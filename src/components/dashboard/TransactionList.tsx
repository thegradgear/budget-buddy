import { Transaction } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';

type Props = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(amount);
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Log</CardTitle>
        <CardDescription>A list of all your recent income and expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className='hidden md:block'>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length > 0 ? (
                transactions.map((t) => (
                    <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                        <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', {
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300': t.type === 'income',
                            'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300': t.type === 'expense',
                        })}>
                            {t.type}
                        </span>
                    </TableCell>
                    <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className={cn('text-right font-semibold', {
                        'text-emerald-600': t.type === 'income',
                        'text-rose-600': t.type === 'expense'
                    })}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(t)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(t.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No transactions yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
            <div className="space-y-4">
                {transactions.length > 0 ? (
                    transactions.map((t) => (
                        <Card key={t.id} className="p-4 flex justify-between items-center">
                            <div className="flex-1 space-y-1">
                                <p className="font-medium truncate">{t.description}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                                <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full capitalize', {
                                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300': t.type === 'income',
                                    'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300': t.type === 'expense',
                                })}>
                                    {t.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={cn('font-semibold text-right', {
                                    'text-emerald-600': t.type === 'income',
                                    'text-rose-600': t.type === 'expense'
                                })}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                </p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(t)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(t.id)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center h-24 flex items-center justify-center">
                        <p>No transactions yet.</p>
                    </div>
                )}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
