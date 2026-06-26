import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderConnection } from "@/types/database";
import { decryptCredentials } from "@/lib/crypto";
import { getProvider } from "./providers/registry";
import type { Trading212Credentials } from "./providers/types";
import { upsertDailySnapshot } from "@/lib/finance/snapshots";

type Supabase = SupabaseClient;

export async function syncProviderConnection(
  supabase: Supabase,
  connection: ProviderConnection
): Promise<void> {
  await supabase
    .from("provider_connections")
    .update({
      last_sync_status: "pending",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  try {
    const credentials = decryptCredentials<Trading212Credentials>(
      connection.credentials_ciphertext
    );
    const provider = getProvider(connection.provider);
    const subtype = connection.subtype ?? "invest";

    const result = await provider.sync(credentials, {
      environment: connection.environment,
      subtype,
      label: connection.label,
    });

    const { data: existingAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("provider_connection_id", connection.id)
      .maybeSingle();

    const accountPayload = {
      user_id: connection.user_id,
      name: result.account.name,
      category: "trading212" as const,
      subtype,
      source: "trading212" as const,
      provider_connection_id: connection.id,
      external_id: result.account.externalId,
      currency: result.account.currency,
      is_active: true,
      metadata: {
        investmentValue: result.account.investmentValue,
        totalValue: result.account.totalValue,
      },
      updated_at: new Date().toISOString(),
    };

    let accountId: string;

    if (existingAccount) {
      await supabase
        .from("accounts")
        .update(accountPayload)
        .eq("id", existingAccount.id);
      accountId = existingAccount.id;
    } else {
      const { data: newAccount, error } = await supabase
        .from("accounts")
        .insert(accountPayload)
        .select("id")
        .single();
      if (error || !newAccount) throw error ?? new Error("Failed to create account");
      accountId = newAccount.id;
    }

    await supabase.from("account_balances").insert({
      account_id: accountId,
      balance: result.account.cashBalance,
      source: "sync",
    });

    const symbols = result.holdings.map((h) => h.symbol);

    for (const holding of result.holdings) {
      await supabase.from("holdings").upsert(
        {
          account_id: accountId,
          symbol: holding.symbol,
          name: holding.name,
          isin: holding.isin,
          quantity: holding.quantity,
          average_cost: holding.averageCost,
          current_price: holding.currentPrice,
          market_value: holding.marketValue,
          currency: holding.currency,
          unrealized_pnl: holding.unrealizedPnl,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "account_id,symbol" }
      );
    }

    if (symbols.length > 0) {
      const { data: staleHoldings } = await supabase
        .from("holdings")
        .select("id, symbol")
        .eq("account_id", accountId);

      const toDelete = (staleHoldings ?? [])
        .filter((h) => !symbols.includes(h.symbol))
        .map((h) => h.id);

      if (toDelete.length > 0) {
        await supabase.from("holdings").delete().in("id", toDelete);
      }
    } else {
      await supabase.from("holdings").delete().eq("account_id", accountId);
    }

    await supabase
      .from("provider_connections")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_status: "success",
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    await upsertDailySnapshot(supabase, connection.user_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await supabase
      .from("provider_connections")
      .update({
        last_sync_status: "error",
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
    throw error;
  }
}

export function shouldAutoSync(connection: ProviderConnection): boolean {
  if (!connection.last_synced_at) return true;
  const lastSync = new Date(connection.last_synced_at).getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  return Date.now() - lastSync > fifteenMinutes;
}
