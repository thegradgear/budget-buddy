'use client';

import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { useMemo } from 'react';
import { subDays, format, startOfDay } from 'date-fns';

type Props = {
  transactions: Transaction[];
};

const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig

export default function SpendingChart({ transactions }: Props) {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dailyExpenses = expenses
        .filter(e => startOfDay(new Date(e.date)).getTime() === dayStart.getTime())
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        date: format(day, 'MMM d'),
        expenses: dailyExpenses,
      };
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending: Last 7 Days</CardTitle>
        <CardDescription>A visual summary of your recent expenses.</CardDescription>
      </CardHeader>
      <CardContent>
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
                    tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
