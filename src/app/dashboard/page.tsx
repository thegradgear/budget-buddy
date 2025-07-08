// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Account, Transaction } from '@/types';
import AccountOverview from '@/components/dashboard/AccountOverview';
import TransactionList from '@/components/dashboard/TransactionList';
import SpendingChart from '@/components/dashboard/SpendingChart';
import SmartSuggestions from '@/components/dashboard/SmartSuggestions';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Banknote } from 'lucide-react';
import TransactionModal from '@/components/dashboard/TransactionModal';
import AccountModal from '@/components/dashboard/AccountModal';
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
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Fetch accounts
  useEffect(() => {
    if (!user || !db) {
      setAccountsLoading(false);
      return;
    }

    const accountsCollection = collection(db, 'users', user.uid, 'accounts');
    
    const unsubscribe = onSnapshot(accountsCollection, (querySnapshot) => {
        const accountsData: Account[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Account));
        
        setAccounts(accountsData);

        if (accountsData.length > 0) {
            // If there's an active account, check if it still exists
            if (activeAccount && accountsData.some(a => a.id === activeAccount.id)) {
                // It still exists, no need to change active account
            } else {
                // Set the first account as active
                setActiveAccount(accountsData[0]);
            }
        } else {
            setActiveAccount(null);
        }
        
        setAccountsLoading(false);
    }, (error) => {
        console.error("Error fetching accounts: ", error);
        toast({ title: "Error", description: "Could not fetch accounts.", variant: "destructive" });
        setAccountsLoading(false);
    });

    return () => unsubscribe();
}, [user, toast]);


  // Fetch transactions for active account
  useEffect(() => {
    if (!user || !db || !activeAccount) {
      setTransactions([]);
      return () => {};
    }

    setTransactionsLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'accounts', activeAccount.id, 'transactions'),
      orderBy('date', 'desc')
    );

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
        setTransactionsLoading(false);
      }, 
      (error) => {
        console.error("Error fetching transactions: ", error);
        toast({ title: "Error", description: "Could not fetch transactions.", variant: "destructive" });
        setTransactionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeAccount, toast]);

  const handleSaveAccount = async (account: Omit<Account, 'id'>) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'accounts'), account);
    } catch (error) {
      console.error("Error adding account: ", error);
      toast({ title: "Error", description: "Could not add account.", variant: "destructive" });
    }
  };

  const handleSetActiveAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setActiveAccount(account);
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user || !db || !activeAccount) return;
    try {
      const { category } = await categorizeTransaction({
        description: transaction.description,
        type: transaction.type,
      });

      await addDoc(collection(db, 'users', user.uid, 'accounts', activeAccount.id, 'transactions'), {
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
    if (!user || !db || !activeAccount) return;
    const { id, ...data } = updatedTransaction;
    try {
      const { category } = await categorizeTransaction({
        description: data.description,
        type: data.type,
      });
      const docRef = doc(db, 'users', user.uid, 'accounts', activeAccount.id, 'transactions', id);
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
    if (!user || !db || !activeAccount) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'accounts', activeAccount.id, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  }

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  }

  if (accountsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (accounts.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <Banknote className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Welcome to Budget Buddy!</h2>
          <p className="text-muted-foreground max-w-sm">To get started, create your first financial account. You can add savings, checking, credit cards, or cash accounts.</p>
          <Button onClick={() => setIsAccountModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Account
          </Button>
        </div>
        <AccountModal 
          isOpen={isAccountModalOpen} 
          onClose={() => setIsAccountModalOpen(false)} 
          onSave={handleSaveAccount} 
        />
      </>
    );
  }
  
  const loading = transactionsLoading && activeAccount;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Select onValueChange={handleSetActiveAccount} value={activeAccount?.id}>
            <SelectTrigger className="w-[180px] sm:w-[200px] h-11 text-lg font-semibold">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsAccountModalOpen(true)}>
             <PlusCircle className="mr-2 h-4 w-4" />
             New Account
          </Button>
        </div>
        <Button onClick={openAddModal} className="w-full sm:w-auto sm:min-w-[160px]" disabled={!activeAccount}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <AccountOverview transactions={transactions} />
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SpendingChart transactions={transactions} />
            </div>
            <div className="xl:col-span-1">
              <SmartSuggestions transactions={transactions} />
            </div>
          </div>
          <TransactionList 
            transactions={transactions} 
            onEdit={openEditModal}
            onDelete={handleDeleteTransaction}
          />
        </>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
        }}
        onSave={handleSaveAccount}
      />
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
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
