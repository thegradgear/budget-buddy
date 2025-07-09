'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { Transaction, UserProfile, Account } from '@/types';
import { Button } from '@/components/ui/button';
import { getSpendingSuggestions } from '@/ai/flows/spending-suggestions';
import { Lightbulb, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [report, setReport] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const fetchAllData = async () => {
      setLoadingData(true);
      try {
        // Fetch user profile for budget and saved report
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setUserProfile(data);
          if (data.aiFinancialReport) {
            setReport(data.aiFinancialReport);
          }
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

  const handleGenerateReport = async () => {
    if (!user || !db) return;

    setLoadingReport(true);
    setReport('');
    try {
      const transactionHistory = allTransactions
        .map(t => `${format(new Date(t.date), 'yyyy-MM-dd')}: ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)} for ${t.description}`)
        .join('\n');
      
      const budget = userProfile?.monthlyBudget ?? 0;
      
      const result = await getSpendingSuggestions({
        transactionHistory,
        currentBudget: budget,
      });
      
      const newReport = result.suggestions;
      setReport(newReport);

      // Save report to Firebase
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { aiFinancialReport: newReport });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error generating report',
        description: 'Could not get AI report at this time. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Button>

        <div className="space-y-8">
            <div className="max-w-4xl mx-auto text-center space-y-2">
                <div className="inline-flex items-center justify-center gap-3">
                    <Lightbulb className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">AI-Powered Financial Insights</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    Get a holistic view of your financial habits. Our AI will analyze your transactions across all accounts to provide personalized advice.
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto flex flex-col">
                {loadingData ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading your financial data...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow min-h-[200px] bg-secondary p-6 rounded-lg">
                            {loadingReport ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                    <p className="text-foreground">Analyzing your spending habits...</p>
                                    <p className="text-xs text-muted-foreground mt-1">This may take a moment.</p>
                                </div>
                            ) : report ? (
                                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full p-8">
                                    <Lightbulb className="h-12 w-12 mb-4 text-primary/30" />
                                    <h3 className="font-semibold text-lg text-foreground mb-2">Ready for your financial check-up?</h3>
                                    <p className="max-w-md">Click the button below to get personalized advice based on your entire transaction history.</p>
                                </div>
                            )}
                        </div>
                        <Button onClick={handleGenerateReport} disabled={loadingReport || allTransactions.length === 0} className="mt-6 w-full sm:w-auto self-center" size="lg">
                            {loadingReport ? 'Analyzing...' : report ? 'Regenerate Full Financial Report' : 'Generate Full Financial Report'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
}
