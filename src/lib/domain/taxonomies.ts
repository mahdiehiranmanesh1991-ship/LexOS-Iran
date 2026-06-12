import type {
  AgentCode,
  AnalysisKind,
  CaseStage,
  CaseStatus,
  CaseType,
  ClientPosition,
  ContactKind,
  CourtKind,
  DeadlinePriority,
  DeadlineStatus,
  DocStatus,
  DocType,
  DraftKind,
  EventType,
  HearingKind,
  HearingStatus,
  NoteKind,
  PartyRole,
} from "./types";

/** Persian labels for every domain vocabulary — the UI's single dictionary. */

export const CASE_TYPE_FA: Record<CaseType, string> = {
  civil: "حقوقی",
  property: "ملکی",
  criminal: "کیفری",
  family: "خانواده",
  commercial: "تجاری",
  administrative: "اداری",
};

export const CASE_STAGE_FA: Record<CaseStage, string> = {
  pre_filing: "پیش از طرح دعوا",
  first_instance: "بدوی",
  vakhahi: "واخواهی",
  appeal: "تجدیدنظر",
  cassation: "فرجام",
  enforcement: "اجرای حکم",
  closed: "مختومه",
};

export const CASE_STATUS_FA: Record<CaseStatus, string> = {
  active: "جاری",
  won: "مختومه — به نفع موکل",
  lost: "مختومه — علیه موکل",
  settled: "سازش",
  suspended: "معلق",
  closed: "مختومه",
};

export const CLIENT_POSITION_FA: Record<ClientPosition, string> = {
  plaintiff: "خواهان",
  defendant: "خوانده",
  complainant: "شاکی",
  accused: "متهم",
  appellant: "تجدیدنظرخواه",
  respondent: "تجدیدنظرخوانده",
  third_party: "ثالث",
};

export const PARTY_ROLE_FA: Record<PartyRole, string> = {
  client: "موکل",
  opponent: "طرف مقابل",
  opposing_counsel: "وکیل طرف مقابل",
  co_counsel: "وکیل همکار",
  third_party: "شخص ثالث",
};

export const CONTACT_KIND_FA: Record<ContactKind, string> = {
  client: "موکل",
  opponent: "طرف مقابل",
  opposing_counsel: "وکیل",
  judge: "قاضی",
  expert: "کارشناس",
  other: "سایر",
};

export const COURT_KIND_FA: Record<CourtKind, string> = {
  dispute_council: "شورای حل اختلاف",
  civil: "دادگاه عمومی حقوقی",
  family: "دادگاه خانواده",
  criminal_1: "دادگاه کیفری یک",
  criminal_2: "دادگاه کیفری دو",
  revolutionary: "دادگاه انقلاب",
  prosecutor: "دادسرا",
  appeal: "دادگاه تجدیدنظر",
  supreme: "دیوان عالی کشور",
  admin_justice: "دیوان عدالت اداری",
  enforcement: "اجرای احکام",
};

export const HEARING_KIND_FA: Record<HearingKind, string> = {
  trial: "جلسه رسیدگی",
  investigation: "جلسه تحقیقات",
  expert_review: "کارشناسی",
  mediation: "سازش",
  other: "سایر",
};

export const HEARING_STATUS_FA: Record<HearingStatus, string> = {
  upcoming: "پیش رو",
  held: "برگزار شد",
  postponed: "تجدید شد",
  cancelled: "لغو شد",
};

export const DEADLINE_STATUS_FA: Record<DeadlineStatus, string> = {
  open: "باز",
  done: "انجام شد",
  missed: "از دست رفته",
  cancelled: "لغو شد",
};

export const PRIORITY_FA: Record<DeadlinePriority, string> = {
  critical: "بحرانی",
  high: "مهم",
  normal: "عادی",
};

export const DOC_TYPE_FA: Record<DocType, string> = {
  petition: "دادخواست",
  brief: "لایحه",
  ruling: "دادنامه",
  service_notice: "ابلاغیه",
  contract: "قرارداد",
  poa: "وکالت‌نامه",
  evidence: "دلیل / مدرک",
  expert_opinion: "نظریه کارشناسی",
  correspondence: "مکاتبات",
  other: "سایر",
};

export const DOC_STATUS_FA: Record<DocStatus, string> = {
  pending: "در صف پردازش",
  processing: "در حال پردازش",
  ready: "آماده",
  failed: "خطا در پردازش",
};

export const EVENT_TYPE_FA: Record<EventType, string> = {
  filing: "ثبت دادخواست",
  hearing: "جلسه دادرسی",
  ruling: "صدور رأی",
  service: "ابلاغ",
  submission: "تقدیم لایحه",
  status_change: "تغییر وضعیت",
  document: "سند",
  deadline: "موعد",
  ai_analysis: "تحلیل هوشمند",
  draft: "پیش‌نویس",
  note: "یادداشت",
};

export const AGENT_FA: Record<AgentCode, { name: string; short: string; description: string }> = {
  orchestrator: {
    name: "دستیار حقوقی",
    short: "دستیار",
    description: "پرسش شما را تحلیل و به ایجنت متخصص مناسب می‌سپارد",
  },
  case_analyzer: {
    name: "تحلیلگر پرونده",
    short: "تحلیلگر",
    description: "بررسی کامل پرونده: وضعیت، ریسک‌ها، نقاط ضعف و فرصت‌ها",
  },
  deadline_agent: {
    name: "ایجنت مواعد",
    short: "مواعد",
    description: "شناسایی مهلت‌های قانونی از متن ابلاغیه‌ها و پیشنهاد موعد با استناد",
  },
  contract_agent: {
    name: "ایجنت قرارداد",
    short: "قرارداد",
    description: "تحلیل بندها، تعهدات و ریسک‌های قراردادی",
  },
  property_agent: {
    name: "ایجنت املاک",
    short: "املاک",
    description: "متخصص دعاوی ملکی: خلع ید، تخلیه، الزام به تنظیم سند و …",
  },
  strategy_agent: {
    name: "استراتژیست دعوا",
    short: "استراتژی",
    description: "پیش‌بینی ایرادات شکلی، ادله ناقص، استدلال‌ها و مواد قابل استناد",
  },
  evidence_agent: {
    name: "ایجنت ادله",
    short: "ادله",
    description: "موجودی ادله هر ادعا، تطبیق با ادله اثبات دعوا و یافتن تناقض‌ها",
  },
  research_agent: {
    name: "پژوهشگر حقوقی",
    short: "پژوهش",
    description: "پاسخ مستند از مواد قانونی و گنجینه دانش شما",
  },
  drafting_agent: {
    name: "ایجنت نگارش",
    short: "نگارش",
    description: "تهیه پیش‌نویس دادخواست، لایحه، شکواییه و قرارداد",
  },
};

export const ANALYSIS_KIND_FA: Record<AnalysisKind, string> = {
  case_analysis: "تحلیل پرونده",
  contract_review: "بررسی قرارداد",
  strategy: "استراتژی دعوا",
  evidence_review: "بررسی ادله",
  hearing_prep: "آماده‌سازی جلسه",
  property_analysis: "تحلیل ملکی",
  document_summary: "خلاصه سند",
};

export const NOTE_KIND_FA: Record<NoteKind, string> = {
  experience: "تجربه دادگاه",
  argument: "استدلال",
  precedent: "رویه قضایی",
  note: "یادداشت",
  snippet: "الگوی متن",
};

export const DRAFT_KIND_FA: Record<DraftKind, string> = {
  petition: "دادخواست",
  brief: "لایحه",
  appeal: "تجدیدنظرخواهی",
  complaint: "شکواییه",
  notice: "اظهارنامه",
  contract: "قرارداد",
};

export const LAW_CODE_FA: Record<string, string> = {
  civil_code: "قانون مدنی",
  civil_procedure: "قانون آیین دادرسی مدنی",
  criminal_procedure: "قانون آیین دادرسی کیفری",
  islamic_penal: "قانون مجازات اسلامی",
  commerce: "قانون تجارت",
  cheque_law: "قانون صدور چک",
  landlord_tenant_56: "قانون روابط موجر و مستأجر ۱۳۵۶",
  landlord_tenant_76: "قانون روابط موجر و مستأجر ۱۳۷۶",
  family_protection: "قانون حمایت خانواده",
  admin_justice: "قانون دیوان عدالت اداری",
  enforcement_civil: "قانون اجرای احکام مدنی",
  registration: "قانون ثبت اسناد و املاک",
  constitution: "قانون اساسی",
  unification_rulings: "آرای وحدت رویه",
};
