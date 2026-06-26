import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { syncProviderConnection } from "@/lib/services/sync";
import { z } from "zod";

const syncSchema = z.object({
  connectionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = syncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let query = supabase
    .from("provider_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "trading212");

  if (parsed.data.connectionId) {
    query = query.eq("id", parsed.data.connectionId);
  }

  const { data: connections, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!connections?.length) {
    return NextResponse.json({ error: "No connections found" }, { status: 404 });
  }

  const results = [];

  for (const connection of connections) {
    try {
      await syncProviderConnection(supabase, connection);
      results.push({ id: connection.id, status: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      results.push({ id: connection.id, status: "error", error: message });
    }
  }

  return NextResponse.json({ results });
}
