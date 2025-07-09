'use server';
/**
 * @fileOverview Creates a financial plan for a major life event.
 *
 * - generateLifeEventPlan - A function that generates a savings and investment plan.
 * - LifeEventPlanInput - The input type for the generateLifeEventPlan function.
 * - LifeEventPlanOutput - The return type for the generateLifeEventPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LifeEventPlanInputSchema = z.object({
  goal: z.string().describe('The financial goal the user wants to achieve.'),
  targetAmount: z.number().positive().describe('The total amount of money needed for the goal, in INR.'),
  years: z.number().positive().describe('The number of years the user has to save for the goal.'),
  monthlyIncome: z.number().positive().describe("The user's current monthly income in INR."),
});
export type LifeEventPlanInput = z.infer<typeof LifeEventPlanInputSchema>;

const InvestmentSuggestionSchema = z.object({
    type: z.string().describe("The type of investment (e.g., 'SIP in Equity Mutual Funds', 'Fixed Deposit (FD)', 'Recurring Deposit (RD)')."),
    description: z.string().describe("A brief explanation of why this investment is suitable for the user's goal and timeframe."),
    estimatedReturn: z.string().describe("The estimated annual return for this investment type, expressed as a range (e.g., '10-12% p.a.', '6-7.5% p.a.')."),
    suggestedAllocation: z.string().describe("The suggested percentage of monthly savings to allocate to this investment (e.g., '60%')."),
});

const LifeEventPlanOutputSchema = z.object({
  planTitle: z.string().describe("A catchy title for the generated plan."),
  monthlySavings: z.object({
      amount: z.number().describe("The total amount the user needs to save each month."),
      summary: z.string().describe("A one-sentence summary about the monthly savings required."),
  }),
  investmentSuggestions: z.array(InvestmentSuggestionSchema).describe("A list of 2-3 diversified investment suggestions."),
  summary: z.string().describe("A concluding paragraph with encouraging words and a disclaimer about market risks."),
});
export type LifeEventPlanOutput = z.infer<typeof LifeEventPlanOutputSchema>;

export async function generateLifeEventPlan(input: LifeEventPlanInput): Promise<LifeEventPlanOutput> {
  return lifeEventPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lifeEventPlannerPrompt',
  input: {schema: LifeEventPlanInputSchema},
  output: {schema: LifeEventPlanOutputSchema},
  prompt: `You are an expert financial planner for "Budget Buddy", an app for users in India. Your task is to create a personalized, actionable financial plan for a user's life event goal.

User's Goal: {{goal}}
Target Amount: ₹{{targetAmount}}
Timeframe: {{years}} years
User's Monthly Income: ₹{{monthlyIncome}}

**Your Plan Generation Steps:**

1.  **Calculate Required Monthly Savings:** Determine the total monthly savings required to reach the target amount. For your calculation, assume a conservative blended annual return rate based on the investment suggestions you will provide (e.g., around 8-10% if suggesting a mix of equity and debt). Don't just divide the target by the number of months; factor in potential investment growth using a simple future value formula logic. **Crucially, the monthly savings must be realistic and should not exceed 50% of the user's monthly income. If the required savings are too high, adjust the plan or state that the goal is ambitious for the given income and timeframe.**
2.  **Develop Investment Strategy:** Based on the timeframe, suggest a diversified investment strategy.
    *   **Short-term (1-3 years):** Focus on low-risk options. A mix of Recurring Deposits (RDs), Fixed Deposits (FDs), and maybe a small allocation to conservative hybrid mutual funds.
    *   **Medium-term (3-7 years):** A balanced approach. Suggest a mix of SIPs in balanced or large-cap equity mutual funds and some allocation to FDs/RDs.
    *   **Long-term (7+ years):** More equity exposure. Suggest a higher allocation to SIPs in equity mutual funds (flexi-cap, large-cap).
3.  **Create Specific Suggestions:**
    *   Provide 2-3 distinct investment suggestions.
    *   For each suggestion, specify the type, a brief description of its suitability, the estimated annual return range (be realistic, e.g., Equity SIPs: 10-14% p.a., FDs: 6-7.5% p.a.), and the percentage of the monthly savings to be allocated to it. The percentages must add up to 100%.
4.  **Generate a Concluding Summary:** Write a brief, encouraging summary. Crucially, include a disclaimer that investments are subject to market risks and these are suggestions, not financial advice.

**Important Rules:**
- All currency is in INR.
- Be encouraging and clear.
- Do not recommend any specific financial products or companies. Stick to generic types (e.g., "Large-cap mutual fund," not "XYZ Bluechip Fund").
- Ensure the output strictly follows the JSON schema provided.
`,
});

const lifeEventPlannerFlow = ai.defineFlow(
  {
    name: 'lifeEventPlannerFlow',
    inputSchema: LifeEventPlanInputSchema,
    outputSchema: LifeEventPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
