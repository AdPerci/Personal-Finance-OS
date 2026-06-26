import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, AccountBalance, Holding, Liability } from "@/types/database";

type Supabase = SupabaseClient;

export interface UserFinancialData {
  accounts: Account[];
  balances: AccountBalance[];
  holdings: Holding[];
  liabilities: Liability[];
}

export async function fetchUserFinancialData(
  supabase: Supabase,
  userId: string
): Promise<UserFinancialData> {
  const [accountsRes, liabilitiesRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const accountIds = accounts.map((a) => a.id);

  let balances: AccountBalance[] = [];
  let holdings: Holding[] = [];

  if (accountIds.length > 0) {
    const [balancesRes, holdingsRes] = await Promise.all([
      supabase
        .from("account_balances")
        .select("*")
        .in("account_id", accountIds)
        .order("recorded_at", { ascending: false }),
      supabase.from("holdings").select("*").in("account_id", accountIds),
    ]);

    balances = (balancesRes.data ?? []) as AccountBalance[];
    holdings = (holdingsRes.data ?? []) as Holding[];
  }

  return {
    accounts,
    balances,
    holdings,
    liabilities: (liabilitiesRes.data ?? []) as Liability[],
  };
}
