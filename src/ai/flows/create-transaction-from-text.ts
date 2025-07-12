
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
    prompt: `Extract transaction details from this text for an Indian user:

Text: "{{text}}"

Extract:
- description: Brief description (e.g., "Movie ticket", "Coffee")
- amount: Number only (e.g., 200, 5000). Convert "k" to thousands (5k = 5000)
- type: "expense" if money spent, "income" if money received
- date: Today is {{currentDate}}. Use YYYY-MM-DD format. "Yesterday" = subtract 1 day.

Rules:
- Amount must be a positive number
- Look for any number in the text as the amount
- Currency is always Indian Rupees
- Words like "spent", "paid", "bought" = expense
- Words like "earned", "received", "salary" = income`,
    template: {
      helpers: {
        currentDate: () => new Date().toLocaleDateString('en-CA'),
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

const createTransactionFromTextFlow = ai.defineFlow(
    {
      name: 'createTransactionFromTextFlow',
      inputSchema: z.object({ text: z.string() }),
      outputSchema: z.object({
        id: z.string(),
        description: z.string(),
        amount: z.number(),
        type: z.enum(['income', 'expense']),
        category: z.string(),
        date: z.date(),
      }),
    },
    async ({ text }) => {
        const maxRetries = 3;
        let attempt = 0;
        
        // Preprocess the text for Indian number formats
        const processedText = preprocessIndianText(text);
        console.log('Original text:', text);
        console.log('Processed text:', processedText);
        
        while (attempt < maxRetries) {
            try {
                console.log(`Attempt ${attempt + 1}: Calling AI with text: "${processedText}"`);
                
                const { output: transactionData } = await createTransactionPrompt(processedText);
                
                console.log('AI Response:', transactionData);
    
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
                console.log(`Attempt ${attempt} failed with error:`, error);
                console.log('Error type:', typeof error);
                console.log('Error message:', error.message);
                console.log('Error stack:', error.stack);
                
                const isLastAttempt = attempt >= maxRetries;
                
                if (!isLastAttempt) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // More specific error handling
                    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                        throw new Error("AI service is temporarily overloaded. Please try again in a few minutes.");
                    }
                    if (error.message?.includes('invalid') || error.message?.includes('parsing')) {
                        throw new Error("AI had trouble understanding your text. Try: 'spent 200 on coffee' or 'earned 5000 salary'");
                    }
                    throw new Error(`AI could not understand your transaction: "${text}". Please try rephrasing with a clear amount (e.g., "spent 200 on coffee" or "earned 5k from work").`);
                }
            }
        }
        throw new Error("Failed to create transaction from text after multiple retries.");
      }
);


// Wrapper function that the client will call. This is NOT a flow.
export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
    return createTransactionFromTextFlow(input);
}
