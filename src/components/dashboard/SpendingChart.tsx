'use client';

import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { useMemo, useState } from 'react';
import { 
  subDays, 
  format, 
  startOfDay, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  startOfWeek, 
  endOfWeek, 
  eachMonthOfInterval,
  getYear
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DateRange = '7d' | '1m' | '3m' | 'all';

const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    income: {
        label: "Income",
        color: "hsl(var(--chart-1))",
    }
} satisfies ChartConfig

export default function SpendingChart({ transactions }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');
    const now = new Date();

    if (dateRange === '7d') {
      const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
      return days.map(day => ({
        date: format(day, 'MMM d'),
        expenses: expenses
          .filter(e => startOfDay(new Date(e.date)).getTime() === startOfDay(day).getTime())
          .reduce((sum, e) => sum + e.amount, 0),
        income: income
            .filter(i => startOfDay(new Date(i.date)).getTime() === startOfDay(day).getTime())
            .reduce((sum, i) => sum + i.amount, 0),
      }));
    }

    if (dateRange === '1m') {
        const days = eachDayOfInterval({ start: startOfMonth(now), end: now });
        return days.map(day => ({
            date: format(day, 'd'),
            expenses: expenses
                .filter(e => startOfDay(new Date(e.date)).getTime() === startOfDay(day).getTime())
                .reduce((sum, e) => sum + e.amount, 0),
            income: income
                .filter(i => startOfDay(new Date(i.date)).getTime() === startOfDay(day).getTime())
                .reduce((sum, i) => sum + i.amount, 0),
        }));
    }

    if (dateRange === '3m') {
      const weeks = eachWeekOfInterval({ start: subMonths(now, 3), end: now }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          date: format(weekStart, 'MMM d'),
          expenses: expenses
            .filter(e => {
              const eDate = startOfDay(new Date(e.date));
              return eDate >= weekStart && eDate <= weekEnd;
            })
            .reduce((sum, e) => sum + e.amount, 0),
          income: income
            .filter(i => {
                const iDate = startOfDay(new Date(i.date));
                return iDate >= weekStart && iDate <= weekEnd;
            })
            .reduce((sum, i) => sum + i.amount, 0),
        };
      });
    }
    
    if (dateRange === 'all') {
        if (transactions.length === 0) return [];
        const firstTransactionDate = transactions.reduce((oldest, t) => new Date(t.date) < oldest ? new Date(t.date) : oldest, new Date());
        const months = eachMonthOfInterval({ start: firstTransactionDate, end: now });
        return months.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            return {
                date: format(monthStart, getYear(monthStart) === getYear(now) ? 'MMM' : 'MMM yy'),
                expenses: expenses
                    .filter(e => {
                        const eDate = new Date(e.date);
                        return eDate >= monthStart && eDate <= monthEnd;
                    })
                    .reduce((sum, e) => sum + e.amount, 0),
                income: income
                    .filter(i => {
                        const iDate = new Date(i.date);
                        return iDate >= monthStart && iDate <= monthEnd;
                    })
                    .reduce((sum, i) => sum + i.amount, 0),
            };
        });
    }

    return [];
  }, [transactions, dateRange]);
  
  const titles = {
    '7d': 'Last 7 Days',
    '1m': 'This Month',
    '3m': 'Last 3 Months',
    'all': 'Overall',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Income vs. Expense: {titles[dateRange]}</CardTitle>
          <CardDescription>A summary of your income and expenses.</CardDescription>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a date range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="1m">This Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="all">Overall</SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data.length > 0 && data.some(d => d.expenses > 0 || d.income > 0) ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={data} accessibilityLayer margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                </BarChart>
            </ChartContainer>
        ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No data for this period.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
