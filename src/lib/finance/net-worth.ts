import type { Account, AccountBalance, Holding, Liability } from "@/types/database";

export interface AccountWithValue extends Account {
  value: number;
  cashBalance: number;
  holdingsValue: number;
}

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountsWithValue: AccountWithValue[];
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "string" ? parseFloat(value) : value;
}

export function getLatestBalances(
  balances: AccountBalance[]
): Map<string, number> {
  const map = new Map<string, number>();
  const sorted = [...balances].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  for (const b of sorted) {
    if (!map.has(b.account_id)) {
      map.set(b.account_id, toNumber(b.balance));
    }
  }
  return map;
}

export function getAccountValue(
  account: Account,
  holdings: Holding[],
  latestBalances: Map<string, number>
): AccountWithValue {
  const accountHoldings = holdings.filter((h) => h.account_id === account.id);
  const holdingsValue = accountHoldings.reduce(
    (sum, h) => sum + toNumber(h.market_value),
    0
  );
  const cashBalance = latestBalances.get(account.id) ?? 0;
  const value =
    accountHoldings.length > 0 ? cashBalance + holdingsValue : cashBalance;

  return {
    ...account,
    value,
    cashBalance,
    holdingsValue,
  };
}

export function computeNetWorth(
  accounts: Account[],
  balances: AccountBalance[],
  holdings: Holding[],
  liabilities: Liability[]
): NetWorthResult {
  const activeAccounts = accounts.filter((a) => a.is_active);
  const activeLiabilities = liabilities.filter((l) => l.is_active);
  const latestBalances = getLatestBalances(balances);

  const accountsWithValue = activeAccounts.map((account) =>
    getAccountValue(account, holdings, latestBalances)
  );

  const totalAssets = accountsWithValue.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = activeLiabilities.reduce(
    (sum, l) => sum + toNumber(l.current_balance),
    0
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    accountsWithValue,
  };
}
