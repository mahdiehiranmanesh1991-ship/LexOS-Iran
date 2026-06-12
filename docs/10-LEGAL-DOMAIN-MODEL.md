# 10 — Iranian Legal Domain Model

The domain knowledge encoded in `src/lib/domain/` and seeded into `deadline_rules` / `legal_articles`. **This doc and that code change together.** Persian terms are canonical; English glosses are for engineers.

## Court hierarchy (مراجع قضایی)

| kind | نام | Notes |
|---|---|---|
| `dispute_council` | شورای حل اختلاف | Small-claims & mediation tier; monetary ceiling set by current statute (configurable, changes by law) |
| `civil` | دادگاه عمومی حقوقی | General civil first instance |
| `family` | دادگاه خانواده | قانون حمایت خانواده ۱۳۹۱ |
| `criminal_2` | دادگاه کیفری دو | Ordinary crimes |
| `criminal_1` | دادگاه کیفری یک | Serious crimes (قتل، حدود…) |
| `revolutionary` | دادگاه انقلاب | Security, narcotics, … |
| `prosecutor` | دادسرا | تحقیقات مقدماتی: دادیار/بازپرس |
| `appeal` | دادگاه تجدیدنظر استان | Appellate review |
| `supreme` | دیوان عالی کشور | فرجام + وحدت رویه |
| `admin_justice` | دیوان عدالت اداری | Citizen vs administration |
| `enforcement` | اجرای احکام | Judgment execution |

**Case stages:** `pre_filing` (پیش از طرح) → `first_instance` (بدوی) → [`vakhahi` واخواهی] → `appeal` (تجدیدنظر) → [`cassation` فرجام] → `enforcement` (اجرا) → `closed`. Criminal path inserts دادسرا at the front (modeled as `first_instance` with court kind `prosecutor`).

## Procedural deadline rules (مواعد) — `deadline_rules` seed

Statutory computation rules (ق.آ.د.م):
- **ماده ۴۴۳:** procedural month = **30 days** ⇒ all rules normalize to day counts (۲ ماه = ۶۰).
- **ماده ۴۴۵:** day of service and day of action are excluded ⇒ engine computes `due_at = trigger_date + days + 1`.
- **ماده ۴۴۴:** last day on an official holiday rolls forward ⇒ engine rolls Fridays to Saturday (full holiday calendar = M1; limitation surfaced in UI tooltip).

| code | عنوان | داخل / خارج (days) | استناد |
|---|---|---|---|
| `vakhahi_civil` | واخواهی از حکم غیابی حقوقی | 20 / 60 | ماده ۳۰۶ ق.آ.د.م |
| `appeal_civil` | تجدیدنظرخواهی حقوقی | 20 / 60 | ماده ۳۳۶ ق.آ.د.م |
| `cassation_civil` | فرجام‌خواهی | 20 / 60 | ماده ۳۹۷ ق.آ.د.م |
| `retrial_civil` | اعاده دادرسی | 20 / 60 | مواد ۴۲۷–۴۲۸ ق.آ.د.م |
| `arbitration_objection` | اعتراض به رأی داور | 20 / 60 | ماده ۴۹۰ ق.آ.د.م |
| `cure_defect` | رفع نقص دادخواست | 10 / 10 | ماده ۵۴ ق.آ.د.م |
| `clerk_rejection_objection` | اعتراض به قرار رد دادخواست دفتر | 10 / 10 | ماده ۵۴ ق.آ.د.م |
| `expert_objection` | اعتراض به نظریه کارشناس | 7 / 7 | ماده ۲۶۰ ق.آ.د.م |
| `appeal_criminal` | تجدیدنظر/فرجام کیفری | 20 / 60 | ماده ۴۳۱ ق.آ.د.ک |
| `prosecutor_order_objection` | اعتراض به قرار منع/موقوفی تعقیب | 10 / 30 | مواد ۲۷۰–۲۷۱ ق.آ.د.ک |
| `admin_justice_complaint` | شکایت از آرای قطعی مراجع اختصاصی در دیوان | 90 / 180 | ماده ۱۶ ق.ت.آ.د.د.ع.ا |
| `admin_justice_appeal` | تجدیدنظر از شعب بدوی دیوان | 20 / 60 | ماده ۶۵ ق.ت.آ.د.د.ع.ا |
| `enforcement_compliance` | اجرای مفاد اجراییه | 10 / 10 | ماده ۳۴ ق.ا.ا.م |
| `registration_objection` | اعتراض به ثبت ملک | 90 / 90 | ماده ۱۶ قانون ثبت |
| `boundary_objection` | اعتراض به تحدید حدود | 30 / 30 | ماده ۲۰ قانون ثبت |
| `cheque_criminal_complaint` | شکایت کیفری چک (از گواهی عدم پرداخت) | 180 / 180 | ماده ۱۱ قانون صدور چک |
| `cheque_presentment` | ارائه چک به بانک (حفظ حق رجوع به ظهرنویس) | 15 / 45* | ماده ۳۱۵ ق.ت (*شهر دیگر) |
| `note_protest` | واخواست سفته/برات | 10 / 10 | ماده ۲۸۰ ق.ت |
| `divorce_certificate_validity` | اعتبار گواهی عدم امکان سازش | 90 / 90 | ماده ۳۴ ق.حمایت خانواده |

> Engine contract: rule + trigger date (+ abroad flag) → due date, **deterministic TS, table-tested**. Agents may *propose* (rule, trigger) pairs; the lawyer confirms; the engine computes. The UI always shows: rule title, citation, trigger, arithmetic, result — verifiability is the feature.

## Evidence model (ادله اثبات)

**Civil — ماده ۱۲۵۸ ق.م:** اقرار `confession` · سند `document` (رسمی/عادی — ماده ۱۲۸۷ ق.م defines official deeds; سند رسمی beats عادی absent جعل claim) · شهادت `testimony` (nisāb rules per ماده ۲۳۰ ق.آ.د.م) · امارات `presumption` (قانونی/قضایی) · قسم `oath`. Augmented procedural evidence: کارشناسی `expert_opinion`, معاینه محل `inspection`, تحقیق محلی `local_inquiry`.
**Criminal — ماده ۱۶۰ ق.م.ا:** اقرار، شهادت، قسامه، سوگند، **علم قاضی**.
**Burden:** ماده ۱۲۵۷ ق.م — «هر کس مدعی حقی باشد باید آن را اثبات کند». The Evidence Agent maps each claim element → available evidence → gap, in exactly these categories.

## Common claim taxonomies (خواسته‌ها) the agents must recognize

- **ملکی:** خلع ید (ownership-based eviction of usurper) vs تخلیه ید (lease-end eviction) vs رفع تصرف عدوانی (possessory, ماده ۱۵۸ ق.آ.د.م) — misclassification is the #1 procedural kill; الزام به تنظیم سند رسمی; ابطال سند; افراز و دستور فروش; ممانعت/مزاحمت.
- **قراردادی/تجاری:** مطالبه وجه (چک ماده ۳۱۰+ ق.ت / سفته), الزام به ایفای تعهد, فسخ/تأیید فسخ, استرداد ثمن, خسارت تأخیر تادیه (ماده ۵۲۲ ق.آ.د.م), ورشکستگی.
- **خانواده:** مهریه, نفقه, تمکین, حضانت, طلاق/گواهی عدم امکان سازش, اجرت‌المثل.
- **کیفری پرتکرار:** کلاهبرداری, خیانت در امانت, جعل و استفاده از سند مجعول, انتقال مال غیر, سرقت, تصرف عدوانی کیفری (ماده ۶۹۰ تعزیرات), توهین/افترا, چک بلامحل.

## Seeded statute corpus (`legal_articles`) — coverage map (~100 rows)

| law_code | قانون | Seeded focus |
|---|---|---|
| `civil_code` | قانون مدنی | عقود و تعهدات (۱۰، ۱۹۰، ۲۱۹–۲۳۱)، بیع، اجاره، غصب (۳۰۸–۳۱۱)، ضمان قهری (۳۲۸+)، ادله (۱۲۵۷–۱۳۳۵ selections)، مهر (۱۰۸۲+) |
| `civil_procedure` | ق.آ.د.م ۱۳۷۹ | صلاحیت، ایرادات (۸۴)، جلسه اول (۹۵–۹۸)، ادله، کارشناسی (۲۵۷–۲۶۹)، مواعد (۴۴۲–۴۴۵)، واخواهی/تجدیدنظر/فرجام/اعاده، دستور موقت (۳۱۰+)، تأمین خواسته (۱۰۸+) |
| `islamic_penal` | ق.م.ا ۱۳۹۲ + تعزیرات ۱۳۷۵ | ادله (۱۶۰+)، کلاهبرداری (۱ تشدید)، خیانت در امانت (۶۷۴)، جعل (۵۲۳+)، انتقال مال غیر، تصرف عدوانی (۶۹۰) |
| `criminal_procedure` | ق.آ.د.ک ۱۳۹۲ | شکایت، قرارهای تأمین، اعتراض به قرارها (۲۷۰–۲۷۱)، تجدیدنظر (۴۲۷–۴۴۷ selections) |
| `commerce` | قانون تجارت | اسناد تجاری (۲۸۰، ۲۸۶، ۳۱۰–۳۱۵)، شرکت‌ها basics |
| `cheque_law` | قانون صدور چک | مواد ۳–۲۳ selections (esp. ۱۱) |
| `landlord_tenant_56/76` | روابط موجر و مستأجر | حق کسب‌وپیشه (۵۶) vs ودیعه/تخلیه فوری (۷۶) |
| `family_protection` | ق.حمایت خانواده ۱۳۹۱ | صلاحیت، مهریه اعسار، گواهی عدم امکان سازش |
| `admin_justice` | قانون دیوان عدالت | مواد ۱۰، ۱۶، ۶۵ |
| `enforcement_civil` | ق.اجرای احکام مدنی | ۳۴، توقیف اموال selections |
| `unification_rulings` | آرای وحدت رویه منتخب | High-litigation rulings (e.g. مهریه به نرخ روز، چک کیفری) |

> **Data honesty rule:** rows whose `text_fa` is an editorial summary (not verbatim Gazette text) are prefixed «خلاصه ماده —» and the UI shows a «متن تلخیص‌شده» badge. Verbatim verified import from رسمی sources is an M1 data task. Agents must cite article numbers either way, so the lawyer verifies in their own منبع — this is by design, not a shortcut.

## National-system touchpoints (modeled, not integrated)

ثنا (electronic service — every ابلاغیه carries a service date that starts clocks; the app's «ثبت ابلاغیه» flow mirrors it), دفاتر خدمات الکترونیک قضایی (filing — drafts export print-ready for filing), عدل ایران (case status — lawyers paste updates into the timeline). No scraping/API in MVP (account-risk for lawyers; no public API).
