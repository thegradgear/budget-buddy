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
  prompt: `You are a financial health analyst for "Budget Buddy", an app for users in India. Your task is to calculate a financial health score based on the 50/30/20 budgeting rule. The score should be between 0 and 100. All currency is in INR.

**Step 1: Understand the 50/30/20 Rule & Categories**
The rule suggests allocating after-tax income as follows:
- 50% to **Needs**: Essential expenses.
- 30% to **Wants**: Non-essential lifestyle expenses.
- 20% to **Savings & Debt**: Investments, EMI payments, and any money left over.

First, categorize each expense from the transaction history into 'Needs', 'Wants', or 'Savings & Debt' based on its description, using this mapping:
- **Needs Categories:** Groceries, Utilities, Transport, Rent, Health & Wellness, Education.
- **Wants Categories:** Food & Dining, Shopping, Entertainment, Travel, Other Expense.
- **Savings & Debt Categories:** EMI, Investment.

**Step 2: Calculate Spending Percentages**
1. Calculate Total Income from the transaction history.
2. Sum up the total amount for each of the three main categories (Needs, Wants, Savings & Debt).
3. Any income remaining after all expenses counts towards 'Savings & Debt'.
4. Calculate the percentage of total income that goes to each category.

**Step 3: Calculate the Score (out of 100)**
- **Needs (Max 50 points):**
  - If Needs are <= 50% of income, award 50 points.
  - For every 1% over 50%, deduct 2 points. (e.g., 55% on needs = 40 points).
- **Wants (Max 30 points):**
  - If Wants are <= 30% of income, award 30 points.
  - For every 1% over 30%, deduct 1.5 points. (e.g., 40% on wants = 15 points).
- **Savings & Debt (Max 20 points):**
  - If Savings are >= 20% of income, award 20 points.
  - For every 1% below 20%, deduct 1 point. (e.g., 15% savings = 15 points).

Sum the points from all three sections to get the final score.

**Step 4: Generate Analysis**
Based on the score and the 50/30/20 breakdown, provide:
1.  A brief, encouraging summary of their financial health.
2.  2-3 key strengths. Be specific and positive. For example: "You are doing an excellent job managing your essential living costs." or "Your savings rate is impressive this month."
3.  2-3 actionable areas for improvement. Provide specific, practical advice without using the terms 'Needs' or 'Wants'. For example: "Reviewing your spending on restaurant meals and online shopping could help you reach your savings goals faster." or "Consider setting up a recurring investment in Budget Buddy to automate your savings."

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
