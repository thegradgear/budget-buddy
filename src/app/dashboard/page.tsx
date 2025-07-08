// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import AccountOverview from '@/components/dashboard/AccountOverview';
import TransactionList from '@/components/dashboard/TransactionList';
import SpendingChart from '@/components/dashboard/SpendingChart';
import SmartSuggestions from '@/components/dashboard/SmartSuggestions';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import TransactionModal from '@/components/dashboard/TransactionModal';
import { useAuth } from '@/lib/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const transactionsData: Transaction[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: (data.date as Timestamp).toDate(),
            category: data.category,
          };
        });
        setTransactions(transactionsData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching transactions: ", error);
        toast({
          title: "Error",
          description: "Could not fetch transactions.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user || !db) return;
    try {
      const { category } = await categorizeTransaction({
        description: transaction.description,
        type: transaction.type,
      });

      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        ...transaction,
        category,
        date: Timestamp.fromDate(transaction.date)
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      toast({ title: "Error", description: "Could not add transaction.", variant: "destructive" });
    }
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    if (!user || !db) return;
    const { id, ...data } = updatedTransaction;
    try {
      const { category } = await categorizeTransaction({
        description: data.description,
        type: data.type,
      });
      const docRef = doc(db, 'users', user.uid, 'transactions', id);
      await updateDoc(docRef, {
        ...data,
        category,
        date: Timestamp.fromDate(data.date)
      });
    } catch (error) {
      console.error("Error updating transaction: ", error);
      toast({ title: "Error", description: "Could not update transaction.", variant: "destructive" });
    }
  };
  
  const handleDeleteTransaction = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
        onSave={async (t) => {
          if ('id' in t && t.id) {
            await handleUpdateTransaction(t as Transaction);
          } else {
            await handleAddTransaction(t as Omit<Transaction, 'id'>);
          }
        }}
        transaction={editingTransaction}
      />
    </div>
  );
}
