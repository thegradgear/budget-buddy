import { Transaction } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

type Props = {
  transactions: Transaction[];
  accountId: string | null;
};

export default function RecentTransactions({ transactions, accountId }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(amount);
    };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Recent Transactions</CardTitle>
        {accountId && (
           <Button variant="ghost" asChild>
             <Link href={`/dashboard/accounts/${accountId}`}>
               View All <ArrowRight className="ml-2 h-4 w-4" />
             </Link>
           </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{t.category || '-'}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className={cn('text-right font-semibold', {
                      'text-emerald-600': t.type === 'income',
                      'text-rose-600': t.type === 'expense'
                  })}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No recent transactions.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
