
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
        amount: z.number().positive().describe('The transaction amount as a positive number.'),
        type: z.enum(['income', 'expense']).describe("The type of transaction, either 'income' or 'expense'."),
        date: z.string().describe("The date of the transaction in 'YYYY-MM-DD' format. The current year is " + new Date().getFullYear() + "."),
    });

    const prompt = ai.definePrompt({
        name: 'createTransactionPrompt',
        input: { schema: z.string() },
        output: { schema: TransactionDataSchema },
        prompt: `You are an expert financial assistant for users in India. Your task is to extract transaction details from a user's text input. The user is adding a transaction to their Budget Buddy app.

        Analyze the text and extract the following information:
        1.  **description**: Create a short, clean description of the transaction. For example, if the user says "paid for the new superman movie", the description should be "Movie".
        2.  **amount**: The transaction amount. This should always be a positive number.
        3.  **type**: Determine if it's 'income' (money received) or 'expense' (money spent).
        4.  **date**: The date of the transaction. Today's date is {{currentDate}}. If the user mentions a relative date like "yesterday" or "last Tuesday", calculate the absolute date in 'YYYY-MM-DD' format.

        The currency is always Indian Rupees (INR).

        User Text: '{{text}}'`,
        template: {
          helpers: {
            currentDate: () => new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
          },
        },
    });

    const { output: transactionData } = await prompt(text);

    if (!transactionData) {
        throw new Error("Could not parse transaction from text.");
    }

    if (transactionData.amount <= 0) {
        throw new Error("Transaction amount must be a positive number.");
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

    const docRef = await addDoc(collection(db!, 'users', userId, 'accounts', accountId, 'transactions'), newTransaction);
    
    return {
        ...newTransaction,
        id: docRef.id,
        date: transactionDate,
    };
  }
);


export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
  return createTransactionFromTextFlow(input);
}
