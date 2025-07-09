'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  transactions: Transaction[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const NEEDS_CATEGORIES = ['Groceries', 'Utilities', 'Transport', 'Rent', 'Health & Wellness', 'Education'];
const WANTS_CATEGORIES = ['Food & Dining', 'Shopping', 'Entertainment', 'Travel', 'Other Expense'];
const SAVINGS_DEBT_CATEGORIES = ['EMI', 'Investment'];

export default function FiftyThirtyTwentyRule({ transactions }: Props) {
  const { needs, wants, savingsAndDebt, totalIncome, needsPercentage, wantsPercentage, savingsAndDebtPercentage, remainingSavings } = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const needs = transactions
      .filter((t) => t.type === 'expense' && NEEDS_CATEGORIES.includes(t.category || ''))
      .reduce((sum, t) => sum + t.amount, 0);

    const wants = transactions
      .filter((t) => t.type === 'expense' && WANTS_CATEGORIES.includes(t.category || ''))
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsAndDebtFromCategories = transactions
      .filter((t) => t.type === 'expense' && SAVINGS_DEBT_CATEGORIES.includes(t.category || ''))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = needs + wants + savingsAndDebtFromCategories;
    const remainingSavings = totalIncome - totalExpenses;
    const totalSavingsAndDebt = savingsAndDebtFromCategories + (remainingSavings > 0 ? remainingSavings : 0);

    if (totalIncome === 0) {
      return { needs: 0, wants: 0, savingsAndDebt: 0, totalIncome: 0, needsPercentage: 0, wantsPercentage: 0, savingsAndDebtPercentage: 0, remainingSavings: 0 };
    }

    const needsPercentage = (needs / totalIncome) * 100;
    const wantsPercentage = (wants / totalIncome) * 100;
    const savingsAndDebtPercentage = (totalSavingsAndDebt / totalIncome) * 100;

    return { needs, wants, savingsAndDebt: totalSavingsAndDebt, totalIncome, needsPercentage, wantsPercentage, savingsAndDebtPercentage, remainingSavings };
  }, [transactions]);
  
  if (totalIncome === 0) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>50/30/20 Rule Analysis</CardTitle>
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                        <p>The 50/30/20 rule is a simple budgeting guideline: allocate 50% of your after-tax income to Needs, 30% to Wants, and 20% to Savings & Debt Repayment.</p>
                        </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>How your spending this month aligns with this popular budgeting rule.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex h-[150px] items-center justify-center text-center text-muted-foreground">
                    <p>Add some income for this month to see your 50/30/20 breakdown.</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  const RuleItem = ({ title, target, actualPercentage, actualAmount, colorClass, tooltipText }: { title: string, target: number, actualPercentage: number, actualAmount: number, colorClass: string, tooltipText: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            <span className="text-sm text-muted-foreground">(Target: {target}%)</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-semibold">{formatCurrency(actualAmount)}</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        {title === 'Savings & Debt' ? (
                            actualPercentage < target ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            )
                        ) : (
                            actualPercentage > target ? (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            )
                        )}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
            <TooltipTrigger className='w-full'>
                <Progress value={actualPercentage > 100 ? 100 : actualPercentage} indicatorClassName={colorClass} />
            </TooltipTrigger>
            <TooltipContent>
                <p>You've spent {actualPercentage.toFixed(1)}% of your income on {title.toLowerCase()}.</p>
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>50/30/20 Rule Analysis</CardTitle>
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                <p>The 50/30/20 rule is a simple budgeting guideline: allocate 50% of your after-tax income to Needs, 30% to Wants, and 20% to Savings & Debt Repayment.</p>
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
        <CardDescription>How your spending this month aligns with this popular budgeting rule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RuleItem 
            title="Needs"
            target={50}
            actualPercentage={needsPercentage}
            actualAmount={needs}
            colorClass={needsPercentage > 50 ? 'bg-destructive' : 'bg-blue-500'}
            tooltipText={needsPercentage > 50 ? `You're over budget on needs.` : `You're within your budget for needs.`}
        />
        <RuleItem 
            title="Wants"
            target={30}
            actualPercentage={wantsPercentage}
            actualAmount={wants}
            colorClass={wantsPercentage > 30 ? 'bg-destructive' : 'bg-amber-500'}
            tooltipText={wantsPercentage > 30 ? `You're over budget on wants.` : `You're within your budget for wants.`}
        />
        <RuleItem 
            title="Savings & Debt"
            target={20}
            actualPercentage={savingsAndDebtPercentage}
            actualAmount={savingsAndDebt}
            colorClass={savingsAndDebtPercentage < 20 ? 'bg-yellow-500' : 'bg-emerald-500'}
            tooltipText={savingsAndDebtPercentage < 20 ? `You're under your savings goal.` : `Great job on saving!`}
        />
        {remainingSavings < 0 && (
            <div className='flex items-center text-destructive-foreground bg-destructive/90 p-3 rounded-md text-sm'>
                <TrendingDown className="mr-2 h-5 w-5" />
                <p>You have spent {formatCurrency(Math.abs(remainingSavings))} more than your income this month.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
