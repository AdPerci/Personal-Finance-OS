import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  getCategoryLabel,
  getSubtypeLabel,
} from "@/types/taxonomy";
import type { AccountWithValue } from "@/lib/finance/net-worth";
import type { AccountCategory } from "@/types/taxonomy";

interface AccountsListProps {
  accounts: AccountWithValue[];
  currency?: string;
}

export function AccountsList({ accounts, currency = "GBP" }: AccountsListProps) {
  if (accounts.length === 0) {
    return (
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add a manual account or connect Trading 212.
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = accounts.reduce(
    (acc, account) => {
      const key = account.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(account);
      return acc;
    },
    {} as Record<AccountCategory, AccountWithValue[]>
  );

  return (
    <div className="space-y-4">
      {(Object.entries(grouped) as [AccountCategory, AccountWithValue[]][]).map(
        ([category, categoryAccounts]) => (
          <Card key={category} className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                {getCategoryLabel(category)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{account.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getSubtypeLabel(account.subtype)}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {account.source}
                      </Badge>
                    </div>
                  </div>
                  <p
                    className="font-semibold tabular-nums shrink-0"
                    aria-label={`${account.name} balance ${formatCurrency(account.value, currency)}`}
                  >
                    {formatCurrency(account.value, currency)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
