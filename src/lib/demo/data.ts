import type {
  AiAnalysis,
  AiConversation,
  AiMessage,
  AppNotification,
  CaseEvent,
  CaseParty,
  Contact,
  Court,
  Deadline,
  Draft,
  Hearing,
  KnowledgeNote,
  LegalCase,
  LegalDocument,
  Task,
} from "@/lib/domain/types";
import { addDays, toISODate } from "@/lib/jalali";

/**
 * Demo dataset — a believable Iranian solo litigation practice.
 * All dates are generated relative to "now" so dashboards always look alive.
 * This data also doubles as the product's seed/demo fixture (Phase 6).
 */

function at(daysFromNow: number, hour = 9, minute = 0): string {
  const d = addDays(new Date(), daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function onDay(daysFromNow: number): string {
  return toISODate(addDays(new Date(), daysFromNow));
}

export const demoProfile = {
  id: "demo-user",
  full_name: "دکتر مهدیه ایرانمنش",
  bar_license_no: "۲۵۴۸۱",
  bar_type: "kanoon" as const,
  phone: "0912XXXXXXX",
  firm_name: "دفتر وکالت ایرانمنش",
  city: "تهران",
};

export const demoCourts: Court[] = [
  { id: "court-1", name: "دادگاه عمومی حقوقی تهران — مجتمع قضایی شهید بهشتی", kind: "civil", province: "تهران", city: "تهران" },
  { id: "court-2", name: "دادگاه تجدیدنظر استان تهران", kind: "appeal", province: "تهران", city: "تهران" },
  { id: "court-3", name: "دادسرای عمومی و انقلاب ناحیه ۶ تهران", kind: "prosecutor", province: "تهران", city: "تهران" },
  { id: "court-4", name: "دادگاه خانواده تهران — مجتمع قضایی خانواده ۱", kind: "family", province: "تهران", city: "تهران" },
  { id: "court-5", name: "شورای حل اختلاف منطقه ۳ تهران", kind: "dispute_council", province: "تهران", city: "تهران" },
  { id: "court-6", name: "دیوان عدالت اداری", kind: "admin_justice", province: "تهران", city: "تهران" },
  { id: "court-7", name: "دادگاه عمومی حقوقی کرج", kind: "civil", province: "البرز", city: "کرج" },
  { id: "court-8", name: "دادگاه کیفری دو تهران — مجتمع قضایی قدس", kind: "criminal_2", province: "تهران", city: "تهران" },
];

export const demoContacts: Contact[] = [
  { id: "ct-1", kind: "client", person_type: "natural", full_name: "محمد رضایی", national_id: "0071234567", phone: "0912 345 6789", email: null, city: "تهران", address: "تهران، سعادت‌آباد", notes: "معرف: آقای کریمی. پرداخت منظم.", created_at: at(-400) },
  { id: "ct-2", kind: "client", person_type: "legal", full_name: "شرکت بازرگانی پارس‌تجارت (سهامی خاص)", national_id: "10103456789", phone: "021 8876 5432", email: "info@parstejarat.example", city: "تهران", address: "تهران، خیابان ولیعصر", notes: "موکل قراردادی — قرارداد مشاوره سالانه", created_at: at(-700) },
  { id: "ct-3", kind: "client", person_type: "natural", full_name: "زهرا کریمی", national_id: "0079876543", phone: "0935 222 1144", email: null, city: "تهران", address: null, notes: "پرونده مهریه", created_at: at(-200) },
  { id: "ct-4", kind: "client", person_type: "natural", full_name: "علی محمدی", national_id: "0451122334", phone: "0919 888 7766", email: null, city: "کرج", address: null, notes: "دو پرونده ملکی", created_at: at(-560) },
  { id: "ct-5", kind: "opponent", person_type: "natural", full_name: "حسین صادقی", national_id: "0064455667", phone: null, email: null, city: "تهران", address: null, notes: "خوانده پرونده خلع ید", created_at: at(-300) },
  { id: "ct-6", kind: "opponent", person_type: "legal", full_name: "شرکت ساختمانی آبادگران البرز", national_id: "10980011223", phone: null, email: null, city: "کرج", address: null, notes: null, created_at: at(-250) },
  { id: "ct-7", kind: "opposing_counsel", person_type: "natural", full_name: "دکتر امیر نادری (وکیل)", national_id: null, phone: "0912 111 2233", email: null, city: "تهران", address: null, notes: "وکیل شرکت آبادگران — سابقه سازش‌پذیری کم", created_at: at(-250) },
  { id: "ct-8", kind: "judge", person_type: "natural", full_name: "قاضی سید مهدی موسوی", national_id: null, phone: null, email: null, city: "تهران", address: "شعبه ۱۲ دادگاه عمومی حقوقی تهران", notes: "رئیس شعبه ۱۲ — دقیق در ادله کتبی", created_at: at(-300) },
  { id: "ct-9", kind: "expert", person_type: "natural", full_name: "مهندس فرهاد توانا (کارشناس رسمی راه و ساختمان)", national_id: null, phone: "0912 555 0101", email: null, city: "تهران", address: null, notes: "کارشناس منتخب در پرونده مشارکت در ساخت", created_at: at(-100) },
  { id: "ct-10", kind: "client", person_type: "natural", full_name: "مریم احمدی", national_id: "0062233445", phone: "0903 444 5566", email: null, city: "تهران", address: null, notes: "موجر — پرونده تخلیه", created_at: at(-90) },
  { id: "ct-11", kind: "opponent", person_type: "natural", full_name: "رضا قاسمی", national_id: null, phone: null, email: null, city: "تهران", address: null, notes: "شاکی پرونده کیفری آقای رضایی", created_at: at(-150) },
];

export const demoCases: LegalCase[] = [
  {
    id: "case-1",
    archive_no: "1403-014",
    case_no: "140368920001234567",
    title: "خلع ید — پلاک ثبتی ۱۲۳/۴ بخش ۱۱ تهران",
    case_type: "property",
    stage: "first_instance",
    status: "active",
    client_position: "plaintiff",
    subject: "خلع ید و قلع و قمع بنا و اجرت‌المثل ایام تصرف",
    claim_value: 15_000_000_000,
    court_id: "court-1",
    court_branch: "شعبه ۱۲",
    judge_name: "قاضی سید مهدی موسوی",
    filed_at: onDay(-210),
    description:
      "موکل مالک رسمی شش‌دانگ پلاک ۱۲۳/۴ است. خوانده بدون اذن، بخش شمالی ملک را تصرف و دیوارکشی کرده است. اظهارنامه ارسال و بی‌پاسخ مانده؛ دادخواست خلع ید با مطالبه اجرت‌المثل طرح شد.",
    ai_summary:
      "دعوای خلع ید مبتنی بر مالکیت رسمی (سند تک‌برگ) علیه متصرف بدون مدرک. کارشناسی تصرف را تأیید کرده؛ نقطه قوت: سند رسمی + نظریه کارشناس. ریسک: ادعای احتمالی خوانده مبنی بر اذن شفاهی قبلی.",
    created_at: at(-210),
    updated_at: at(-1),
  },
  {
    id: "case-2",
    archive_no: "1404-003",
    case_no: "140468920007654321",
    title: "مطالبه وجه چک — ۴٬۸۰۰٬۰۰۰٬۰۰۰ ریال",
    case_type: "commercial",
    stage: "first_instance",
    status: "active",
    client_position: "plaintiff",
    subject: "مطالبه وجه دو فقره چک به انضمام خسارت تأخیر تأدیه و هزینه دادرسی",
    claim_value: 4_800_000_000,
    court_id: "court-1",
    court_branch: "شعبه ۷",
    judge_name: "قاضی احمدی‌نژاد",
    filed_at: onDay(-95),
    description:
      "دو فقره چک صیادی عهده بانک ملت، برگشت‌خورده با گواهی عدم پرداخت. صادرکننده: شرکت آبادگران البرز. تأمین خواسته صادر و یک حساب توقیف شده است.",
    ai_summary:
      "دعوای مطالبه وجه چک با گواهی عدم پرداخت معتبر. تأمین خواسته اخذ شده. دفاع احتمالی: ادعای امانی بودن چک — مستند کتبی ارائه نشده.",
    created_at: at(-95),
    updated_at: at(-3),
  },
  {
    id: "case-3",
    archive_no: "1403-051",
    case_no: "140368920005556677",
    title: "الزام به تنظیم سند رسمی — آپارتمان نارمک",
    case_type: "property",
    stage: "appeal",
    status: "active",
    client_position: "appellant",
    subject: "الزام به تنظیم سند رسمی انتقال شش‌دانگ آپارتمان",
    claim_value: 32_000_000_000,
    court_id: "court-2",
    court_branch: "شعبه ۱۵",
    judge_name: null,
    filed_at: onDay(-330),
    description:
      "مبایعه‌نامه عادی با پرداخت ۸۰٪ ثمن. فروشنده از حضور در دفترخانه امتناع کرد. دادگاه بدوی به استناد عدم احراز مالکیت رسمی فروشنده، دعوا را رد کرد؛ تجدیدنظرخواهی ثبت شده است.",
    ai_summary:
      "رد بدوی به دلیل عدم استعلام ثبتی کامل. در تجدیدنظر باید زنجیره انتقال (قولنامه‌های متوالی) و گواهی دفترخانه (عدم حضور فروشنده) تقویت شود. رأی وحدت رویه مرتبط با الزام فروشنده مبنای استدلال است.",
    created_at: at(-330),
    updated_at: at(-6),
  },
  {
    id: "case-4",
    archive_no: "1404-009",
    case_no: "140468920002223344",
    title: "دفاع از اتهام خیانت در امانت — آقای رضایی",
    case_type: "criminal",
    stage: "first_instance",
    status: "active",
    client_position: "accused",
    subject: "اتهام خیانت در امانت موضوع ماده ۶۷۴ تعزیرات (دفاع)",
    claim_value: null,
    court_id: "court-8",
    court_branch: "شعبه ۱۰۲",
    judge_name: "قاضی رستمی",
    filed_at: onDay(-150),
    description:
      "شاکی مدعی است خودرو به‌امانت سپرده و مسترد نشده است. دفاع: رابطه امانی وجود ندارد؛ خودرو بابت طلب تحویل شده (دفاع مبتنی بر معامله، نه امانت). کیفرخواست صادر و پرونده به دادگاه ارسال شده است.",
    ai_summary:
      "عنصر «سپردن مال به‌امانت» محل نزاع است؛ پیام‌های مکتوب طرفین به معامله اشاره دارد نه امانت. شهادت شاهد شاکی در دادسرا دارای دو تناقض تاریخی است.",
    created_at: at(-150),
    updated_at: at(-1),
  },
  {
    id: "case-5",
    archive_no: "1404-017",
    case_no: "140468920008889900",
    title: "مطالبه مهریه — خانم کریمی",
    case_type: "family",
    stage: "first_instance",
    status: "active",
    client_position: "plaintiff",
    subject: "مطالبه ۳۱۴ عدد سکه تمام بهار آزادی مهریه",
    claim_value: null,
    court_id: "court-4",
    court_branch: "شعبه ۲۶۸",
    judge_name: null,
    filed_at: onDay(-60),
    description:
      "زوجه متقاضی وصول مهریه. زوج دادخواست اعسار و تقسیط داده است. توقیف یک خودرو انجام شده؛ استعلام بانک مرکزی در جریان است.",
    ai_summary:
      "دعوای مهریه عندالمطالبه. نکته راهبردی: اثبات ملائت زوج از طریق گردش حساب و بیعانه ملک اخیر؛ پاسخ به اعسار با شهادت و قرائن.",
    created_at: at(-60),
    updated_at: at(-2),
  },
  {
    id: "case-6",
    archive_no: "1404-021",
    case_no: null,
    title: "تخلیه عین مستأجره — مغازه خیابان شریعتی",
    case_type: "property",
    stage: "pre_filing",
    status: "active",
    client_position: "plaintiff",
    subject: "تخلیه به علت انقضای مدت (قانون ۱۳۷۶) و مطالبه اجور معوقه",
    claim_value: 1_200_000_000,
    court_id: "court-5",
    court_branch: null,
    judge_name: null,
    filed_at: null,
    description:
      "قرارداد اجاره ۱۴۰۲ با دو شاهد و قید تخلیه. مدت منقضی شده، مستأجر تخلیه نمی‌کند. ودیعه نزد موجر است — آماده‌سازی درخواست دستور تخلیه.",
    ai_summary:
      "شرایط شکلی قانون ۷۶ (دو شاهد، مدت معین) محقق است → مسیر دستور تخلیه یک‌هفته‌ای شورا. اجور معوقه باید جداگانه مطالبه شود.",
    created_at: at(-25),
    updated_at: at(-25),
  },
  {
    id: "case-7",
    archive_no: "1403-058",
    case_no: "140368920003334455",
    title: "فسخ قرارداد مشارکت در ساخت — پروژه ولنجک",
    case_type: "civil",
    stage: "first_instance",
    status: "active",
    client_position: "plaintiff",
    subject: "تأیید فسخ قرارداد مشارکت در ساخت و خلع ید سازنده و مطالبه خسارت",
    claim_value: 95_000_000_000,
    court_id: "court-1",
    court_branch: "شعبه ۱۲",
    judge_name: "قاضی سید مهدی موسوی",
    filed_at: onDay(-280),
    description:
      "سازنده ۱۴ ماه از برنامه عقب است؛ پیشرفت واقعی ۲۸٪ مقابل تعهد ۷۵٪. حق فسخ ضمن قرارداد برای تأخیر بیش از ۶ ماه پیش‌بینی شده. اظهارنامه فسخ ابلاغ شده است. کارشناسی پیشرفت فیزیکی انجام و نظریه اخیراً ابلاغ شد.",
    ai_summary:
      "استحقاق فسخ مبتنی بر شرط صریح + احراز تأخیر توسط کارشناس. ریسک: ادعای سازنده مبنی بر فورس‌ماژور (تحریم مصالح) — مستندات ابرازی او عمومی و غیرمستند است.",
    created_at: at(-280),
    updated_at: at(0),
  },
  {
    id: "case-8",
    archive_no: "1404-026",
    case_no: "140468920001112223",
    title: "رفع تصرف عدوانی — زمین کشاورزی کرج (رأی غیابی)",
    case_type: "property",
    stage: "vakhahi",
    status: "active",
    client_position: "defendant",
    subject: "واخواهی از حکم غیابی رفع تصرف عدوانی",
    claim_value: null,
    court_id: "court-7",
    court_branch: "شعبه ۴",
    judge_name: null,
    filed_at: onDay(-380),
    description:
      "علیه موکل (آقای محمدی) حکم غیابی رفع تصرف صادر شده؛ ابلاغ واقعی اخیراً انجام شد. موکل مدعی سابقه تصرف ده‌ساله و اذن مالک قبلی است. مهلت واخواهی در جریان است.",
    ai_summary:
      "اولویت مطلق: ثبت واخواهی در مهلت. دفاع ماهوی: اثبات سبق تصرف موکل با شهادت همسایگان و قبوض برق کشاورزی ده‌ساله.",
    created_at: at(-30),
    updated_at: at(0),
  },
  {
    id: "case-9",
    archive_no: "1404-012",
    case_no: "14046892000DIV0091",
    title: "اعتراض به رأی کمیسیون ماده ۱۰۰ — پارس‌تجارت",
    case_type: "administrative",
    stage: "first_instance",
    status: "active",
    client_position: "plaintiff",
    subject: "ابطال رأی قطعی کمیسیون ماده ۱۰۰ (تخریب نیم‌طبقه انبار)",
    claim_value: null,
    court_id: "court-6",
    court_branch: "شعبه ۳۱",
    judge_name: null,
    filed_at: onDay(-40),
    description:
      "کمیسیون تجدیدنظر ماده ۱۰۰ رأی به تخریب نیم‌طبقه داده است. ایراد شکلی: عدم ابلاغ صحیح به مالک در مرحله بدوی و عدم استماع دفاع. شکایت در مهلت سه‌ماهه ثبت شد.",
    ai_summary:
      "نقض حق دفاع در رسیدگی کمیسیون، مبنای نقض رأی در دیوان است. درخواست دستور موقت توقف اجرای تخریب ثبت و در انتظار نتیجه است.",
    created_at: at(-40),
    updated_at: at(-4),
  },
  {
    id: "case-10",
    archive_no: "1402-044",
    case_no: "140268920009990011",
    title: "مطالبه وجه سفته — پرونده مختومه",
    case_type: "commercial",
    stage: "closed",
    status: "won",
    client_position: "plaintiff",
    subject: "مطالبه وجه سه فقره سفته واخواست‌شده",
    claim_value: 2_100_000_000,
    court_id: "court-1",
    court_branch: "شعبه ۷",
    judge_name: null,
    filed_at: onDay(-540),
    description: "حکم قطعی به نفع موکل صادر و محکومٌ‌به وصول شد.",
    ai_summary: "مختومه با وصول کامل. استدلال «استقلال تعهد سفته از منشأ» در گنجینه دانش ذخیره شد.",
    created_at: at(-540),
    updated_at: at(-120),
  },
];

export const demoParties: CaseParty[] = [
  { id: "p-1", case_id: "case-1", contact_id: "ct-1", role: "client", note: "مالک رسمی" },
  { id: "p-2", case_id: "case-1", contact_id: "ct-5", role: "opponent", note: "متصرف" },
  { id: "p-3", case_id: "case-2", contact_id: "ct-2", role: "client", note: "دارنده چک" },
  { id: "p-4", case_id: "case-2", contact_id: "ct-6", role: "opponent", note: "صادرکننده" },
  { id: "p-5", case_id: "case-2", contact_id: "ct-7", role: "opposing_counsel", note: null },
  { id: "p-6", case_id: "case-3", contact_id: "ct-4", role: "client", note: "خریدار" },
  { id: "p-7", case_id: "case-4", contact_id: "ct-1", role: "client", note: "متهم (دفاع)" },
  { id: "p-8", case_id: "case-4", contact_id: "ct-11", role: "opponent", note: "شاکی" },
  { id: "p-9", case_id: "case-5", contact_id: "ct-3", role: "client", note: "زوجه" },
  { id: "p-10", case_id: "case-6", contact_id: "ct-10", role: "client", note: "موجر" },
  { id: "p-11", case_id: "case-7", contact_id: "ct-2", role: "client", note: "مالک زمین" },
  { id: "p-12", case_id: "case-7", contact_id: "ct-6", role: "opponent", note: "سازنده" },
  { id: "p-13", case_id: "case-7", contact_id: "ct-7", role: "opposing_counsel", note: null },
  { id: "p-14", case_id: "case-8", contact_id: "ct-4", role: "client", note: "واخواه" },
  { id: "p-15", case_id: "case-9", contact_id: "ct-2", role: "client", note: "شاکی دیوان" },
];

export const demoHearings: Hearing[] = [
  { id: "h-1", case_id: "case-4", hearing_at: at(1, 10, 0), kind: "trial", location: "مجتمع قضایی قدس — شعبه ۱۰۲", notes: "اولین جلسه دادگاه؛ همراه داشتن اصل پیام‌های مکتوب و دو شاهد", result: null, status: "upcoming" },
  { id: "h-2", case_id: "case-1", hearing_at: at(6, 9, 30), kind: "trial", location: "مجتمع شهید بهشتی — شعبه ۱۲", notes: "رسیدگی پس از وصول نظر کارشناس ثبتی", result: null, status: "upcoming" },
  { id: "h-3", case_id: "case-5", hearing_at: at(13, 11, 0), kind: "trial", location: "مجتمع خانواده ۱ — شعبه ۲۶۸", notes: "رسیدگی به اعسار زوج — آماده‌سازی ایرادات به شهود اعسار", result: null, status: "upcoming" },
  { id: "h-4", case_id: "case-7", hearing_at: at(-9, 10, 0), kind: "expert_review", location: "محل پروژه ولنجک", notes: "بازدید کارشناس از پیشرفت فیزیکی", result: "نظریه: پیشرفت ۲۸٪ — تأخیر ۱۴ ماهه تأیید شد", status: "held" },
  { id: "h-5", case_id: "case-2", hearing_at: at(20, 9, 0), kind: "trial", location: "مجتمع شهید بهشتی — شعبه ۷", notes: null, result: null, status: "upcoming" },
  { id: "h-6", case_id: "case-1", hearing_at: at(-45, 10, 0), kind: "trial", location: "مجتمع شهید بهشتی — شعبه ۱۲", notes: null, result: "قرار ارجاع به کارشناس ثبتی صادر شد", status: "held" },
];

export const demoDeadlines: Deadline[] = [
  {
    id: "dl-1",
    case_id: "case-8",
    title: "ثبت واخواهی از حکم غیابی رفع تصرف",
    rule_code: "vakhahi_civil",
    citation: "ماده ۳۰۶ قانون آیین دادرسی مدنی",
    trigger_date: onDay(-9),
    is_abroad: false,
    due_at: onDay(12),
    status: "open",
    priority: "critical",
    notes: "ابلاغ واقعی انجام شده — پیش‌نویس واخواهی در حال تکمیل است",
    created_by: "agent",
  },
  {
    id: "dl-2",
    case_id: "case-7",
    title: "اعتراض به نظریه کارشناس (در صورت لزوم تکمیل)",
    rule_code: "expert_objection",
    citation: "ماده ۲۶۰ قانون آیین دادرسی مدنی",
    trigger_date: onDay(-5),
    is_abroad: false,
    due_at: onDay(2),
    status: "open",
    priority: "critical",
    notes: "نظریه به نفع ماست؛ صرفاً درخواست تکمیل بند خسارات بررسی شود",
    created_by: "agent",
  },
  {
    id: "dl-3",
    case_id: "case-3",
    title: "تقدیم لایحه تکمیلی تجدیدنظر",
    rule_code: null,
    citation: null,
    trigger_date: null,
    is_abroad: false,
    due_at: onDay(5),
    status: "open",
    priority: "high",
    notes: "پیوست: استعلام ثبتی جدید + گواهی دفترخانه",
    created_by: "user",
  },
  {
    id: "dl-4",
    case_id: "case-9",
    title: "پیگیری دستور موقت توقف تخریب",
    rule_code: null,
    citation: null,
    trigger_date: null,
    is_abroad: false,
    due_at: onDay(8),
    status: "open",
    priority: "high",
    notes: null,
    created_by: "user",
  },
  {
    id: "dl-5",
    case_id: "case-2",
    title: "ارائه اصل چک‌ها به شعبه پیش از جلسه",
    rule_code: null,
    citation: null,
    trigger_date: null,
    is_abroad: false,
    due_at: onDay(18),
    status: "open",
    priority: "normal",
    notes: null,
    created_by: "user",
  },
  {
    id: "dl-6",
    case_id: "case-1",
    title: "پرداخت دستمزد تکمیلی کارشناس",
    rule_code: null,
    citation: "ماده ۲۵۹ قانون آیین دادرسی مدنی",
    trigger_date: onDay(-12),
    is_abroad: false,
    due_at: onDay(-4),
    status: "done",
    priority: "high",
    notes: "پرداخت و فیش پیوست شد",
    created_by: "user",
  },
];

export const demoTasks: Task[] = [
  { id: "t-1", case_id: "case-4", title: "هماهنگی حضور دو شاهد برای جلسه فردا", due_on: onDay(0), status: "open", priority: "critical" },
  { id: "t-2", case_id: "case-8", title: "اخذ قبوض برق کشاورزی ده‌ساله از موکل", due_on: onDay(3), status: "open", priority: "high" },
  { id: "t-3", case_id: "case-6", title: "تنظیم درخواست دستور تخلیه برای شورا", due_on: onDay(4), status: "open", priority: "high" },
  { id: "t-4", case_id: null, title: "تمدید تمبر مالیاتی پروانه وکالت", due_on: onDay(15), status: "open", priority: "normal" },
  { id: "t-5", case_id: "case-5", title: "استعلام پلاک خودروی دوم زوج", due_on: onDay(-1), status: "done", priority: "normal" },
];

export const demoDocuments: LegalDocument[] = [
  {
    id: "doc-1",
    case_id: "case-1",
    title: "سند مالکیت تک‌برگ پلاک ۱۲۳/۴",
    doc_type: "evidence",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 412_000,
    pages: 2,
    extracted_text:
      "سند مالکیت شش‌دانگ یک قطعه زمین به پلاک ثبتی ۱۲۳ فرعی از ۴ اصلی بخش ۱۱ تهران به مساحت ۴۲۰ متر مربع به نام محمد رضایی...",
    ai_summary: "سند رسمی تک‌برگ مالکیت شش‌دانگ به نام موکل — مبنای دعوای خلع ید.",
    tags: ["سند رسمی", "مالکیت"],
    status: "ready",
    created_at: at(-200),
  },
  {
    id: "doc-2",
    case_id: "case-1",
    title: "نظریه کارشناس ثبتی",
    doc_type: "expert_opinion",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 880_000,
    pages: 6,
    extracted_text:
      "اینجانب کارشناس منتخب پس از معاینه محل و تطبیق حدود اربعه با سند، تصرف خوانده در ۸۵ متر مربع از ضلع شمالی پلاک موصوف را محرز می‌دانم. ارزش اجرت‌المثل ماهانه تصرف، مبلغ ۴۵٬۰۰۰٬۰۰۰ ریال برآورد می‌گردد...",
    ai_summary: "کارشناس تصرف ۸۵ متری خوانده را تأیید و اجرت‌المثل ماهانه را ۴۵ میلیون ریال برآورد کرده است.",
    tags: ["کارشناسی", "تصرف"],
    status: "ready",
    created_at: at(-20),
  },
  {
    id: "doc-3",
    case_id: "case-8",
    title: "دادنامه غیابی رفع تصرف + ابلاغیه",
    doc_type: "ruling",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 350_000,
    pages: 3,
    extracted_text:
      "دادنامه شماره ۱۴۰۴۶۸... دادگاه با احراز سبق تصرف خواهان و لحوق تصرف خوانده، مستنداً به مواد ۱۵۸ و ۱۶۱ قانون آیین دادرسی مدنی حکم به رفع تصرف عدوانی خوانده صادر می‌نماید. رأی صادره غیابی و ظرف بیست روز پس از ابلاغ قابل واخواهی در این دادگاه است...",
    ai_summary:
      "حکم غیابی رفع تصرف علیه موکل به استناد مواد ۱۵۸ و ۱۶۱ ق.آ.د.م. قابل واخواهی ظرف ۲۰ روز از ابلاغ واقعی.",
    tags: ["رأی غیابی", "تصرف عدوانی"],
    status: "ready",
    created_at: at(-9),
  },
  {
    id: "doc-4",
    case_id: "case-7",
    title: "قرارداد مشارکت در ساخت ولنجک",
    doc_type: "contract",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 1_240_000,
    pages: 14,
    extracted_text:
      "ماده ۸ — مدت اجرا: ۲۴ ماه از تاریخ تحویل زمین. ماده ۱۲ — در صورت تأخیر بیش از شش ماه از برنامه زمان‌بندی، مالک حق فسخ یک‌جانبه قرارداد را خواهد داشت. ماده ۱۴ — وجه التزام تأخیر روزانه ۵۰٬۰۰۰٬۰۰۰ ریال...",
    ai_summary:
      "قرارداد مشارکت با شرط فسخ صریح برای تأخیر +۶ ماه (ماده ۱۲) و وجه التزام روزانه (ماده ۱۴). نسبت تقسیم ۶۰/۴۰ به نفع مالک.",
    tags: ["مشارکت در ساخت", "شرط فسخ"],
    status: "ready",
    created_at: at(-275),
  },
  {
    id: "doc-5",
    case_id: "case-7",
    title: "نظریه کارشناسی پیشرفت فیزیکی",
    doc_type: "expert_opinion",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 2_100_000,
    pages: 11,
    extracted_text:
      "پیشرفت فیزیکی پروژه در زمان بازدید ۲۸ درصد برآورد می‌گردد که نسبت به برنامه زمان‌بندی پیوست قرارداد (۷۵٪) معادل ۱۴ ماه تأخیر است. علل تأخیر عمدتاً مدیریتی و تأمین مالی سازنده تشخیص داده شد...",
    ai_summary: "کارشناس: پیشرفت ۲۸٪، تأخیر ۱۴ ماه، علل عمدتاً منتسب به سازنده — مؤید حق فسخ.",
    tags: ["کارشناسی", "تأخیر"],
    status: "ready",
    created_at: at(-5),
  },
  {
    id: "doc-6",
    case_id: "case-2",
    title: "گواهی‌های عدم پرداخت چک‌ها",
    doc_type: "evidence",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 240_000,
    pages: 2,
    extracted_text:
      "گواهینامه عدم پرداخت — بانک ملت شعبه ولیعصر — چک شماره ۹۸۷۶۵۴ به مبلغ ۲٬۴۰۰٬۰۰۰٬۰۰۰ ریال به علت کسر موجودی برگشت گردید...",
    ai_summary: "دو گواهی عدم پرداخت معتبر با علت «کسر موجودی» — مبنای دعوا و خسارت تأخیر.",
    tags: ["چک", "گواهی عدم پرداخت"],
    status: "ready",
    created_at: at(-92),
  },
  {
    id: "doc-7",
    case_id: "case-4",
    title: "پرینت پیام‌های طرفین (ادله دفاع)",
    doc_type: "evidence",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 3_400_000,
    pages: 22,
    extracted_text:
      "— پیام شاکی ۱۴۰۳/۰۲/۱۴: «ماشین رو بابت طلبت بردار تا پولت جور بشه»... — پیام شاکی ۱۴۰۳/۰۴/۰۲: «اگه تا آخر ماه نفروختمش پسش میارم»...",
    ai_summary:
      "پیام‌های شاکی به تحویل خودرو «بابت طلب» تصریح دارد — ناقض ادعای سپردن امانی و مؤثر در رد عنصر روانی خیانت در امانت.",
    tags: ["پیام", "دفاع"],
    status: "ready",
    created_at: at(-60),
  },
  {
    id: "doc-8",
    case_id: "case-5",
    title: "دادخواست اعسار زوج",
    doc_type: "petition",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 310_000,
    pages: 3,
    extracted_text:
      "اینجانب به علت عدم تمکن مالی و نداشتن دارایی به جز مستثنیات دین، تقاضای پذیرش اعسار و تقسیط مهریه را دارم. شهود: ۱...",
    ai_summary: "اعسار با استناد به شهادت دو شاهد؛ تعارض با بیعانه ملک اخیر زوج قابل استناد است.",
    tags: ["اعسار", "مهریه"],
    status: "ready",
    created_at: at(-15),
  },
  {
    id: "doc-9",
    case_id: null,
    title: "ابلاغیه جدید ثنا — در انتظار بررسی",
    doc_type: "service_notice",
    storage_path: null,
    mime_type: "application/pdf",
    size_bytes: 95_000,
    pages: 1,
    extracted_text:
      "ابلاغیه — مهلت: وقت رسیدگی مورخ آتی شعبه ۷ ... خواهان شرکت بازرگانی پارس‌تجارت ... حضور به‌همراه اصول اسناد الزامی است.",
    ai_summary: null,
    tags: [],
    status: "processing",
    created_at: at(0, 8, 30),
  },
];

export const demoEvents: CaseEvent[] = [
  { id: "ev-1", case_id: "case-1", event_type: "filing", title: "ثبت دادخواست خلع ید", description: "از طریق دفتر خدمات الکترونیک قضایی شعبه ۱۸ تهران", event_date: at(-210), metadata: null },
  { id: "ev-2", case_id: "case-1", event_type: "hearing", title: "جلسه اول رسیدگی", description: "قرار ارجاع امر به کارشناس ثبتی صادر شد", event_date: at(-45, 10), metadata: null },
  { id: "ev-3", case_id: "case-1", event_type: "document", title: "وصول نظریه کارشناس", description: "تأیید تصرف ۸۵ متری + برآورد اجرت‌المثل", event_date: at(-20), metadata: null },
  { id: "ev-4", case_id: "case-1", event_type: "ai_analysis", title: "تحلیل هوشمند پرونده به‌روزرسانی شد", description: "ریسک ادعای اذن شفاهی شناسایی شد", event_date: at(-19), metadata: null },
  { id: "ev-5", case_id: "case-8", event_type: "service", title: "ابلاغ واقعی دادنامه غیابی", description: "مبدأ مهلت ۲۰ روزه واخواهی", event_date: at(-9), metadata: null },
  { id: "ev-6", case_id: "case-8", event_type: "deadline", title: "موعد واخواهی ثبت شد", description: "پیشنهاد ایجنت مواعد — تأیید وکیل", event_date: at(-9, 14), metadata: null },
  { id: "ev-7", case_id: "case-7", event_type: "hearing", title: "بازدید کارشناس از پروژه", description: null, event_date: at(-9, 10), metadata: null },
  { id: "ev-8", case_id: "case-7", event_type: "document", title: "وصول نظریه کارشناسی پیشرفت", description: "پیشرفت ۲۸٪ — تأخیر ۱۴ ماه", event_date: at(-5), metadata: null },
  { id: "ev-9", case_id: "case-2", event_type: "ruling", title: "صدور قرار تأمین خواسته", description: "توقیف حساب نزد بانک ملت اجرا شد", event_date: at(-70), metadata: null },
  { id: "ev-10", case_id: "case-4", event_type: "status_change", title: "صدور کیفرخواست و ارسال به دادگاه", description: "شعبه ۱۰۲ کیفری دو", event_date: at(-30), metadata: null },
  { id: "ev-11", case_id: "case-5", event_type: "submission", title: "ثبت دادخواست اعسار توسط زوج", description: "نوبت رسیدگی همزمان با ماهیت", event_date: at(-15), metadata: null },
  { id: "ev-12", case_id: "case-9", event_type: "filing", title: "ثبت شکایت در دیوان عدالت", description: "به انضمام درخواست دستور موقت", event_date: at(-40), metadata: null },
];

export const demoAnalyses: AiAnalysis[] = [
  {
    id: "an-1",
    case_id: "case-1",
    document_id: null,
    agent: "case_analyzer",
    kind: "case_analysis",
    title: "تحلیل جامع پرونده خلع ید",
    content_md:
      "## وضعیت پرونده\nدعوای خلع ید مبتنی بر **سند رسمی مالکیت** علیه متصرفی که هیچ مدرک مالکیت یا اذن کتبی ارائه نکرده است. نظریه کارشناس ثبتی، تصرف ۸۵ متر مربع از ضلع شمالی را تأیید کرده است.\n\n## ارکان دعوا\n۱. **مالکیت خواهان** — محرز با سند تک‌برگ [سند: سند مالکیت، ص ۱]\n۲. **تصرف خوانده** — محرز با نظریه کارشناس [سند: نظریه کارشناس، ص ۴]\n۳. **عدوانی بودن (عدم اذن)** — اماره از سکوت خوانده در برابر اظهارنامه\n\nمستند قانونی: مواد ۳۰۸ و ۳۱۱ قانون مدنی (غصب و رد عین).",
    structured: {
      risks: [
        { title: "ادعای اذن شفاهی", detail: "خوانده ممکن است به اذن شفاهی مالک قبلی استناد کند؛ پاسخ: انتقال رسمی مالکیت اذن سابق را زایل می‌کند و اثبات اذن با اوست.", severity: "medium", citation: "ماده ۳۰۸ ق.م" },
        { title: "تداخل با دیوارکشی مجاور", detail: "حدود اربعه در ضلع شمال‌غربی با ملک مجاور هم‌مرز است؛ نقشه‌برداری دقیق در اجرای حکم لازم می‌شود.", severity: "low" },
      ],
      weaknesses: [
        { title: "اجرت‌المثل از تاریخ نامعین", detail: "تاریخ شروع تصرف دقیقاً اثبات نشده — مطالبه اجرت‌المثل را از تاریخ اظهارنامه بخواهید تا محکم باشد.", severity: "medium" },
      ],
      opportunities: [
        { title: "قلع و قمع بنا", detail: "دیوارکشی غیرمجاز مشمول قلع و قمع است؛ در صورت اثبات، اهرم فشار قوی برای سازش است.", severity: "high", citation: "ماده ۳۱۳ ق.م" },
      ],
      suggested_articles: [
        { law: "قانون مدنی", article: "۳۰۸", why: "تعریف غصب — مبنای خلع ید" },
        { law: "قانون مدنی", article: "۳۱۱", why: "الزام غاصب به رد عین" },
        { law: "قانون مدنی", article: "۳۲۰", why: "اجرت‌المثل ایام تصرف" },
      ],
      next_steps: [
        "درخواست تعیین وقت رسیدگی پس از وصول نظریه",
        "آماده‌سازی پاسخ به اعتراض احتمالی خوانده به نظریه کارشناس",
        "محاسبه دقیق اجرت‌المثل از تاریخ ابلاغ اظهارنامه",
      ],
    },
    model: "claude-opus-4-8",
    created_at: at(-19),
  },
  {
    id: "an-2",
    case_id: "case-7",
    document_id: "doc-4",
    agent: "contract_agent",
    kind: "contract_review",
    title: "بررسی قرارداد مشارکت در ساخت",
    content_md:
      "## خلاصه قرارداد\nمشارکت در ساخت با نسبت ۶۰/۴۰ به نفع مالک، مدت ۲۴ ماه، همراه با **شرط فسخ صریح برای تأخیر بیش از ۶ ماه** (ماده ۱۲) و وجه التزام روزانه ۵۰ میلیون ریال (ماده ۱۴).\n\n## نقاط قوت برای موکل\n- شرط فسخ بدون نیاز به اثبات تقصیر — صرف تحقق تأخیر کافی است [سند: قرارداد، ماده ۱۲]\n- وجه التزام مستقل از خسارت واقعی قابل مطالبه است (ماده ۲۳۰ ق.م)\n\n## بندهای پرریسک\n- ماده ۱۷ داوری: ارجاع اختلاف به «داور مرضی‌الطرفین» بدون تعیین شخص — ریسک ایراد عدم صلاحیت دادگاه از سوی سازنده.",
    structured: {
      risks: [
        { title: "شرط داوری مبهم (ماده ۱۷)", detail: "سازنده می‌تواند ایراد داوری مطرح کند؛ پاسخ: عدم توافق بر شخص داور و رویه قضایی در بی‌اثری شرط داوری ناقص.", severity: "high" },
        { title: "ادعای فورس‌ماژور", detail: "تحریم مصالح به‌عنوان قوه قاهره؛ پاسخ: کارشناس علل تأخیر را «مدیریتی و مالی» دانسته است.", severity: "medium", citation: "ماده ۲۲۹ ق.م" },
      ],
      opportunities: [
        { title: "وجه التزام انباشته", detail: "۱۴ ماه تأخیر × ۵۰م ریال/روز — سقف قراردادی ندارد؛ اهرم سازش بسیار قوی.", severity: "high", citation: "ماده ۲۳۰ ق.م" },
      ],
      suggested_articles: [
        { law: "قانون مدنی", article: "۲۳۰", why: "اعتبار وجه التزام قراردادی" },
        { law: "قانون مدنی", article: "۲۲۹", why: "شرایط استناد به قوه قاهره" },
      ],
      next_steps: ["پاسخ کتبی به ایراد احتمالی داوری آماده شود", "محاسبه وجه التزام تا تاریخ فسخ ضمیمه لایحه شود"],
    },
    model: "claude-opus-4-8",
    created_at: at(-4),
  },
  {
    id: "an-3",
    case_id: "case-4",
    document_id: null,
    agent: "evidence_agent",
    kind: "evidence_review",
    title: "بررسی ادله — پرونده خیانت در امانت",
    content_md:
      "## نگاشت ادله به ارکان اتهام\n**رکن سپردن مال (عقد امانی):** دلیل شاکی فقط شهادت یک شاهد است؛ پیام‌های مکتوب خودِ شاکی به «تحویل بابت طلب» تصریح دارد [سند: پرینت پیام‌ها، ص ۳ و ۱۱] — تعارض مستقیم.\n\n**تناقض‌های شهادت شاهد:** در صورتجلسه دادسرا تاریخ تحویل را «اوایل اردیبهشت» و در برگه بعدی «اواخر خرداد» ذکر کرده است.\n\n## نتیجه\nبا تزلزل رکن امانت، استناد به اصل برائت (ماده ۴ ق.آ.د.ک) و تفسیر مضیق نصوص جزایی، دفاع قابل‌اتکاست.",
    structured: {
      missing_evidence: [
        { title: "استشهادیه همسایگان پارکینگ", detail: "برای اثبات نگهداری علنی خودرو (نافی سوءنیت) مفید است.", severity: "medium" },
      ],
      weaknesses: [
        { title: "عدم حضور موکل در یک جلسه دادسرا", detail: "ممکن است به‌عنوان قرینه فرار از پاسخ تفسیر شود — توضیح پزشکی ضمیمه شود.", severity: "low" },
      ],
      next_steps: ["اخذ استشهادیه", "تهیه جدول تطبیقی تناقض‌های شاهد برای جلسه"],
    },
    model: "claude-sonnet-4-6",
    created_at: at(-2),
  },
];

export const demoDrafts: Draft[] = [
  {
    id: "dr-1",
    case_id: "case-8",
    template_code: "vakhahi_petition",
    title: "دادخواست واخواهی — رفع تصرف عدوانی",
    doc_kind: "petition",
    content_md:
      "**واخواه:** علی محمدی، فرزند حسن، ساکن کرج\n**واخوانده:** [نام خواهان بدوی]\n**خواسته:** واخواهی نسبت به دادنامه شماره ۱۴۰۴۶۸… شعبه ۴ دادگاه عمومی حقوقی کرج و نقض آن\n\n**ریاست محترم شعبه چهارم دادگاه عمومی حقوقی کرج**\n\nبا سلام و احترام؛ در خصوص دادنامه غیابی صادره به شماره فوق که در تاریخ اخیر ابلاغ واقعی گردیده است، در مهلت قانونی مقرر در ماده ۳۰۶ قانون آیین دادرسی مدنی، مراتب واخواهی خود را به استحضار می‌رساند:\n\n**اولاً —** برخلاف ادعای واخوانده، موکل از ده سال قبل با اذن مالک وقت در زمین موضوع دعوا متصرف بوده و این سبق تصرف با شهادت شهود (همسایگان مجاور) و قبوض مصرف برق کشاورزی به نام موکل از سال ۱۳۹۴ قابل اثبات است؛ بنابراین رکن «لحوق تصرف» واخواه و «سبق تصرف» واخوانده منتفی است.\n\n**ثانیاً —** رسیدگی غیابی بدون استماع دفاعیات صورت گرفته و ادله واخوانده صرفاً استشهادیه‌ای است که شهود آن قابل جرح‌اند.\n\n**نتیجتاً** نقض دادنامه واخواسته و صدور حکم بر بطلان دعوای اولیه، مستنداً به مواد ۳۰۵ و ۳۰۶ قانون آیین دادرسی مدنی مورد استدعاست.\n\nبا احترام مجدد\nوکیل واخواه — دکتر مهدیه ایرانمنش",
    status: "draft",
    version: 2,
    created_at: at(-8),
    updated_at: at(-1),
  },
  {
    id: "dr-2",
    case_id: "case-5",
    template_code: "defense_brief",
    title: "لایحه پاسخ به دادخواست اعسار زوج",
    doc_kind: "brief",
    content_md:
      "**ریاست محترم شعبه ۲۶۸ دادگاه خانواده تهران**\n\nموضوع: پاسخ به دادخواست اعسار خوانده (زوج) از پرداخت مهریه\n\nبا سلام؛ در پاسخ به ادعای اعسار مطروحه، نکات زیر به استحضار می‌رسد:\n\n۱. خوانده در همین سال جاری مبادرت به پرداخت بیعانه خرید آپارتمان نموده است (پرینت حساب پیوست) — امری که با ادعای «نداشتن دارایی جز مستثنیات دین» در تعارض آشکار است.\n\n۲. شهود اعسار از بستگان درجه یک خوانده‌اند و طبق ماده ۱۳۱۳ قانون مدنی و رویه قضایی، شهادتشان مظنون به نفع است؛ جرح شهود به‌عمل خواهد آمد.\n\n۳. به موجب ماده ۷ قانون نحوه اجرای محکومیت‌های مالی، بار اثبات اعسار با مدعی آن است و صرف ادعا کافی نیست.\n\nرد دعوای اعسار و صدور حکم به پرداخت نقدی مهریه مورد استدعاست.",
    status: "draft",
    version: 1,
    created_at: at(-3),
    updated_at: at(-3),
  },
];

export const demoNotes: KnowledgeNote[] = [
  {
    id: "kn-1",
    kind: "argument",
    title: "استدلال خلع ید با سند عادی وقتی خوانده مدعی بیع است",
    content_md:
      "در پرونده ۱۳۹۸ شعبه ۵: وقتی خوانده دفاعِ «خریده‌ام» مطرح کرد، به جای ورود به اصالت قولنامه او، بر **تفکیک دعوای مالکیت از دعوای تصرف** تمرکز کردیم: مادام که انتقال رسمی اثبات نشده، مالکیت رسمی خواهان معتبر است (مواد ۲۲ و ۴۸ قانون ثبت). دادگاه پذیرفت و خوانده را به طرح دعوای مستقل اثبات وقوع بیع هدایت کرد. ✅ این چارچوب در سه پرونده بعدی هم جواب داد.",
    tags: ["خلع ید", "سند رسمی", "ماده ۲۲ ثبت"],
    case_id: null,
    judge_contact_id: null,
    outcome: "won",
    created_at: at(-500),
  },
  {
    id: "kn-2",
    kind: "experience",
    title: "رویه قاضی موسوی (شعبه ۱۲) در ادله",
    content_md:
      "قاضی موسوی به ادله **کتبی** وزن بالا می‌دهد و به شهادت بدون قرینه مکتوب کم‌اعتناست. لوایح کوتاه با فهرست مستندات شماره‌گذاری‌شده را می‌پسندد. در پرونده‌های کارشناسی، تقریباً همیشه به نظریه کارشناس عمل می‌کند مگر اعتراض با ایراد فنی مشخص همراه باشد — اعتراض کلی را رد می‌کند.",
    tags: ["قاضی موسوی", "شعبه ۱۲", "رویه"],
    case_id: null,
    judge_contact_id: "ct-8",
    outcome: "na",
    created_at: at(-150),
  },
  {
    id: "kn-3",
    kind: "precedent",
    title: "وحدت رویه — مطالبه وجه چک از ظهرنویس",
    content_md:
      "برای حفظ حق رجوع به ظهرنویس: ارائه چک ظرف ۱۵ روز (ماده ۳۱۵ ق.ت) + طرح دعوا ظرف یک سال از واخواست. در پرونده ۱۴۰۲ همین نکته باعث شد دعوای همکار علیه ظهرنویس رد شود — همیشه تاریخ صدور تا ارائه را اول چک کن.",
    tags: ["چک", "ظهرنویس", "مواعد تجاری"],
    case_id: null,
    judge_contact_id: null,
    outcome: "na",
    created_at: at(-300),
  },
  {
    id: "kn-4",
    kind: "argument",
    title: "پاسخ به ایراد داوریِ شرط داوری ناقص",
    content_md:
      "وقتی شرط داوری «داور مرضی‌الطرفین» بدون تعیین شخص یا آیین تعیین است: استدلال موفق — شرط داوری به نحو کمال منعقد نشده و با عدم تراضی بعدی بر داور، رجوع به دادگاه بلامانع است (مفهوم مواد ۴۵۵ و ۴۵۹ ق.آ.د.م). شعبه ۱۲ پذیرفت (۱۴۰۳).",
    tags: ["داوری", "ایراد", "مشارکت در ساخت"],
    case_id: "case-7",
    judge_contact_id: null,
    outcome: "won",
    created_at: at(-80),
  },
  {
    id: "kn-5",
    kind: "snippet",
    title: "الگوی استناد به اصل برائت در دفاع کیفری",
    content_md:
      "«نظر به اینکه به موجب اصل ۳۷ قانون اساسی و ماده ۴ قانون آیین دادرسی کیفری، اصل بر برائت است و هرگونه شک در تحقق ارکان بزه باید به نفع متهم تفسیر گردد؛ و نظر به اینکه رکن [مادی/روانی] بزه انتسابی به شرح آتی مخدوش است…»",
    tags: ["کیفری", "اصل برائت", "الگو"],
    case_id: null,
    judge_contact_id: null,
    outcome: "na",
    created_at: at(-200),
  },
  {
    id: "kn-6",
    kind: "experience",
    title: "دستور تخلیه شورا — مدارک حیاتی",
    content_md:
      "برای دستور تخلیه قانون ۷۶: قرارداد با **دو شاهد** + قید مدت + درخواست پس از انقضا. اگر ودیعه نزد موجر است، آمادگی تودیع همزمان الزامی است وگرنه دستور اجرا نمی‌شود. دفتر شورا به کپی برابر اصل شناسنامه مالکیت حساس است.",
    tags: ["تخلیه", "شورای حل اختلاف", "قانون ۷۶"],
    case_id: "case-6",
    judge_contact_id: null,
    outcome: "na",
    created_at: at(-20),
  },
];

export const demoNotifications: AppNotification[] = [
  { id: "nt-1", kind: "deadline_upcoming", title: "موعد بحرانی: اعتراض به نظریه کارشناس", body: "پرونده مشارکت ولنجک — ۲ روز باقی مانده", link: "/cases/case-7", read_at: null, created_at: at(0, 7) },
  { id: "nt-2", kind: "hearing_upcoming", title: "جلسه فردا ساعت ۱۰:۰۰", body: "دفاع کیفری آقای رضایی — شعبه ۱۰۲ مجتمع قدس", link: "/cases/case-4", read_at: null, created_at: at(0, 7) },
  { id: "nt-3", kind: "document_ready", title: "پردازش سند تکمیل شد", body: "نظریه کارشناسی پیشرفت فیزیکی — خلاصه و برچسب‌ها آماده است", link: "/documents", read_at: at(-1), created_at: at(-4) },
  { id: "nt-4", kind: "agent_done", title: "تحلیل ادله آماده شد", body: "ایجنت ادله ۲ تناقض در شهادت شاهد یافت", link: "/cases/case-4", read_at: null, created_at: at(-2) },
];

export const demoConversations: AiConversation[] = [
  { id: "cv-1", case_id: "case-8", agent: "orchestrator", title: "مهلت واخواهی پرونده کرج", created_at: at(-9, 14) },
  { id: "cv-2", case_id: null, agent: "research_agent", title: "تفاوت خلع ید و تصرف عدوانی", created_at: at(-12) },
];

export const demoMessages: AiMessage[] = [
  {
    id: "m-1",
    conversation_id: "cv-1",
    role: "user",
    content: "دادنامه غیابی رفع تصرف امروز ابلاغ واقعی شد. مهلت واخواهی را حساب و ثبت کن.",
    agent: null,
    citations: [],
    created_at: at(-9, 14, 0),
  },
  {
    id: "m-2",
    conversation_id: "cv-1",
    role: "assistant",
    content:
      "بر اساس دادنامه غیابی پرونده «رفع تصرف عدوانی کرج»، مهلت واخواهی برای مقیم ایران **۲۰ روز از تاریخ ابلاغ واقعی** است [ماده ۳۰۶ ق.آ.د.م]. با مبدأ امروز و احتساب نشدن روز ابلاغ و روز اقدام [ماده ۴۴۵ ق.آ.د.م]، آخرین روز ثبت واخواهی محاسبه و به‌صورت پیشنهاد موعد ثبت شد — لطفاً تأیید کنید.\n\nپیشنهاد بعدی: پیش‌نویس دادخواست واخواهی را بر مبنای دفاع «سبق تصرف ده‌ساله با اذن مالک وقت» آماده کنم؟",
    agent: "deadline_agent",
    citations: [
      { kind: "rule", id: "vakhahi_civil", label: "ماده ۳۰۶ ق.آ.د.م" },
      { kind: "document", id: "doc-3", label: "دادنامه غیابی", locator: "ص ۳" },
    ],
    created_at: at(-9, 14, 1),
  },
  {
    id: "m-3",
    conversation_id: "cv-2",
    role: "user",
    content: "فرق دعوای خلع ید با رفع تصرف عدوانی را با ماده بگو — کدام برای موکلی که سند رسمی دارد بهتر است؟",
    agent: null,
    citations: [],
    created_at: at(-12),
  },
  {
    id: "m-4",
    conversation_id: "cv-2",
    role: "assistant",
    content:
      "**خلع ید** دعوای مالکانه است: مبنای آن اثبات مالکیت است و رسیدگی ماهوی کامل دارد [ماده ۳۰۸ ق.م — غصب] و خواهان باید مالکیت (معمولاً سند رسمی) را اثبات کند.\n\n**رفع تصرف عدوانی** دعوای تصرف‌محور است: فقط «سبق تصرف خواهان + لحوق تصرف خوانده + عدوانی بودن» بررسی می‌شود و به مالکیت کاری ندارد [مواد ۱۵۸ و ۱۶۱ ق.آ.د.م]؛ در عوض رسیدگی خارج از نوبت و اجرای فوری دارد [ماده ۱۷۵ ق.آ.د.م].\n\n**برای موکل دارای سند رسمی:** اگر تصرف خوانده تازه است و سرعت می‌خواهید، تصرف عدوانی سریع‌تر است؛ اما اگر خوانده ادعای حقی بر ملک دارد، خلع ید نتیجه را قطعی‌تر می‌کند چون مالکیت را مستقیماً به کرسی می‌نشاند. ترکیب رایج: ابتدا تصرف عدوانی برای اعاده فوری، سپس تثبیت با دعوای مالکانه در صورت نیاز.",
    agent: "research_agent",
    citations: [
      { kind: "article", id: "civil_code:308", label: "ماده ۳۰۸ ق.م" },
      { kind: "article", id: "civil_procedure:158", label: "ماده ۱۵۸ ق.آ.د.م" },
      { kind: "article", id: "civil_procedure:175", label: "ماده ۱۷۵ ق.آ.د.م" },
    ],
    created_at: at(-12, 0, 2),
  },
];
