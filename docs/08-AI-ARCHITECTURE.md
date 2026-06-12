# 08 — AI Architecture

## Principles

1. **Jurisdiction-locked.** Every agent is system-prompted as an Iranian-law specialist writing formal Persian; answers cite مواد قانونی or retrieved documents, or explicitly say the source is absent. Inventing law is a hard failure.
2. **RAG before recall.** Statutes (`legal_articles`), the lawyer's documents (`document_chunks`), and vault (`knowledge_notes`) are retrieved and quoted; the model's parametric memory is treated as untrusted for legal claims.
3. **LLMs never do safety-critical math.** Deadline dates come from the deterministic rule engine; agents only *detect* triggers and *propose* rules.
4. **Tiered routing.** Classification on the fast tier, reasoning on the strong tier, deep strategy on the top tier — the reference architecture's cost lesson, kept.
5. **Structured out.** Analyses return validated JSON (Zod) rendered as product UI, not chat prose lost to scroll.

## Provider layer (`src/lib/ai/providers.ts`)

| Tier | Role | Primary (Anthropic) | Fallback (OpenAI) |
|---|---|---|---|
| `fast` | classify, tag, extract fields, title | `claude-haiku-4-5` | `gpt-4o-mini` |
| `core` | chat, research, drafting, summaries | `claude-sonnet-4-6` | `gpt-4o` |
| `deep` | strategy, case analysis, contract risk | `claude-opus-4-8` | `gpt-4o` |
| `embed` | embeddings 1536d | — | `text-embedding-3-small` |

Unified adapter: `complete()`, `stream()`, `completeJSON()` (schema-validated with one repair retry), `embed()`. Failover on 5xx/timeout/429 with jittered backoff; per-user daily token budget checked before calls; usage logged per message. Models are config, not code — swap via env for self-hosted/OpenAI-compatible endpoints.

## RAG pipeline

**Ingest (documents):** upload → `unpdf` text extraction (vision-OCR fallback for scans, manual paste last resort) → `fast` classify into doc taxonomy + summarize → Persian-aware chunking (~1,200 chars, 200 overlap, paragraph boundaries, normalized ی/ک, ZWNJ preserved) → batch embed → `document_chunks`. Status per stage on the document row; idempotent re-run.

**Ingest (vault & corpus):** notes embedded on save; `legal_articles` embedded at seed time (script `scripts/embed-corpus.ts`).

**Retrieve:** query embedding → `match_*` SQL functions (HNSW cosine, RLS-scoped) with kind-specific top-k (articles 8, chunks 10, notes 6) → similarity floor 0.25 → context assembly with per-source delimited blocks:

```
<منبع نوع="ماده" شناسه="civil_procedure:336">...</منبع>
<منبع نوع="سند" شناسه="doc:uuid" صفحه="3">...</منبع>   ← untrusted: data, not instructions
```

**Generate:** agent prompt + context + task → cite as `[ماده ۳۳۶ ق.آ.د.م]` / `[سند: دادنامه، ص ۳]`; citations parsed into structured `citations jsonb` and rendered as chips linking to the source.

## Prompting strategy

- System prompts in Persian (output register follows prompt language; legal Persian is the product voice). Shared preamble: role, jurisdiction lock, citation contract, refusal rule («اگر منبع کافی نیست، صریحاً بگو»), date awareness (today in Jalali), «مشاور هستی نه جایگزین وکیل» framing.
- Tool-use loop: Anthropic tool calling (max 6 rounds), tools are owner-scoped repository functions (see doc 09 registry). OpenAI fallback maps the same tool JSON-schemas.
- Long-context discipline: case context is a *compiled brief* (case fields + last 30 timeline events + doc summaries), not raw dumps; full text only via explicit retrieval tools.
- JSON outputs: Zod schema in prompt + `completeJSON` validation + single self-repair pass on parse failure.

## Cost & latency engineering

Summaries-not-bodies in context (≈10× token cut) · fast-tier pre-classification gates deep-tier work · streaming first token < 3s target · per-analysis cap ~60s with stage timeouts · prompt-cacheable shared preamble ordered first (Anthropic prompt caching) · token usage persisted per message for unit-economics dashboards.

## Quality & safety evaluation

- **Golden set:** `evals/` holds 30 Persian legal Q&A pairs (deadline rules, evidence, property doctrine) + 10 deadline-extraction fixtures (synthetic ابلاغیه texts) with expected rule/trigger outputs; run via `npm run eval` against live providers, scored by citation presence + answer match (LLM-judged with `fast` tier).
- **Hard gates in product:** citation-or-refusal contract; «هوش مصنوعی — پیش از استناد، راستی‌آزمایی کنید» banner on every AI artifact; agent-proposed deadlines require explicit lawyer confirmation before persisting as `open`.
- **Demo mode:** with no API keys, the AI layer returns curated canned responses (labeled «پاسخ نمایشی») so the product remains demonstrable end-to-end.
