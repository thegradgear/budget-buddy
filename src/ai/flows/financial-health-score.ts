'use server';
/**
 * @fileOverview Calculates a user's financial health score.
 *
 * - getFinancialHealthScore - A function that generates a financial health score.
 * - FinancialHealthScoreInput - The input type for the getFinancialHealthScore function.
 * - FinancialHealthScoreOutput - The return type for the getFinancialHealthScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialHealthScoreInputSchema = z.object({
  transactionHistory: z
    .string()
    .describe(
      'A string containing the transaction history of the user. Each transaction should be on a new line.'
    ),
  monthlyBudget: z.number().describe('The current monthly budget of the user in INR.'),
});
export type FinancialHealthScoreInput = z.infer<typeof FinancialHealthScoreInputSchema>;

const FinancialHealthScoreOutputSchema = z.object({
    score: z.number().min(0).max(100).describe("A score from 0 to 100 representing the user's financial health."),
    summary: z.string().describe("A one or two-sentence summary of the user's financial health."),
    strengths: z.array(z.string()).describe("A list of 2-3 key financial strengths, each as a separate string."),
    areasForImprovement: z.array(z.string()).describe("A list of 2-3 key areas for improvement with actionable advice, each as a separate string."),
});
export type FinancialHealthScoreOutput = z.infer<typeof FinancialHealthScoreOutputSchema>;

export async function getFinancialHealthScore(input: FinancialHealthScoreInput): Promise<FinancialHealthScoreOutput> {
  return financialHealthScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialHealthScorePrompt',
  input: {schema: FinancialHealthScoreInputSchema},
  output: {schema: FinancialHealthScoreOutputSchema},
  prompt: `You are a financial health analyst for "Budget Buddy", an app for users in India. Your task is to calculate a financial health score for a user based on their transaction history and budget. The score should be between 0 and 100. All currency is in INR.

Analyze the provided data based on these key pillars of financial health:
1.  **Budget Adherence (40 points):** How well does the user stick to their budget? Are expenses consistently lower than their budget?
2.  **Savings Rate (30 points):** What percentage of their income are they saving? (Savings = Income - Expenses). A rate above 20% is excellent. A rate between 10-20% is good. Below 10% needs improvement. Negative savings is a major red flag.
3.  **Spending Habits (20 points):** Is spending consistent or volatile? Are 'Wants' (like Shopping, Entertainment) a reasonable proportion of their spending compared to 'Needs' (like Groceries, Utilities, Rent)?
4.  **Income Stability (10 points):** Is income regular? (This is a minor factor).

Based on your analysis of these pillars, calculate a final score. Provide a brief, encouraging summary, and then list their top 2-3 strengths and top 2-3 actionable areas for improvement.

**User's Monthly Budget:** ₹{{monthlyBudget}}
**User's Transaction History:**
{{transactionHistory}}`,
});

const financialHealthScoreFlow = ai.defineFlow(
  {
    name: 'financialHealthScoreFlow',
    inputSchema: FinancialHealthScoreInputSchema,
    outputSchema: FinancialHealthScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
