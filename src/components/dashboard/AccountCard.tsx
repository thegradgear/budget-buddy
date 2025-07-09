'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Account } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  account: Account & { balance: number };
  isActive: boolean;
  onActivate: (id: string) => void;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function AccountCard({ account, isActive, onActivate }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/accounts/${account.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn("h-full flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow rounded-lg", isActive && "border-primary ring-2 ring-primary")}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">{account.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{account.type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor={`active-switch-${account.id}`} className={cn("text-xs", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
            Active
          </Label>
          <Switch
            id={`active-switch-${account.id}`}
            checked={isActive}
            onCheckedChange={(checked) => {
              if (checked) {
                onActivate(account.id);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isActive) onActivate(account.id);
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
        <p className="text-xs text-muted-foreground">Current Balance</p>
      </CardContent>
    </Card>
  );
}
