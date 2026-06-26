import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AccountForm } from "@/components/accounts/account-form";
import { AccountsList } from "@/components/dashboard/accounts-list";
import { computeNetWorth } from "@/lib/finance/net-worth";
import { fetchUserFinancialData } from "@/lib/data/financial";

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { accounts, balances, holdings, liabilities } =
    await fetchUserFinancialData(supabase, user.id);

  const { accountsWithValue } = computeNetWorth(
    accounts,
    balances,
    holdings,
    liabilities
  );

  return (
    <AppShell email={user.email}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage manual and synced accounts
            </p>
          </div>
          <AccountForm />
        </div>
        <AccountsList accounts={accountsWithValue} />
      </div>
    </AppShell>
  );
}
