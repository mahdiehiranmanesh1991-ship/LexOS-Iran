# 13 — Solo MVP Hardening (تثبیت نسخهٔ وکیل مستقل)

**نوع سند:** Technical PRD / Implementation Spec
**وضعیت:** تأییدشده برای پیاده‌سازی — هنوز کدی نوشته نشده
**دامنه:** فقط چهار محور تثبیت نسخهٔ Solo Lawyer طبق `01-PRD.md`
**خارج از دامنه (Non-goals):** معماری Multi-Tenant (به `12` واگذار شد)، Billing/پرداخت، خروجی Word، یکپارچگی ثنا، اپ موبایل — هیچ‌کدام در این سند نیستند.

این سند مرجع چهار کار P0/P1 است که در `05`/گزارش وضعیت شناسایی شد:
**Reminder Engine · Brain Integration · RAG Activation · Production Hardening.**
هر محور با پنج بخش تعریف می‌شود: هدف، فایل‌های درگیر، ریسک‌ها، ترتیب پیاده‌سازی، معیار پذیرش.

> اصول ثابت پروژه که هیچ محوری حق نقض آن‌ها را ندارد: (۱) محاسبهٔ تاریخ مواعد فقط با موتور قطعی (`domain/deadlines.ts`)، هرگز LLM. (۲) قرارداد citation-or-refuse و jurisdiction-lock ایجنت‌ها دست‌نخورده. (۳) ثبت موعد فقط با تأیید وکیل (propose→confirm). (۴) سازگاری کامل با حالت demo (بدون کلید/بدون Supabase) — محصول هرگز خالی نمی‌شود.

---

## محور ۱ — Reminder Engine (موتور یادآوری مواعد و جلسات)

### هدف
تحویل وعدهٔ هستهٔ محصول و North-Star در PRD §5.3: تولید خودکار یادآوری برای مواعد باز و جلسات در آستانه‌های `settings.deadlines.reminder_offsets` (پیش‌فرض `[7,3,1]` روز) به‌علاوهٔ `safety_buffer_days`. خروجی فاز اول: اعلان درون‌برنامه‌ای (`notifications`)؛ کانال ایمیل/پیامک به‌صورت آداپتورِ قابل‌توسعه پشت `settings.notifications` (فاز دوم همین محور).
**مسئله‌ای که حل می‌کند:** امروز در حالت production هیچ ردیفی در `notifications` ساخته نمی‌شود (در `data/supabase.ts` فقط `select`/`update` روی این جدول هست) و هیچ scheduler‌ای وجود ندارد؛ یادآوری‌ها فقط در دادهٔ demo دیده می‌شوند.

### فایل‌های درگیر
- **جدید — مهاجرت:** `supabase/migrations/00003_reminders.sql` → جدول `reminder_log` (کلید یکتا `(deadline_id, kind, offset_days)` برای idempotency)؛ در صورت در دسترس بودن، تنظیم `pg_cron`.
- **جدید — اسکن سرویس‌رول:** `src/lib/data/admin.ts` (در `07-SECURITY-ARCHITECTURE.md §Privilege escalation` پیش‌بینی شده) — کوئری‌های service-role با تزریق صریح `owner_id` برای پیمایش مواعد/جلسات همهٔ کاربران بدون JWT.
- **جدید — Job امن:** `src/app/api/cron/reminders/route.ts` — اندپوینت محافظت‌شده با `CRON_SECRET` که موتور را اجرا می‌کند (چون دسترسی Vercel نداریم، تریگر = `pg_cron` داخل Supabase یا GitHub Actions زمان‌بندی‌شده؛ هرگز وابسته به Vercel Cron نشود).
- **جدید — منطق خالص:** افزودن helper به `src/lib/domain/deadlines.ts` مثل `dueReminderOffsets(dueAt, offsets, today)` → تعیین این‌که امروز کدام آستانه فعال است (با مرز روز در منطقهٔ زمانی `Asia/Tehran`).
- **قرارداد داده:** `src/lib/data/types.ts` → افزودن `createNotification(...)`؛ پیاده‌سازی در `src/lib/data/supabase.ts` و `src/lib/data/demo.ts`.
- **پیکربندی:** `.env.example` → `CRON_SECRET`، (اختیاری) `KAVENEGAR_API_KEY`/SMS داخلی، `RESEND_API_KEY`/ایمیل.
- **مصرف‌کننده‌های موجود (بدون تغییر منطق):** `settings.deadlines.*` و `settings.notifications.*` از قبل وجود دارند (`domain/settings.ts`)؛ نمایش اعلان در `components/layout/topbar.tsx` و داشبورد آماده است.

### ریسک‌ها
- **نشت بین‌کاربری:** Job بدون JWT با service-role اجرا می‌شود؛ طبق قانون doc-07 «هیچ کوئری service-role بدون predicate مالک» — هر کوئری باید `owner_id` را صریح حمل کند. (ریسک: بحرانی)
- **تکرار اعلان:** اجرای چندبارهٔ Job → یادآوری تکراری؛ مهار با `reminder_log` و یکتایی `(deadline_id, kind, offset_days)`.
- **مرز روز / منطقهٔ زمانی:** `deadlines.due_at` از نوع `date` گرگوری است؛ «امروز» باید بر اساس `Asia/Tehran` محاسبه شود تا یادآوری یک روز زود/دیر شلیک نشود. هماهنگی با rolling جمعه (ماده ۴۴۴).
- **در دسترس نبودن `pg_cron`** در پلن Supabase → جایگزین GitHub Actions زمان‌بندی‌شده با هدر مخفی.
- **دسترسی ارائه‌دهندهٔ ایمیل/پیامک از ایران** → کانال درون‌برنامه‌ای اول؛ SMS با ارائه‌دهندهٔ داخلی (Kavenegar/SMS.ir) پشت آداپتور.

### ترتیب پیاده‌سازی
1. مهاجرت `reminder_log` + `createNotification` در هر دو DataSource.
2. helper خالصِ تطبیق آستانه در `domain/deadlines.ts` + تست جدولی (هم‌سبک `scripts/test-deadlines.ts`).
3. `data/admin.ts` (اسکن service-role با owner-scoping).
4. روت `api/cron/reminders` — تولید اعلان درون‌برنامه‌ای، idempotent.
5. اتصال scheduler (`pg_cron` ← فراخوانی روت/تابع، یا GH Actions).
6. (فاز ۲) آداپتورهای ایمیل/پیامک پشت `settings.notifications.channel_*`.

### معیار پذیرش (Acceptance Criteria)
- برای یک موعدِ باز با سررسید دقیقاً ۷/۳/۱ روز بعد (به وقت تهران)، اجرای Job دقیقاً یک `notification` به‌ازای هر آستانه می‌سازد و در اجرای مجدد **تکرار نمی‌شود**.
- مواعد `done`/`missed`/`cancelled` و جلسات گذشته هیچ یادآوری تولید نمی‌کنند.
- اعلان فقط برای مالک همان ردیف دیده می‌شود (تست نشت بین‌کاربری سبز).
- فراخوانی روت بدون `CRON_SECRET` رد می‌شود.
- در حالت demo، Job بدون خطا no-op یا روی store حافظه‌ای اجرا می‌شود.
- آستانه‌ها از `settings.deadlines.reminder_offsets` خوانده می‌شوند (نه ثابت hard-coded).

---

## محور ۲ — Brain Integration (اتصال مغز حقوقی و ترجیحات نگارش)

### هدف
فعال‌کردن وجه تمایز اصلی محصول (ستون ۱۰ PRD): خروجی AI واقعاً تابع `settings.drafting` (سبک لایحه، لحن، شیوهٔ استناد، شماره‌گذاری، بلوک امضا، ترجیح رویه) و `brain_profile` (سبک شخصی آموخته‌شده) شود؛ و آموزش مغز (`addBrainSource`) از stub به استخراج واقعیِ پروفایل سبک تبدیل شود.
**مسئله‌ای که حل می‌کند:** امروز کل لایهٔ `src/lib/ai` هرگز `settings.drafting` یا `brain_profile` را نمی‌خواند (تأییدشده با grep)؛ پرامپت `drafting_agent` ثابت است و `BrainProfile` نمایشی است.

### فایل‌های درگیر
- **جدید — سازندهٔ خالص:** `src/lib/ai/style.ts` → `buildStyleDirective(drafting, brainProfile)` که یک بلوک دستورالعملِ فارسیِ مختصر تولید می‌کند (lحن/citation_style/pleading_style/numbering/honorifics/signature_block/precedent_preference + tone/signature_phrases/structure_notes از مغز).
- **تزریق:** `src/lib/ai/orchestrator.ts` — `runAgentStream`/`runAgent` که اکنون فقط `spec.system + caseHint` می‌سازند، باید بلوک سبک را **پس از** preamble غیرقابل‌عدول و به‌صورت صریحاً تابع اضافه کنند. منبع داده: یک‌بار `db.getSettings()` و `db.getBrainProfile()` در orchestrator.
- **آموزش مغز (پایان stub):** `src/lib/ai/brain.ts` (جدید) → `extractStyleProfile(texts[])` با `completeJSON` (`providers.ts`) → `BrainProfile`. اتصال در `src/app/(app)/settings/actions.ts` (`addBrainSourceAction`) و `data/supabase.ts`/`demo.ts` (`addBrainSource`): گذار وضعیت `learning→learned`، ذخیرهٔ `insights`، و نوشتن `settings.brain_profile`.
- **گِیت‌ها:** پرچم‌های `settings.brain.{enabled,learn_*,apply_to_drafts}` باید اعمال/عدم‌اعمال را کنترل کنند.
- **بدون تغییر:** `agents.ts` (پرامپت پایه ثابت می‌ماند؛ سبک به‌صورت پیوست تزریق می‌شود)، `settings/sections/brain-section.tsx` (نمایش پروفایل از قبل آماده است — فقط باید دادهٔ واقعی ببیند).

### ریسک‌ها
- **حریم خصوصی/ممتاز بودن:** متن مغز privileged است و در استخراج به ارائه‌دهنده می‌رود → باید `settings.security.ai_redaction` رعایت شود و مغز همیشه owner-scoped بماند (هرگز بین کاربران به اشتراک نرود).
- **تورم توکن/هزینه:** بلوک سبک به هر فراخوان اضافه می‌شود → باید مختصر باشد و با prompt caching انتروپیک (preamble اول) کش شود.
- **تضاد سبک با صحت حقوقی:** دستور سبک هرگز نباید jurisdiction-lock/citation/refusal را شل کند → بلوک سبک صریحاً «تابع و فرع بر اصول غیرقابل‌عدول» علامت‌گذاری شود.
- **تأخیر استخراج درون‌خطی** روی متن‌های بزرگ → ورودی کران‌دار شود؛ در صورت نیاز به زیرساخت Job (مشترک با محور ۱) منتقل شود؛ وضعیت پیشرفت را منعکس کند.
- **حالت demo:** `demoStream` باید مغز را بی‌خطا نادیده بگیرد.

### ترتیب پیاده‌سازی
1. `buildStyleDirective` خالص + تست snapshot.
2. تزریق در orchestrator (اول `drafting_agent`، سپس `strategy/contract/research`) با گِیتِ `brain.enabled`/`apply_to_drafts` و `drafting`.
3. `extractStyleProfile` + اتصال `addBrainSource` برای پرکردن `insights` و `settings.brain_profile` و گذار وضعیت.
4. اعمال `ai_redaction` پیش از ارسال.
5. تأیید نمایش پروفایل واقعی در `brain-section.tsx`.

### معیار پذیرش
- تغییر `drafting.tone`/`citation_style`/`pleading_style`/`numbering`/`signature_block` به‌طور قابل‌مشاهده خروجی پیش‌نویس را تغییر می‌دهد (مثلاً قالب استناد «مختصر» در برابر «کامل»؛ حضور بلوک امضا).
- با `brain.enabled=false` یا `apply_to_drafts=false` هیچ تزریق سبکی انجام نمی‌شود.
- اصول غیرقابل‌عدول (citation-or-refuse، jurisdiction-lock) صرف‌نظر از سبک پابرجا می‌مانند.
- پس از افزودن منبع مغز با متن چسبانده‌شده: وضعیت → `learned` و یک `BrainProfile` واقعی (tone، signature_phrases، structure_notes) ذخیره و نمایش داده می‌شود.
- نشت مغز بین کاربران رخ نمی‌دهد (owner-scoped).
- سربار توکنِ بلوک سبک کران‌دار است (هدف ≤ ~۴۰۰ توکن).

---

## محور ۳ — RAG Activation (فعال‌سازی بازیابی معنایی)

### هدف
روشن‌کردن بازیابی برداری واقعی (تولید embedding هنگام ingest + کوئری `match_*`) با fallback به keyword — مطابق PRD §5.4/§5.7 و `08-AI-ARCHITECTURE.md`.
**مسئله‌ای که حل می‌کند:** کل لایهٔ برداری امروز مرده است: embedding اسناد/یادداشت‌ها هرگز تولید نمی‌شود، توابع `match_document_chunks/match_knowledge_notes/match_legal_articles` هرگز فراخوانی نمی‌شوند (تأییدشده با grep)؛ همه‌چیز keyword است. (زیرساخت DB — جداول، HNSW، توابع — در `00001` آماده است و corpus در `seed-reference-data.ts` embed می‌شود.)

### فایل‌های درگیر
- **Ingest:** `src/app/api/documents/process/route.ts` — پس از استخراج متن: chunk + embed + درج در `document_chunks`.
- **جدید — تکه‌سازی:** `src/lib/ai/chunking.ts` — تکه‌سازِ فارسی‌آگاه (~۱٬۲۰۰ نویسه، هم‌پوشانی ۲۰۰، مرز پاراگراف، نرمال‌سازی ی/ک، حفظ ZWNJ) طبق doc-08.
- **جدید — بازیابی:** `src/lib/ai/retrieval.ts` (در کامنت `data/supabase.ts` پیش‌بینی شده) — embed کوئری → فراخوانی RPC `match_*` با کف شباهت ۰٫۲۵ و **fallback به keyword** و **fallback به corpus درون‌کدی در حالت demo**.
- **ابزارها:** `src/lib/ai/tools.ts` — `search_case_documents`/`search_knowledge_notes`/`search_legal_articles` از keyword به `retrieval` سوییچ کنند (با حفظ wrapper `untrusted()` و fallback).
- **داده:** `src/lib/data/supabase.ts` — `createNote` هنگام ذخیره embed کند؛ helperهای RPC `match_*` (تحت JWT کاربر، `SECURITY INVOKER`).
- **ارائه‌دهنده:** `src/lib/ai/providers.ts` — `embed()`/`embedOne()` موجودند (OpenAI)؛ مسیر بدون کلید OpenAI باید بی‌خطا به keyword برگردد.
- **Backfill:** اسکریپت جدید برای embed اسناد/یادداشت‌های موجود؛ `scripts/seed-reference-data.ts` از قبل corpus را embed می‌کند.
- **بدون تغییر اسکیما:** `00001` (جداول `document_chunks`، توابع `match_*`، HNSW، بُعد ۱۵۳۶) — فقط بررسی صحت بُعد.

### ریسک‌ها
- **وابستگی به OpenAI برای embedding:** اگر وکیل فقط کلید Anthropic داشته باشد، embedding نداریم → باید بی‌سروصدا به keyword برگردد **اما در UI شفاف اعلام شود** (ادعای «معنایی» نکنیم).
- **هزینه/تأخیر ingest:** embed هر تکه روی سند بزرگ ممکن است از سقف زمان روت عبور کند → batch + سقف تکه؛ در صورت نیاز انتقال به زیرساخت Job مشترک با محور ۱.
- **حالت demo:** نبود DB/RPC → بازیابی باید به `searchCorpus` و store حافظه‌ای برگردد.
- **کیفیت ایندکس/کف شباهت (۰٫۲۵):** false-negative → نیاز به تنظیم.
- **RLS توابع:** `match_*` باید `SECURITY INVOKER` و تحت JWT کاربر اجرا شوند، نه service-role.
- **Prompt injection:** تکه‌های بازیابی‌شده باید همچنان داخل `untrusted()` بسته شوند.

### ترتیب پیاده‌سازی
1. `chunking.ts` (خالص) + تست روی متن فارسی.
2. Ingest: chunk+embed+insert در `documents/process` + گذار وضعیت + اسکریپت backfill.
3. `retrieval.ts` با `match_*` + کف شباهت + fallback keyword + fallback demo.
4. سوییچ سه ابزار جستجو به `retrieval`.
5. embed یادداشت‌ها در `createNote`.
6. نشانهٔ UI برای حالت keyword-only (نبود کلید OpenAI).

### معیار پذیرش
- بارگذاری یک سند، `document_chunks` را با embedding غیرتهی پر می‌کند (وقتی کلید OpenAI هست).
- `search_case_documents` برای یک کوئری بازنویسی‌شده (نه عین کلیدواژه) تکه‌های مرتبط معنایی برمی‌گرداند؛ بدون کلید OpenAI، بی‌خطا به keyword برمی‌گردد.
- `search_legal_articles` علیه embedding‌های seed‌شدهٔ corpus از `match_legal_articles` استفاده می‌کند و برای پرسش هم‌معنا مادهٔ مرتبط می‌دهد.
- `createNote` یک embedding ذخیره می‌کند و جستجوی معنایی یادداشت مرتبط را برمی‌گرداند.
- تست RLS سبز: کوئری کاربر A هرگز تکه/یادداشت کاربر B را برنمی‌گرداند.
- حالت demo همچنان کار می‌کند (corpus درون‌کدی).

---

## محور ۴ — Production Hardening (تثبیت برای بهره‌برداری زنده)

### هدف
امن و قابل‌بهره‌برداری‌کردن اجرای زنده: صداقت بخش‌های Facade در Settings، سنجش و بودجهٔ مصرف AI، rate limiting، رصد خطا، تست‌های RLS، رفع race در `updateSettings`، و سخت‌سازی اسرار/هدرها — مطابق `07-SECURITY-ARCHITECTURE.md` و `08 §Cost`.

### فایل‌های درگیر
- **صداقت Settings:** `src/components/settings/sections/{security,backup,billing}-section.tsx` — کنترل‌هایی که عملی پشتشان نیست یا واقعی شوند یا با برچسب «به‌زودی» **غیرفعال** شوند. (طبق PRD، Billing می‌تواند کاملاً پنهان شود؛ خروجی JSON در Backup کم‌هزینه و واقعی‌شدنی است؛ 2FA واقعی بزرگ است → برای MVP برچسب.)
- **سنجش AI:** `src/lib/ai/orchestrator.ts` (capture usage از پیام نهایی) + `appendMessage` در `data/*.ts` (نوشتن `ai_messages.tokens_in/out`) + بررسی بودجهٔ روزانهٔ کاربر پیش از `runAgentStream` (جدول/شمارندهٔ سبک در Postgres).
- **rate limiting + CSRF:** `src/proxy.ts` یا per-route روی `api/ai/chat` و `api/documents/process` (شمارندهٔ DB یا Upstash) + بررسی `Origin` روی روت‌های جهش‌دهنده.
- **رصد خطا:** `instrumentation.ts` (Sentry با scrub داده‌های ممتاز) + روت `src/app/api/healthz/route.ts`.
- **رفع race:** `data/supabase.ts` `updateSettings` (read-modify-write کل jsonb) → به `jsonb` merge سمت DB یا version-lock.
- **Audit:** نوشتن `audit_logs` روی login/export/delete/AI-access (پیوند با واقعی‌شدن نسبی security-section).
- **تست RLS:** `supabase/tests/` (در doc-07 پیش‌بینی شده) — هر جدول باید SELECT/UPDATE/DELETE بین‌کاربری را رد کند.
- **پیکربندی:** `.env.example` (`CRON_SECRET`، حد بودجه، کلید Sentry).

### ریسک‌ها
- **Over-scoping:** 2FA/Backup کامل بزرگ‌اند؛ نیاز واقعی MVP «صداقت» است (غیرفعال‌سازی + برچسب)، نه پیاده‌سازی کامل — این مرز باید صریح بماند.
- **نیاز rate-limit به store:** Upstash/Redis وابستگی می‌افزاید → جایگزین سادهٔ شمارندهٔ Postgres.
- **اجبار بودجه:** قطع وکیل وسط کار بد است → هشدار نرم + سقف سخت قابل‌تنظیم.
- **PII در Sentry:** دادهٔ حقوقی نباید در payload خطا نشت کند → scrub اجباری.
- **تست RLS** نیازمند harness/CI است.

### ترتیب پیاده‌سازی
1. **صداقت Settings** (سریع و بحرانی برای اعتماد): غیرفعال/برچسب Facadeها؛ در صورت امکان Backup→خروجی JSON واقعی.
2. سنجش AI: نوشتن توکن‌ها + شمارندهٔ روزانه + بودجهٔ نرم.
3. رفع race در `updateSettings`.
4. رصد خطا (Sentry + `/healthz`).
5. rate limiting روی روت‌های AI/سند + بررسی Origin/CSRF.
6. تست‌های RLS در CI.
7. نوشتن audit_logs برای اقدامات حساس.

### معیار پذیرش
- هیچ کنترلی در Settings حفاظتی را ادعا نکند که ارائه نمی‌دهد (هر Facade یا کار می‌کند یا به‌وضوح غیرفعال/«به‌زودی» است).
- هر تبادل AI مقدار `tokens_in/out` را ذخیره می‌کند؛ عبور از بودجهٔ روزانه پیام فارسی روشن می‌دهد، نه crash.
- `updateSettings` تحت نوشتن هم‌زمان هیچ بخشی را گم نمی‌کند.
- خطاهای کنترل‌نشده به Sentry (اسکراب‌شده) می‌رسند؛ `/healthz` پاسخ ok می‌دهد.
- اندپوینت‌های chat/document نرخ سوءاستفاده را رد می‌کنند؛ روت‌های جهش‌دهنده درخواست cross-origin را رد می‌کنند.
- تست‌های RLS سبز: SELECT/UPDATE/DELETE بین‌کاربری روی هر جدول در CI رد می‌شود.
- اقدامات حساس (login، export، delete، AI access) در `audit_logs` (production) ثبت می‌شوند.

---

## زیرساخت مشترک و توالی کلان (Cross-cutting)

- **زیرساخت Job مشترک:** «روت امن با `CRON_SECRET` + اسکن service-role با owner-scoping» که در محور ۱ ساخته می‌شود، توسط آموزش مغز (محور ۲، در صورت سنگین‌شدن) و backfill/ingest سنگین (محور ۳) قابل استفادهٔ مجدد است. یک‌بار درست ساخته شود.
- **fallback‌های مشترک:** هر سه محور هوشمند باید سه حالت را بی‌خطا پوشش دهند — کلید کامل / فقط Anthropic (بدون embedding) / حالت demo (بدون کلید و بدون Supabase).

### توالی پیشنهادی کلان (با دلیل)
1. **Production Hardening — گام «صداقت Settings»** (کوچک، اعتمادساز، بدون وابستگی) را همان ابتدا بردار.
2. **Reminder Engine** (P0 و سازندهٔ زیرساخت Job مشترک).
3. **Brain Integration** (وجه تمایز؛ از زیرساخت Job و fallbackها بهره می‌برد).
4. **RAG Activation** (بیشترین وابستگی فنی؛ از همان زیرساخت/الگوها استفاده می‌کند).
5. **بقیهٔ Production Hardening** (metering، rate limit، Sentry، تست RLS) به‌موازات یا بلافاصله پس از آن.

## تعریف «انجام‌شده» (Definition of Done) کل سند
هر چهار محور وقتی Done‌اند که: معیارهای پذیرش‌شان سبز باشد، `next build`/lint تمیز بماند، حالت demo سالم بماند، و هیچ‌یک از چهار اصل ثابت پروژه نقض نشده باشد.
