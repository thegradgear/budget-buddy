'use client';

import { useState, useEffect } from 'react';
import { Transaction, Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSpendingSuggestions } from '@/ai/flows/spending-suggestions';
import { Lightbulb, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  transactions: Transaction[];
  account: Account | null;
};

export default function SmartSuggestions({ transactions, account }: Props) {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (account?.aiSuggestions) {
      setSuggestions(account.aiSuggestions);
    } else {
      setSuggestions('');
    }
  }, [account]);

  const handleGetSuggestions = async () => {
    if (!user || !account || !db) {
        toast({ title: "Error", description: "Cannot generate suggestions without a logged-in user and account.", variant: "destructive" });
        return;
    }

    setLoading(true);
    setSuggestions('');
    try {
      const transactionHistory = transactions
        .map(t => `${format(new Date(t.date), 'yyyy-MM-dd')}: ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)} for ${t.description}`)
        .join('\n');
      
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      const result = await getSpendingSuggestions({
        transactionHistory,
        currentBudget: totalIncome, // Simplified: uses total income as budget reference
      });

      const newSuggestions = result.suggestions;
      setSuggestions(newSuggestions);

      // Save to Firebase
      const accountDocRef = doc(db, 'users', user.uid, 'accounts', account.id);
      await updateDoc(accountDocRef, {
        aiSuggestions: newSuggestions
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error fetching suggestions',
        description: 'Could not get AI suggestions at this time. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Smart Suggestions</CardTitle>
        <CardDescription>Get AI-powered tips for this account.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex-grow min-h-[250px] relative">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : suggestions ? (
              <div className="text-sm text-muted-foreground leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestions}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <Lightbulb className="h-12 w-12 mb-4 text-primary/50" />
                <p>Click the button to get financial advice for this account.</p>
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="mt-4 shrink-0">
            <Button onClick={handleGetSuggestions} disabled={loading || transactions.length === 0} className="w-full">
            {loading ? 'Analyzing...' : suggestions ? 'Regenerate Suggestions' : 'Get Suggestions'}
            </Button>
        </div>
      </CardContent>
      <CardFooter className="p-2 border-t bg-secondary shrink-0">
          <Button variant="link" asChild className="w-full text-xs">
              <Link href="/dashboard/insights">
                  Go to AI Insights for a full analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
