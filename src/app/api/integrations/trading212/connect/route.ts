import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptCredentials } from "@/lib/crypto";
import { validateTrading212Credentials } from "@/lib/services/providers/trading212";
import { syncProviderConnection } from "@/lib/services/sync";

const connectSchema = z.object({
  label: z.string().min(1).max(50),
  environment: z.enum(["live", "demo"]),
  subtype: z.enum(["isa", "invest"]),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = connectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { label, environment, subtype, apiKey, apiSecret } = parsed.data;

  try {
    await validateTrading212Credentials({ apiKey, apiSecret }, environment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid credentials";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ciphertext = encryptCredentials({ apiKey, apiSecret });

  const { data: connection, error } = await supabase
    .from("provider_connections")
    .upsert(
      {
        user_id: user.id,
        provider: "trading212",
        label,
        environment,
        subtype,
        credentials_ciphertext: ciphertext,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider,label" }
    )
    .select()
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  try {
    await syncProviderConnection(supabase, connection);
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : "Sync failed";
    return NextResponse.json(
      { connection, error: message, synced: false },
      { status: 207 }
    );
  }

  const { data: updated } = await supabase
    .from("provider_connections")
    .select("id, label, environment, subtype, last_synced_at, last_sync_status, last_sync_error")
    .eq("id", connection.id)
    .single();

  return NextResponse.json({ connection: updated, synced: true });
}
