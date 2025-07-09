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
      className={cn(
        "group h-full flex flex-col justify-between cursor-pointer rounded-xl border transition-all duration-300",
        isActive
          ? "border-primary/50 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 ring-2 ring-primary"
          : "border-border bg-card hover:shadow-lg hover:border-primary/30"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className={cn("text-xl", isActive && "text-primary-foreground/90")}>{account.name}</CardTitle>
          <p className={cn("text-sm", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{account.type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor={`active-switch-${account.id}`} className={cn("text-xs", isActive ? "text-primary-foreground/80 font-semibold" : "text-muted-foreground")}>
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
            className={cn(isActive && "data-[state=checked]:bg-white data-[state=unchecked]:bg-slate-500/50 [&>span]:bg-primary")}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", isActive && "text-primary-foreground")}>{formatCurrency(account.balance)}</div>
        <p className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>Current Balance</p>
      </CardContent>
    </Card>
  );
}
