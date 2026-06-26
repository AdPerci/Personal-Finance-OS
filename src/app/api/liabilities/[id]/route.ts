import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertDailySnapshot } from "@/lib/finance/snapshots";
import { LIABILITY_TYPES } from "@/types/taxonomy";

const updateLiabilitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  liability_type: z.enum(LIABILITY_TYPES).optional(),
  current_balance: z.number().min(0).optional(),
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  minimum_payment: z.number().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
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
  const parsed = updateLiabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("liabilities")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  await upsertDailySnapshot(supabase, user.id);

  return NextResponse.json(data);
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

  await supabase
    .from("liabilities")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  await upsertDailySnapshot(supabase, user.id);

  return NextResponse.json({ success: true });
}
