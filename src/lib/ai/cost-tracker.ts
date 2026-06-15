import "server-only";

import type { DataSource } from "@/lib/data/types";
import { isDemoMode } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { fnv1a } from "@/lib/security/rate-limit";
import type { Tier } from "./providers";
import {
  budgetUnavailableResponse,
  decideBudget,
  estimateCostUsd,
  governedTier,
  monthPeriod,
  platformBudgetUsd,
  quotaExceededResponse,
  quotaForPlan,
  type AiFeature,
  type BudgetLevel,
  type UsageInput,
  type UsageRecord,
} from "./cost-control";
import { DemoCostStore, type CostStore, type UsageDashboard } from "./cost-store";
import { SupabaseCostStore } from "./cost-store-supabase";

/**
 * Cost orchestration: store resolution, usage recording, the preflight quota +
 * budget gate, and the dashboard backend. Server-only. All logging here is
 * structured and content-free.
 */

/* ── structured cost logging (never content) ── */

type CostEvent =
  | "quota_exceeded"
  | "budget_warning"
  | "budget_critical"
  | "budget_emergency"
  | "model_downgrade"
  | "abnormal_usage"
  | "store_degraded";

interface CostLogFields {
  ownerHash?: string;
  feature?: AiFeature;
  route?: string;
  model?: string;
  level?: BudgetLevel;
  tier?: Tier;
  costUsd?: number;
  userSpendUsd?: number;
  platformSpendUsd?: number;
  reason?: string;
}

function costLog(event: CostEvent, fields: CostLogFields = {}): void {
  console.warn(JSON.stringify({ ts: new Date().toISOString(), scope: "ai-cost", event, ...fields }));
}

/* ── store resolution (single instance via globalThis) ── */

const globalRef = globalThis as unknown as { __lexosCostStore?: CostStore };

export function getCostStore(): CostStore {
  if (globalRef.__lexosCostStore) return globalRef.__lexosCostStore;
  let store: CostStore;
  if (!isDemoMode() && hasServiceRole()) {
    store = new SupabaseCostStore();
  } else {
    if (!isDemoMode()) costLog("store_degraded", { reason: "no_service_role_key" });
    store = new DemoCostStore();
  }
  globalRef.__lexosCostStore = store;
  return store;
}

/* ── recording ── */

const ABNORMAL_CALL_USD = Number(process.env.AI_ABNORMAL_CALL_USD) || 1.0;

/** Record one AI call. Best-effort: never throws into the AI request path. */
export async function recordUsage(input: UsageInput): Promise<void> {
  try {
    const costUsd = estimateCostUsd(input.model, input.tokensIn, input.tokensOut);
    const rec: UsageRecord = {
      ...input,
      totalTokens: input.tokensIn + input.tokensOut,
      costUsd,
      createdAt: new Date().toISOString(),
    };
    if (costUsd >= ABNORMAL_CALL_USD) {
      costLog("abnormal_usage", {
        ownerHash: fnv1a(input.ownerId),
        feature: input.feature,
        route: input.route,
        model: input.model,
        costUsd,
      });
    }
    await getCostStore().record(rec);
  } catch (err) {
    costLog("store_degraded", { reason: err instanceof Error ? err.message : "record_failed" });
  }
}

/* ── principal resolution ── */

export interface CostPrincipal {
  ownerId: string;
  plan: string;
}

export async function resolveCostPrincipal(db: DataSource): Promise<CostPrincipal> {
  const [profile, settings] = await Promise.all([db.getProfile(), db.getSettings()]);
  return { ownerId: profile.id, plan: settings.billing.plan };
}

/* ── preflight gate ── */

export type PreflightResult =
  | { ok: true; ownerId: string; tier: Tier; level: BudgetLevel }
  | { ok: false; response: Response };

/**
 * Quota + platform-budget gate. Resolves the principal, reads current spend,
 * and decides allow/downgrade/block. Fails OPEN on store errors (logged) so a
 * cost-store outage never takes the whole AI surface down.
 */
export async function aiPreflight(args: {
  db: DataSource;
  route: string;
  feature: AiFeature;
}): Promise<PreflightResult> {
  const { db, route, feature } = args;
  const { ownerId, plan } = await resolveCostPrincipal(db);
  const period = monthPeriod();
  const store = getCostStore();

  let userSpendUsd = 0;
  let platformSpendUsd = 0;
  try {
    [userSpendUsd, platformSpendUsd] = await Promise.all([
      store.userMonthSpend(ownerId, period),
      store.platformMonthSpend(period),
    ]);
  } catch (err) {
    costLog("store_degraded", { reason: err instanceof Error ? err.message : "read_failed", route });
    return { ok: true, ownerId, tier: governedTier(feature), level: "ok" }; // fail-open
  }

  const decision = decideBudget({
    feature,
    baselineTier: governedTier(feature),
    userSpendUsd,
    quotaUsd: quotaForPlan(plan),
    platformSpendUsd,
    platformBudgetUsd: platformBudgetUsd(),
    enforceQuota: !isDemoMode(),
  });

  const ownerHash = fnv1a(ownerId);
  if (decision.level === "warning") costLog("budget_warning", { level: decision.level, platformSpendUsd });
  if (decision.level === "critical") costLog("budget_critical", { level: decision.level, platformSpendUsd });
  if (decision.level === "emergency") costLog("budget_emergency", { level: decision.level, platformSpendUsd });

  if (!decision.allow) {
    if (decision.reason === "quota_exceeded") {
      costLog("quota_exceeded", { ownerHash, feature, route, userSpendUsd });
      return { ok: false, response: quotaExceededResponse(quotaForPlan(plan)) };
    }
    costLog("budget_emergency", { ownerHash, feature, route, reason: "blocked", platformSpendUsd });
    return { ok: false, response: budgetUnavailableResponse() };
  }

  if (decision.tier !== governedTier(feature)) {
    costLog("model_downgrade", { ownerHash, feature, route, tier: decision.tier, level: decision.level });
  }
  return { ok: true, ownerId, tier: decision.tier, level: decision.level };
}

/* ── dashboard backend (Step 7) ── */

export async function getUsageDashboard(period = monthPeriod()): Promise<UsageDashboard> {
  return getCostStore().dashboard(period);
}
