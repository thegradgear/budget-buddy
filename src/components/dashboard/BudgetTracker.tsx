'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth } from 'date-fns';
import { UserProfile } from '@/types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function BudgetTracker() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [budget, setBudget] = useState<number | null>(null);
    const [expenses, setExpenses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newBudget, setNewBudget] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user || !db) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user budget
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserProfile;
                    setBudget(userData.monthlyBudget ?? 0);
                    setNewBudget(String(userData.monthlyBudget ?? ''));
                    if (!userData.monthlyBudget) {
                        setIsEditing(true);
                    }
                } else {
                    setBudget(0);
                    setIsEditing(true);
                }

                // Fetch total expenses for the current month
                const now = new Date();
                const start = startOfMonth(now);
                const end = endOfMonth(now);
                let totalExpenses = 0;
                
                const accountsSnapshot = await getDocs(collection(db, 'users', user.uid, 'accounts'));

                for (const accountDoc of accountsSnapshot.docs) {
                    const transactionsQuery = query(
                        collection(db, 'users', user.uid, 'accounts', accountDoc.id, 'transactions'),
                        where('date', '>=', Timestamp.fromDate(start)),
                        where('date', '<=', Timestamp.fromDate(end)),
                        where('type', '==', 'expense')
                    );
                    
                    const transactionsSnapshot = await getDocs(transactionsQuery);
                    transactionsSnapshot.forEach(transactionDoc => {
                        totalExpenses += transactionDoc.data().amount;
                    });
                }
                setExpenses(totalExpenses);

            } catch (error) {
                console.error("Error fetching budget data:", error);
                toast({ title: "Error", description: "Could not fetch budget information.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, toast]);

    const handleSaveBudget = async () => {
        if (!user || !db) return;
        const budgetValue = parseFloat(newBudget);
        if (isNaN(budgetValue) || budgetValue < 0) {
            toast({ title: "Invalid Input", description: "Please enter a valid positive number for your budget.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { monthlyBudget: budgetValue });
            setBudget(budgetValue);
            setIsEditing(false);
            toast({ title: "Success", description: "Your budget has been updated." });
        } catch (error) {
            console.error("Error updating budget:", error);
            toast({ title: "Error", description: "Could not update your budget.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const progressPercentage = useMemo(() => {
        if (budget === null || budget <= 0) return 0;
        return Math.min((expenses / budget) * 100, 100);
    }, [expenses, budget]);

    const progressColorClass = useMemo(() => {
        const percentage = (expenses / (budget || 1)) * 100;
        if (percentage > 90) return 'bg-destructive';
        if (percentage > 75) return 'bg-[hsl(var(--chart-4))]';
        return 'bg-primary';
    }, [expenses, budget]);


    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 h-[158px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Monthly Budget</CardTitle>
                        <CardDescription>Track your spending against your monthly limit.</CardDescription>
                    </div>
                    { !isEditing && (
                        <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Budget
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditing ? (
                    <div className="flex items-center gap-4">
                        <Input 
                            type="number" 
                            value={newBudget}
                            onChange={(e) => setNewBudget(e.target.value)}
                            className="h-10"
                            placeholder="e.g., 50000"
                        />
                        <Button onClick={handleSaveBudget} disabled={isSaving}>
                           {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                           Save
                        </Button>
                        { (budget ?? 0) > 0 && 
                            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                        }
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Progress value={progressPercentage} className="h-3" indicatorClassName={progressColorClass} />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{formatCurrency(expenses)} spent</span>
                            <span>Budget: {formatCurrency(budget ?? 0)}</span>
                        </div>
                    </div>
                )}
                 { budget === 0 && !isEditing &&
                     <div className="text-center text-sm text-muted-foreground pt-2">
                        You haven't set a budget yet. Click "Edit Budget" to get started.
                    </div>
                }
            </CardContent>
        </Card>
    );
}
