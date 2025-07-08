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
                    const monthlyBudget = userData.monthlyBudget ?? null;
                    setBudget(monthlyBudget);
                    setNewBudget(String(monthlyBudget ?? ''));
                } else {
                    setBudget(null);
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
        if (isNaN(budgetValue) || budgetValue <= 0) {
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
        if (percentage > 75) return 'bg-yellow-500';
        return 'bg-primary';
    }, [expenses, budget]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="h-[78px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )
        }

        if (isEditing) {
            return (
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">Enter your total budget for the month.</p>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            value={newBudget}
                            onChange={(e) => setNewBudget(e.target.value)}
                            className="h-9"
                            placeholder="e.g., 50000"
                        />
                        <Button onClick={handleSaveBudget} disabled={isSaving} size="sm">
                           {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                           Save
                        </Button>
                        { budget !== null && 
                            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setNewBudget(String(budget ?? ''))}} disabled={isSaving}>
                                Cancel
                            </Button>
                        }
                    </div>
                </div>
            )
        }
        
        if (budget !== null && budget > 0) {
            return (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatCurrency(expenses)}</span>
                        <span>of</span>
                        <span>{formatCurrency(budget)}</span>
                        <span>spent</span>
                        <Button onClick={() => setIsEditing(true)} variant="ghost" size="icon" className="h-6 w-6 ml-1">
                            <Pencil className="h-3 w-3" />
                        </Button>
                    </div>
                    <Progress value={progressPercentage} className="h-2" indicatorClassName={progressColorClass} />
                    <p className="text-xs text-right text-muted-foreground">{progressPercentage.toFixed(1)}% used</p>
                </div>
            )
        }

        return (
            <div className="text-center py-4">
                 <p className="text-sm text-muted-foreground mb-4">You haven't set a budget yet. Get started now.</p>
                <Button onClick={() => setIsEditing(true)}>Set Monthly Budget</Button>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Budget</CardTitle>
                <CardDescription>Your spending summary for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}