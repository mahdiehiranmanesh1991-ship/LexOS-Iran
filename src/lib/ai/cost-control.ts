/**
 * AI cost governance — the single source of truth for pricing, cost estimation,
 * per-plan quotas, platform-budget thresholds, and model routing (governance).
 *
 * This module is PURE (no I/O, no Next/Supabase imports) so the financial logic
 * is exhaustively unit-testable with no database. Persistence and request
 * orchestration live in `cost-tracker.ts`; storage in `cost-store.ts`.
 *
 * PRICING NOTE: the USD figures below are configurable ESTIMATES for budgeting.
 * Operators MUST verify them against current Anthropic/OpenAI pricing and update
 * `MODEL_PRICING` (or override per-model) — they drive quota/budget enforcement.
 */

import type { Tier } from "./providers";

/* ───────────────────────── types ───────────────────────── */

export type Provider = "anthropic" | "openai";

/** Logical AI features — the unit governance and dashboards reason about. */
export type AiFeature =
  | "chat"
  | "analysis"
  | "draft"
  | "doc_ocr"
  | "doc_classify"
  | "intent_route"
  | "structured_extract"
  | "embedding";

/** Billing plan → monthly USD quota. (Spec: Free $5 · Professional $25 · Power $100.) */
export type QuotaPlan = "free" | "pro" | "firm" | "enterprise";

export interface ModelPrice {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
}

export interface UsageInput {
  ownerId: string;
  route: string;
  feature: AiFeature;
  provider: Provider;
  model: string;
  tokensIn: number;
  tokensOut: number;
}

export interface UsageRecord extends UsageInput {
  totalTokens: number;
  costUsd: number;
  createdAt: string;
}

/** The caller-supplied context (provider/model/tokens are filled by the call site). */
export type CallCost = Pick<UsageInput, "ownerId" | "route" | "feature">;

export type BudgetLevel = "ok" | "warning" | "critical" | "emergency";

export interface BudgetInputs {
  feature: AiFeature;
  baselineTier: Tier;
  userSpendUsd: number;
  quotaUsd: number; // Infinity = unlimited
  platformSpendUsd: number;
  platformBudgetUsd: number;
  enforceQuota: boolean;
}

export interface BudgetDecision {
  allow: boolean;
  level: BudgetLevel;
  /** Possibly downgraded tier the caller should use. */
  tier: Tier;
  reason?: "quota_exceeded" | "platform_emergency";
}

/* ───────────────────────── pricing ───────────────────────── */

/** Named reference table (USD / 1M tokens). Substring matching below makes this
 * robust to version suffixes (e.g. `claude-haiku-4-5-20251001`). */
export const MODEL_PRICING: Record<string, ModelPrice> = {
  haiku: { input: 1, output: 5 },
  sonnet: { input: 3, output: 15 },
  opus: { input: 15, output: 75 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "embedding-3-small": { input: 0.02, output: 0 },
};

/** Conservative fallback for unknown models (≈ core tier) so cost is never $0. */
const FALLBACK_PRICE: ModelPrice = { input: 3, output: 15 };

export function priceFor(model: string): ModelPrice {
  const m = model.toLowerCase();
  if (m.includes("haiku")) return MODEL_PRICING.haiku;
  if (m.includes("sonnet")) return MODEL_PRICING.sonnet;
  if (m.includes("opus")) return MODEL_PRICING.opus;
  if (m.includes("mini")) return MODEL_PRICING["gpt-4o-mini"];
  if (m.includes("embedding")) return MODEL_PRICING["embedding-3-small"];
  if (m.includes("gpt-4o")) return MODEL_PRICING["gpt-4o"];
  return FALLBACK_PRICE;
}

/** Estimated USD cost of one call. */
export function estimateCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const p = priceFor(model);
  return (tokensIn / 1_000_000) * p.input + (tokensOut / 1_000_000) * p.output;
}

/* ───────────────────────── quotas ───────────────────────── */

export const QUOTA_USD: Record<QuotaPlan, number> = {
  free: 5,
  pro: 25, // "Professional"
  firm: 100, // "Power User" / firm seat
  enterprise: Number.POSITIVE_INFINITY,
};

export function quotaForPlan(plan: string): number {
  return QUOTA_USD[(plan as QuotaPlan) in QUOTA_USD ? (plan as QuotaPlan) : "free"];
}

/* ───────────────────────── model governance ───────────────────────── */

/** Central feature → tier policy. No route/agent should hardcode a model;
 * the tier resolves to a concrete model in `providers.modelFor()`. */
export const FEATURE_TIER: Record<AiFeature, Tier> = {
  chat: "core",
  analysis: "deep",
  draft: "core",
  doc_ocr: "core",
  doc_classify: "fast",
  intent_route: "fast",
  structured_extract: "fast",
  embedding: "fast",
};

/** Features expensive enough to block first under an emergency platform budget. */
export const EXPENSIVE_FEATURES: ReadonlySet<AiFeature> = new Set<AiFeature>([
  "analysis",
  "draft",
  "doc_ocr",
  "chat",
]);

export function isExpensive(feature: AiFeature): boolean {
  return EXPENSIVE_FEATURES.has(feature);
}

export function governedTier(feature: AiFeature): Tier {
  return FEATURE_TIER[feature];
}

/* ───────────────────────── platform budget ───────────────────────── */

export const BUDGET_THRESHOLDS = { warning: 0.8, critical: 0.9, emergency: 1.0 } as const;

/** Platform-wide monthly ceiling (USD), env-overridable. */
export function platformBudgetUsd(): number {
  const raw = Number(process.env.AI_PLATFORM_BUDGET_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : 500;
}

export function budgetLevel(ratio: number): BudgetLevel {
  if (ratio >= BUDGET_THRESHOLDS.emergency) return "emergency";
  if (ratio >= BUDGET_THRESHOLDS.critical) return "critical";
  if (ratio >= BUDGET_THRESHOLDS.warning) return "warning";
  return "ok";
}

/**
 * The core decision: combine per-user quota with platform-budget pressure.
 *  - quota exceeded (when enforced)      → block
 *  - emergency + expensive feature       → block
 *  - critical + deep tier                → downgrade deep → core
 *  - warning                             → allow (caller logs)
 */
export function decideBudget(i: BudgetInputs): BudgetDecision {
  const ratio = i.platformBudgetUsd > 0 ? i.platformSpendUsd / i.platformBudgetUsd : 0;
  const level = budgetLevel(ratio);
  let tier = i.baselineTier;

  if (i.enforceQuota && i.userSpendUsd >= i.quotaUsd) {
    return { allow: false, level, tier, reason: "quota_exceeded" };
  }
  if (level === "emergency" && isExpensive(i.feature)) {
    return { allow: false, level, tier, reason: "platform_emergency" };
  }
  if (level === "critical" && tier === "deep") tier = "core";
  return { allow: true, level, tier };
}

/* ───────────────────────── periods ───────────────────────── */

/** First-of-month (UTC) `YYYY-MM-01` — the rollup/quota period key. */
export function monthPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** `YYYY-MM-DD` (UTC) — the daily-spend bucket key. */
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/* ───────────────────────── standard responses (clear, no internals) ───────────────────────── */

export function quotaExceededResponse(quotaUsd: number): Response {
  return Response.json(
    {
      error: "quota_exceeded",
      message:
        "سقف مصرف ماهانه هوش مصنوعی شما به پایان رسیده است. برای ادامه، طرح خود را ارتقا دهید یا تا ماه بعد صبر کنید.",
      quotaUsd,
    },
    { status: 402 },
  );
}

/** Platform-wide protection — deliberately does NOT expose platform finances. */
export function budgetUnavailableResponse(): Response {
  return Response.json(
    {
      error: "ai_temporarily_unavailable",
      message: "سرویس هوش مصنوعی موقتاً به دلیل محدودیت ظرفیت در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    },
    { status: 503 },
  );
}
