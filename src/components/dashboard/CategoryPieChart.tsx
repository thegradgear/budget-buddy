'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

type Props = {
  transactions: Transaction[];
  type: 'income' | 'expense';
  title: string;
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(217, 85%, 70%)',
  'hsl(38, 85%, 60%)',
];

export default function CategoryPieChart({ transactions, type, title }: Props) {
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        const category = t.category || 'Uncategorized';
        const currentAmount = categoryMap.get(category) || 0;
        categoryMap.set(category, currentAmount + t.amount);
      });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [transactions, type]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={{}} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex flex-col">
                           <span>{name}: {formatCurrency(Number(value))}</span>
                           <span className='text-xs text-muted-foreground'>{total > 0 ? ((Number(value)/total)*100).toFixed(1) : 0}%</span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No {type} data to display.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
