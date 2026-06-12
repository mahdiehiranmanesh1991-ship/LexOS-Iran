# 03 — User Journeys

Five journeys cover ~90% of weekly product value. Each maps steps → screens → system behavior. Personas: P1 مهدیه (property litigator), P2 رضا (criminal veteran), P3 سارا (junior).

---

## J1 — The ابلاغیه moment (P1) — *deadline wedge journey*

> A رأی غیابی (default judgment) against مهدیه's client arrives in ثنا. The 20-day واخواهی clock started at electronic service.

| # | User action | Screen | System behavior |
|---|------------|--------|-----------------|
| 1 | Opens app after ثنا notification | Dashboard | — |
| 2 | Opens the case, uploads ابلاغیه PDF (or pastes its text) | Case → اسناد | Pipeline: extract text → classify as `ابلاغیه` → **Deadline Agent** detects رأی غیابی + service date ۱۴۰۵/۰۳/۲۲ |
| 3 | Reviews agent proposal | Deadline proposal card | Proposes: واخواهی — due **۱۴۰۵/۰۴/۱۱** (20 days, ماده ۳۰۶ ق.آ.د.م), shows rule + trigger date + math; lawyer can edit before accepting |
| 4 | Accepts | Case → مواعد | Deadline created with citation; lands on calendar; reminders T-7/3/1; case timeline event appended |
| 5 | Clicks «تحلیل رأی» | AI workspace (case-scoped) | Case Analyzer summarizes the judgment, flags واخواهی grounds; offers handoff to Drafting Agent |
| 6 | «پیش‌نویس واخواهی» | Drafts editor | Draft generated with case parties/numbers pre-filled; she edits, saves v1, prints |

**Success:** from ابلاغیه to calendared, cited deadline in **< 3 minutes**. Failure mode designed against: silent wrong date → mitigated by always-visible rule + trigger + arithmetic.

---

## J2 — New case intake with conflict check (P1)

1. Client arrives with a مشارکت در ساخت dispute. Dashboard → «پرونده جدید».
2. Wizard: type (حقوقی/ملکی) → parties (new contact or pick existing — **conflict check runs on opposing-party name/ID; warns if they're an existing client**) → court & شعبه → خواسته + بهای خواسته → optional first hearing date.
3. Case created; timeline seeded with "تشکیل پرونده"; documents tab ready; AI panel suggests: «قرارداد مشارکت را بارگذاری کنید تا تحلیل اولیه انجام شود».
4. Uploads the contract → Contract Agent extracts parties/obligations/فسخ clauses/تعهدات, risk-flags missing کمیسیون ماده ۱۰۰-style exposures, saves analysis to case.

**Success:** case fully structured ≤ 5 min; AI produced its first artifact without being asked twice.

## J3 — Hearing prep the night before (P2 رضا, via his کارآموز)

1. Dashboard shows «جلسه فردا: شعبه ۲ کیفری یک — ساعت ۱۰:۰۰».
2. Case → هوش مصنوعی → «آماده‌سازی جلسه». Orchestrator fans out: Case Analyzer (procedural posture) + Evidence Agent (exhibit inventory vs charges, contradictions across صورتجلسه‌ها) + Strategy Agent (likely judge questions, weak points to pre-empt).
3. Output: a hearing brief — timeline of facts, each charge mapped to its evidence with quoted excerpts + page refs, three vulnerabilities, suggested oral arguments. Saved to case as analysis; print view for رضا who reads paper.
4. کارآموز marks two AI-flagged contradictions as «تأیید شد», saves the best one to the knowledge vault tagged to the judge.

**Success:** prep from ~4h to ~40min; every AI claim carries a document citation رضا can check.

## J4 — Drafting a لایحه دفاعیه under time pressure (P3 سارا)

1. Case → پیش‌نویس جدید → نوع: لایحه دفاعیه → instructions: «رد ادعای مطالبه وجه؛ استناد به پرداخت قبلی و مرور زمان چک».
2. Drafting Agent pulls case context (parties, claims, uploaded evidence summaries) + Research Agent fetches articles (ماده ۳۱۸ ق.ت on چک limitation…) → draft in formal legal register with numbered دفاعیات and استنادات section.
3. She edits inline; selects a weak paragraph → «بازنویسی رسمی‌تر»; saves version; exports print HTML for the دفتر خدمات filing.
4. Post-filing, she saves the مرور زمان argument block to her vault: type «استدلال برنده» (pending outcome), tags: چک، مرور زمان.

**Success:** first usable draft < 10 min; she edited rather than rewrote (acceptance metric).

## J5 — "What did I argue in 1398?" (P1) — *vault journey*

1. Global search or گنجینه دانش → semantic query: «استدلال خلع ید وقتی سند عادی است و خوانده مدعی بیع است».
2. Vector search over her notes + past draft texts returns her 1398 لایحه argument (similarity-ranked, with case link), plus a related آرای وحدت رویه note.
3. One click: «استفاده در پیش‌نویس» — inserts the block into the current draft, adapted by the Drafting Agent to the new parties/facts.

**Success:** the dead-laptop problem is gone; reuse loop closes (draft → vault → draft).

---

## Journey-derived requirements (traceability)

| Requirement | Journeys |
|---|---|
| Deadline proposals must show rule, citation, trigger, computed math; accept/edit flow | J1 |
| Document pipeline must classify ابلاغیه and hand off to Deadline Agent automatically | J1 |
| Conflict check at party-entry time | J2 |
| Multi-agent fan-out ("hearing prep") with one merged, printable brief | J3 |
| Every AI legal/factual claim cites article or source doc + locator | J1 J3 J4 |
| Draft editor: inline AI revisions, versions, print/export | J1 J4 |
| Vault entries embeddable from any surface (chat, analysis, draft) in one click | J3 J4 J5 |
| Semantic search spans vault **and** historical draft/document text | J5 |
| Print-friendly rendering of analyses and drafts | J3 J4 |
