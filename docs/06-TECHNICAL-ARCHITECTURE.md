# 06 — Technical Architecture

## System shape: integrated monolith on serverless

One Next.js 16 (App Router) application is the entire system — UI, API, and agent runtime — backed by Supabase (Postgres + Auth + Storage + pgvector). Deploys to Vercel as a single unit.

```
┌────────────────────────── Vercel ──────────────────────────┐
│  Next.js 16 (App Router, React 19, TS strict)              │
│                                                            │
│  RSC pages (RTL/fa) ──► Server Actions / Route Handlers    │
│   /(app)/* modules        /api/ai/* (SSE streaming)        │
│   /(auth)/*               /api/documents/process           │
│                                                            │
│  src/lib/ai  ── orchestrator + 8 agents + tools (TS)       │
│  src/lib/domain ── deadline rules · taxonomies · Jalali    │
│  src/lib/data ── repository layer (Supabase | Demo)        │
└──────┬──────────────────────────────┬──────────────────────┘
       │ @supabase/ssr (RLS, anon key)│ server-only secrets
┌──────▼──────────────┐   ┌───────────▼──────────────────────┐
│  Supabase           │   │  AI providers                    │
│  Postgres+pgvector  │   │  Anthropic Claude (reasoning)    │
│  Auth (JWT)         │   │  OpenAI (embeddings + fallback)  │
│  Storage (documents)│   └──────────────────────────────────┘
└─────────────────────┘
```

### Why a monolith (trade-off record)
The reference architecture we studied (draftLegal) runs web + Express API + Python LangGraph agents + Redis queues + Elasticsearch. Right for self-hosted enterprise CLM; wrong for us: (a) the stack mandate is Supabase+Vercel; (b) a solo-lawyer SaaS needs operational simplicity over horizontal agent scaling; (c) TypeScript agents in route handlers eliminate a service boundary, a queue, and a second language while still allowing 60s+ streaming executions on Vercel. **What we keep from the reference:** tiered model routing, pipeline-status document processing, agent registry with tool whitelists, citations-or-refuse RAG discipline. **What we accept:** no durable background queue in MVP — document processing runs in an awaited route handler with status persisted per stage (`pending→processing→ready|failed`); a queue (Supabase cron / QStash) is the M1 upgrade when OCR latencies demand it.

## Repository layout

```
src/
  app/
    (auth)/login, signup          # public, RTL minimal shells
    (app)/                        # authenticated shell: sidebar + topbar
      page.tsx                    # dashboard میز کار
      cases/, cases/[id]/         # case workspace (tabbed)
      calendar/                   # Jalali calendar
      documents/                  # document center
      ai/                         # agent workspace (chat)
      drafts/, drafts/[id]/       # drafting copilot
      knowledge/                  # vault
      contacts/                   # CRM
      settings/
    api/
      ai/chat/route.ts            # SSE orchestrator endpoint
      ai/analyze/route.ts         # structured analyses (case/contract/strategy/evidence)
      ai/draft/route.ts           # draft generation/revision
      documents/process/route.ts  # extract→classify→summarize→chunk→embed
      deadlines/compute/route.ts  # rule engine endpoint
  components/ui/                  # shadcn-style primitives (RTL-aware)
  components/{layout,cases,calendar,...}
  lib/
    supabase/{client,server,middleware}.ts
    data/                         # repository layer: supabase.ts | demo.ts | index.ts
    ai/{providers,orchestrator,tools,agents/*,prompts}.ts
    domain/{types,deadlines,taxonomies,courts}.ts
    jalali.ts                     # Jalali ⇄ Gregorian, formatting, Persian digits
supabase/
  migrations/*.sql                # schema + RLS + functions
  seed.sql                        # rules, templates, corpus, courts + demo data
docs/
```

## Key decisions

| Decision | Choice | Why / trade-off |
|---|---|---|
| Rendering | RSC-first; client components only for interactivity (calendar grid, chat, editor) | Fast TTI on weak connections; less JS shipped |
| Auth | Supabase Auth, `@supabase/ssr` cookie sessions, middleware-guarded `(app)` group | RLS gets `auth.uid()` for free on every query |
| Data access | **Repository layer** `src/lib/data` with two implementations: `SupabaseDataSource` and `DemoDataSource` (in-memory, seeded) | One switch (`DEMO_MODE` or missing env) gives a fully-browsable public demo without credentials; also isolates Supabase API surface for testing |
| Dates | Store Gregorian UTC; render/edit Jalali via `jalaali-js` wrapper; Persian digits at format layer | Calendar correctness is non-negotiable in this domain |
| AI calls | Server-only (`server-only` import guard); SSE streaming to client | Keys never reach browser; Iran-side users get responses proxied via Vercel |
| Embeddings | OpenAI `text-embedding-3-small` (1536d) | Best multilingual price/perf; dimension fixed in schema |
| Vector search | pgvector HNSW + SQL `match_*` functions | No second search system (vs reference's Elasticsearch) — acceptable at MVP corpus scale |
| Document text | `unpdf` for text-layer PDFs; vision-model OCR fallback for scans; manual paste as last resort | Persian OCR is the riskiest dependency — degrade gracefully |
| Styling | Tailwind v4 + shadcn-style primitives, `dir="rtl"` at root, logical properties (`ms-/me-/ps-/pe-`) | RTL correctness by construction, not by override |
| State | Server state via RSC + revalidation; minimal client state (React state per feature) | No global store needed at this scale |
| Validation | Zod schemas at every route boundary, shared with forms | One source of truth for shapes |

## Streaming AI protocol

`POST /api/ai/chat` → `text/event-stream`. Events: `token` (delta), `agent` (which specialist is active), `tool` (tool call begin/end, surfaced in UI as «در حال جستجوی اسناد…»), `citations` (final array), `actions` (structured follow-ups: create-deadline proposal, save-to-vault), `done` (message id + usage), `error`. Client renders progressively; persisted to `ai_messages` server-side on completion.

## Environments & config

`.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server pipelines only), `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AI_PRIMARY_PROVIDER` (`anthropic`|`openai`), `DEMO_MODE` (`1` forces demo data source). Missing Supabase env ⇒ automatic demo mode with a visible «نسخه نمایشی» badge — the app is never blank.

## Performance & failure posture

- Dashboard/case pages: single round-trip RSC queries with narrow selects + indexed predicates.
- AI provider failover: primary → secondary on 5xx/timeout with jittered retry; user sees provider badge.
- Document pipeline stages persist status transitions; a failed stage is retryable idempotently (re-process button).
- Deadline computation is pure TS (`lib/domain/deadlines.ts`) with table-driven tests — no LLM in the date-math path, ever. Agents *propose*; the rule engine *computes*; the lawyer *confirms*.
