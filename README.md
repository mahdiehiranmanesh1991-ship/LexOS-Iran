<div align="center">

# ⚖️ Iranmanesh Legal OS — سیستم‌عامل حقوقی ایرانمنش

### The AI Legal Operating System for Iranian litigators

**مدیریت پرونده · مواعد قانونی خودکار · ۸ ایجنت هوشمند · نگارش اسناد · گنجینه دانش**

Next.js 16 · TypeScript · Tailwind v4 · Supabase (Postgres + pgvector + Auth + Storage) · Claude + GPT · Vercel-ready

</div>

---

## What it is

Not case-management software with a chatbot — an **operating system for an Iranian litigation practice**, where AI agents that genuinely understand Iranian law (مواعد، ادله اثبات، سلسله‌مراتب مراجع) sit inside every workflow:

| Pillar | What it does |
|---|---|
| 📁 **Case management** | Unlimited cases through the real Iranian court pipeline (بدوی → واخواهی → تجدیدنظر → فرجام → اجرا), parties, courts, judges, append-only timeline |
| ⏰ **Deadline engine** | 19 statutory rules (واخواهی ۲۰ روز، تجدیدنظر ۲۰/۶۰، دیوان عدالت ۹۰/۱۸۰…) computed **deterministically** per مواد ۴۴۳–۴۴۵ ق.آ.د.م — citation, trigger and arithmetic always visible; table-tested |
| 📅 **Jalali calendar** | Fully Shamsi-native month grid (شنبه-first), hearings + deadlines + tasks unified |
| 📄 **Document intelligence** | PDF/image/pasted-ثنا upload → extraction → AI classification (ابلاغیه/دادنامه/قرارداد…) → summary → tags → search; ابلاغیه auto-offers deadline computation |
| 🤖 **8 specialist agents** | Case Analyzer · Deadline · Contract · Property · Strategy · Evidence · Research · Drafting — orchestrated, tool-using, citation-bound, jurisdiction-locked |
| ✍️ **Drafting copilot** | دادخواست، لایحه، واخواهی، تجدیدنظر، شکواییه، اظهارنامه، قرارداد from structural templates + case data, with AI revision and print-ready output |
| 📚 **Knowledge vault** | Winning arguments, judge intel, court experience — semantically searchable; your 20-year archive becomes an asset |
| 👥 **CRM + conflict check** | Clients/opponents/judges/experts; automatic conflict-of-interest warning at intake |

**Safety contract:** LLMs never compute dates. Agents *propose* → the deterministic rule engine *computes* → the lawyer *confirms*. Every legal claim must cite a ماده or a source document, or explicitly refuse.

## Quickstart

```bash
npm install
npm run dev        # → http://localhost:3000
```

**Zero-config demo mode:** with no env vars, the app boots fully browsable with a realistic Persian law-office dataset (10 cases, deadlines, hearings, analyses, vault). AI responses are labeled «نمایشی».

### Full production setup

1. Create a [Supabase](https://supabase.com) project → run `supabase/migrations/00001_initial_schema.sql`, then `supabase/seed.sql` (SQL editor or `supabase db push`).
2. Copy `.env.example` → `.env.local`, fill in Supabase URL/keys and at least one AI key (`ANTHROPIC_API_KEY` recommended, `OPENAI_API_KEY` enables semantic-search embeddings).
3. Sync reference data (rules, templates, statute corpus + embeddings):
   ```bash
   npm run seed:reference
   ```
4. `npm run build && npm start` — or push to GitHub and **deploy on Vercel** (set the same env vars; everything runs in one Next.js app, no extra services).

```bash
npm test           # deadline-engine + Jalali round-trip tests (safety-critical path)
```

## Architecture (1-minute tour)

```
src/app/(app)/…        RTL Persian UI — dashboard, cases, calendar, documents, ai, drafts, knowledge, contacts
src/app/api/ai/…       SSE chat orchestrator · structured analyses · draft generation
src/lib/domain/        The encoded law: deadline rules (cited), taxonomies, statute corpus, templates
src/lib/ai/            Provider tiers (fast/core/deep + failover) · tool registry · 8 agents · orchestrator
src/lib/data/          Repository layer: SupabaseDataSource (RLS) ⇄ DemoDataSource (in-memory)
src/lib/jalali.ts      Jalali ⇄ Gregorian, Persian digits, month grid — the only date gateway
supabase/              Migration (schema + RLS + pgvector + storage policies) · seed
docs/                  PRD, personas, journeys, DB design, architecture (technical/security/AI/multi-agent), legal domain model
```

Read [`docs/00-INDEX.md`](./docs/00-INDEX.md) for the full design record — including why this is a Vercel-deployable monolith rather than the multi-service reference architecture it was inspired by, and the data-honesty rule for the statute corpus.

## Status & roadmap

MVP (M0) complete: all ten pillars functional end-to-end. Next: ابلاغیه parser hardening, SMS/email reminders, Word export, multi-user firms, expanded verbatim corpus (آرای وحدت رویه). See [`docs/05-FEATURE-PRIORITIZATION.md`](./docs/05-FEATURE-PRIORITIZATION.md).

> ⚖️ AI output is analytical assistance, not legal advice; professional responsibility for filings remains with the lawyer. Deadline computations show their statutory basis precisely so they can be verified.
