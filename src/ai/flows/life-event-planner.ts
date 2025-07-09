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
export type FeasibilityAnalysis = z.infer<typeof FeasibilityAnalysisSchema>;

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

// Internal schema to pass pre-calculated data to the AI prompt
const AiInputSchema = LifeEventPlanInputSchema.extend({
  isFeasible: z.boolean(),
  feasibilityAnalysis: FeasibilityAnalysisSchema.optional(),
  monthlySavingsAmount: z.number().optional(),
  finalTimeframeYears: z.number(),
});

export async function generateLifeEventPlan(input: LifeEventPlanInput): Promise<LifeEventPlanOutput> {
  return lifeEventPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lifeEventPlannerPrompt',
  input: {schema: AiInputSchema},
  output: {schema: LifeEventPlanOutputSchema},
  prompt: `You are an expert financial planner for "Budget Buddy", an app for users in India. Your task is to generate a personalized financial plan or a feasibility analysis based on the pre-calculated data provided below.

**User Goal & Pre-Calculated Data:**
- Goal: {{goal}}
- Target Amount: ₹{{targetAmount}}
- Original Timeframe: {{years}} years
- User's Monthly Income: ₹{{monthlyIncome}}
- Is Feasible in Original Timeframe: {{isFeasible}}
- Final Timeframe to Use for Plan: {{finalTimeframeYears}} years
{{#if monthlySavingsAmount}}
- Required Monthly Savings: ₹{{monthlySavingsAmount}}
{{/if}}
{{#if feasibilityAnalysis}}
- Feasibility Report:
  - Originally Required Monthly Savings: ₹{{feasibilityAnalysis.requiredMonthlySavings}}
  - User's Max Affordable Savings: ₹{{feasibilityAnalysis.maxAffordableSavings}}
  - New Minimum Feasible Timeframe: {{feasibilityAnalysis.minimumFeasibleTimeframe}}
  - Calculation Breakdown: {{feasibilityAnalysis.calculationBreakdown}}
{{/if}}

**Your Task:**
Based on the feasibility status (isFeasible), generate the appropriate response.

**If 'isFeasible' is FALSE:**
1.  Set the 'isFeasible' flag in your output to 'false'.
2.  Set the 'feasibilityAnalysis' object in your output to exactly match the one provided in the input.
3.  Create a 'planTitle' like "Feasibility Report for Your Goal".
4.  Write a 'summary' that gently explains the original goal was too ambitious for the timeframe and income, and presents the new, longer timeframe as an achievable alternative.
5.  **DO NOT** generate the 'monthlySavings' or 'investmentSuggestions' fields.

**If 'isFeasible' is TRUE:**
1.  Set the 'isFeasible' flag in your output to 'true'.
2.  Populate the 'monthlySavings' object using the 'monthlySavingsAmount' provided. Write a simple, one-sentence summary for it.
3.  Develop a diversified investment strategy based on the 'finalTimeframeYears' (Short: 1-3 yrs, Medium: 3-7 yrs, Long: 7+ yrs).
4.  Create 2-3 specific 'investmentSuggestions'. For each suggestion:
    a. Determine a suitable allocation percentage. Allocations must sum to 100%.
    b. Calculate 'monthlyInvestment' = (total monthly savings * allocation percentage).
    c. Calculate 'futureValue' using the FV of a series formula: FV = P * [(((1 + r)^n) - 1) / r]. Use a realistic interest rate for that specific investment type. The 'n' here is based on the 'finalTimeframeYears'.
5.  **Verify Totals:** Ensure the sum of 'futureValue' from all suggestions roughly equals the 'targetAmount'.
6.  Create an appropriate 'planTitle' (e.g., "Your Plan to Buy a New Car").
7.  Write a concluding 'summary' with encouraging words and a disclaimer about market risks.
8.  **DO NOT** generate the 'feasibilityAnalysis' field.

**Important Rules:**
- All currency is in INR.
- Be encouraging and clear.
- Do not recommend specific financial products. Stick to generic types (e.g., "Large-cap mutual fund").
- Ensure the output strictly follows the JSON schema provided.
`,
});

const lifeEventPlannerFlow = ai.defineFlow(
  {
    name: 'lifeEventPlannerFlow',
    inputSchema: LifeEventPlanInputSchema,
    outputSchema: LifeEventPlanOutputSchema,
  },
  async (input) => {
    const { targetAmount, years, monthlyIncome } = input;
    const maxAffordableSavings = monthlyIncome * 0.5;
    const n = years * 12; // Original number of months
    
    // Assume a conservative blended annual return rate for initial feasibility check
    const annualRate = 0.09; 
    const monthlyRate = annualRate / 12;

    // Calculate required monthly savings for the user's desired timeframe
    const requiredMonthlySavings = (targetAmount * monthlyRate) / (Math.pow(1 + monthlyRate, n) - 1);

    let isFeasible = requiredMonthlySavings <= maxAffordableSavings;
    let feasibilityAnalysis: FeasibilityAnalysis | undefined;
    let monthlySavingsAmount = requiredMonthlySavings;
    let finalTimeframeYears = years;

    if (!isFeasible) {
        // If not feasible, calculate the minimum timeframe based on max affordable savings
        const P = maxAffordableSavings;
        const new_n_numerator = Math.log((targetAmount * monthlyRate / P) + 1);
        const new_n_denominator = Math.log(1 + monthlyRate);
        const new_n = new_n_numerator / new_n_denominator; // New minimum months

        const newYears = Math.floor(new_n / 12);
        const newMonths = Math.ceil(new_n % 12);

        finalTimeframeYears = new_n / 12; // Use the precise value for AI plan generation
        monthlySavingsAmount = maxAffordableSavings; // The plan will be based on this amount

        feasibilityAnalysis = {
            requiredMonthlySavings: Math.round(requiredMonthlySavings),
            maxAffordableSavings: Math.round(maxAffordableSavings),
            minimumFeasibleTimeframe: `${newYears} years and ${newMonths} months`,
            calculationBreakdown: [
                `Your goal requires saving ₹${Math.round(requiredMonthlySavings)}/month, which is more than your affordable limit of ₹${Math.round(maxAffordableSavings)}/month.`,
                `To make it achievable, we've adjusted your monthly savings to your maximum affordable amount.`,
                `Based on saving ₹${Math.round(maxAffordableSavings)}/month with an assumed average return of ${annualRate * 100}%/year, the new minimum timeframe to reach ₹${targetAmount.toLocaleString('en-IN')} is approximately ${newYears} years and ${newMonths} months.`
            ],
        };
    }

    const aiInput: z.infer<typeof AiInputSchema> = {
      ...input,
      isFeasible,
      feasibilityAnalysis,
      monthlySavingsAmount: Math.round(monthlySavingsAmount),
      finalTimeframeYears: finalTimeframeYears,
    };

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(aiInput);
        if (output && output.isFeasible && output.investmentSuggestions) {
            let totalFutureValue = 0;
            let totalMonthlyInvestment = 0;

            // Recalculate monthly and future values to ensure precision and remove AI's math errors.
            for (const suggestion of output.investmentSuggestions) {
                totalMonthlyInvestment += suggestion.monthlyInvestment;
            }

            // Adjust the last suggestion to make totals match perfectly
            if (output.investmentSuggestions.length > 0) {
                const lastSuggestion = output.investmentSuggestions[output.investmentSuggestions.length - 1];
                const adjustment = Math.round(monthlySavingsAmount) - totalMonthlyInvestment;
                lastSuggestion.monthlyInvestment += adjustment;
                
                // Recalculate FV for all suggestions with the precise monthly amounts
                for (const suggestion of output.investmentSuggestions) {
                    const returnRange = suggestion.estimatedReturn.match(/(\d+(\.\d+)?)/g);
                    const avgReturn = returnRange ? (parseFloat(returnRange[0]) + parseFloat(returnRange[1] || returnRange[0])) / 2 / 100 : annualRate;
                    const r = avgReturn / 12;
                    const n_final = finalTimeframeYears * 12;
                    const P_final = suggestion.monthlyInvestment;
                    suggestion.futureValue = Math.round(P_final * ((Math.pow(1 + r, n_final) - 1) / r));
                    totalFutureValue += suggestion.futureValue;
                }

                // Adjust the future value of the last item to make the grand total match the target amount
                const fvAdjustment = targetAmount - totalFutureValue;
                lastSuggestion.futureValue += fvAdjustment;
            }
        }
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

    