import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { AccountsList } from "@/components/dashboard/accounts-list";
import { computeNetWorth } from "@/lib/finance/net-worth";
import { computeAllocation } from "@/lib/finance/allocation";
import { computeMonthlyChange } from "@/lib/finance/change";
import { getSnapshotHistory } from "@/lib/finance/snapshots";
import { shouldAutoSync, syncProviderConnection } from "@/lib/services/sync";
import { fetchUserFinancialData } from "@/lib/data/financial";
import type { ProviderConnection } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

async function triggerAutoSync(connections: ProviderConnection[]) {
  const stale = connections.filter(shouldAutoSync);
  if (stale.length === 0) return;

  const supabase = await createClient();
  for (const connection of stale) {
    try {
      await syncProviderConnection(supabase, connection);
    } catch {
      // Non-blocking
    }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: connectionsData } = await supabase
    .from("provider_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "trading212");

  const connections = (connectionsData ?? []) as ProviderConnection[];

  if (connections.length) {
    void triggerAutoSync(connections);
  }

  const { accounts, balances, holdings, liabilities } =
    await fetchUserFinancialData(supabase, user.id);

  const netWorth = computeNetWorth(accounts, balances, holdings, liabilities);
  const allocation = computeAllocation(netWorth.accountsWithValue);
  const snapshots = await getSnapshotHistory(supabase, user.id, 90);
  const monthlyChange = computeMonthlyChange(netWorth.netWorth, snapshots);

  const chartData = snapshots.map((s) => ({
    date: s.snapshot_date,
    netWorth: Number(s.net_worth),
  }));

  return (
    <AppShell email={user.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your complete financial picture
          </p>
        </div>

        <SummaryCards
          netWorth={netWorth.netWorth}
          totalAssets={netWorth.totalAssets}
          totalLiabilities={netWorth.totalLiabilities}
          monthlyChange={monthlyChange}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NetWorthChart data={chartData} />
          </div>
          <div>
            <AllocationChart data={allocation} />
          </div>
        </div>

        {connections.length > 0 && (
          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between text-sm">
                  <span>Trading 212 — {conn.label}</span>
                  <div className="flex items-center gap-2">
                    {conn.last_sync_status && (
                      <Badge
                        variant={
                          conn.last_sync_status === "success" ? "secondary" : "destructive"
                        }
                      >
                        {conn.last_sync_status}
                      </Badge>
                    )}
                    {conn.last_synced_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conn.last_synced_at), "HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <AccountsList accounts={netWorth.accountsWithValue} />
      </div>
    </AppShell>
  );
}
