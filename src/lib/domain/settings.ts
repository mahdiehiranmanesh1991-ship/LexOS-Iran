/**
 * Settings domain — the typed model behind the lawyer control center
 * (docs/11-SETTINGS-ARCHITECTURE.md). All persisted settings live in
 * profiles.settings (jsonb); ancillary records (sessions, audit, brain
 * sources, custom templates) live in their own tables. Persian labels here
 * are the single dictionary the Settings UI renders from.
 */

/* ───────────────────────── enums ───────────────────────── */

export type BarRank = "paye1" | "paye2" | "karamuz";
export type OfficeType = "solo" | "firm" | "institute";
export type PleadingStyle =
  | "formal_traditional"
  | "modern_concise"
  | "detailed_academic"
  | "judicial_strict";
export type DraftingTone = "formal" | "assertive" | "conciliatory" | "persuasive" | "neutral";
export type CitationStyle = "full" | "short" | "inline" | "footnote";
export type PrecedentPreference =
  | "vahdat_rovieh_first"
  | "higher_court_first"
  | "recent_first"
  | "balanced"
  | "none";
export type Numbering = "persian_words" | "persian_digits" | "abjad";
export type PlanTier = "free" | "pro" | "firm" | "enterprise";
export type TwoFAMethod = "none" | "totp" | "sms";
export type HolidayCalendar = "friday_only" | "official_iran";
export type ModelTierPref = "economical" | "balanced" | "max_quality";

/* ───────────────────────── settings shape ───────────────────────── */

export interface AppSettings {
  profile: {
    display_name: string;
    headline: string;
    bio: string;
    avatar_color: string;
    locale: "fa-IR";
  };
  license: {
    bar_type: "kanoon" | "markaz" | "";
    license_no: string;
    rank: BarRank | "";
    issue_year: string;
    province: string;
    kanoon_name: string;
    specialties: string[];
  };
  office: {
    name: string;
    type: OfficeType;
    phone: string;
    email: string;
    website: string;
    address: string;
    city: string;
    colleagues: number;
    accent_color: string;
  };
  ai: {
    primary_provider: "anthropic" | "openai" | "google";
    model_tier: ModelTierPref;
    temperature: number; // 0..1
    require_citations: boolean;
    jurisdiction_lock: boolean;
    refuse_without_source: boolean;
    stream_thoughts: boolean;
  };
  knowledge: {
    enabled_laws: string[]; // law_code list
    prefer_unification_rulings: boolean;
    auto_cite_articles: boolean;
    allow_personal_vault: boolean;
    allow_web: boolean; // roadmap; off by default
  };
  drafting: {
    pleading_style: PleadingStyle;
    tone: DraftingTone;
    citation_style: CitationStyle;
    precedent_preference: PrecedentPreference;
    numbering: Numbering;
    honorifics: boolean;
    signature_block: string;
  };
  brain: {
    enabled: boolean;
    learn_style: boolean;
    learn_reasoning: boolean;
    learn_citations: boolean;
    apply_to_drafts: boolean;
  };
  deadlines: {
    auto_compute: boolean;
    default_abroad: boolean;
    holiday_calendar: HolidayCalendar;
    reminder_offsets: number[]; // days before
    safety_buffer_days: number;
    block_friday: boolean;
  };
  notifications: {
    channel_in_app: boolean;
    channel_email: boolean;
    channel_sms: boolean;
    on_deadline: boolean;
    on_hearing: boolean;
    on_document_ready: boolean;
    on_agent_done: boolean;
    daily_digest: boolean;
    quiet_hours: boolean;
  };
  security: {
    twofa: TwoFAMethod;
    session_timeout_min: number;
    audit_log: boolean;
    encryption_at_rest: boolean;
    reauth_sensitive: boolean;
    ai_redaction: boolean;
  };
  billing: {
    plan: PlanTier;
    cycle: "monthly" | "yearly";
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const DEFAULT_SETTINGS: AppSettings = {
  profile: { display_name: "", headline: "وکیل پایه یک دادگستری", bio: "", avatar_color: "#047857", locale: "fa-IR" },
  license: { bar_type: "", license_no: "", rank: "", issue_year: "", province: "", kanoon_name: "", specialties: [] },
  office: { name: "", type: "solo", phone: "", email: "", website: "", address: "", city: "", colleagues: 1, accent_color: "#047857" },
  ai: {
    primary_provider: "anthropic",
    model_tier: "balanced",
    temperature: 0.3,
    require_citations: true,
    jurisdiction_lock: true,
    refuse_without_source: true,
    stream_thoughts: true,
  },
  knowledge: {
    enabled_laws: [
      "civil_code", "civil_procedure", "criminal_procedure", "islamic_penal",
      "commerce", "cheque_law", "family_protection", "registration",
      "landlord_tenant_76", "admin_justice", "enforcement_civil", "unification_rulings",
    ],
    prefer_unification_rulings: true,
    auto_cite_articles: true,
    allow_personal_vault: true,
    allow_web: false,
  },
  drafting: {
    pleading_style: "formal_traditional",
    tone: "formal",
    citation_style: "full",
    precedent_preference: "vahdat_rovieh_first",
    numbering: "persian_words",
    honorifics: true,
    signature_block: "با تجدید احترام\nوکیل دادگستری",
  },
  brain: { enabled: true, learn_style: true, learn_reasoning: true, learn_citations: true, apply_to_drafts: true },
  deadlines: {
    auto_compute: true,
    default_abroad: false,
    holiday_calendar: "friday_only",
    reminder_offsets: [7, 3, 1],
    safety_buffer_days: 0,
    block_friday: true,
  },
  notifications: {
    channel_in_app: true,
    channel_email: true,
    channel_sms: false,
    on_deadline: true,
    on_hearing: true,
    on_document_ready: true,
    on_agent_done: true,
    daily_digest: true,
    quiet_hours: false,
  },
  security: {
    twofa: "none",
    session_timeout_min: 60,
    audit_log: true,
    encryption_at_rest: true,
    reauth_sensitive: false,
    ai_redaction: true,
  },
  billing: { plan: "pro", cycle: "yearly" },
};

/** Deep-merge a stored (possibly partial/old) settings object over defaults. */
export function mergeSettings(stored: unknown): AppSettings {
  const out = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
  if (stored && typeof stored === "object") {
    for (const [section, value] of Object.entries(stored as Record<string, unknown>)) {
      if (value && typeof value === "object" && !Array.isArray(value) && section in out) {
        out[section] = { ...(out[section] as object), ...(value as object) };
      } else if (section in out) {
        out[section] = value;
      }
    }
  }
  return out as unknown as AppSettings;
}

export function applyPatch(current: AppSettings, patch: DeepPartial<AppSettings>): AppSettings {
  const next = structuredClone(current) as unknown as Record<string, unknown>;
  for (const [section, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      next[section] = { ...(next[section] as object), ...(value as object) };
    } else {
      next[section] = value;
    }
  }
  return next as unknown as AppSettings;
}

/* ───────────────────────── ancillary records ───────────────────────── */

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  last_active: string;
  current: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  detail: string;
  ip: string;
  created_at: string;
  level: "info" | "security" | "danger";
}

export type BrainSourceKind = "pleading" | "brief" | "appeal" | "contract" | "opinion";
export type BrainStatus = "queued" | "learning" | "learned" | "failed";

export interface BrainSource {
  id: string;
  title: string;
  kind: BrainSourceKind;
  status: BrainStatus;
  pages: number | null;
  insights: string[] | null;
  created_at: string;
}

export interface BrainProfile {
  tone: string;
  avg_sentence_words: number;
  favorite_citations: string[];
  signature_phrases: string[];
  structure_notes: string;
  trained_on: number;
}

export interface CustomTemplate {
  id: string;
  title: string;
  doc_kind: string;
  description: string;
  created_at: string;
}

export interface Subscription {
  plan: PlanTier;
  cycle: "monthly" | "yearly";
  status: "active" | "trialing" | "past_due" | "canceled";
  renews_at: string;
  seats: number;
  price_rial: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount_rial: number;
  status: "paid" | "open" | "void";
}

/* ───────────────────────── label maps ───────────────────────── */

export const BAR_RANK_FA: Record<BarRank, string> = {
  paye1: "وکیل پایه یک دادگستری",
  paye2: "وکیل پایه دو",
  karamuz: "کارآموز وکالت",
};

export const OFFICE_TYPE_FA: Record<OfficeType, string> = {
  solo: "وکیل مستقل",
  firm: "مؤسسه حقوقی / دفتر گروهی",
  institute: "مؤسسه / شرکت",
};

export const PLEADING_STYLE_FA: Record<PleadingStyle, { label: string; hint: string }> = {
  formal_traditional: { label: "رسمی سنتی", hint: "نثر کلاسیک محاکم با تعارفات و ساختار مرسوم لوایح" },
  modern_concise: { label: "مدرن و موجز", hint: "جملات کوتاه، بندبندی شفاف، بدون حشو" },
  detailed_academic: { label: "تحلیلی و مستند", hint: "استدلال عمیق با ارجاعات دکترین و رویه" },
  judicial_strict: { label: "منطبق با فرم قضایی", hint: "پایبندی دقیق به ساختار رسمی دادخواست/لایحه" },
};

export const DRAFTING_TONE_FA: Record<DraftingTone, string> = {
  formal: "رسمی و محترمانه",
  assertive: "قاطع و مؤکد",
  conciliatory: "مصالحه‌جویانه",
  persuasive: "اقناعی",
  neutral: "بی‌طرف و توصیفی",
};

export const CITATION_STYLE_FA: Record<CitationStyle, { label: string; hint: string }> = {
  full: { label: "کامل", hint: "«ماده ۳۳۶ قانون آیین دادرسی مدنی»" },
  short: { label: "مختصر", hint: "«م ۳۳۶ ق.آ.د.م»" },
  inline: { label: "درون‌متنی", hint: "ارجاع داخل جمله بدون پرانتز جداگانه" },
  footnote: { label: "پانوشت", hint: "ارجاعات در پانوشت انتهای بند" },
};

export const PRECEDENT_PREF_FA: Record<PrecedentPreference, { label: string; hint: string }> = {
  vahdat_rovieh_first: { label: "اولویت آرای وحدت رویه", hint: "ابتدا آرای لازم‌الاتباع دیوان عالی" },
  higher_court_first: { label: "اولویت مرجع عالی‌تر", hint: "ترجیح آرای دیوان و تجدیدنظر" },
  recent_first: { label: "اولویت رأی جدیدتر", hint: "ترجیح رویه متأخر" },
  balanced: { label: "متوازن", hint: "ترکیب اعتبار مرجع و تازگی" },
  none: { label: "بدون رویه", hint: "فقط استناد به نص قانون" },
};

export const NUMBERING_FA: Record<Numbering, string> = {
  persian_words: "حروفی (اولاً، ثانیاً)",
  persian_digits: "عددی فارسی (۱، ۲، ۳)",
  abjad: "ابجد (الف، ب، ج)",
};

export const MODEL_TIER_FA: Record<ModelTierPref, { label: string; hint: string }> = {
  economical: { label: "اقتصادی", hint: "سریع و کم‌هزینه؛ مناسب کارهای روزمره" },
  balanced: { label: "متوازن", hint: "تعادل کیفیت و هزینه (پیشنهادی)" },
  max_quality: { label: "حداکثر کیفیت", hint: "قوی‌ترین مدل برای تحلیل و استراتژی" },
};

export const PLAN_FA: Record<PlanTier, { label: string; price_month: number; price_year: number; tagline: string; features: string[] }> = {
  free: {
    label: "رایگان",
    price_month: 0,
    price_year: 0,
    tagline: "برای شروع و آشنایی",
    features: ["تا ۵ پرونده", "موتور مواعد قانونی", "تقویم جلالی", "بدون هوش مصنوعی"],
  },
  pro: {
    label: "حرفه‌ای",
    price_month: 2_900_000,
    price_year: 27_900_000,
    tagline: "برای وکیل مستقل",
    features: ["پرونده نامحدود", "۸ ایجنت هوشمند", "مغز حقوقی شخصی", "نگارش و تحلیل نامحدود", "گنجینه دانش"],
  },
  firm: {
    label: "دفتر",
    price_month: 8_900_000,
    price_year: 85_000_000,
    tagline: "برای دفاتر گروهی",
    features: ["تا ۱۰ کاربر", "همه امکانات حرفه‌ای", "مدیریت دسترسی", "گزارش‌های دفتر", "پشتیبانی اولویت‌دار"],
  },
  enterprise: {
    label: "سازمانی",
    price_month: 0,
    price_year: 0,
    tagline: "میزبانی اختصاصی و SLA",
    features: ["کاربر نامحدود", "استقرار اختصاصی (Self-hosted)", "قرارداد عدم استفاده از داده", "یکپارچه‌سازی اختصاصی"],
  },
};

export const TWOFA_FA: Record<TwoFAMethod, string> = {
  none: "غیرفعال",
  totp: "اپلیکیشن احرازکننده (TOTP)",
  sms: "پیامک",
};

export const HOLIDAY_FA: Record<HolidayCalendar, { label: string; hint: string }> = {
  friday_only: { label: "فقط جمعه‌ها", hint: "انتقال موعد روز جمعه به شنبه (مطابق ماده ۴۴۴)" },
  official_iran: { label: "تقویم رسمی ایران", hint: "احتساب کامل تعطیلات رسمی (به‌زودی)" },
};

export const BRAIN_KIND_FA: Record<BrainSourceKind, string> = {
  pleading: "دادخواست",
  brief: "لایحه",
  appeal: "تجدیدنظرخواهی",
  contract: "قرارداد",
  opinion: "نظر حقوقی",
};

export const BRAIN_STATUS_FA: Record<BrainStatus, string> = {
  queued: "در صف یادگیری",
  learning: "در حال یادگیری",
  learned: "آموخته شد",
  failed: "ناموفق",
};

/* Common Iranian legal specialties for the multi-select. */
export const SPECIALTIES_FA = [
  "حقوقی", "ملکی", "کیفری", "خانواده", "تجاری", "ثبتی", "اداری و دیوان",
  "کار", "بیمه", "مالیاتی", "داوری", "اجرای احکام", "چک و اسناد تجاری", "مهاجرت",
];

export const IRAN_PROVINCES = [
  "تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی", "آذربایجان شرقی", "آذربایجان غربی",
  "خوزستان", "مازندران", "گیلان", "کرمان", "کرمانشاه", "قم", "یزد", "همدان", "گلستان",
  "اردبیل", "هرمزگان", "لرستان", "کردستان", "مرکزی", "قزوین", "زنجان", "سمنان", "بوشهر",
  "چهارمحال و بختیاری", "سیستان و بلوچستان", "کهگیلویه و بویراحمد", "خراسان شمالی",
  "خراسان جنوبی", "ایلام",
];

/* ───────────────────────── section registry ───────────────────────── */

export type SettingsGroup = "workspace" | "intelligence" | "operations" | "account";

export interface SettingsSectionMeta {
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide icon name, resolved in the nav
  group: SettingsGroup;
}

export const SETTINGS_GROUPS_FA: Record<SettingsGroup, string> = {
  workspace: "فضای کاری",
  intelligence: "هوش حقوقی",
  operations: "عملیات",
  account: "حساب و امنیت",
};

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { slug: "profile", title: "حساب و پروفایل", description: "هویت، نمایش و اطلاعات تماس شما", icon: "UserRound", group: "workspace" },
  { slug: "license", title: "اطلاعات پروانه وکالت", description: "کانون، شماره پروانه، پایه و تخصص‌ها", icon: "BadgeCheck", group: "workspace" },
  { slug: "office", title: "اطلاعات دفتر", description: "نام دفتر، نشانی و همکاران", icon: "Building2", group: "workspace" },
  { slug: "ai", title: "ارائه‌دهندگان هوش مصنوعی", description: "مدل‌ها، کلیدها و رفتار پاسخ‌گویی", icon: "Sparkles", group: "intelligence" },
  { slug: "brain", title: "مغز حقوقی شخصی", description: "آموزش سبک نگارش و استدلال شما به هوش مصنوعی", icon: "BrainCircuit", group: "intelligence" },
  { slug: "drafting", title: "ترجیحات نگارش حقوقی", description: "سبک لایحه، لحن، شیوه استناد و رویه", icon: "PenLine", group: "intelligence" },
  { slug: "knowledge", title: "منابع دانش حقوقی", description: "قوانین و منابع فعال برای پژوهش و استناد", icon: "Library", group: "intelligence" },
  { slug: "templates", title: "کتابخانه قالب اسناد", description: "قالب‌های دادخواست، لایحه و قرارداد", icon: "FileStack", group: "operations" },
  { slug: "deadlines", title: "موتور مواعد قانونی", description: "محاسبه خودکار، تعطیلات و یادآوری‌ها", icon: "AlarmClockCheck", group: "operations" },
  { slug: "notifications", title: "اعلان‌ها", description: "کانال‌ها و رویدادهای اطلاع‌رسانی", icon: "Bell", group: "operations" },
  { slug: "security", title: "امنیت و حریم خصوصی", description: "ورود دو مرحله‌ای، نشست‌ها و رمزنگاری", icon: "ShieldCheck", group: "account" },
  { slug: "backup", title: "پشتیبان‌گیری و خروجی", description: "خروجی کامل داده و حذف حساب", icon: "DatabaseBackup", group: "account" },
  { slug: "billing", title: "صورتحساب و اشتراک", description: "طرح، تمدید و فاکتورها", icon: "CreditCard", group: "account" },
];
