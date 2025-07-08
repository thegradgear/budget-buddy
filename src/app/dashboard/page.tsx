// src/app/dashboard/page.tsx
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section - Responsive flex layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
          Welcome, {user?.displayName?.split(' ')[0] || 'Buddy'}!
        </h1>
        <Button onClick={openAddModal} className="w-full sm:w-auto sm:min-w-[160px]">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Account Overview - Full width on all screens */}
      <AccountOverview transactions={transactions} />

      {/* Chart and Suggestions Grid - Responsive layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-3">
        {/* Spending Chart - Takes full width on mobile, 2/3 on xl screens */}
        <div className="xl:col-span-2">
          <SpendingChart transactions={transactions} />
        </div>
        {/* Smart Suggestions - Full width on mobile, 1/3 on xl screens */}
        <div className="xl:col-span-1">
          <SmartSuggestions transactions={transactions} />
        </div>
      </div>
      
      {/* Transaction List - Full width, responsive internally */}
      <TransactionList 
        transactions={transactions} 
        onEdit={openEditModal}
        onDelete={handleDeleteTransaction}
      />

      {/* Modal - Responsive by default */}
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
