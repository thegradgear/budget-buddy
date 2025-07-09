'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, Target, PiggyBank, ArrowRight, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { generateLifeEventPlan, LifeEventPlanOutput } from '@/ai/flows/life-event-planner';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  goal: z.string().min(3, 'Goal must be at least 3 characters long.'),
  targetAmount: z.coerce.number().positive('Target amount must be a positive number.'),
  monthlyIncome: z.coerce.number().positive('Monthly income must be a positive number.'),
  years: z.coerce.number().min(1, 'Timeframe must be at least 1 year.'),
});

type FormValues = z.infer<typeof formSchema>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function LifeEventPlanner() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LifeEventPlanOutput | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: '',
      targetAmount: undefined,
      years: undefined,
      monthlyIncome: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setPlan(null);
    try {
      const result = await generateLifeEventPlan(values);
      setPlan(result);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Plan',
        description: 'Could not create a financial plan at this time. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const grandTotalFutureValue = plan?.investmentSuggestions?.reduce((sum, item) => sum + item.futureValue, 0) ?? 0;
  
  const renderPlan = () => {
    if (!plan) return null;

    if (!plan.isFeasible && plan.feasibilityAnalysis) {
        return (
            <div className="space-y-6 w-full">
                <Card className="relative overflow-hidden border-amber-500/50 shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 p-6 text-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">{plan.planTitle}</h2>
                </Card>

                <Card className="border-amber-500/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                           <AlertTriangle className="h-6 w-6" />
                           Goal May Be Unrealistic in Current Timeframe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{plan.summary}</p>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Required Monthly Savings</p>
                                <p className="font-bold text-lg text-red-600">{formatCurrency(plan.feasibilityAnalysis.requiredMonthlySavings)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Your Max Affordable Savings</p>
                                <p className="font-bold text-lg text-emerald-600">{formatCurrency(plan.feasibilityAnalysis.maxAffordableSavings)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                           <CheckCircle className="h-6 w-6" />
                           Here's An Achievable Alternative
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">You can still reach your goal in:</p>
                        <p className="text-center text-4xl font-bold text-primary">{plan.feasibilityAnalysis.minimumFeasibleTimeframe}</p>
                        
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Calculator className="h-5 w-5" />
                           How We Calculated This
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                        {plan.feasibilityAnalysis.calculationBreakdown.map((step, index) => (
                            <p key={index}>{step}</p>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (plan.isFeasible && plan.monthlySavings && plan.investmentSuggestions) {
        return (
            <div className="space-y-6 w-full">
                <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-6 text-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{plan.planTitle}</h2>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <PiggyBank className="h-5 w-5" />
                           Monthly Savings Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatCurrency(plan.monthlySavings.amount)}</p>
                        <p className="text-muted-foreground">{plan.monthlySavings.summary}</p>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recommended Investment Strategy</h3>
                    {plan.investmentSuggestions.map((item, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                    {item.type}
                                    <Badge variant="secondary">{item.suggestedAllocation}</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Est. Return: <span className="font-semibold text-primary">{item.estimatedReturn}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Monthly Investment</p>
                                        <p className="font-bold text-lg">{formatCurrency(item.monthlyInvestment)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Projected Value</p>
                                        <p className="font-bold text-lg">{formatCurrency(item.futureValue)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Projected Grand Total</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(grandTotalFutureValue)}</span>
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-secondary">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground italic">{plan.summary}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Form Section */}
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Plan Your Next Big Goal
                </CardTitle>
                <CardDescription>
                    Tell us what you're saving for, and our AI will create a personalized investment plan to help you get there.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="goal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Financial Goal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Buy a new car, Down payment for a house" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="targetAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Amount (in INR)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 500000" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="monthlyIncome"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Monthly Income (in INR)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 80000" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="years"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timeframe (in years)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 3" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {loading ? 'Generating Plan...' : 'Create My Plan'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        {/* Results Section */}
        <div className="min-h-[500px] flex items-center justify-center">
        {loading ? (
            <div className="text-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-semibold text-lg">Building your custom plan...</p>
                <p>This may take a moment.</p>
            </div>
        ) : plan ? (
            renderPlan()
        ) : (
            <div className="text-center text-muted-foreground p-8">
                <Wand2 className="h-16 w-16 mx-auto mb-4 text-primary/30" />
                <h3 className="font-semibold text-xl text-foreground mb-2">Your financial plan awaits</h3>
                <p className="max-w-md">Fill out the form to see how you can achieve your goals with a smart savings and investment strategy.</p>
            </div>
        )}
        </div>
    </div>
  );
}
