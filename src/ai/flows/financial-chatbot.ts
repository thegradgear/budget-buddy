'use server';

/**
 * @fileOverview A financial chatbot that answers user questions based on their transaction history.
 *
 * - financialChatbot - A streaming flow that generates responses to user queries.
 * - FinancialChatbotInput - The input type for the financialChatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { stream } from 'genkit';

export const FinancialChatbotInputSchema = z.object({
  question: z.string().describe('The user question about their finances.'),
  transactionHistory: z
    .string()
    .describe(
      'A string containing the transaction history of the user across all accounts. Each transaction should be on a new line, including date, description, type, amount, and category.'
    ),
  userProfile: z.string().describe('A JSON string of the user profile, including name and budget.'),
});
export type FinancialChatbotInput = z.infer<typeof FinancialChatbotInputSchema>;

export async function financialChatbot(input: FinancialChatbotInput): Promise<string> {
    const { stream, response } = financialChatbotFlow(input);
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    await response;
    return fullResponse;
}

const prompt = ai.definePrompt({
  name: 'financialChatbotPrompt',
  input: { schema: FinancialChatbotInputSchema },
  system: [
    `You are "Budget Buddy," an expert financial assistant chatbot for a user in India. Your personality is helpful, friendly, and professional.`,
    `Your primary goal is to answer user questions based ONLY on the provided financial context (transaction history and user profile).`,
    `You MUST NOT make up information or provide financial advice beyond what can be inferred from the data. Do not suggest other apps or external tools.`,
    `**User Profile Context:**\n{{userProfile}}`,
    `**Transaction History Context:**\n{{transactionHistory}}`,
  ].join('\n'),
  prompt: `User question: "{{question}}"`,
  config: {
    model: 'googleai/gemini-2.0-flash'
  }
});


const financialChatbotFlow = ai.defineFlow(
  {
    name: 'financialChatbotFlow',
    inputSchema: FinancialChatbotInputSchema,
    outputSchema: z.string(),
    stream: true,
  },
  async (input) => {
    return await stream(async (s) => {
        const { stream: responseStream, response } = await prompt(input);
    
        // Stream the response chunks directly to the client
        for await (const chunk of responseStream) {
            s.chunk(chunk.text);
        }
    
        // Optional: you can perform actions after streaming is complete
        const finalResponse = await response;
    });
  }
);
