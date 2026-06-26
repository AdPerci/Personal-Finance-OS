import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, AccountBalance, Holding, Liability, NetWorthSnapshot } from "@/types/database";
import { computeNetWorth } from "@/lib/finance/net-worth";

type Supabase = SupabaseClient;

export async function upsertDailySnapshot(
  supabase: Supabase,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const [accountsRes, liabilitiesRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("liabilities").select("*").eq("user_id", userId).eq("is_active", true),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const liabilities = (liabilitiesRes.data ?? []) as Liability[];
  const accountIds = accounts.map((a) => a.id);

  let balances: AccountBalance[] = [];
  let holdings: Holding[] = [];

  if (accountIds.length > 0) {
    const [balancesRes, holdingsRes] = await Promise.all([
      supabase.from("account_balances").select("*").in("account_id", accountIds),
      supabase.from("holdings").select("*").in("account_id", accountIds),
    ]);
    balances = (balancesRes.data ?? []) as AccountBalance[];
    holdings = (holdingsRes.data ?? []) as Holding[];
  }

  const result = computeNetWorth(accounts, balances, holdings, liabilities);

  const assetsByCategory: Record<string, number> = {};
  const assetsBySubtype: Record<string, number> = {};
  const assetsByAccount: Record<string, number> = {};

  for (const account of result.accountsWithValue) {
    assetsByCategory[account.category] =
      (assetsByCategory[account.category] ?? 0) + account.value;
    const subtypeKey = `${account.category}:${account.subtype}`;
    assetsBySubtype[subtypeKey] =
      (assetsBySubtype[subtypeKey] ?? 0) + account.value;
    assetsByAccount[account.id] = account.value;
  }

  await supabase.from("net_worth_snapshots").upsert(
    {
      user_id: userId,
      snapshot_date: today,
      total_assets: result.totalAssets,
      total_liabilities: result.totalLiabilities,
      net_worth: result.netWorth,
      assets_by_category: assetsByCategory,
      assets_by_subtype: assetsBySubtype,
      assets_by_account: assetsByAccount,
    },
    { onConflict: "user_id,snapshot_date" }
  );
}

export async function getSnapshotHistory(
  supabase: Supabase,
  userId: string,
  days = 90
): Promise<NetWorthSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabase
    .from("net_worth_snapshots")
    .select("*")
    .eq("user_id", userId)
    .gte("snapshot_date", since)
    .order("snapshot_date", { ascending: true });

  return (data ?? []) as NetWorthSnapshot[];
}
