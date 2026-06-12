# 05 — Feature Prioritization

Method: MoSCoW for scope discipline + RICE for ordering inside "Must". Reach = % of weekly actives touching it; Impact 0.5–3; Confidence %; Effort in engineer-weeks.

## RICE-ranked MVP (Must-have)

| Rank | Feature | R | I | C | E | RICE | Rationale |
|---|---|---|---|---|---|---|---|
| 1 | Deadline engine (rules + auto-compute + calendar) | 100 | 3 | 95 | 2 | 142 | The trust wedge; malpractice insurance in software form |
| 2 | Case management core (cases, parties, timeline, stages) | 100 | 2 | 100 | 2 | 100 | The spine every other module hangs on |
| 3 | Jalali calendar (month/agenda, hearings+deadlines unified) | 90 | 2 | 100 | 1.5 | 120 | Daily-open habit driver |
| 4 | Dashboard (today, urgent, activity) | 95 | 1.5 | 100 | 1 | 142 | First screen, retention surface |
| 5 | Document center + AI pipeline (classify→summarize→embed) | 80 | 2.5 | 80 | 3 | 53 | Feeds every agent; heaviest engineering |
| 6 | AI workspace (orchestrator chat, case-scoped, citations) | 75 | 2.5 | 80 | 2.5 | 60 | The "AI-native" promise made tangible |
| 7 | Drafting copilot (templates + agent + editor + versions) | 70 | 3 | 75 | 2.5 | 63 | Biggest single time-saver (hours → minutes) |
| 8 | Litigation strategy & case analysis (persisted structured reports) | 60 | 3 | 70 | 2 | 63 | Differentiator vs every local competitor |
| 9 | Knowledge vault + semantic search | 55 | 2.5 | 80 | 1.5 | 73 | The compounding moat; cheap once pgvector is in |
| 10 | CRM + conflict check | 70 | 1.5 | 90 | 1 | 94 | Low effort, table-stakes completeness |
| 11 | Legal research agent over seeded corpus | 60 | 2.5 | 65 | 2 | 49 | Quality depends on corpus breadth — seed narrow, deep |
| 12 | Evidence analyzer (inventory + gap analysis) | 45 | 2.5 | 65 | 1.5 | 49 | Persona P2 anchor; rides on documents pipeline |

## Should-have (M1)
ابلاغیه text parser (paste from ثنا → auto deadline proposal) · email/SMS reminders · Word (.docx) export of drafts · bulk document upload · آرای وحدت رویه corpus expansion · per-judge analytics page.

## Could-have (M2)
Firm multi-user + roles · client read-only portal · time/fee notes · PWA offline case view · داوری (arbitration) module · WhatsApp/Telegram bot intake.

## Won't-have (explicit)
Direct ثنا/عدل‌ایران integration (no public API; scraping = account risk for lawyers) · consumer legal advice mode · e-signature (no legal framework parity in Iran) · payment processing.

## MVP cutline logic
Everything ranked 1–12 ships in M0 because the product thesis ("OS, not point tool") fails if any pillar is absent; effort is controlled by sharing infrastructure: one AI provider layer, one vector pipeline, one calendar substrate, one editor. The corpus (rank 11) ships narrow-but-deep: procedural deadlines + evidence + the ~100 most-litigated articles, fully cited.
