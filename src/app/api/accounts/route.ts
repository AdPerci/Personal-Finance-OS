import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertDailySnapshot } from "@/lib/finance/snapshots";
import { ACCOUNT_CATEGORIES, isValidSubtype } from "@/types/taxonomy";
import type { AccountCategory } from "@/types/taxonomy";

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(ACCOUNT_CATEGORIES),
  subtype: z.string().min(1),
  currency: z.string().length(3).default("GBP"),
  balance: z.number().min(0),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, category, subtype, currency, balance } = parsed.data;

  if (!isValidSubtype(category as AccountCategory, subtype)) {
    return NextResponse.json({ error: "Invalid category/subtype" }, { status: 400 });
  }

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name,
      category,
      subtype,
      source: "manual",
      currency,
    })
    .select()
    .single();

  if (error || !account) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  await supabase.from("account_balances").insert({
    account_id: account.id,
    balance,
    source: "manual",
  });

  await upsertDailySnapshot(supabase, user.id);

  return NextResponse.json(account, { status: 201 });
}
