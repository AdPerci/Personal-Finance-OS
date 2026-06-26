import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Trading212ConnectForm } from "@/components/integrations/trading212-connect-form";
import type { ProviderConnection } from "@/types/database";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: connections } = await supabase
    .from("provider_connections")
    .select(
      "id, label, environment, subtype, last_synced_at, last_sync_status, last_sync_error"
    )
    .eq("user_id", user.id)
    .eq("provider", "trading212");

  return (
    <AppShell email={user.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external accounts and brokers
          </p>
        </div>
        <Trading212ConnectForm
          connections={(connections ?? []) as Pick<
            ProviderConnection,
            | "id"
            | "label"
            | "environment"
            | "subtype"
            | "last_synced_at"
            | "last_sync_status"
            | "last_sync_error"
          >[]}
        />
      </div>
    </AppShell>
  );
}
