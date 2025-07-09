'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Transaction, UserProfile, Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSpendingSuggestions } from '@/ai/flows/spending-suggestions';
import { Lightbulb, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const fetchAllData = async () => {
      setLoadingData(true);
      try {
        // Fetch user profile for budget
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }

        // Fetch all accounts
        const accountsSnapshot = await getDocs(collection(db, 'users', user.uid, 'accounts'));
        const accountsData: Account[] = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));

        // Fetch transactions for ALL accounts
        const transactionsList: Transaction[] = [];
        const transactionPromises = accountsData.map(account => {
            const transactionsQuery = query(
                collection(db, 'users', user.uid, 'accounts', account.id, 'transactions')
            );
            return getDocs(transactionsQuery).then(snapshot => {
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    transactionsList.push({
                        id: doc.id,
                        ...data,
                        date: (data.date as Timestamp).toDate(),
                    } as Transaction);
                });
            });
        });

        await Promise.all(transactionPromises);
        setAllTransactions(transactionsList.sort((a, b) => b.date.getTime() - a.date.getTime()));
      } catch (error) {
        console.error("Error fetching data for insights:", error);
        toast({ title: "Error", description: "Could not load data for AI Insights.", variant: "destructive" });
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [user, toast]);

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions('');
    try {
      const transactionHistory = allTransactions
        .map(t => `${format(new Date(t.date), 'yyyy-MM-dd')}: ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)} for ${t.description}`)
        .join('\n');
      
      const budget = userProfile?.monthlyBudget ?? 0;
      
      const result = await getSpendingSuggestions({
        transactionHistory,
        currentBudget: budget,
      });

      setSuggestions(result.suggestions);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error fetching suggestions',
        description: 'Could not get AI suggestions at this time. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            AI-Powered Financial Insights
          </CardTitle>
          <CardDescription>
            Get a holistic view of your financial habits. Our AI will analyze your transactions across all accounts to provide personalized advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
            {loadingData ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Loading your financial data...</p>
                </div>
            ) : (
                <>
                    <div className="flex-grow min-h-[200px] bg-secondary p-4 rounded-md">
                        {loadingSuggestions ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Analyzing your spending habits...</p>
                            </div>
                        ) : suggestions ? (
                            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{suggestions}</div>
                        ) : (
                            <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                            <Lightbulb className="h-12 w-12 mb-4 text-primary/50" />
                            <p className="max-w-md">Ready for your financial check-up? Click the button below to get personalized advice based on your entire transaction history.</p>
                            </div>
                        )}
                    </div>
                    <Button onClick={handleGetSuggestions} disabled={loadingSuggestions || allTransactions.length === 0} className="mt-4 w-full sm:w-auto self-center">
                        {loadingSuggestions ? 'Analyzing...' : 'Generate Full Financial Report'}
                    </Button>
                </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
