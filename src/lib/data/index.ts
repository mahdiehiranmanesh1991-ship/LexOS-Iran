import "server-only";

import { isDemoMode } from "@/lib/supabase/server";
import { DemoDataSource } from "./demo";
import { SupabaseDataSource } from "./supabase";
import type { DataSource } from "./types";

export type { CaseDetail, DashboardData, DataSource } from "./types";

const demo = new DemoDataSource();

/**
 * Resolve the data source for the current request.
 * Demo mode (no Supabase env or DEMO_MODE=1) → in-memory demo store.
 * Otherwise → RLS-scoped Supabase source for the signed-in user
 * (falls back to demo if no session — middleware normally prevents that).
 */
export async function getDataSource(): Promise<DataSource> {
  if (isDemoMode()) return demo;
  const supabase = await SupabaseDataSource.create();
  return supabase ?? demo;
}
