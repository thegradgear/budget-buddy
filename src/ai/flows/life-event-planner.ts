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
    suggestedAllocation: z.string().describe("The suggested percentage of the total monthly savings to allocate to this investment (e.g., '60%')."),
    monthlyInvestment: z.number().describe("The specific amount to invest in this type each month."),
    futureValue: z.number().describe("The estimated future value of this specific investment at the end of the timeframe."),
});

const LifeEventPlanOutputSchema = z.object({
  planTitle: z.string().describe("A catchy title for the generated plan."),
  monthlySavings: z.object({
      amount: z.number().describe("The total amount the user needs to save each month."),
      summary: z.string().describe("A one-sentence summary about the monthly savings required."),
  }),
  investmentSuggestions: z.array(InvestmentSuggestionSchema).describe("A list of 2-3 diversified investment suggestions with detailed calculations."),
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
  prompt: `You are an expert financial planner for "Budget Buddy", an app for users in India. Your task is to create a personalized, actionable financial plan for a user's life event goal, complete with mathematical calculations.

User's Goal: {{goal}}
Target Amount: ₹{{targetAmount}}
Timeframe: {{years}} years
User's Monthly Income: ₹{{monthlyIncome}}

**Your Plan Generation Steps:**

1.  **Calculate Required Monthly Savings:** Determine the total monthly savings required to reach the target amount. For your calculation, assume a conservative blended annual return rate based on the investment suggestions you will provide (e.g., around 8-10% if suggesting a mix of equity and debt). Don't just divide the target by the number of months; factor in potential investment growth using a simple future value of a series formula logic. **Crucially, the monthly savings must be realistic and should not exceed 50% of the user's monthly income. If the required savings are too high, adjust the plan or state that the goal is ambitious for the given income and timeframe.**
2.  **Develop Investment Strategy:** Based on the timeframe, suggest a diversified investment strategy.
    *   **Short-term (1-3 years):** Focus on low-risk options. A mix of Recurring Deposits (RDs), Fixed Deposits (FDs), and maybe a small allocation to conservative hybrid mutual funds.
    *   **Medium-term (3-7 years):** A balanced approach. Suggest a mix of SIPs in balanced or large-cap equity mutual funds and some allocation to FDs/RDs.
    *   **Long-term (7+ years):** More equity exposure. Suggest a higher allocation to SIPs in equity mutual funds (flexi-cap, large-cap).
3.  **Create Specific Suggestions & CALCULATIONS:**
    *   Provide 2-3 distinct investment suggestions. The allocations must sum to 100%.
    *   For each suggestion, you MUST perform and output the following calculations:
        a.  **'monthlyInvestment'**: Calculate the specific amount in INR to be invested monthly into this option. This is calculated as (Total Monthly Savings * Allocation Percentage).
        b.  **'futureValue'**: Calculate the projected future value of *this specific investment* at the end of the timeframe. Use the standard future value of a series formula: FV = P * [(((1 + r)^n) - 1) / r], where P is the 'monthlyInvestment', r is the monthly interest rate (use a realistic rate from your 'estimatedReturn', e.g., for 12% annual, use 0.01 monthly), and n is the total number of months ('years' * 12).
4.  **Verify Totals:** Ensure that the sum of all individual 'monthlyInvestment' amounts equals the total 'monthlySavings.amount', and the sum of all individual 'futureValue' amounts approximately equals the 'targetAmount'.
5.  **Generate a Concluding Summary:** Write a brief, encouraging summary. Crucially, include a disclaimer that investments are subject to market risks and these are suggestions, not financial advice.

**Important Rules:**
- All currency is in INR.
- Be encouraging and clear.
- Do not recommend any specific financial products or companies. Stick to generic types (e.g., "Large-cap mutual fund," not "XYZ Bluechip Fund").
- Ensure the output strictly follows the JSON schema provided, including all calculation fields.
`,
});

const lifeEventPlannerFlow = ai.defineFlow(
  {
    name: 'lifeEventPlannerFlow',
    inputSchema: LifeEventPlanInputSchema,
    outputSchema: LifeEventPlanOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error: any) {
        attempt++;
        const isLastAttempt = attempt >= maxRetries;
        const isOverloaded = error.message && (error.message.includes('503') || error.message.includes('overloaded'));
        
        if (isOverloaded && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Attempt ${attempt} failed with model overload. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For other errors or on the last attempt, re-throw to be caught by the client.
          throw error;
        }
      }
    }
    // This should be unreachable, but TypeScript needs a return path.
    throw new Error('Failed to generate life event plan after multiple retries.');
  }
);
