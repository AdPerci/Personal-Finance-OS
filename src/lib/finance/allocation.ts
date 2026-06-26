import type { AccountWithValue } from "./net-worth";
import { getCategoryLabel } from "@/types/taxonomy";
import type { AccountCategory } from "@/types/taxonomy";
import { getCategoryChartColor } from "@/lib/chart-colors";

export interface AllocationSlice {
  name: string;
  value: number;
  category: AccountCategory;
  color: string;
}

export function computeAllocation(
  accountsWithValue: AccountWithValue[]
): AllocationSlice[] {
  const byCategory = new Map<AccountCategory, number>();

  for (const account of accountsWithValue) {
    const current = byCategory.get(account.category) ?? 0;
    byCategory.set(account.category, current + account.value);
  }

  return Array.from(byCategory.entries())
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: getCategoryLabel(category),
      value,
      category,
      color: getCategoryChartColor(category),
    }))
    .sort((a, b) => b.value - a.value);
}
