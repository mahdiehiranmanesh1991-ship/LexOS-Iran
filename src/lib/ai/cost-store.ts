/**
 * Cost persistence contract + the in-memory implementation.
 *
 * `DemoCostStore` is PURE (no Next/Supabase) so it powers demo mode AND the
 * test suite. The Supabase-backed store lives in `cost-store-supabase.ts`; the
 * resolver that picks between them lives in `cost-tracker.ts`.
 */

import { dayKey, monthPeriod, type UsageRecord } from "./cost-control";

export interface UsageDashboard {
  period: string;
  totalUsd: number;
  calls: number;
  byFeature: { feature: string; costUsd: number; calls: number }[];
  byModel: { model: string; costUsd: number; calls: number }[];
  byUser: { ownerId: string; costUsd: number; calls: number }[];
  daily: { day: string; costUsd: number }[];
}

export interface CostStore {
  record(rec: UsageRecord): Promise<void>;
  /** Total USD spent by one owner within the given month period. */
  userMonthSpend(ownerId: string, period: string): Promise<number>;
  /** Total USD spent across the whole platform within the month period. */
  platformMonthSpend(period: string): Promise<number>;
  /** Aggregations for the cost dashboard backend (Step 7). */
  dashboard(period: string): Promise<UsageDashboard>;
}

/** Bounded in-memory store. Single-instance / demo / tests. */
export class DemoCostStore implements CostStore {
  private records: UsageRecord[] = [];
  private cap = 20_000;

  async record(rec: UsageRecord): Promise<void> {
    this.records.push(rec);
    if (this.records.length > this.cap) this.records.splice(0, this.records.length - this.cap);
  }

  async userMonthSpend(ownerId: string, period: string): Promise<number> {
    return this.records
      .filter((r) => r.ownerId === ownerId && monthPeriod(new Date(r.createdAt)) === period)
      .reduce((sum, r) => sum + r.costUsd, 0);
  }

  async platformMonthSpend(period: string): Promise<number> {
    return this.records
      .filter((r) => monthPeriod(new Date(r.createdAt)) === period)
      .reduce((sum, r) => sum + r.costUsd, 0);
  }

  async dashboard(period: string): Promise<UsageDashboard> {
    const rows = this.records.filter((r) => monthPeriod(new Date(r.createdAt)) === period);
    const group = <K extends string>(key: (r: UsageRecord) => K) => {
      const map = new Map<K, { costUsd: number; calls: number }>();
      for (const r of rows) {
        const k = key(r);
        const e = map.get(k) ?? { costUsd: 0, calls: 0 };
        e.costUsd += r.costUsd;
        e.calls += 1;
        map.set(k, e);
      }
      return [...map.entries()]
        .map(([k, v]) => ({ key: k, ...v }))
        .sort((a, b) => b.costUsd - a.costUsd);
    };
    return {
      period,
      totalUsd: rows.reduce((s, r) => s + r.costUsd, 0),
      calls: rows.length,
      byFeature: group((r) => r.feature).map((g) => ({ feature: g.key, costUsd: g.costUsd, calls: g.calls })),
      byModel: group((r) => r.model).map((g) => ({ model: g.key, costUsd: g.costUsd, calls: g.calls })),
      byUser: group((r) => r.ownerId).map((g) => ({ ownerId: g.key, costUsd: g.costUsd, calls: g.calls })),
      daily: group((r) => dayKey(new Date(r.createdAt))).map((g) => ({ day: g.key, costUsd: g.costUsd })),
    };
  }

  /** Test/observability helper. */
  size(): number {
    return this.records.length;
  }
}
