# 14 — AI Cost Governance

How LexOS Iran tracks, prices, quotas, and governs LLM spend so the platform stays
financially sustainable as usage grows. Companion to `08-AI-ARCHITECTURE.md`.

## Goals

Prevent uncontrolled LLM spending via four mechanisms working together:
1. **Usage recording** — every paid AI call is priced and persisted.
2. **Per-user monthly quotas** — a free/pro/firm USD ceiling per user.
3. **Platform budget protection** — warning/critical/emergency thresholds on total monthly spend.
4. **Model governance** — feature→tier routing, centralized, with budget-aware downgrade.

## Architecture

```
 route (chat/analyze/draft/documents)
   │  ① aiPreflight({db, route, feature})         ← quota + budget gate, returns governed tier
   ▼
 orchestrator / providers  ──②──►  Anthropic / OpenAI
   │                                   │ usage (tokens_in/out)
   │  ③ recordUsage(...)  ◄────────────┘
   ▼
 cost-tracker ──► cost-store ──► Supabase (ai_record_usage RPC: event + monthly rollup)
                              └─► DemoCostStore (in-memory; demo / tests / single-instance fallback)
```

### Files

| File | Role |
|---|---|
| `src/lib/ai/cost-control.ts` | **Pure** source of truth: pricing, cost estimate, quotas, budget thresholds, feature→tier governance, the `decideBudget()` engine, standard 402/503 responses. No I/O — fully unit-tested. |
| `src/lib/ai/cost-store.ts` | `CostStore` interface + `DemoCostStore` (in-memory, pure). |
| `src/lib/ai/cost-store-supabase.ts` | `SupabaseCostStore` — RPC writes + rollup reads via the service role. |
| `src/lib/ai/cost-tracker.ts` | Orchestration: store resolution, `recordUsage()`, the `aiPreflight()` gate, `getUsageDashboard()`, content-free cost logging. |
| `src/lib/supabase/admin.ts` | Service-role client (confined here per docs/07). |
| `supabase/migrations/00003_ai_cost.sql` | `ai_usage_events`, `ai_usage_monthly`, `ai_record_usage()`, `ai_platform_month_spend()`, RLS. |

### Why this shape
- **Two recording chokepoints**, not scattered call sites: `providers.ts` records every non-streaming call (when a `cost` context is passed); `orchestrator.runAgentStream` records the streaming agent loop from `finalMessage().usage`. Nothing else calls the providers directly except `documents/process` (vision OCR), which records inline.
- **Atomic rollup** — `ai_record_usage()` inserts the event and upserts the per-user monthly total in one SECURITY DEFINER call, so quota checks read an O(1) rollup row instead of summing events.
- **Service role for recording** — deep call sites (e.g. inside the stream) have no request-scoped RLS client, and platform-budget reads are inherently cross-tenant. `owner_id` is always passed explicitly (docs/07 rule).
- **Pure core** — all financial logic is in `cost-control.ts` with zero I/O, so it is exhaustively testable without a database.

## Quota system

Monthly USD ceilings by billing plan (`QUOTA_USD` in `cost-control.ts`):

| Plan | Monthly quota | Spec name |
|---|---|---|
| `free` | $5 | Free |
| `pro` | $25 | Professional |
| `firm` | $100 | Power User / firm |
| `enterprise` | ∞ | unlimited |

Enforcement runs in `aiPreflight()` before any model call. When `userSpend ≥ quota`, the request is rejected with **HTTP 402** `{ error: "quota_exceeded", message, quotaUsd }`. Quota is enforced only for authenticated users (`!isDemoMode()`); the public demo is never quota-blocked.

## Platform budget protection

A single env-configurable ceiling `AI_PLATFORM_BUDGET_USD` (default **$500/month**). `decideBudget()` maps the platform spend ratio to a level:

| Ratio | Level | Action |
|---|---|---|
| < 0.80 | ok | normal |
| ≥ 0.80 | warning | allow + log `budget_warning` |
| ≥ 0.90 | critical | **downgrade** deep→core tier + log `budget_critical` |
| ≥ 1.00 | emergency | **block expensive features** (analysis, draft, doc_ocr, chat) with HTTP 503; cheap ops (intent, classify) still run |

The 503 response is deliberately generic (`ai_temporarily_unavailable`) and never exposes platform finances.

## Model governance

`FEATURE_TIER` centralizes the feature→tier decision; no route or agent hardcodes a model. `providers.modelFor(tier)` resolves the tier to a concrete model (env-overridable). The preflight returns a possibly-downgraded tier which the route passes as `tierOverride` into the agent run.

| Feature | Tier | Rationale |
|---|---|---|
| chat | core | balanced default |
| analysis | deep | premium legal reasoning |
| draft | core | balanced |
| doc_ocr | core | vision quality |
| doc_classify, intent_route, structured_extract, embedding | fast | cheapest acceptable |

## Pricing

`MODEL_PRICING` (USD per 1M tokens) is matched by substring so version suffixes resolve correctly (`claude-haiku-4-5-…` → haiku). **These are configurable estimates** for budgeting — operators MUST verify against current provider pricing and update the table; they drive enforcement. Unknown models fall back to a conservative non-zero price so cost is never silently $0.

## Dashboard backend (Step 7)

`getUsageDashboard(period?)` returns: total spend, call count, and breakdowns **by user, by feature, by model, and daily** for the month. Backed by the monthly rollup (totals) and event aggregation (breakdowns). No UI yet — this is the data layer a cost dashboard renders from.

## Monitoring

`cost-tracker` emits structured, **content-free** JSON logs (`scope: "ai-cost"`): `quota_exceeded`, `budget_warning|critical|emergency`, `model_downgrade`, `abnormal_usage` (single call ≥ `AI_ABNORMAL_CALL_USD`), `store_degraded`. Owner ids are hashed; no prompt, document, or message text is ever logged.

## Operational procedures

- **Set the platform budget:** `AI_PLATFORM_BUDGET_USD` per deployment. Watch for `budget_warning` → review `getUsageDashboard()`; `budget_critical` auto-downgrades; `budget_emergency` sheds expensive load.
- **Adjust a plan's quota:** edit `QUOTA_USD` in `cost-control.ts`.
- **Update pricing:** edit `MODEL_PRICING` when providers change rates (re-verify quarterly).
- **Investigate a spike:** `getUsageDashboard()` → `byUser`/`byFeature`/`byModel`; cross-reference `abnormal_usage` logs (hashed owner).
- **Run the migration:** apply `00003_ai_cost.sql`; ensure `SUPABASE_SERVICE_ROLE_KEY` is set or the store silently degrades to per-instance in-memory (logged `store_degraded`).

## Upgrade path

- **Higher accuracy:** swap estimated pricing for provider billing reconciliation.
- **Multi-instance / serverless:** the in-memory fallback is single-instance; with the service role configured, all state already lives in Postgres, so horizontal scale needs no code change.
- **Real-time caps:** add a pre-call hard stop using the live rollup (today the gate reads the rollup at request start — within-month granularity, not per-token).
- **Prepaid credits / overage billing:** the `ai_usage_monthly` rollup is the natural integration point.

## Remaining limitations

1. **Estimated pricing**, not invoiced cost — verify and maintain `MODEL_PRICING`.
2. **Quota is checked at request start** against the month-to-date rollup; a single in-flight request can cross the line (no mid-stream abort). Bounded by `max_tokens`.
3. **Recording is best-effort** — a cost-store outage logs `store_degraded` and the gate fails **open** (availability over hard enforcement). Documented trade-off.
4. **Anonymous/demo usage** is recorded only in the in-memory store (no `auth.users` FK), so it is per-instance and non-persistent.
5. **Platform budget without a service-role key** degrades to per-instance in-memory accounting.
