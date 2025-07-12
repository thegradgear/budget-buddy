
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
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export type CreateTransactionFromTextInput = {
  userId: string;
  accountId: string;
  text: string;
};

export type CreateTransactionFromTextOutput = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
};

const createTransactionFromTextFlow = ai.defineFlow(
  {
    name: 'createTransactionFromTextFlow',
    inputSchema: z.object({
      userId: z.string(),
      accountId: z.string(),
      text: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      description: z.string(),
      amount: z.number(),
      type: z.enum(['income', 'expense']),
      category: z.string(),
      date: z.date(),
    }),
  },
  async ({ userId, accountId, text }) => {
    
    const TransactionDataSchema = z.object({
        description: z.string().describe('A short, concise description of the transaction (e.g., "Groceries", "Movie tickets", "Salary").'),
        amount: z.number().describe('The transaction amount as a number. This must always be a positive number.'),
        type: z.enum(['income', 'expense']).describe("The type of transaction, either 'income' or 'expense'."),
        date: z.string().describe("The date of the transaction in 'YYYY-MM-DD' format. The current year is " + new Date().getFullYear() + "."),
    });

    const prompt = ai.definePrompt({
        name: 'createTransactionPrompt',
        input: { schema: z.string() },
        output: { schema: TransactionDataSchema },
        prompt: `You are an expert financial assistant for users in India. Your task is to extract transaction details from a user's text input. The user is adding a transaction to their Budget Buddy app. The currency is always Indian Rupees (INR).

        Analyze the text and extract the following information:
        1.  **description**: Create a short, clean description of the transaction. For example, if the user says "paid for the new superman movie", the description should be "Movie".
        2.  **amount**: The transaction amount. This must always be a positive number. If the amount is ambiguous or not present, you must throw an error with the message "Invalid transaction amount".
        3.  **type**: Determine if it's 'income' (money received) or 'expense' (money spent).
        4.  **date**: The date of the transaction. Today's date is {{currentDate}}. If the user mentions a relative date like "yesterday" or "last Tuesday", calculate the absolute date in 'YYYY-MM-DD' format.

        User Text: '{{text}}'`,
        template: {
          helpers: {
            currentDate: () => new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
          },
        },
    });

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const { output: transactionData } = await prompt(text);

            if (!transactionData) {
                throw new Error("Could not parse transaction from text.");
            }
            
            // Manual validation after getting AI response
            if (transactionData.amount <= 0) {
                throw new Error("Invalid transaction amount");
            }

            const categorizationInput: CategorizeTransactionInput = {
                description: transactionData.description,
                type: transactionData.type,
            };
            
            const { category } = await categorizeTransaction(categorizationInput);
            
            const transactionDate = new Date(transactionData.date);

            const newTransaction = {
              description: transactionData.description,
              amount: transactionData.amount,
              type: transactionData.type,
              date: Timestamp.fromDate(transactionDate),
              category: category,
            };
            
            console.log('DEBUG: Attempting to write to Firestore with the following data:');
            console.log('DEBUG: userId:', userId);
            console.log('DEBUG: accountId:', accountId);
            console.log('DEBUG: newTransaction:', JSON.stringify(newTransaction, null, 2));


            const docRef = await addDoc(collection(db!, 'users', userId, 'accounts', accountId, 'transactions'), newTransaction);
            
            return {
                ...newTransaction,
                id: docRef.id,
                date: transactionDate,
            };
        } catch (error: any) {
            attempt++;
            const isLastAttempt = attempt >= maxRetries;
            const isOverloaded = error.message && (error.message.includes('503') || error.message.includes('overloaded'));
            
            if ((isOverloaded || error.message.includes('Invalid transaction amount')) && !isLastAttempt) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                if (error instanceof Error) {
                    if (error.message.includes('Invalid transaction amount')) {
                        throw new Error("The AI failed to extract a valid amount from your text. Please state the amount clearly (e.g., '100 rupees', '5k').");
                    }
                    throw error;
                }
                throw new Error("An unexpected error occurred while creating the transaction.");
            }
        }
    }
    throw new Error("Failed to create transaction from text after multiple retries.");
  }
);


export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
  return createTransactionFromTextFlow(input);
}
