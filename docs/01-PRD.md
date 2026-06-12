# 01 — Product Requirements Document

**Product:** Iranmanesh Legal OS (سیستم‌عامل حقوقی ایرانمنش)
**Version:** 1.0 (MVP)
**Status:** Approved for build
**Authors:** Product / LegalTech founding team

---

## 1. Vision

Every serious Iranian litigator runs their practice from three places today: a paper archive (زونکن), a personal phone (WhatsApp/Telegram threads with clients, photos of court documents), and their own memory of deadlines. The cost of this is invisible until it isn't — a missed تجدیدنظر window is malpractice, a forgotten جلسه دادرسی is a lost client, and the institutional knowledge of twenty years of practice evaporates because it lives in nobody's system.

**Iranmanesh Legal OS is the operating system for an Iranian litigation practice.** Not case management software with an AI chatbot bolted on — a system where AI agents that genuinely understand Iranian law (مواعد قانونی, ادله اثبات, سلسله‌مراتب دادگاه‌ها) sit inside every workflow: reading the file, computing the deadlines, finding the weaknesses, drafting the لایحه.

### Product thesis

1. **The calendar is the wedge.** Procedural deadlines (مواعد) in Iranian law are rigid, computable, and catastrophic to miss. Software that *automatically derives* "واخواهی expires ۱۴۰۵/۰۴/۱۲" from "default judgment served ۱۴۰۵/۰۳/۲۲" earns trust no generic tool can.
2. **AI must be jurisdictional.** Generic LLM chat is useless to a lawyer who needs ماده ۳۳۶ ق.آ.د.م, not a US-law hallucination. Our agents are constrained to Iranian sources, cite article numbers, and refuse to invent law.
3. **The lawyer's own archive is the moat.** Twenty years of لوایح, winning arguments, and judge-specific experience, made semantically searchable, is a knowledge asset no competitor and no public model can replicate.

## 2. Market context

- ~70,000+ licensed lawyers in Iran across کانون وکلای دادگستری and مرکز وکلا، کارشناسان رسمی و مشاوران خانواده قوه قضاییه.
- The judiciary is already digital at the *filing* layer: دفاتر خدمات الکترونیک قضایی, سامانه ثنا (electronic service of process), عدل ایران. Lawyers receive ابلاغیه electronically — but **manage** them manually. The gap is the practice-side layer.
- Existing local software is Windows-era case registry (data entry forms, Excel exports, dated UI). None has meaningful AI. International tools (Clio, Harvey) are inaccessible (sanctions, payment, language, law).
- Persian-capable LLMs reached practical quality in 2024–2025. The window to build the AI-native incumbent is now.

**Competitive stance:** we do not compete with the judiciary's filing systems — we sit on the lawyer's side of the table and manage everything those systems don't: strategy, drafting, deadlines, evidence, knowledge.

## 3. Target users

Professional Iranian litigators in civil (حقوقی), property (ملکی), criminal (کیفری), family (خانواده), and commercial (تجاری) practice. Detailed personas in [02-USER-PERSONAS.md](./02-USER-PERSONAS.md). Primary: solo/small-office litigators with 30–150 active cases. Secondary: small firms (2–10 lawyers) — multi-user is post-MVP, but the data model is firm-ready from day one.

## 4. Product pillars and scope

The platform is ten capabilities behaving as one system:

| # | Pillar | MVP scope |
|---|--------|-----------|
| 1 | **Case Management** | Unlimited cases; parties, lawyers, judges, courts; stage tracking through the Iranian court hierarchy; full event timeline |
| 2 | **AI Legal Research Assistant** | RAG over seeded Iranian statutes + the lawyer's own knowledge vault; every answer cites article numbers |
| 3 | **AI Litigation Strategist** | Procedural-risk prediction, missing-evidence detection, argument generation, applicable-article suggestions |
| 4 | **Deadline Tracking** | Rule engine encoding مواعد (واخواهی ۲۰ روز, تجدیدنظر ۲۰ روز/۲ ماه, فرجام, دیوان عدالت ۳/۶ ماه…); auto-computation from service date; escalating reminders |
| 5 | **Document Intelligence** | PDF/image upload, text extraction, AI classification & tagging, full-text + semantic search |
| 6 | **Knowledge Vault** | Notes, court experiences, winning arguments, judge intel — embedded and semantically searchable |
| 7 | **Law Firm CRM** | Clients, opposing parties/counsel, judges, experts (کارشناس), with case linkage and conflict-of-interest visibility |
| 8 | **Court Calendar** | Jalali-native calendar of hearings, deadlines, follow-ups; day/month views; ics-free in-app reminders |
| 9 | **Evidence Analyzer** | Evidence inventory per claim mapped to ادله اثبات دعوا; AI gap analysis against burden of proof |
| 10 | **Drafting Copilot** | Generates دادخواست, لایحه دفاعیه, تجدیدنظرخواهی, شکواییه, اظهارنامه, قرارداد drafts in formal Persian legal register, structured per procedural requirements |

### Explicitly out of MVP scope
Billing/trust accounting (تعرفه حق‌الوکاله) beyond simple fee notes; multi-user firm permissions; client portal; mobile apps (responsive web only); direct integration with عدل ایران/ثنا (no public API — lawyers paste/upload ابلاغیه instead); e-signature.

## 5. Functional requirements (condensed)

### 5.1 Dashboard (میز کار)
- Today panel: hearings today/tomorrow, deadlines within 7 days (color-coded by urgency), open tasks.
- Critical-deadline banner when any مهلت < 3 days away.
- Recent activity stream across cases; quick actions (new case, upload ابلاغیه, ask AI).

### 5.2 Cases (پرونده‌ها)
- Case record: internal archive no., court case no. (شماره پرونده / بایگانی), type (حقوقی/کیفری/خانواده/ملکی/تجاری/اداری), stage (بدوی → واخواهی → تجدیدنظر → فرجام → اجرا), court + branch (شعبه), judge, subject (خواسته/اتهام), value (بهای خواسته), status.
- Parties with role (موکل, طرف مقابل, ثالث) and type (حقیقی/حقوقی); opposing counsel.
- Timeline of every event (filing, جلسه, ابلاغ, رأی, لایحه submitted…) — append-only, feeds AI context.
- Per-case tabs: overview, timeline, parties, documents, hearings/deadlines, evidence, AI analysis, drafts, notes.

### 5.3 Calendar & deadlines (تقویم و مواعد)
- Jalali month/agenda views; everything date-bearing (hearings, deadlines, tasks, follow-ups) renders here.
- Deadline engine: pick rule (e.g., تجدیدنظرخواهی), give trigger date (تاریخ ابلاغ), party location (ایران/خارج) → system computes due date, creates deadline with statutory citation attached.
- Manual deadlines allowed; all deadlines carry status (open/done/missed) and reminders at T-7, T-3, T-1.

### 5.4 Documents (اسناد)
- Upload PDF/JPG/PNG per case or unattached; Supabase Storage with per-user isolation.
- Processing pipeline: text extraction → AI classification (دادخواست/رأی/قرارداد/ابلاغیه/وکالت‌نامه/...) → summary → tags → chunk → embed.
- Search: keyword + semantic, filterable by case/type/tag.

### 5.5 AI workspace (دستیار هوشمند)
- Chat with the orchestrator or a chosen specialist agent; case-scoped or global context.
- Streaming responses; every legal assertion must cite (article number or source document).
- One-click "actions" from AI output: create deadline, save to knowledge vault, open as draft.
- Structured analyses (case analysis, contract review, strategy report) are persisted to the case and rendered as rich panels (risks/weaknesses/opportunities), not lost in chat scroll.

### 5.6 Drafting (پیش‌نویس‌ها)
- Template-driven generation: type + case context + user instructions → formal Persian draft with correct structure (سرفصل دادخواست: خواهان/خوانده/خواسته/دلایل/شرح).
- Editor with AI revise ("formal tone", "add legal basis", "shorten"); version save; export to print-ready HTML/Word-compatible format.

### 5.7 Knowledge vault (گنجینه دانش)
- Note types: تجربه دادگاه, استدلال برنده, رویه قضایی, نکته, الگوی متن; free tags; optional link to case/judge.
- Embedded on save; semantic search ("استدلال‌هایی که در خلع ید جواب داده") returns ranked notes with similarity.

### 5.8 CRM (مخاطبین)
- Contact types: موکل, طرف مقابل, وکیل مقابل, قاضی, کارشناس, دفتر خدمات; national ID/company ID fields; phone/ثنا status.
- Judge profiles accumulate: cases before them + vault notes tagged to them.
- Conflict check on new case: warn if opposing party matches an existing client.

## 6. Non-functional requirements

| Area | Requirement |
|------|------------|
| Language/локale | UI 100% Persian; RTL layout; Persian digits (۱۲۳۴۵۶۷۸۹۰); Jalali dates everywhere; Gregorian stored internally (UTC) |
| Performance | Dashboard TTI < 2s on 4G; search results < 1.5s; AI first-token < 3s (streamed) |
| Availability | Vercel + Supabase managed HA; graceful AI-provider failover (Claude → GPT) |
| Security | RLS on every table; private storage buckets; secrets server-side only; see [07](./07-SECURITY-ARCHITECTURE.md) |
| Privacy | Attorney–client privileged data: no AI training on user data; provider zero-retention options documented; data export anytime |
| Compliance posture | Self-hosted-friendly architecture (Supabase is open-source) given sanctions/payment realities for Iranian users |
| Accessibility | Keyboard navigable; WCAG AA contrast; honors reduced motion |

## 7. Success metrics (first 6 months post-launch)

| Metric | Target |
|--------|--------|
| Activation: lawyer creates ≥3 cases + 1 deadline in week 1 | ≥ 60% of signups |
| **North star: deadlines auto-computed per active user per month** | ≥ 8 |
| AI engagement: ≥1 agent analysis per active case | ≥ 50% of cases |
| Drafts generated then edited (not discarded) | ≥ 70% acceptance |
| Weekly retention (W4) | ≥ 45% |
| Missed-deadline incidents reported by users | 0 caused by system error |

## 8. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| LLM hallucinates Iranian law | RAG-first prompting; citation requirement; statute corpus in DB; refusal instruction when source absent; visible "AI — verify before reliance" labeling |
| Deadline rule errors → malpractice exposure | Rules table carries statutory citation; UI always shows the rule + trigger date so the lawyer verifies; deadlines are advisory, never silently authoritative; test suite on rule math |
| AI provider access from Iran | Server-side proxying through Vercel functions; provider-agnostic adapter so models can be swapped per deployment |
| OCR quality on Persian court scans | MVP: text-layer PDFs extract directly; image OCR via vision-capable models; manual paste fallback always available |
| Trust (privileged data in cloud) | Transparent security docs; self-hosting path; per-user encryption roadmap |

## 9. Release plan

- **M0 (this build):** Docs, schema, full UI shell, cases/calendar/deadline engine, documents pipeline, 8 agents + orchestrator, drafting, vault, CRM, seed/demo data.
- **M1:** Real OCR hardening, ابلاغیه parser (paste ثنا text → auto-extract dates), reminder notifications (email/SMS), Word export.
- **M2:** Multi-user firms, roles, client portal read-only sharing.
- **M3:** Mobile PWA polish, offline case viewing, rulings corpus expansion (آرای وحدت رویه full set).
