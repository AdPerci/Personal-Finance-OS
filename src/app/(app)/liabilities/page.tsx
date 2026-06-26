import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LiabilityForm } from "@/components/liabilities/liability-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getLiabilityLabel } from "@/types/taxonomy";
import type { Liability } from "@/types/database";

export default async function LiabilitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: liabilities } = await supabase
    .from("liabilities")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const items = (liabilities ?? []) as Liability[];

  return (
    <AppShell email={user.email}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Liabilities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track debts and loans
            </p>
          </div>
          <LiabilityForm />
        </div>

        {items.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No liabilities yet. Add a car loan, credit card, or student loan.
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-medium">Your Debts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((liability) => (
                <div
                  key={liability.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{liability.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {getLiabilityLabel(liability.liability_type)}
                    </Badge>
                    {liability.interest_rate != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {liability.interest_rate}% APR
                      </p>
                    )}
                  </div>
                  <p className="font-semibold tabular-nums text-destructive">
                    {formatCurrency(Number(liability.current_balance), liability.currency)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
