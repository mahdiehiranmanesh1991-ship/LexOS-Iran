# 02 — User Personas

Four personas drawn from the structure of the Iranian bar: solo generalist litigators dominate numerically; property and commercial specialists carry the highest-value matters; junior lawyers are the AI-native adopters who pull tools into offices.

---

## P1 — دکتر مهدیه ایرانمنش — The Property & Civil Litigator (primary persona)

| | |
|---|---|
| Age / role | 35, پایه یک دادگستری, solo practice with one assistant (کارآموز) |
| Location | Tehran; cases across Tehran, Karaj, and one inherited file in Kerman |
| Caseload | ~80 active: خلع ید, الزام به تنظیم سند رسمی, تصرف عدوانی, مطالبه وجه چک, فسخ قرارداد مشارکت در ساخت |
| Tools today | Paper زونکن per case, phone camera, Telegram "Saved Messages" as a document store, paper تقویم, ثنا app for ابلاغیه |

**A day:** 8:00 reviews today's hearing file in traffic; 9:30 جلسه at شعبه ۱۲ دادگاه عمومی حقوقی تهران; afternoon: three client calls asking "پرونده‌ام چی شد؟", drafts a لایحه until 21:00 because finding the right precedent and her own old argument from a similar 1398 case takes hours.

**Pains (ranked):**
1. **Deadline anxiety.** Every ابلاغیه starts a silent 20-day clock. She triple-checks dates manually; one واخواهی near-miss in 1402 still haunts her.
2. **Her best work is unfindable.** The winning استدلال from a 1398 خلع ید case exists only in a Word file named `لایحه نهایی ۲.docx` on a dead laptop.
3. **Client status calls** interrupt deep work; answering requires reconstructing the case state from paper.
4. Drafting from scratch when 70% of every دادخواست خلع ید is structurally identical.

**Goals:** never miss a موعد; reuse her own knowledge; cut drafting time 60%; look impeccably organized to clients.

**Quote:** «من به نرم‌افزار اعتماد نمی‌کنم مگر اینکه ماده قانونی مهلت را هم نشانم بدهد.» — *"I won't trust software unless it shows me the statutory article for the deadline too."*

**Feature affinity:** Deadline engine ★★★★★ · Knowledge vault ★★★★★ · Drafting ★★★★ · AI strategy ★★★★ · CRM ★★★

---

## P2 — آقای رضا توکلی — The Criminal Defense Veteran

| | |
|---|---|
| Age / role | 52, پایه یک, 24 years at the bar, ex-قاضی; takes serious کیفری work: کلاهبرداری, خیانت در امانت, جعل |
| Caseload | ~35 active, each heavy: multi-volume دادسرا files, بازپرسی sessions, کیفری یک و دو, تجدیدنظر |
| Tech comfort | Low-moderate. Reads on paper. His کارآموز operates the systems. |

**Pains:** Case files of 400+ pages photographed at the دادسرا — finding "آن صورتجلسه‌ای که شاهد حرفش را عوض کرد" takes a day of scrolling photos. Tracking parallel deadlines for several متهم in one file. He distrusts AI's legal judgment but would accept "a junior that reads 400 pages overnight and marks contradictions."

**Goals:** searchable case files; contradiction/timeline extraction from bulky evidence; deadline safety across parallel appeals (his clients are sometimes in custody — days matter).

**Design implication:** AI output must be *grounded and quoted* — he checks every citation. Big readable type; print-friendly views; the کارآموز does data entry, he consumes.

**Feature affinity:** Document intelligence ★★★★★ · Evidence analyzer ★★★★★ · Deadlines ★★★★ · Drafting ★★ (writes his own) · Vault ★★★

---

## P3 — خانم سارا محمدی — The Ambitious Junior (growth engine)

| | |
|---|---|
| Age / role | 28, second-year وکیل (recently passed اختبار), building a practice from referrals and family law + small commercial cases |
| Caseload | ~25 active: مهریه, نفقه, حضانت, مطالبه وجه, تخلیه |
| Tech comfort | High. Uses ChatGPT already — and knows it hallucinates Iranian law. Pays for tools that save hours. |

**Pains:** No senior to ask "آیا این دعوا را درست طرح کرده‌ام؟" (procedural soundness fear: wrong خواسته phrasing → قرار رد دعوا). Drafting takes her 3× a senior's time. No archive of her own yet.

**Goals:** an always-available senior-shaped reviewer; procedurally-safe drafts; building her knowledge base from day one; impressing clients with responsiveness.

**Quote:** «هوش مصنوعی عمومی قانون ایران را از خودش می‌سازد؛ من چیزی می‌خواهم که ماده واقعی بدهد.»

**Feature affinity:** Litigation strategist ★★★★★ · Drafting ★★★★★ · Research agent ★★★★★ · Deadlines ★★★★ · everything else ★★★

---

## P4 — شرکت حقوقی دادآفرین — The Boutique Commercial Firm (future tier)

5 lawyers + office manager; corporate clients on retainer; قرارداد review, شرکت disputes, چک و سفته portfolios, some داوری (arbitration). Needs: shared case visibility, who-does-what task assignment, contract review at volume, client reporting. **Not in MVP** — but schema (firm-scoped ownership, roles) must not require migration surgery later. They validate the contract-agent and CRM pillars.

---

## Anti-persona

- **Notary offices (دفاتر اسناد رسمی)** — registry workflows, not litigation.
- **Citizens self-representing** — the system speaks lawyer; consumer legal advice is a different (riskier) product.
- **Large state-linked legal departments** — procurement and hosting constraints out of scope for MVP.
