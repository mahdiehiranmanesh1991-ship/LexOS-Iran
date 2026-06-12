import { addDays, faNum, formatJalaliNumeric, isFriday, toISODate } from "@/lib/jalali";
import type { DeadlineRule } from "./types";

/**
 * مواعد قانونی — the procedural deadline rule table and the deterministic
 * computation engine. LLM agents may PROPOSE (rule, trigger) pairs; only this
 * module computes dates. See docs/10-LEGAL-DOMAIN-MODEL.md.
 *
 * Statutory computation (ق.آ.د.م):
 *  - ماده ۴۴۳: procedural month = 30 days → all rules are day counts.
 *  - ماده ۴۴۵: the day of service and the day of action are excluded
 *    → due = trigger + days + 1 (the familiar «ابلاغ ۱ فروردین، مهلت تا پایان ۲۱» for 20-day rules).
 *  - ماده ۴۴۴: a due date falling on an official holiday rolls forward.
 *    MVP rolls Fridays → Saturday; the full holiday calendar is an M1 item
 *    and this limitation is surfaced in the UI.
 */

export const DEADLINE_RULES: DeadlineRule[] = [
  {
    code: "vakhahi_civil",
    title_fa: "واخواهی از حکم غیابی حقوقی",
    citation: "ماده ۳۰۶ قانون آیین دادرسی مدنی",
    days_inside: 20,
    days_abroad: 60,
    category: "civil",
    description_fa:
      "محکومٌ‌علیه غایب می‌تواند ظرف بیست روز از ابلاغ واقعی (و برای مقیمان خارج دو ماه) به حکم غیابی اعتراض کند.",
  },
  {
    code: "appeal_civil",
    title_fa: "تجدیدنظرخواهی حقوقی",
    citation: "ماده ۳۳۶ قانون آیین دادرسی مدنی",
    days_inside: 20,
    days_abroad: 60,
    category: "civil",
    description_fa:
      "مهلت تجدیدنظرخواهی برای اشخاص مقیم ایران بیست روز و برای اشخاص مقیم خارج دو ماه از تاریخ ابلاغ یا انقضای مهلت واخواهی است.",
  },
  {
    code: "cassation_civil",
    title_fa: "فرجام‌خواهی",
    citation: "ماده ۳۹۷ قانون آیین دادرسی مدنی",
    days_inside: 20,
    days_abroad: 60,
    category: "civil",
    description_fa:
      "مهلت فرجام‌خواهی بیست روز (مقیم ایران) و دو ماه (مقیم خارج) از تاریخ ابلاغ رأی یا انقضای مهلت تجدیدنظر است.",
  },
  {
    code: "retrial_civil",
    title_fa: "اعاده دادرسی حقوقی",
    citation: "مواد ۴۲۷ و ۴۲۸ قانون آیین دادرسی مدنی",
    days_inside: 20,
    days_abroad: 60,
    category: "civil",
    description_fa:
      "مهلت درخواست اعاده دادرسی بیست روز / دو ماه است؛ مبدأ بسته به جهت اعاده (ابلاغ رأی، اثبات جعل، وصول اسناد مکتوم و …) متفاوت است.",
  },
  {
    code: "arbitration_objection",
    title_fa: "اعتراض به رأی داور",
    citation: "ماده ۴۹۰ قانون آیین دادرسی مدنی",
    days_inside: 20,
    days_abroad: 60,
    category: "civil",
    description_fa:
      "درخواست ابطال رأی داوری ظرف بیست روز از ابلاغ (دو ماه برای مقیم خارج) به دادگاه ارجاع‌کننده یا صالح تقدیم می‌شود.",
  },
  {
    code: "cure_defect",
    title_fa: "رفع نقص دادخواست",
    citation: "ماده ۵۴ قانون آیین دادرسی مدنی",
    days_inside: 10,
    days_abroad: 10,
    category: "civil",
    description_fa: "خواهان ظرف ده روز از ابلاغ اخطار رفع نقص باید نواقص دادخواست را برطرف کند.",
  },
  {
    code: "clerk_rejection_objection",
    title_fa: "اعتراض به قرار رد دادخواست دفتر",
    citation: "ماده ۵۴ قانون آیین دادرسی مدنی",
    days_inside: 10,
    days_abroad: 10,
    category: "civil",
    description_fa: "قرار رد دادخواست صادره از دفتر ظرف ده روز از ابلاغ قابل شکایت در همان دادگاه است.",
  },
  {
    code: "expert_objection",
    title_fa: "اعتراض به نظریه کارشناس",
    citation: "ماده ۲۶۰ قانون آیین دادرسی مدنی",
    days_inside: 7,
    days_abroad: 7,
    category: "civil",
    description_fa: "طرفین ظرف یک هفته از ابلاغ وصول نظریه کارشناس می‌توانند به آن اعتراض کنند.",
  },
  {
    code: "appeal_criminal",
    title_fa: "تجدیدنظر / فرجام کیفری",
    citation: "ماده ۴۳۱ قانون آیین دادرسی کیفری",
    days_inside: 20,
    days_abroad: 60,
    category: "criminal",
    description_fa:
      "مهلت درخواست تجدیدنظر یا فرجام آرای کیفری بیست روز از ابلاغ و برای مقیمان خارج دو ماه است.",
  },
  {
    code: "prosecutor_order_objection",
    title_fa: "اعتراض به قرار منع / موقوفی تعقیب",
    citation: "مواد ۲۷۰ و ۲۷۱ قانون آیین دادرسی کیفری",
    days_inside: 10,
    days_abroad: 30,
    category: "criminal",
    description_fa:
      "شاکی ظرف ده روز (مقیم خارج یک ماه) از ابلاغ می‌تواند به قرارهای قابل اعتراض دادسرا اعتراض کند.",
  },
  {
    code: "admin_justice_complaint",
    title_fa: "شکایت از آرای قطعی مراجع اختصاصی در دیوان عدالت",
    citation: "ماده ۱۶ قانون تشکیلات و آیین دادرسی دیوان عدالت اداری",
    days_inside: 90,
    days_abroad: 180,
    category: "admin",
    description_fa:
      "مهلت تقدیم شکایت از آرای قطعی مراجعی مانند کمیسیون ماده ۱۰۰ و هیأت‌های حل اختلاف کار، سه ماه (مقیم خارج شش ماه) از ابلاغ است.",
  },
  {
    code: "admin_justice_appeal",
    title_fa: "تجدیدنظر از آرای شعب بدوی دیوان عدالت",
    citation: "ماده ۶۵ قانون تشکیلات و آیین دادرسی دیوان عدالت اداری",
    days_inside: 20,
    days_abroad: 60,
    category: "admin",
    description_fa: "آرای شعب بدوی دیوان ظرف بیست روز از ابلاغ قابل تجدیدنظر در شعب تجدیدنظر دیوان است.",
  },
  {
    code: "enforcement_compliance",
    title_fa: "اجرای مفاد اجراییه",
    citation: "ماده ۳۴ قانون اجرای احکام مدنی",
    days_inside: 10,
    days_abroad: 10,
    category: "civil",
    description_fa:
      "محکومٌ‌علیه ظرف ده روز از ابلاغ اجراییه باید مفاد آن را اجرا کند یا ترتیب پرداخت دهد یا مالی معرفی کند.",
  },
  {
    code: "registration_objection",
    title_fa: "اعتراض به ثبت ملک",
    citation: "ماده ۱۶ قانون ثبت اسناد و املاک",
    days_inside: 90,
    days_abroad: 90,
    category: "registration",
    description_fa: "اعتراض به درخواست ثبت ظرف ۹۰ روز از انتشار اولین آگهی نوبتی پذیرفته می‌شود.",
  },
  {
    code: "boundary_objection",
    title_fa: "اعتراض به تحدید حدود",
    citation: "ماده ۲۰ قانون ثبت اسناد و املاک",
    days_inside: 30,
    days_abroad: 30,
    category: "registration",
    description_fa: "مجاوران ظرف سی روز از تنظیم صورت‌مجلس تحدید حدود حق اعتراض دارند.",
  },
  {
    code: "cheque_criminal_complaint",
    title_fa: "شکایت کیفری چک بلامحل",
    citation: "ماده ۱۱ قانون صدور چک",
    days_inside: 180,
    days_abroad: 180,
    category: "commercial",
    description_fa:
      "دارنده باید ظرف شش ماه از تاریخ صدور چک گواهی عدم پرداخت بگیرد و ظرف شش ماه از گواهی، شکایت کیفری کند. (مبدأ این موعد را تاریخ گواهی عدم پرداخت قرار دهید.)",
  },
  {
    code: "cheque_presentment",
    title_fa: "ارائه چک به بانک (حفظ حق رجوع به ظهرنویس)",
    citation: "ماده ۳۱۵ قانون تجارت",
    days_inside: 15,
    days_abroad: 45,
    category: "commercial",
    description_fa:
      "چک باید ظرف ۱۵ روز از صدور (و اگر در شهر دیگری صادر شده ۴۵ روز) مطالبه شود تا حق رجوع به ظهرنویس محفوظ بماند.",
  },
  {
    code: "note_protest",
    title_fa: "واخواست سفته / برات",
    citation: "ماده ۲۸۰ قانون تجارت",
    days_inside: 10,
    days_abroad: 10,
    category: "commercial",
    description_fa: "اعتراض عدم تأدیه باید ظرف ده روز از سررسید به عمل آید.",
  },
  {
    code: "divorce_certificate_validity",
    title_fa: "اعتبار گواهی عدم امکان سازش",
    citation: "ماده ۳۴ قانون حمایت خانواده ۱۳۹۱",
    days_inside: 90,
    days_abroad: 90,
    category: "family",
    description_fa:
      "گواهی عدم امکان سازش سه ماه از ابلاغ رأی قطعی اعتبار دارد و باید در این مهلت به دفترخانه ارائه شود.",
  },
];

export function getRule(code: string): DeadlineRule | undefined {
  return DEADLINE_RULES.find((r) => r.code === code);
}

export interface DeadlineComputation {
  rule: DeadlineRule;
  triggerDate: Date;
  isAbroad: boolean;
  days: number;
  dueDate: Date;
  dueISO: string;
  rolledForHoliday: boolean;
  /** Human-verifiable explanation shown next to every computed deadline. */
  explanationFa: string;
}

/**
 * Deterministic deadline computation.
 * due = trigger + days + 1 (روز ابلاغ و روز اقدام محاسبه نمی‌شود — ماده ۴۴۵)
 * then roll Friday → Saturday (ماده ۴۴۴, MVP approximation).
 */
export function computeDeadline(
  ruleCode: string,
  triggerDate: Date,
  isAbroad = false,
): DeadlineComputation {
  const rule = getRule(ruleCode);
  if (!rule) throw new Error(`Unknown deadline rule: ${ruleCode}`);

  const days = isAbroad ? rule.days_abroad : rule.days_inside;
  let dueDate = addDays(triggerDate, days + 1);
  let rolled = false;
  while (isFriday(dueDate)) {
    dueDate = addDays(dueDate, 1);
    rolled = true;
  }

  const explanationFa =
    `${rule.title_fa}: ${faNum(days)} روز از تاریخ ابلاغ ${formatJalaliNumeric(triggerDate)} ` +
    `(${rule.citation}؛ روز ابلاغ و روز اقدام طبق ماده ۴۴۵ ق.آ.د.م محاسبه نشده است${
      rolled ? "؛ روز جمعه به روز بعد منتقل شد" : ""
    }) ← آخرین روز: ${formatJalaliNumeric(dueDate)}`;

  return {
    rule,
    triggerDate,
    isAbroad,
    days,
    dueDate,
    dueISO: toISODate(dueDate),
    rolledForHoliday: rolled,
    explanationFa,
  };
}

/** Urgency bucket used across dashboard/calendar for color coding. */
export function deadlineUrgency(daysLeft: number): "overdue" | "critical" | "soon" | "ok" {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "critical";
  if (daysLeft <= 7) return "soon";
  return "ok";
}
