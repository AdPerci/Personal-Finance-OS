/**
 * Supabase client key — publishable (sb_publishable_...) or legacy anon JWT.
 * Both have low privilege and work with RLS the same way.
 * @see https://supabase.com/docs/guides/getting-started/api-keys
 */
export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return key;
}
