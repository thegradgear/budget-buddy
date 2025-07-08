'use server';

/**
 * @fileOverview Generates a monthly budget summary notification for a user.
 *
 * - generateMonthlySummary - Creates a personalized message based on the user's spending last month.
 * - MonthlySummaryInput - The input type for the generateMonthlySummary function.
 * - MonthlySummaryOutput - The return type for the generateMonthlySummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MonthlySummaryInputSchema = z.object({
  totalExpenses: z.number().describe("The user's total expenses for the previous month."),
  monthlyBudget: z.number().describe("The user's set monthly budget."),
  monthName: z.string().describe("The name of the month for the summary (e.g., 'July')."),
});
export type MonthlySummaryInput = z.infer<typeof MonthlySummaryInputSchema>;

const MonthlySummaryOutputSchema = z.object({
  message: z.string().describe('The generated notification message.'),
});
export type MonthlySummaryOutput = z.infer<typeof MonthlySummaryOutputSchema>;

export async function generateMonthlySummary(input: MonthlySummaryInput): Promise<MonthlySummaryOutput> {
  return monthlySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monthlySummaryPrompt',
  input: { schema: MonthlySummaryInputSchema },
  output: { schema: MonthlySummaryOutputSchema },
  prompt: `You are an AI financial assistant for the "Budget Buddy" app. 
  
  Your task is to generate a concise, friendly, one-sentence notification summarizing the user's budget performance for the previous month.
  
  Previous Month: {{monthName}}
  Monthly Budget: ₹{{monthlyBudget}}
  Total Expenses: ₹{{totalExpenses}}

  {{#if (isGreaterThan totalExpenses monthlyBudget)}}
  Your spending in {{monthName}} exceeded your budget. Consider using Budget Buddy's AI suggestions to find areas where you can save this month!
  {{else}}
  Great job! You stayed within your budget for {{monthName}}. Keep up the excellent work!
  {{/if}}
  `,
  template: {
    helpers: {
      isGreaterThan: (a: number, b: number) => a > b,
    }
  }
});

const monthlySummaryFlow = ai.defineFlow(
  {
    name: 'monthlySummaryFlow',
    inputSchema: MonthlySummaryInputSchema,
    outputSchema: MonthlySummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
