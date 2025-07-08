export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  category?: string;
};

export type Account = {
  id: string;
  name: string;
  type: 'Savings' | 'Checking' | 'Credit Card' | 'Cash';
};
