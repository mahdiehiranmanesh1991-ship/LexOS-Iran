/**
 * Tests for AI cost governance (docs/14).
 *
 *   npm run test:cost  →  npx tsx scripts/test-cost-control.ts
 *
 * Hermetic: pure pricing/quota/budget/governance logic + the in-memory store.
 */
import {
  priceFor,
  estimateCostUsd,
  quotaForPlan,
  governedTier,
  FEATURE_TIER,
  budgetLevel,
  decideBudget,
  monthPeriod,
  dayKey,
  MODEL_PRICING,
} from "../src/lib/ai/cost-control";
import { DemoCostStore } from "../src/lib/ai/cost-store";

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) failures++;
  console.log(`${cond ? "✓" : "✗ FAIL"} ${name}`);
}
const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

/* ── 1. pricing (substring match handles version suffixes) ── */
ok("price: haiku", priceFor("claude-haiku-4-5-20251001") === MODEL_PRICING.haiku);
ok("price: sonnet", priceFor("claude-sonnet-4-6") === MODEL_PRICING.sonnet);
ok("price: opus", priceFor("claude-opus-4-8") === MODEL_PRICING.opus);
ok("price: gpt-4o-mini", priceFor("gpt-4o-mini") === MODEL_PRICING["gpt-4o-mini"]);
ok("price: gpt-4o", priceFor("gpt-4o") === MODEL_PRICING["gpt-4o"]);
ok("price: embedding", priceFor("text-embedding-3-small") === MODEL_PRICING["embedding-3-small"]);
ok("price: unknown → non-zero fallback", priceFor("some-future-model").input > 0);

/* ── 2. cost estimation math ── */
// sonnet: $3/Mtok in, $15/Mtok out → 1000 in + 500 out = 0.003 + 0.0075 = 0.0105
ok("cost: sonnet 1000in/500out = $0.0105", approx(estimateCostUsd("claude-sonnet-4-6", 1000, 500), 0.0105));
ok("cost: zero tokens = $0", estimateCostUsd("claude-opus-4-8", 0, 0) === 0);

/* ── 3. quotas ── */
ok("quota: free = $5", quotaForPlan("free") === 5);
ok("quota: pro = $25", quotaForPlan("pro") === 25);
ok("quota: firm = $100", quotaForPlan("firm") === 100);
ok("quota: enterprise = unlimited", quotaForPlan("enterprise") === Number.POSITIVE_INFINITY);
ok("quota: unknown plan → free", quotaForPlan("???") === 5);

/* ── 4. model governance (no hardcoding; central feature→tier) ── */
ok("route: simple chat → core", governedTier("chat") === "core");
ok("route: complex analysis → deep (premium)", governedTier("analysis") === "deep");
ok("route: draft → core (balanced)", governedTier("draft") === "core");
ok("route: classify → fast (cheapest)", governedTier("doc_classify") === "fast");
ok("route: intent → fast (cheapest)", governedTier("intent_route") === "fast");
ok("route: every feature has a tier", Object.values(FEATURE_TIER).every(Boolean));

/* ── 5. budget thresholds ── */
ok("budget: 0.79 → ok", budgetLevel(0.79) === "ok");
ok("budget: 0.80 → warning", budgetLevel(0.8) === "warning");
ok("budget: 0.90 → critical", budgetLevel(0.9) === "critical");
ok("budget: 1.00 → emergency", budgetLevel(1.0) === "emergency");

/* ── 6. quota enforcement decision ── */
{
  const base = {
    feature: "chat" as const,
    baselineTier: "core" as const,
    platformSpendUsd: 0,
    platformBudgetUsd: 500,
  };
  const blocked = decideBudget({ ...base, userSpendUsd: 25, quotaUsd: 25, enforceQuota: true });
  ok("quota: at/over quota → blocked", !blocked.allow && blocked.reason === "quota_exceeded");
  const under = decideBudget({ ...base, userSpendUsd: 24.99, quotaUsd: 25, enforceQuota: true });
  ok("quota: under quota → allowed", under.allow);
  const demo = decideBudget({ ...base, userSpendUsd: 999, quotaUsd: 25, enforceQuota: false });
  ok("quota: not enforced (demo) → allowed even over", demo.allow);
  const unlimited = decideBudget({ ...base, userSpendUsd: 1e6, quotaUsd: Infinity, enforceQuota: true });
  ok("quota: enterprise unlimited → allowed", unlimited.allow);
}

/* ── 7. platform budget protection ── */
{
  const q = { userSpendUsd: 0, quotaUsd: 25, enforceQuota: true, platformBudgetUsd: 500 };
  // Emergency blocks expensive features…
  const emExpensive = decideBudget({ ...q, feature: "analysis", baselineTier: "deep", platformSpendUsd: 500 });
  ok("platform: emergency blocks expensive (analysis)", !emExpensive.allow && emExpensive.reason === "platform_emergency");
  // …but lets cheap operations through.
  const emCheap = decideBudget({ ...q, feature: "intent_route", baselineTier: "fast", platformSpendUsd: 500 });
  ok("platform: emergency allows cheap (intent_route)", emCheap.allow);
  // Critical downgrades deep → core.
  const crit = decideBudget({ ...q, feature: "analysis", baselineTier: "deep", platformSpendUsd: 460 });
  ok("platform: critical downgrades deep → core", crit.allow && crit.tier === "core" && crit.level === "critical");
  // Warning allows, no downgrade.
  const warn = decideBudget({ ...q, feature: "chat", baselineTier: "core", platformSpendUsd: 410 });
  ok("platform: warning allows without downgrade", warn.allow && warn.tier === "core" && warn.level === "warning");
  // Healthy → untouched.
  const okd = decideBudget({ ...q, feature: "analysis", baselineTier: "deep", platformSpendUsd: 100 });
  ok("platform: healthy keeps premium tier", okd.allow && okd.tier === "deep" && okd.level === "ok");
}

/* ── 8. period helpers ── */
ok("period: monthPeriod = YYYY-MM-01", /^\d{4}-\d{2}-01$/.test(monthPeriod(new Date("2026-06-15T10:00:00Z"))));
ok("period: monthPeriod june", monthPeriod(new Date("2026-06-15T10:00:00Z")) === "2026-06-01");
ok("period: dayKey", dayKey(new Date("2026-06-15T10:00:00Z")) === "2026-06-15");

/* ── 9. store: recording + aggregation (dashboard backend) ── */
(async () => {
  const store = new DemoCostStore();
  const period = monthPeriod();
  const now = new Date().toISOString();
  const rec = (ownerId: string, feature: string, model: string, costUsd: number) =>
    store.record({
      ownerId, route: "/x", feature: feature as never, provider: "anthropic", model,
      tokensIn: 100, tokensOut: 50, totalTokens: 150, costUsd, createdAt: now,
    });

  await rec("u:alice", "chat", "claude-sonnet-4-6", 0.10);
  await rec("u:alice", "analysis", "claude-opus-4-8", 0.40);
  await rec("u:bob", "chat", "claude-sonnet-4-6", 0.25);

  ok("store: user month spend (alice = 0.50)", approx(await store.userMonthSpend("u:alice", period), 0.5));
  ok("store: user month spend (bob = 0.25)", approx(await store.userMonthSpend("u:bob", period), 0.25));
  ok("store: platform month spend = 0.75", approx(await store.platformMonthSpend(period), 0.75));

  const dash = await store.dashboard(period);
  ok("dashboard: total = 0.75", approx(dash.totalUsd, 0.75));
  ok("dashboard: calls = 3", dash.calls === 3);
  ok("dashboard: byUser top is alice", dash.byUser[0]?.ownerId === "u:alice");
  ok("dashboard: byFeature has chat+analysis", dash.byFeature.length === 2);
  ok("dashboard: byModel has sonnet+opus", dash.byModel.length === 2);
  ok("dashboard: daily has one bucket", dash.daily.length === 1);

  // spend outside the queried period is excluded
  const store2 = new DemoCostStore();
  await store2.record({
    ownerId: "u:alice", route: "/x", feature: "chat" as never, provider: "anthropic",
    model: "claude-sonnet-4-6", tokensIn: 1, tokensOut: 1, totalTokens: 2, costUsd: 9,
    createdAt: "2020-01-15T00:00:00.000Z",
  });
  ok("store: other-month spend excluded", (await store2.userMonthSpend("u:alice", period)) === 0);

  console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll cost-control tests passed ✓");
  process.exit(failures ? 1 : 0);
})();
