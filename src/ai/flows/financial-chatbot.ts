'use server';

/**
 * @fileOverview A financial chatbot that answers user questions based on their transaction history.
 *
 * - financialChatbot - A flow that generates responses to user queries.
 * - FinancialChatbotInput - The input type for the financialChatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialChatbotInputSchema = z.object({
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
    const { question, transactionHistory, userProfile } = input;

    const systemPrompt = `You are "Budget Buddy," an expert financial assistant chatbot for a user in India. Your personality is helpful, friendly, and professional.
Your primary goal is to answer user questions based ONLY on the provided financial context (transaction history and user profile).
You MUST NOT make up information or provide financial advice beyond what can be inferred from the data. Do not suggest other apps or external tools.
When analyzing spending patterns, consider the Indian context (INR currency, common categories like groceries, transportation, utilities, etc.).
For questions about spending in specific time periods, analyze the dates carefully and provide accurate calculations.
Always format monetary amounts in INR (Indian Rupees) and provide clear, actionable insights.

**User Profile Context:**
${userProfile}

**Transaction History Context:**
${transactionHistory}

User question: "${question}"

Please analyze the transaction history provided and answer the user's question accurately. If asking about spending patterns, provide specific amounts and categories. If asking about time periods, make sure to filter transactions by the correct dates.`;
    
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: systemPrompt,
        });

        return response.text;
    } catch (error) {
        console.error('Error in financialChatbot flow:', error);
        return "I apologize, but I encountered an issue while communicating with the AI. Please try again in a moment.";
    }
}
