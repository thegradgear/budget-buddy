'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const budgetSchema = z.object({
  monthlyBudget: z.coerce.number().min(0, "Budget must be a positive number.").optional(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function BudgetPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      monthlyBudget: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Database not connected.' });
            setFetching(false);
            return;
        }
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          form.reset({
            monthlyBudget: userData.monthlyBudget || undefined,
          });
        }
        setFetching(false);
      };
      fetchUserData();
    } else if (!user && fetching === false) {
        router.push('/login');
    }
  }, [user, form, toast, router, fetching]);

  async function onSubmit(data: BudgetFormValues) {
    setLoading(true);
    if (!user || !db) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your budget.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        monthlyBudget: data.monthlyBudget || 0,
      });

      toast({
        title: 'Success',
        description: 'Your monthly budget has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating budget',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
      return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div>
      <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
      </Button>
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>Set your monthly spending limit to receive notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Budget (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="100" placeholder="e.g., 50000" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Budget
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
