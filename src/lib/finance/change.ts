import type { NetWorthSnapshot } from "@/types/database";
import { differenceInDays, subDays } from "date-fns";

export interface MonthlyChange {
  amount: number;
  percent: number;
  hasComparison: boolean;
}

export function computeMonthlyChange(
  currentNetWorth: number,
  snapshots: NetWorthSnapshot[]
): MonthlyChange {
  if (snapshots.length === 0) {
    return { amount: 0, percent: 0, hasComparison: false };
  }

  const targetDate = subDays(new Date(), 30);
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  let comparison = sorted[0];
  for (const snap of sorted) {
    const snapDate = new Date(snap.snapshot_date);
    if (snapDate <= targetDate) {
      comparison = snap;
    }
  }

  const daysDiff = differenceInDays(new Date(), new Date(comparison.snapshot_date));
  if (daysDiff < 7) {
    return { amount: 0, percent: 0, hasComparison: false };
  }

  const previousNetWorth = Number(comparison.net_worth);
  const amount = currentNetWorth - previousNetWorth;
  const percent =
    previousNetWorth !== 0 ? (amount / Math.abs(previousNetWorth)) * 100 : 0;

  return { amount, percent, hasComparison: true };
}
