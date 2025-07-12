
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Wand2, Send } from 'lucide-react';
import { createTransactionFromText } from '@/ai/flows/create-transaction-from-text';
import { checkBudgetAndCreateNotifications } from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  text: z.string().min(1, 'Please enter a description.'),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
    activeAccountId: string | null;
}

export default function NlpTransactionInput({ activeAccountId }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: '',
        },
    });

    const handleAddTransaction = async (values: FormValues) => {
        if (!user || !activeAccountId) {
            toast({
                title: "No Active Account",
                description: "Please select an active account on the dashboard before adding a transaction.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Get AI-processed data from the flow
            const result = await createTransactionFromText({
                text: values.text
            });
            
            // 2. Save the processed data to Firebase on the client side
            const newTransaction = {
                description: result.description,
                amount: result.amount,
                type: result.type,
                date: Timestamp.fromDate(result.date),
                category: result.category,
            };
            
            const docRef = await addDoc(
              collection(db!, 'users', user.uid, 'accounts', activeAccountId, 'transactions'), 
              newTransaction
            );
            
            toast({
                title: 'Transaction Added',
                description: `Added ${result.type} of ${result.amount} for "${result.description}".`,
            });
            form.reset();

            if (result.type === 'expense') {
                await checkBudgetAndCreateNotifications(user.uid);
            }

        } catch (error: any) {
            console.error("Error creating transaction from text: ", error);
            toast({
                title: "AI Error",
                description: error.message || "Could not understand the transaction details.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <CardHeader className="relative pb-4">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10">
                        <Wand2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Add Transaction with AI
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground mt-1">
                            Describe your transaction and let AI handle the details.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddTransaction)} className="flex items-start gap-4">
                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., 'spent 200 rupees on coffee yesterday' or 'monthly salary of 50k'"
                                            {...field}
                                            className="h-12 text-base"
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading} size="lg" className="h-12">
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Add
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
