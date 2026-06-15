import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client (docs/07 §Privilege escalation). Bypasses RLS, so
 * it is confined to this module and used ONLY by server pipelines that thread an
 * explicit owner_id — never with caller-supplied trust. Today: AI cost recording
 * (cross-tenant platform-budget reads + deep-call-site writes without a request
 * RLS client).
 */

export function hasServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
