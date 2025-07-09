'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSpendingSuggestions } from '@/ai/flows/spending-suggestions';
import { Lightbulb, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

type Props = {
  transactions: Transaction[];
};

export default function SmartSuggestions({ transactions }: Props) {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
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

      setSuggestions(result.suggestions);
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
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suggestions ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{suggestions}</div>
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Lightbulb className="h-12 w-12 mb-4 text-primary/50" />
              <p>Click the button to get financial advice for this account.</p>
            </div>
          )}
        </div>
        <Button onClick={handleGetSuggestions} disabled={loading || transactions.length === 0} className="mt-4 w-full">
          {loading ? 'Analyzing...' : 'Get Suggestions'}
        </Button>
      </CardContent>
      <CardFooter className="p-2 border-t bg-secondary">
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
