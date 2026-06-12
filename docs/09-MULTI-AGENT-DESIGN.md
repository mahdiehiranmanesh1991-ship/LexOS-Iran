# 09 — Multi-Agent Design

## Topology: orchestrator + 8 specialists, shared tool registry

```
کاربر ──► Orchestrator (هماهنگ‌کننده)
            │ intent classification (fast tier) + routing
            ├─► single specialist (most turns)
            └─► composite plans (e.g. «آماده‌سازی جلسه» = Analyzer ∥ Evidence ∥ Strategy → merge)
                                  │
              shared tool registry (owner-scoped, whitelisted per agent)
              get_case_brief · search_case_documents · get_document_text
              search_legal_articles · search_knowledge_notes · list_deadline_rules
              compute_deadline · propose_deadline · save_analysis · save_note_draft
```

Agents are TypeScript modules (`src/lib/ai/agents/*`) sharing one execution loop (`runAgent`): system prompt → tool-use rounds (≤6) → final answer with citations → optional structured payload. Collaboration is **planner-executed composition** (orchestrator sequences/fans-out specialists and merges named sections), not free agent-to-agent chatter — deterministic, debuggable, cheap. This is the lesson taken from the reference architecture's registry/tiering, adapted from LangGraph-in-Python to plain TS.

## The 8 specialists

| # | Agent (Persian name) | Tier | Mission | Tools (beyond `get_case_brief`) | Structured output |
|---|---|---|---|---|---|
| 1 | **Case Analyzer** تحلیلگر پرونده | deep | Full case review: posture, claims vs ادله, risks/weaknesses/opportunities | search_case_documents, get_document_text, search_legal_articles | `case_analysis` (risks[], weaknesses[], opportunities[], next_steps[]) |
| 2 | **Deadline Agent** مواعد | fast→core | Detect procedural triggers in text (ابلاغ رأی غیابی، رأی حضوری، نظریه کارشناس…), map to rule codes, propose deadlines | list_deadline_rules, compute_deadline, propose_deadline, get_document_text | deadline proposals (rule_code, trigger_date, due_at, citation) — **never persists without user confirm** |
| 3 | **Contract Agent** قراردادها | deep | Clause extraction, obligation map, risk scoring per Iranian contract law (عقود معین، شروط ضمن عقد، وجه التزام، فسخ/انفساخ) | get_document_text, search_legal_articles | `contract_review` (parties, obligations[], risky_clauses[], missing_clauses[]) |
| 4 | **Property Law Agent** املاک | deep | Specialist doctrine: خلع ید vs تخلیه vs تصرف عدوانی، سند رسمی/عادی، الزام به تنظیم سند، افراز، مشارکت در ساخت | search_legal_articles, search_case_documents, search_knowledge_notes | `property_analysis` + recommended دعوا framing |
| 5 | **Litigation Strategy Agent** استراتژیست | deep | Procedural-risk prediction (ایرادات ماده ۸۴), missing evidence, argument lines, counter-scenarios, applicable articles | all read tools + compute_deadline | `strategy` (procedural_risks[], missing_evidence[], arguments[], counter_arguments[], suggested_articles[]) |
| 6 | **Evidence Review Agent** ادله | core | Inventory evidence per claim element; map to ادله اثبات (اقرار، سند، شهادت، اماره، قسم); find contradictions across documents | search_case_documents, get_document_text | `evidence_review` (claim_elements[] × evidence[], gaps[], contradictions[]) |
| 7 | **Legal Research Agent** پژوهشگر | core | Grounded Q&A over corpus + vault; doctrine summaries with article citations; «قانون چه می‌گوید» | search_legal_articles, search_knowledge_notes | cited answer (+ optional research memo) |
| 8 | **Drafting Agent** نگارش | core | Generate/revise دادخواست، لایحه، تجدیدنظرخواهی، شکواییه، اظهارنامه، قرارداد from template skeletons + case context, formal register | get_case_brief, search_legal_articles, get_template, search_knowledge_notes | draft markdown honoring template structure |

## Orchestrator contract

1. Classify intent (fast tier): `{agent | composite | smalltalk | out_of_scope}` + confidence. Low confidence → ask one clarifying question in Persian.
2. Compile context: case brief (if case-scoped), conversation tail, user profile preferences.
3. Execute route. Composites run specialists with section budgets and merge under named headings; UI streams `agent` events so the user sees who is working («تحلیلگر پرونده در حال بررسی…»).
4. Post-process: extract citations, collect `actions` (e.g. deadline proposals become confirm-cards in UI), persist message + any analysis.

**Composite plans shipped in MVP:** `hearing_prep` (Analyzer ∥ Evidence ∥ Strategy), `full_case_review` (Analyzer → Strategy), `new_contract_intake` (Contract → Strategy-lite). Plans are data (`src/lib/ai/plans.ts`), not prose — adding one is a config change.

## Autonomy boundaries

| Action class | Policy |
|---|---|
| Read (search, fetch, compute) | Autonomous within owner scope |
| Persist analysis/draft/note | Autonomous, always labeled AI, linked to source message |
| Create deadline/hearing/task | **Propose-only** — user confirms card; confirmation calls the deterministic engine |
| Delete / modify user data | Never available as a tool |
| External calls (web, integrations) | Not in MVP tool registry |

Guardrails: per-agent tool whitelist enforced in the loop (a tool not in the list is rejected even if the model asks); retrieved text wrapped as untrusted data blocks (prompt-injection defense, see doc 07); round and token ceilings per run; all tool I/O logged to `ai_messages.tool_calls` for auditability.

## Failure & degradation ladder

Tool error → agent told, may retry once → provider failover (Anthropic⇄OpenAI) → graceful refusal in Persian with what was tried. No keys at all → demo responses labeled «نمایشی». A specialist failing inside a composite degrades to partial report with an explicit «بخش ناتمام» marker — never a silent gap.
