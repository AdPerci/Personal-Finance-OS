import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertDailySnapshot } from "@/lib/finance/snapshots";
import { LIABILITY_TYPES } from "@/types/taxonomy";

const createLiabilitySchema = z.object({
  name: z.string().min(1).max(100),
  liability_type: z.enum(LIABILITY_TYPES),
  current_balance: z.number().min(0),
  interest_rate: z.number().min(0).max(100).optional(),
  minimum_payment: z.number().min(0).optional(),
  currency: z.string().length(3).default("GBP"),
  notes: z.string().max(500).optional(),
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
    .from("liabilities")
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
  const parsed = createLiabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("liabilities")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await upsertDailySnapshot(supabase, user.id);

  return NextResponse.json(data, { status: 201 });
}
