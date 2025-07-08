// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Account, Transaction } from '@/types';
import AccountOverview from '@/components/dashboard/AccountOverview';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Banknote } from 'lucide-react';
import AccountModal from '@/components/dashboard/AccountModal';
import { useAuth } from '@/lib/auth';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AccountCard from '@/components/dashboard/AccountCard';
import CategoryPieChart from '@/components/dashboard/CategoryPieChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Fetch accounts
  useEffect(() => {
    if (!user || !db) return;
    setAccountsLoading(true);
    const accountsCollection = collection(db, 'users', user.uid, 'accounts');
    
    const unsubscribe = onSnapshot(accountsCollection, (snapshot) => {
        const accountsData: Account[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
        setAccounts(accountsData);

        if (accountsData.length > 0) {
            if (!activeAccountId || !accountsData.some(a => a.id === activeAccountId)) {
                setActiveAccountId(accountsData[0].id);
            }
        } else {
            setActiveAccountId(null);
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
    if (!user || !db || !activeAccountId) {
      setTransactions([]);
      setTransactionsLoading(false);
      return () => {};
    }

    setTransactionsLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'accounts', activeAccountId, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const transactionsData: Transaction[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
          } as Transaction;
        });
        setTransactions(transactionsData);
        setTransactionsLoading(false);
      }, (error) => {
        console.error("Error fetching transactions: ", error);
        toast({ title: "Error", description: "Could not fetch transactions.", variant: "destructive" });
        setTransactionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeAccountId, toast]);
  
  const accountsWithBalance = useMemo(() => {
    // This is not efficient for many accounts/transactions, but ok for this scope.
    // For the active account, we already have transactions.
    if (activeAccountId) {
        return accounts.map(account => {
            if (account.id === activeAccountId) {
                const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                return { ...account, balance: totalIncome - totalExpenses };
            }
            // For other accounts, we'll just show a balance of 0 to avoid fetching all transactions for all accounts.
            // The real balance will show on the account details page.
            return { ...account, balance: 0 };
        });
    }
    return accounts.map(account => ({ ...account, balance: 0 }));
  }, [accounts, activeAccountId, transactions]);


  const handleSaveAccount = async (account: Omit<Account, 'id'>) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'accounts'), account);
      toast({ title: "Success", description: "Account created successfully." });
    } catch (error) {
      console.error("Error adding account: ", error);
      toast({ title: "Error", description: "Could not add account.", variant: "destructive" });
    }
  };

  const handleSetActiveAccount = (accountId: string) => {
    setActiveAccountId(accountId);
  };
  
  if (accountsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
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
          <p className="text-muted-foreground max-w-sm">To get started, create your first financial account. You can add savings, checking, or credit card accounts.</p>
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

  return (
    <div className="space-y-8">
      {transactionsLoading ? (
         <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      ) : (
        <>
            <AccountOverview transactions={transactions} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CategoryPieChart transactions={transactions} type="expense" title="Expense Categories" />
                <CategoryPieChart transactions={transactions} type="income" title="Income Categories" />
            </div>
            <RecentTransactions transactions={transactions} accountId={activeAccountId}/>
        </>
      )}

        <div>
            <h2 className="text-2xl font-bold mb-4">Your Accounts</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accountsWithBalance.map(acc => (
                <AccountCard 
                    key={acc.id} 
                    account={acc} 
                    isActive={acc.id === activeAccountId} 
                    onActivate={handleSetActiveAccount} 
                />
            ))}
            <Card 
                className="flex items-center justify-center border-dashed h-full min-h-[150px] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsAccountModalOpen(true)}
            >
                <div className="text-center">
                    <PlusCircle className="mx-auto h-8 w-8 mb-2" />
                    <p className="font-semibold">Add New Account</p>
                </div>
            </Card>
            </div>
        </div>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
