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
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AccountCard from '@/components/dashboard/AccountCard';
import CategoryPieChart from '@/components/dashboard/CategoryPieChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Card } from '@/components/ui/card';
import BudgetTracker from '@/components/dashboard/BudgetTracker';

const ACTIVE_ACCOUNT_STORAGE_KEY = 'fiscalFlowActiveAccountId';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<Map<string, Transaction[]>>(new Map());
  
  const [loading, setLoading] = useState(true);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    // On initial load, try to get the active account from localStorage
    const storedAccountId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY) : null;
    if (storedAccountId) {
      setActiveAccountId(storedAccountId);
    }
  }, []);

  // Fetch accounts and all their transactions
  useEffect(() => {
    if (!user || !db) return;
    
    setLoading(true);
    const accountsCollection = collection(db, 'users', user.uid, 'accounts');
    
    const unsubscribe = onSnapshot(accountsCollection, async (accountsSnapshot) => {
        const accountsData: Account[] = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
        setAccounts(accountsData);

        if (accountsData.length > 0) {
            // Determine and persist active account
            const storedAccountId = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
            let currentActiveId = accountsData.some(a => a.id === storedAccountId) ? storedAccountId : accountsData[0].id;
            
            // If activeAccountId from state is not in the new list, reset it.
            if (!accountsData.some(a => a.id === activeAccountId)) {
              currentActiveId = accountsData[0].id;
            }

            if (activeAccountId !== currentActiveId) {
                setActiveAccountId(currentActiveId);
                localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, currentActiveId!);
            }

            // Fetch transactions for ALL accounts
            const transactionsMap = new Map<string, Transaction[]>();
            const transactionPromises = accountsData.map(account => {
                const transactionsQuery = query(
                    collection(db, 'users', user.uid, 'accounts', account.id, 'transactions')
                );
                return getDocs(transactionsQuery).then(snapshot => {
                    const transactionsData: Transaction[] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            date: (data.date as Timestamp).toDate(),
                        } as Transaction;
                    });
                    transactionsMap.set(account.id, transactionsData);
                });
            });

            await Promise.all(transactionPromises);
            setAllTransactions(transactionsMap);
        } else {
            setActiveAccountId(null);
            setAllTransactions(new Map());
            localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
        }

        setLoading(false);
    }, (error) => {
        console.error("Error fetching accounts: ", error);
        toast({ title: "Error", description: "Could not fetch accounts.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const accountsWithBalance = useMemo(() => {
    return accounts.map(account => {
        const accountTransactions = allTransactions.get(account.id) || [];
        const totalIncome = accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { ...account, balance: totalIncome - totalExpenses };
    });
  }, [accounts, allTransactions]);

  const activeAccountTransactions = useMemo(() => {
    if (!activeAccountId) return [];
    // Sort transactions by date descending for display
    return (allTransactions.get(activeAccountId) || []).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activeAccountId, allTransactions]);


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
    localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, accountId);
  };
  
  if (loading) {
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
          <h2 className="text-2xl font-semibold">Welcome, {user?.displayName || 'User'}!</h2>
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
       <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.displayName || 'User'}!</h1>
        <p className="text-muted-foreground">{currentDate}</p>
      </div>

      <BudgetTracker />

      {activeAccountId ? (
        <>
            <AccountOverview transactions={activeAccountTransactions} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CategoryPieChart transactions={activeAccountTransactions} type="expense" title="Expense Categories" />
                <CategoryPieChart transactions={activeAccountTransactions} type="income" title="Income Categories" />
            </div>
            <RecentTransactions transactions={activeAccountTransactions} accountId={activeAccountId}/>
        </>
      ) : (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
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
