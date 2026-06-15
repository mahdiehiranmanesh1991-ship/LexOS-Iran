import "server-only";

import { createServiceClient } from "@/lib/supabase/admin";
import { monthPeriod, type UsageRecord } from "./cost-control";
import type { CostStore, UsageDashboard } from "./cost-store";

/**
 * Production cost store. Writes go through the `ai_record_usage` RPC, which
 * atomically appends an event AND upserts the monthly rollup (race-free, one
 * round trip). Reads use the rollup for O(1) quota/budget checks. Cross-tenant
 * platform reads are why this uses the service role — owner_id is always passed
 * explicitly, satisfying docs/07.
 */
export class SupabaseCostStore implements CostStore {
  private db = createServiceClient();

  async record(rec: UsageRecord): Promise<void> {
    const { error } = await this.db.rpc("ai_record_usage", {
      p_owner: rec.ownerId,
      p_route: rec.route,
      p_feature: rec.feature,
      p_provider: rec.provider,
      p_model: rec.model,
      p_tokens_in: rec.tokensIn,
      p_tokens_out: rec.tokensOut,
      p_cost: rec.costUsd,
    });
    if (error) throw error;
  }

  async userMonthSpend(ownerId: string, period: string): Promise<number> {
    const { data } = await this.db
      .from("ai_usage_monthly")
      .select("cost_usd")
      .eq("owner_id", ownerId)
      .eq("period", period)
      .maybeSingle();
    return Number((data as { cost_usd?: number } | null)?.cost_usd ?? 0);
  }

  async platformMonthSpend(period: string): Promise<number> {
    const { data } = await this.db.rpc("ai_platform_month_spend", { p_period: period });
    return Number(data ?? 0);
  }

  async dashboard(period: string): Promise<UsageDashboard> {
    // MVP-scale: aggregate the month's events in TS. Move to SQL views/materialized
    // rollups when event volume warrants it.
    const start = period;
    const end = nextMonth(period);
    const { data } = await this.db
      .from("ai_usage_events")
      .select("owner_id,feature,model,cost_usd,created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .limit(50_000);
    const rows = (data ?? []) as {
      owner_id: string;
      feature: string;
      model: string;
      cost_usd: number;
      created_at: string;
    }[];

    const acc = <K extends string>(key: (r: (typeof rows)[number]) => K) => {
      const m = new Map<K, { costUsd: number; calls: number }>();
      for (const r of rows) {
        const k = key(r);
        const e = m.get(k) ?? { costUsd: 0, calls: 0 };
        e.costUsd += Number(r.cost_usd);
        e.calls += 1;
        m.set(k, e);
      }
      return [...m.entries()].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.costUsd - a.costUsd);
    };

    return {
      period,
      totalUsd: rows.reduce((s, r) => s + Number(r.cost_usd), 0),
      calls: rows.length,
      byFeature: acc((r) => r.feature).map((g) => ({ feature: g.key, costUsd: g.costUsd, calls: g.calls })),
      byModel: acc((r) => r.model).map((g) => ({ model: g.key, costUsd: g.costUsd, calls: g.calls })),
      byUser: acc((r) => r.owner_id).map((g) => ({ ownerId: g.key, costUsd: g.costUsd, calls: g.calls })),
      daily: acc((r) => r.created_at.slice(0, 10)).map((g) => ({ day: g.key, costUsd: g.costUsd })),
    };
  }
}

function nextMonth(period: string): string {
  const d = new Date(`${period}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return monthPeriod(d);
}
