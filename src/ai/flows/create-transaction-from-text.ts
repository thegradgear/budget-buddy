
'use server';
/**
 * @fileOverview Creates a financial transaction from a natural language text input.
 *
 * - createTransactionFromText - A function that parses text to create a transaction.
 * - CreateTransactionFromTextInput - The input type for the function.
 * - CreateTransactionFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { categorizeTransaction, CategorizeTransactionInput } from './categorize-transaction';

// The input is just the raw text from the user
export type CreateTransactionFromTextInput = {
  text: string;
};

// The output is the structured data, ready to be saved
export type CreateTransactionFromTextOutput = {
  id: string; // Will be empty, client will generate it
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
};

// Define the schema for the AI's expected output
const TransactionDataSchema = z.object({
    description: z.string().describe('A short, concise description of the transaction (e.g., "Movie ticket", "Groceries", "Salary").'),
    amount: z.number().positive().describe('The transaction amount as a positive number. Extract any numerical value from the text (200, 2k=2000, 5000, etc.).'),
    type: z.enum(['income', 'expense']).describe("The type of transaction: 'income' for money received, 'expense' for money spent."),
    date: z.string().describe("The date of the transaction in 'YYYY-MM-DD' format. Current year is " + new Date().getFullYear() + "."),
});

// Define the prompt at the top level
const createTransactionPrompt = ai.definePrompt({
    name: 'createTransactionPrompt',
    input: { schema: z.string() },
    output: { schema: TransactionDataSchema },
    prompt: `You are an expert financial assistant for users in India. Your task is to extract transaction details from a user's text input. The user is adding a transaction to their Budget Buddy app. The currency is always Indian Rupees (INR).

    IMPORTANT GUIDELINES:
    - Users may express amounts in various formats: "200", "200 rupees", "2k", "2000", "two hundred", etc.
    - If no currency is mentioned, assume INR (Indian Rupees)
    - Common Indian expressions: "5k" = 5000, "2.5k" = 2500, "1 lakh" = 100000, "50k" = 50000
    - Extract ANY numerical value as the amount, even if currency is not explicitly mentioned
    - If you find ANY number in the text, treat it as the transaction amount
    - Words like "spent", "paid", "bought", "purchased" indicate expenses
    - Words like "earned", "received", "salary", "income" indicate income

    Analyze the text and extract the following information:
    1. **description**: Create a short, clean description of the transaction. For example, if the user says "paid for the new superman movie", the description should be "Movie ticket".
    2. **amount**: The transaction amount. This must always be a positive number. Look for ANY numerical value in the text (200, 2k, 5000, etc.). Convert text numbers to digits if needed.
    3. **type**: Determine if it's 'income' (money received) or 'expense' (money spent).
    4. **date**: The date of the transaction. Today's date is {{currentDate}}. If the user mentions a relative date like "yesterday" or "last Tuesday", calculate the absolute date in 'YYYY-MM-DD' format.

    Examples:
    - "spent 200 on coffee" → amount: 200, type: expense, description: "Coffee"
    - "earned 5k from freelance" → amount: 5000, type: income, description: "Freelance work"
    - "paid 150 for groceries yesterday" → amount: 150, type: expense, description: "Groceries"

    User Text: '{{text}}'`,
    template: {
      helpers: {
        currentDate: () => new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
      },
    },
});

function preprocessIndianText(text: string): string {
    // Convert common Indian number formats
    let processed = text.toLowerCase();
    
    // Handle 'k' suffix (5k = 5000)
    processed = processed.replace(/(\d+(?:\.\d+)?)k/g, (match, num) => {
        return (parseFloat(num) * 1000).toString();
    });
    
    // Handle 'lakh' (1 lakh = 100000)
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*lakh/g, (match, num) => {
        return (parseFloat(num) * 100000).toString();
    });
    
    // Handle 'crore' (1 crore = 10000000)
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*crore/g, (match, num) => {
        return (parseFloat(num) * 10000000).toString();
    });
    
    return processed;
}


// Wrapper function that the client will call. This is NOT a flow.
export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
    const maxRetries = 3;
    let attempt = 0;
    
    const processedText = preprocessIndianText(input.text);

    while (attempt < maxRetries) {
        try {
            const { output: transactionData } = await createTransactionPrompt(processedText);

            if (!transactionData) {
                throw new Error("Could not parse transaction from text.");
            }
            
            // The schema already validates that amount is positive.
            console.log('Extracted transaction data:', transactionData); // Debug log

            const categorizationInput: CategorizeTransactionInput = {
                description: transactionData.description,
                type: transactionData.type,
            };
            
            const { category } = await categorizeTransaction(categorizationInput);
            
            const transactionDate = new Date(transactionData.date);
            // Fix for dates being in the future if only day/month is provided
            if (transactionDate > new Date()) {
                transactionDate.setFullYear(transactionDate.getFullYear() - 1);
            }

            // Return the processed data WITHOUT saving to Firebase
            return {
                id: '', // Will be set after client saves
                description: transactionData.description,
                amount: transactionData.amount,
                type: transactionData.type,
                category: category,
                date: transactionDate,
            };
        } catch (error: any) {
            attempt++;
            const isLastAttempt = attempt >= maxRetries;
            
            console.log(`Attempt ${attempt} failed:`, error.message); // Debug log

            if (!isLastAttempt) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                if (error instanceof Error) {
                    throw new Error(`AI could not understand your transaction: "${input.text}". Please try rephrasing with a clear amount (e.g., "spent 200 on coffee" or "earned 5k from work").`);
                }
                throw new Error("An unexpected error occurred while creating the transaction.");
            }
        }
    }
    throw new Error("Failed to create transaction from text after multiple retries.");
}
