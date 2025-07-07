'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import AccountOverview from '@/components/dashboard/AccountOverview';
import TransactionList from '@/components/dashboard/TransactionList';
import SpendingChart from '@/components/dashboard/SpendingChart';
import SmartSuggestions from '@/components/dashboard/SmartSuggestions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import TransactionModal from '@/components/dashboard/TransactionModal';
import { useAuth } from '@/lib/auth';

const mockTransactions: Transaction[] = [
    { id: '1', type: 'income', amount: 2000, description: 'Salary', date: new Date('2024-07-15') },
    { id: '2', type: 'expense', amount: 50, description: 'Groceries', date: new Date('2024-07-16') },
    { id: '3', type: 'expense', amount: 25, description: 'Coffee', date: new Date('2024-07-17') },
    { id: '4', type: 'expense', amount: 120, description: 'Dinner with friends', date: new Date('2024-07-18') },
    { id: '5', type: 'income', amount: 300, description: 'Freelance Project', date: new Date('2024-07-20') },
    { id: '6', type: 'expense', amount: 80, description: 'Internet Bill', date: new Date('2024-07-21') },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: new Date().toISOString() };
    setTransactions(prev => [...prev, newTransaction].sort((a, b) => b.date.getTime() - a.date.getTime()));
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a,b) => b.date.getTime() - a.date.getTime()));
  };
  
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-semibold">Welcome, {user?.displayName?.split(' ')[0] || 'Buddy'}!</h1>
        <Button onClick={openAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <AccountOverview transactions={transactions} />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <SpendingChart transactions={transactions} />
        </div>
        <div className="lg:col-span-3">
          <SmartSuggestions transactions={transactions} />
        </div>
      </div>
      
      <TransactionList 
        transactions={transactions} 
        onEdit={openEditModal}
        onDelete={handleDeleteTransaction}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(t) => {
          if ('id' in t && t.id) {
            handleUpdateTransaction(t as Transaction);
          } else {
            handleAddTransaction(t);
          }
        }}
        transaction={editingTransaction}
      />
    </div>
  );
}
