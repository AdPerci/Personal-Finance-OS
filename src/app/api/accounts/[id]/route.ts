import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertDailySnapshot } from "@/lib/finance/snapshots";

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  balance: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("id, source")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;

  if (Object.keys(updates).length > 1) {
    await supabase.from("accounts").update(updates).eq("id", id);
  }

  if (parsed.data.balance !== undefined && account.source === "manual") {
    await supabase.from("account_balances").insert({
      account_id: id,
      balance: parsed.data.balance,
      source: "manual",
    });
  }

  await upsertDailySnapshot(supabase, user.id);

  const { data: updated } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("id, source")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (account.source !== "manual") {
    return NextResponse.json(
      { error: "Synced accounts cannot be deleted manually" },
      { status: 400 }
    );
  }

  await supabase.from("accounts").update({ is_active: false }).eq("id", id);
  await upsertDailySnapshot(supabase, user.id);

  return NextResponse.json({ success: true });
}
