'use server';
/**
 * @fileOverview Creates a financial plan for a major life event, assessing feasibility.
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

const FeasibilityAnalysisSchema = z.object({
    requiredMonthlySavings: z.number().describe("The initially calculated monthly savings required to meet the goal in the user's timeframe."),
    maxAffordableSavings: z.number().describe("The maximum monthly savings the user can afford, calculated as 50% of their monthly income."),
    minimumFeasibleTimeframe: z.string().describe("The newly calculated, minimum feasible timeframe to reach the goal, expressed in years and months (e.g., '5 years and 6 months')."),
    calculationBreakdown: z.array(z.string()).describe("A step-by-step breakdown of the calculations used to determine the new timeframe, explaining formulas and assumptions."),
});

const LifeEventPlanOutputSchema = z.object({
  planTitle: z.string().describe("A catchy title for the generated plan or feasibility report."),
  isFeasible: z.boolean().describe("Whether the goal is achievable within the given timeframe and income constraints."),
  feasibilityAnalysis: FeasibilityAnalysisSchema.optional().describe("A detailed analysis if the goal is not feasible. This field is present only if isFeasible is false."),
  monthlySavings: z.object({
      amount: z.number().describe("The total amount the user needs to save each month."),
      summary: z.string().describe("A one-sentence summary about the monthly savings required."),
  }).optional().describe("Details of monthly savings. This field is present only if isFeasible is true."),
  investmentSuggestions: z.array(InvestmentSuggestionSchema).optional().describe("A list of 2-3 diversified investment suggestions. This field is present only if isFeasible is true."),
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
  prompt: `You are an expert financial planner for "Budget Buddy", an app for users in India. Your task is to create a personalized financial plan or a feasibility analysis for a user's life event goal.

User's Goal: {{goal}}
Target Amount: ₹{{targetAmount}}
Desired Timeframe: {{years}} years
User's Monthly Income: ₹{{monthlyIncome}}

**Execution Steps:**

**Step 1: Determine Required Monthly Savings & Feasibility**
1.1. Calculate the required monthly savings (let's call it 'Required_P') to reach the target amount within the user's specified timeframe. To do this, you must first assume a conservative blended annual return rate based on the investment types suitable for the timeframe (e.g., around 8-10%).
1.2. Use the standard future value of a series formula in reverse to solve for the monthly payment (P): P = (FV * r) / [(((1 + r)^n) - 1)], where FV is the 'targetAmount', r is the assumed monthly interest rate, and n is the number of months.
1.3. Calculate the user's maximum affordable monthly savings, which is strictly 50% of their 'monthlyIncome'.
1.4. **Feasibility Check:** Compare 'Required_P' with the 'maxAffordableSavings'.
    - If 'Required_P' is LESS THAN OR EQUAL TO 'maxAffordableSavings', the plan is **FEASIBLE**. Set 'isFeasible' to true and proceed to Step 3, using the user's desired timeframe and the calculated 'Required_P'.
    - If 'Required_P' is GREATER THAN 'maxAffordableSavings', the plan is **UNFEASIBLE**. Set 'isFeasible' to false and proceed to Step 2.

**Step 2: Handle Unfeasible Goal (If Necessary)**
2.1. Set the monthly savings to the 'maxAffordableSavings' amount (50% of income).
2.2. Calculate the minimum number of months ('n') required to reach the 'targetAmount' with this affordable savings amount. Use the standard formula to solve for n: n = ln((FV*r/P) + 1) / ln(1+r).
2.3. Convert the total months 'n' into years and months (e.g., 66 months = 5 years and 6 months).
2.4. Populate the 'feasibilityAnalysis' object:
    - 'requiredMonthlySavings': The value calculated in step 1.2.
    - 'maxAffordableSavings': 50% of the user's income.
    - 'minimumFeasibleTimeframe': The string calculated in step 2.3.
    - 'calculationBreakdown': Provide a clear, step-by-step explanation of the calculation. Explain the formulas used, the assumed interest rate, and how you arrived at the new timeframe. This is crucial for user understanding.
2.5. Generate an appropriate 'planTitle' (e.g., "Feasibility Report for Your Goal") and a 'summary' explaining the situation and presenting the new timeframe as an achievable alternative.
2.6. STOP here. Do not generate 'monthlySavings' or 'investmentSuggestions' fields for unfeasible plans.

**Step 3: Generate Feasible Plan (If Feasible)**
3.1. Populate the 'monthlySavings' object using the 'Required_P' calculated in step 1.2 (this is based on the user's original, feasible timeframe).
3.2. Develop a diversified investment strategy based on the timeframe (Short: 1-3 yrs, Medium: 3-7 yrs, Long: 7+ yrs).
3.3. Create 2-3 specific 'investmentSuggestions'. For each suggestion:
    a. Calculate 'monthlyInvestment' (Total Monthly Savings * Allocation Percentage).
    b. Calculate 'futureValue' using the FV of a series formula: FV = P * [(((1 + r)^n) - 1) / r]. Use a realistic interest rate for that specific investment type. The 'n' here is based on the user's original, feasible timeframe.
3.4. **Verify Totals:** Ensure the sum of 'futureValue' from all suggestions roughly equals the 'targetAmount'.
3.5. Generate an appropriate 'planTitle' (e.g., "Your Plan to Buy a New Car") and a concluding 'summary' with a disclaimer.

**Important Rules:**
- All currency is in INR.
- Be encouraging and clear.
- Do not recommend specific financial products. Stick to generic types (e.g., "Large-cap mutual fund").
- Ensure the output strictly follows the JSON schema provided, including all calculation fields. The presence of 'feasibilityAnalysis' vs. 'investmentSuggestions' must depend on the 'isFeasible' flag.
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
