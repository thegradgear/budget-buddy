'use server';
/**
 * @fileOverview Creates a financial transaction from a natural language text input,
 * with a robust fallback parser if the AI fails.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {categorizeTransaction, CategorizeTransactionInput} from './categorize-transaction';

// Input and Output types remain the same for the client
export type CreateTransactionFromTextInput = {
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

// Define the schema for the AI's expected output
const TransactionDataSchema = z.object({
  description: z.string().describe('A short, concise description of the transaction (e.g., "Movie ticket", "Groceries", "Salary").'),
  amount: z.number().describe('The transaction amount as a positive number. Extract any numerical value from the text.'),
  type: z.enum(['income', 'expense']).describe("The type of transaction: 'income' for money received, 'expense' for money spent."),
  date: z.string().describe("The date of the transaction in 'YYYY-MM-DD' format. Current year is " + new Date().getFullYear() + "."),
});

// AI Prompt - simplified and direct
const createTransactionPrompt = ai.definePrompt({
  name: 'createTransactionPrompt',
  input: {
    schema: z.string()
  },
  output: {
    schema: TransactionDataSchema
  },
  prompt: `Extract transaction details from this text for an Indian user:

Text: "{{text}}"

Extract and return ONLY a JSON object with:
- description: Brief description (e.g., "Movie ticket", "Coffee")
- amount: Number only (e.g., 200, 5000).
- type: "expense" if money spent, "income" if money received
- date: Today is {{currentDate}}. Use YYYY-MM-DD format. If user says 'yesterday', 'last night', or 'last monday', calculate the correct date.

Rules:
- Amount must be a positive number.
- Look for any number in the text as the amount.
- Currency is always Indian Rupees.
- Words like "spent", "paid", "bought" = expense.
- Words like "earned", "received", "salary" = income.

Return only valid JSON, no other text.`,
  template: {
    helpers: {
      currentDate: () => new Date().toLocaleDateString('en-CA'),
    },
  },
});

// Preprocessing for Indian number formats
function preprocessIndianText(text: string): string {
  let processed = text.toLowerCase();
  processed = processed.replace(/(\d+(?:\.\d+)?)k/g, (_, num) => (parseFloat(num) * 1000).toString());
  processed = processed.replace(/(\d+(?:\.\d+)?)\s*lakh/g, (_, num) => (parseFloat(num) * 100000).toString());
  processed = processed.replace(/(\d+(?:\.\d+)?)\s*crore/g, (_, num) => (parseFloat(num) * 10000000).toString());
  return processed;
}

// Fallback parser for when AI fails
function fallbackParseTransaction(text: string) {
  const lowerText = text.toLowerCase();
  const amountMatch = lowerText.match(/\d+(?:\.\d+)?/);
  
  if (!amountMatch || !amountMatch[0]) {
    throw new Error("AMOUNT_NOT_FOUND");
  }
  const amount = parseFloat(amountMatch[0]);

  const expenseKeywords = /\b(spent|paid|bought|purchase|cost|expense|bill|fee|charge|debit|withdraw|loss|lose)\b/;
  const incomeKeywords = /\b(earned|received|salary|income|got|profit|bonus|refund|credit|deposit|gain|win|won)\b/;
  const type = incomeKeywords.test(lowerText) ? 'income' : 'expense';

  const date = new Date();
  if (lowerText.includes('yesterday') || lowerText.includes('last night')) {
    date.setDate(date.getDate() - 1);
  } else if (lowerText.includes('last weekend')) {
      const todayDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const diff = todayDay >= 6 ? todayDay - 6 : todayDay + 1; // days to subtract to get to last Saturday
      date.setDate(date.getDate() - diff);
  } else {
      const dayMatch = lowerText.match(/last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
      if (dayMatch) {
          const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = weekdays.indexOf(dayMatch[1]);
          const todayDay = date.getDay();
          let diff = todayDay - targetDay;
          if (diff <= 0) {
              diff += 7;
          }
          date.setDate(date.getDate() - diff);
      }
  }
  
  const fillerWordsRegex = /\b(on|for|at|a|the|of|was|were|from|in|with|to)\b/gi;
  let description = text.replace(/rs\.?|rupees|inr/gi, '')
                        .replace(/\d+(?:\.\d+)?k?/gi, '')
                        .replace(expenseKeywords, '')
                        .replace(incomeKeywords, '')
                        .replace(fillerWordsRegex, '')
                        .replace(/\s+/g, ' ')
                        .trim();

  description = description.charAt(0).toUpperCase() + description.slice(1);

  if (!description) {
    description = type === 'income' ? 'Income' : 'Expense';
  }

  return {
    amount,
    type,
    date: date.toISOString().split('T')[0],
    description,
  };
}


// The main exported function
export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
  const processedText = preprocessIndianText(input.text);
  let transactionData;

  try {
    // Try AI first
    console.log('Attempting AI parsing...');
    const {
      output
    } = await createTransactionPrompt(processedText);
    transactionData = output;
    if (!transactionData || transactionData.amount <= 0) {
      throw new Error("AI returned invalid data.");
    }
    console.log('AI parsing successful:', transactionData);
  } catch (aiError) {
    console.warn('AI parsing failed, attempting fallback parser...', aiError);
    try {
      // Use fallback parser if AI fails
      transactionData = fallbackParseTransaction(processedText);
      console.log('Fallback parsing successful:', transactionData);
    } catch (fallbackError: any) {
      console.error('Fallback parser also failed:', fallbackError);
      if (fallbackError.message === "AMOUNT_NOT_FOUND") {
        throw new Error("Please specify an amount in your transaction (e.g., 'spent 200 on coffee' or 'earned 5000 salary')");
      }
      throw new Error(`Could not parse transaction from: "${input.text}". Please try rephrasing.`);
    }
  }

  // Categorize the transaction
  try {
    const categorizationInput: CategorizeTransactionInput = {
      description: transactionData.description,
      type: transactionData.type,
    };
    const { category } = await categorizeTransaction(categorizationInput);
    const transactionDate = new Date(transactionData.date);

    // Ensure date is not in the future
    if (transactionDate > new Date()) {
        const currentYear = new Date().getFullYear();
        if (transactionDate.getFullYear() > currentYear) {
            transactionDate.setFullYear(currentYear);
        }
    }

    return {
      id: '', // Will be set on the client
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: category,
      date: transactionDate,
    };
  } catch (error) {
    console.error('Categorization failed:', error);
    // Return with a default category if categorization fails
    return {
      id: '',
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.type === 'expense' ? 'Other' : 'Income',
      date: new Date(transactionData.date),
    };
  }
}
