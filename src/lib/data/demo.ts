import "server-only";

import {
  demoAnalyses,
  demoCases,
  demoContacts,
  demoConversations,
  demoCourts,
  demoDeadlines,
  demoDocuments,
  demoDrafts,
  demoEvents,
  demoHearings,
  demoMessages,
  demoNotes,
  demoNotifications,
  demoParties,
  demoProfile,
  demoTasks,
} from "@/lib/demo/data";
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
import { daysFromToday } from "@/lib/jalali";
import type {
  CaseDetail,
  CaseFilter,
  DataSource,
  DashboardData,
  NewAnalysisInput,
  NewCaseInput,
  NewContactInput,
  NewDeadlineInput,
  NewDocumentInput,
  NewDraftInput,
  NewEventInput,
  NewHearingInput,
  NewMessageInput,
  NewNoteInput,
} from "./types";
import {
  type AppSettings,
  type AuditLog,
  type BrainProfile,
  type BrainSource,
  type BrainSourceKind,
  type CustomTemplate,
  type DeepPartial,
  type Invoice,
  type Subscription,
  type UserSession,
  applyPatch,
  mergeSettings,
  PLAN_FA,
} from "@/lib/domain/settings";

/**
 * In-memory demo store. Mutations work (per server process) so the public
 * demo behaves like a live product. State survives HMR via globalThis.
 */
interface DemoStore {
  cases: LegalCase[];
  parties: CaseParty[];
  contacts: Contact[];
  courts: Court[];
  events: CaseEvent[];
  hearings: Hearing[];
  deadlines: Deadline[];
  tasks: Task[];
  notifications: AppNotification[];
  documents: LegalDocument[];
  notes: KnowledgeNote[];
  drafts: Draft[];
  analyses: AiAnalysis[];
  conversations: AiConversation[];
  messages: AiMessage[];
  settings: AppSettings;
  sessions: UserSession[];
  auditLogs: AuditLog[];
  brainSources: BrainSource[];
  customTemplates: CustomTemplate[];
  seq: number;
}

function ago(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

/** Seeds for the Settings control center (demo mode). */
const demoSettings: AppSettings = mergeSettings({
  profile: { display_name: "دکتر مهدیه ایرانمنش", headline: "وکیل پایه یک دادگستری — متخصص دعاوی ملکی و حقوقی", bio: "بیش از ده سال سابقه وکالت در دعاوی ملکی، قراردادی و تجاری.", avatar_color: "#047857" },
  license: { bar_type: "kanoon", license_no: "۲۵۴۸۱", rank: "paye1", issue_year: "۱۳۹۳", province: "تهران", kanoon_name: "کانون وکلای دادگستری مرکز", specialties: ["ملکی", "حقوقی", "تجاری", "چک و اسناد تجاری"] },
  office: { name: "دفتر وکالت ایرانمنش", type: "solo", phone: "۰۲۱۸۸۷۶۵۴۳۲", email: "office@iranmanesh.legal", website: "iranmanesh.legal", address: "تهران، سعادت‌آباد، بلوار دریا", city: "تهران", colleagues: 2, accent_color: "#047857" },
  billing: { plan: "pro", cycle: "yearly" },
});

const demoSessions: UserSession[] = [
  { id: "ses-1", device: "لپ‌تاپ", browser: "Chrome 141", os: "Windows 11", ip: "۲٫۱۸۸٫XX٫XX", location: "تهران، ایران", last_active: ago(2), current: true },
  { id: "ses-2", device: "موبایل", browser: "Safari", os: "iOS 18", ip: "۵٫۱۲۰٫XX٫XX", location: "تهران، ایران", last_active: ago(190), current: false },
  { id: "ses-3", device: "تبلت", browser: "Chrome", os: "Android 15", ip: "۹۱٫۹۹٫XX٫XX", location: "کرج، ایران", last_active: ago(2880), current: false },
];

const demoAudit: AuditLog[] = [
  { id: "aud-1", action: "ورود به سامانه", detail: "ورود موفق با گذرواژه", ip: "۲٫۱۸۸٫XX٫XX", created_at: ago(2), level: "info" },
  { id: "aud-2", action: "تولید پیش‌نویس", detail: "لایحه دفاعیه — پرونده مهریه خانم کریمی", ip: "۲٫۱۸۸٫XX٫XX", created_at: ago(46), level: "info" },
  { id: "aud-3", action: "ثبت موعد قانونی", detail: "واخواهی پرونده کرج — توسط ایجنت مواعد", ip: "۲٫۱۸۸٫XX٫XX", created_at: ago(120), level: "info" },
  { id: "aud-4", action: "خروجی داده", detail: "دانلود خروجی کامل پرونده‌ها (JSON)", ip: "۲٫۱۸۸٫XX٫XX", created_at: ago(1500), level: "security" },
  { id: "aud-5", action: "تلاش ناموفق ورود", detail: "گذرواژه نادرست — مسدودسازی موقت", ip: "۱۸۵٫۱۱۰٫XX٫XX", created_at: ago(4300), level: "danger" },
  { id: "aud-6", action: "تغییر تنظیمات امنیتی", detail: "فعال‌سازی رمزنگاری در حالت سکون", ip: "۲٫۱۸۸٫XX٫XX", created_at: ago(7200), level: "security" },
];

const demoBrainSources: BrainSource[] = [
  { id: "br-1", title: "لایحه خلع ید — پرونده ۱۳۹۸/۵۲۴", kind: "brief", status: "learned", pages: 6, insights: ["تفکیک دقیق دعوای مالکیت از تصرف", "استناد محوری به ماده ۲۲ قانون ثبت", "لحن قاطع با جمله‌بندی کوتاه"], created_at: ago(5000) },
  { id: "br-2", title: "دادخواست الزام به تنظیم سند", kind: "pleading", status: "learned", pages: 3, insights: ["ساختار خواسته دقیق و منجز", "ذکر زنجیره انتقال در شرح دادخواست"], created_at: ago(4000) },
  { id: "br-3", title: "تجدیدنظرخواهی پرونده مشارکت در ساخت", kind: "appeal", status: "learning", pages: 9, insights: null, created_at: ago(30) },
];

const demoBrainProfile: BrainProfile = {
  tone: "رسمی و قاطع",
  avg_sentence_words: 18,
  favorite_citations: ["ماده ۲۲ قانون ثبت", "ماده ۳۰۸ قانون مدنی", "ماده ۲۳۰ قانون مدنی", "مواد ۱۵۸ و ۱۶۱ ق.آ.د.م"],
  signature_phrases: ["با عنایت به مراتب معروضه", "علی‌هذا", "نظر به اینکه", "بنا به جهات فوق‌الذکر"],
  structure_notes: "مقدمه کوتاه، سپس بندبندی استدلال‌ها با «اولاً، ثانیاً»، استنادات در پایان هر بند، نتیجه‌گیری صریح.",
  trained_on: 2,
};

const demoCustomTemplates: CustomTemplate[] = [
  { id: "ct-tpl-1", title: "دادخواست خلع ید (الگوی شخصی)", doc_kind: "petition", description: "نسخه شخصی‌سازی‌شده با بند اجرت‌المثل و قلع و قمع", created_at: ago(9000) },
  { id: "ct-tpl-2", title: "قرارداد مشارکت در ساخت — دفتر ایرانمنش", doc_kind: "contract", description: "با شرط فسخ تأخیر و وجه التزام روزانه", created_at: ago(12000) },
];

function freshStore(): DemoStore {
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  return {
    cases: clone(demoCases),
    parties: clone(demoParties),
    contacts: clone(demoContacts),
    courts: clone(demoCourts),
    events: clone(demoEvents),
    hearings: clone(demoHearings),
    deadlines: clone(demoDeadlines),
    tasks: clone(demoTasks),
    notifications: clone(demoNotifications),
    documents: clone(demoDocuments),
    notes: clone(demoNotes),
    drafts: clone(demoDrafts),
    analyses: clone(demoAnalyses),
    conversations: clone(demoConversations),
    messages: clone(demoMessages),
    settings: clone(demoSettings),
    sessions: clone(demoSessions),
    auditLogs: clone(demoAudit),
    brainSources: clone(demoBrainSources),
    customTemplates: clone(demoCustomTemplates),
    seq: 1000,
  };
}

const g = globalThis as unknown as { __lexosDemoStore?: DemoStore };

function store(): DemoStore {
  if (!g.__lexosDemoStore) g.__lexosDemoStore = freshStore();
  return g.__lexosDemoStore;
}

function nextId(prefix: string): string {
  return `${prefix}-${++store().seq}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function caseRef(s: DemoStore, id: string | null) {
  if (!id) return undefined;
  const c = s.cases.find((x) => x.id === id);
  return c ? { id: c.id, title: c.title, archive_no: c.archive_no } : undefined;
}

export class DemoDataSource implements DataSource {
  readonly mode = "demo" as const;

  async getProfile() {
    return demoProfile;
  }

  async getDashboard(): Promise<DashboardData> {
    const s = store();
    const hearings = s.hearings
      .filter((h) => h.status === "upcoming")
      .map((h) => ({ ...h, case: caseRef(s, h.case_id) }))
      .sort((a, b) => a.hearing_at.localeCompare(b.hearing_at));
    const deadlines = s.deadlines
      .filter((d) => d.status === "open")
      .map((d) => ({ ...d, case: caseRef(s, d.case_id) }))
      .sort((a, b) => a.due_at.localeCompare(b.due_at));
    const recentEvents = [...s.events]
      .sort((a, b) => b.event_date.localeCompare(a.event_date))
      .slice(0, 8)
      .map((e) => ({ ...e, case_title: caseRef(s, e.case_id)?.title ?? "" }));
    return {
      profile: demoProfile,
      todayHearings: hearings.filter((h) => daysFromToday(h.hearing_at) === 0),
      upcomingHearings: hearings.filter((h) => {
        const d = daysFromToday(h.hearing_at);
        return d >= 0 && d <= 14;
      }),
      urgentDeadlines: deadlines.filter((d) => daysFromToday(d.due_at) <= 14),
      openTasks: s.tasks
        .filter((t) => t.status === "open")
        .map((t) => ({ ...t, case: caseRef(s, t.case_id) })),
      notifications: [...s.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      recentEvents,
      stats: {
        activeCases: s.cases.filter((c) => c.status === "active").length,
        openDeadlines: deadlines.length,
        upcomingHearings: hearings.length,
        documents: s.documents.length,
      },
    };
  }

  async listCases(filter?: CaseFilter) {
    const s = store();
    let rows = s.cases.map((c) => ({
      ...c,
      court: s.courts.find((x) => x.id === c.court_id) ?? null,
      parties: s.parties
        .filter((p) => p.case_id === c.id)
        .map((p) => ({ ...p, contact: s.contacts.find((x) => x.id === p.contact_id) })),
    }));
    if (filter?.q) {
      const q = filter.q;
      rows = rows.filter(
        (c) =>
          c.title.includes(q) ||
          c.subject.includes(q) ||
          c.archive_no.includes(q) ||
          (c.case_no ?? "").includes(q),
      );
    }
    if (filter?.case_type) rows = rows.filter((c) => c.case_type === filter.case_type);
    if (filter?.status) rows = rows.filter((c) => c.status === filter.status);
    if (filter?.stage) rows = rows.filter((c) => c.stage === filter.stage);
    return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async getCase(id: string): Promise<CaseDetail | null> {
    const s = store();
    const c = s.cases.find((x) => x.id === id);
    if (!c) return null;
    return {
      ...c,
      court: s.courts.find((x) => x.id === c.court_id) ?? null,
      parties: s.parties
        .filter((p) => p.case_id === id)
        .map((p) => ({ ...p, contact: s.contacts.find((x) => x.id === p.contact_id)! }))
        .filter((p) => p.contact),
      events: s.events
        .filter((e) => e.case_id === id)
        .sort((a, b) => b.event_date.localeCompare(a.event_date)),
      hearings: s.hearings
        .filter((h) => h.case_id === id)
        .sort((a, b) => b.hearing_at.localeCompare(a.hearing_at)),
      deadlines: s.deadlines
        .filter((d) => d.case_id === id)
        .sort((a, b) => a.due_at.localeCompare(b.due_at)),
      documents: s.documents
        .filter((d) => d.case_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      analyses: s.analyses
        .filter((a) => a.case_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      drafts: s.drafts
        .filter((d) => d.case_id === id)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    };
  }

  async createCase(input: NewCaseInput): Promise<LegalCase> {
    const s = store();
    const now = nowISO();
    const year = new Date().getFullYear();
    const c: LegalCase = {
      id: nextId("case"),
      archive_no: `${year}-${String(s.cases.length + 1).padStart(3, "0")}`,
      case_no: input.case_no ?? null,
      title: input.title,
      case_type: input.case_type,
      stage: input.stage ?? "first_instance",
      status: "active",
      client_position: input.client_position,
      subject: input.subject,
      claim_value: input.claim_value ?? null,
      court_id: input.court_id ?? null,
      court_branch: input.court_branch ?? null,
      judge_name: input.judge_name ?? null,
      filed_at: input.filed_at ?? null,
      description: input.description ?? null,
      ai_summary: null,
      created_at: now,
      updated_at: now,
    };
    s.cases.push(c);
    if (input.client_contact_id) {
      s.parties.push({
        id: nextId("p"),
        case_id: c.id,
        contact_id: input.client_contact_id,
        role: "client",
        note: null,
      });
    }
    if (input.opponent_contact_id) {
      s.parties.push({
        id: nextId("p"),
        case_id: c.id,
        contact_id: input.opponent_contact_id,
        role: "opponent",
        note: null,
      });
    }
    s.events.push({
      id: nextId("ev"),
      case_id: c.id,
      event_type: "filing",
      title: "تشکیل پرونده در سامانه",
      description: null,
      event_date: now,
      metadata: null,
    });
    return c;
  }

  async updateCase(id: string, patch: Partial<LegalCase>) {
    const s = store();
    const c = s.cases.find((x) => x.id === id);
    if (c) Object.assign(c, patch, { updated_at: nowISO() });
  }

  async listCourts() {
    return store().courts;
  }

  async listContacts() {
    const s = store();
    return [...s.contacts].sort((a, b) => a.full_name.localeCompare(b.full_name, "fa"));
  }

  async createContact(input: NewContactInput): Promise<Contact> {
    const s = store();
    const c: Contact = {
      id: nextId("ct"),
      kind: input.kind,
      person_type: input.person_type,
      full_name: input.full_name,
      national_id: input.national_id ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      created_at: nowISO(),
    };
    s.contacts.push(c);
    return c;
  }

  async findClientConflicts(nameOrId: string) {
    const s = store();
    const q = nameOrId.trim();
    if (!q) return [];
    return s.contacts.filter(
      (c) => c.kind === "client" && (c.full_name.includes(q) || (c.national_id ?? "") === q),
    );
  }

  async listHearings() {
    const s = store();
    return s.hearings
      .map((h) => ({ ...h, case: caseRef(s, h.case_id) }))
      .sort((a, b) => a.hearing_at.localeCompare(b.hearing_at));
  }

  async createHearing(input: NewHearingInput): Promise<Hearing> {
    const s = store();
    const h: Hearing = {
      id: nextId("h"),
      case_id: input.case_id,
      hearing_at: input.hearing_at,
      kind: input.kind,
      location: input.location ?? null,
      notes: input.notes ?? null,
      result: null,
      status: "upcoming",
    };
    s.hearings.push(h);
    await this.addCaseEvent({
      case_id: input.case_id,
      event_type: "hearing",
      title: "تعیین وقت رسیدگی",
      event_date: input.hearing_at,
    });
    return { ...h, case: caseRef(s, h.case_id) };
  }

  async listDeadlines() {
    const s = store();
    return s.deadlines
      .map((d) => ({ ...d, case: caseRef(s, d.case_id) }))
      .sort((a, b) => a.due_at.localeCompare(b.due_at));
  }

  async createDeadline(input: NewDeadlineInput): Promise<Deadline> {
    const s = store();
    const d: Deadline = {
      id: nextId("dl"),
      case_id: input.case_id,
      title: input.title,
      rule_code: input.rule_code ?? null,
      citation: input.citation ?? null,
      trigger_date: input.trigger_date ?? null,
      is_abroad: input.is_abroad ?? false,
      due_at: input.due_at,
      status: "open",
      priority: input.priority ?? "high",
      notes: input.notes ?? null,
      created_by: input.created_by ?? "user",
    };
    s.deadlines.push(d);
    if (input.case_id) {
      await this.addCaseEvent({
        case_id: input.case_id,
        event_type: "deadline",
        title: `ثبت موعد: ${input.title}`,
        event_date: nowISO(),
      });
    }
    return { ...d, case: caseRef(s, d.case_id) };
  }

  async setDeadlineStatus(id: string, status: Deadline["status"]) {
    const s = store();
    const d = s.deadlines.find((x) => x.id === id);
    if (d) d.status = status;
  }

  async listTasks() {
    const s = store();
    return s.tasks.map((t) => ({ ...t, case: caseRef(s, t.case_id) }));
  }

  async toggleTask(id: string) {
    const s = store();
    const t = s.tasks.find((x) => x.id === id);
    if (t) t.status = t.status === "open" ? "done" : "open";
  }

  async listNotifications() {
    const s = store();
    return [...s.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async markNotificationsRead() {
    const s = store();
    const now = nowISO();
    for (const n of s.notifications) n.read_at = n.read_at ?? now;
  }

  async listDocuments() {
    const s = store();
    return s.documents
      .map((d) => ({ ...d, case: caseRef(s, d.case_id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getDocument(id: string) {
    const s = store();
    const d = s.documents.find((x) => x.id === id);
    return d ? { ...d, case: caseRef(s, d.case_id) } : null;
  }

  async createDocument(input: NewDocumentInput): Promise<LegalDocument> {
    const s = store();
    const d: LegalDocument = {
      id: nextId("doc"),
      case_id: input.case_id ?? null,
      title: input.title,
      doc_type: input.doc_type,
      storage_path: input.storage_path ?? null,
      mime_type: input.mime_type ?? null,
      size_bytes: input.size_bytes ?? null,
      pages: null,
      extracted_text: input.extracted_text ?? null,
      ai_summary: null,
      tags: input.tags ?? [],
      status: input.status ?? "pending",
      created_at: nowISO(),
    };
    s.documents.push(d);
    if (d.case_id) {
      await this.addCaseEvent({
        case_id: d.case_id,
        event_type: "document",
        title: `بارگذاری سند: ${d.title}`,
      });
    }
    return d;
  }

  async updateDocument(id: string, patch: Partial<LegalDocument>) {
    const s = store();
    const d = s.documents.find((x) => x.id === id);
    if (d) Object.assign(d, patch);
  }

  async listNotes(q?: string) {
    const s = store();
    let rows = [...s.notes];
    if (q?.trim()) {
      const needle = q.trim();
      const terms = needle.split(/\s+/).filter(Boolean);
      rows = rows
        .map((n) => {
          const hay = `${n.title} ${n.content_md} ${n.tags.join(" ")}`;
          const hits = terms.filter((t) => hay.includes(t)).length;
          return { ...n, similarity: hits / terms.length };
        })
        .filter((n) => (n.similarity ?? 0) > 0)
        .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    } else {
      rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return rows;
  }

  async createNote(input: NewNoteInput): Promise<KnowledgeNote> {
    const s = store();
    const n: KnowledgeNote = {
      id: nextId("kn"),
      kind: input.kind,
      title: input.title,
      content_md: input.content_md,
      tags: input.tags ?? [],
      case_id: input.case_id ?? null,
      judge_contact_id: input.judge_contact_id ?? null,
      outcome: input.outcome ?? "na",
      created_at: nowISO(),
    };
    s.notes.push(n);
    return n;
  }

  async listDrafts() {
    const s = store();
    return s.drafts
      .map((d) => ({ ...d, case: caseRef(s, d.case_id) }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async getDraft(id: string) {
    const s = store();
    const d = s.drafts.find((x) => x.id === id);
    return d ? { ...d, case: caseRef(s, d.case_id) } : null;
  }

  async createDraft(input: NewDraftInput): Promise<Draft> {
    const s = store();
    const now = nowISO();
    const d: Draft = {
      id: nextId("dr"),
      case_id: input.case_id ?? null,
      template_code: input.template_code ?? null,
      title: input.title,
      doc_kind: input.doc_kind,
      content_md: input.content_md,
      status: input.status ?? "draft",
      version: 1,
      created_at: now,
      updated_at: now,
    };
    s.drafts.push(d);
    return d;
  }

  async updateDraft(id: string, patch: Partial<Pick<Draft, "title" | "content_md" | "status">>) {
    const s = store();
    const d = s.drafts.find((x) => x.id === id);
    if (d) {
      Object.assign(d, patch, { updated_at: nowISO(), version: d.version + 1 });
    }
  }

  async listAnalyses(caseId?: string) {
    const s = store();
    return s.analyses
      .filter((a) => !caseId || a.case_id === caseId)
      .map((a) => ({ ...a, case: caseRef(s, a.case_id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getAnalysis(id: string) {
    const s = store();
    const a = s.analyses.find((x) => x.id === id);
    return a ? { ...a, case: caseRef(s, a.case_id) } : null;
  }

  async createAnalysis(input: NewAnalysisInput): Promise<AiAnalysis> {
    const s = store();
    const a: AiAnalysis = {
      id: nextId("an"),
      case_id: input.case_id ?? null,
      document_id: input.document_id ?? null,
      agent: input.agent,
      kind: input.kind,
      title: input.title,
      content_md: input.content_md,
      structured: input.structured ?? null,
      model: input.model ?? null,
      created_at: nowISO(),
    };
    s.analyses.push(a);
    if (a.case_id) {
      await this.addCaseEvent({
        case_id: a.case_id,
        event_type: "ai_analysis",
        title: `تحلیل هوشمند: ${a.title}`,
      });
    }
    return a;
  }

  async listConversations() {
    const s = store();
    return [...s.conversations]
      .map((c) => ({ ...c, case: caseRef(s, c.case_id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getMessages(conversationId: string) {
    const s = store();
    return s.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async createConversation(agent: string, caseId: string | null, title: string) {
    const s = store();
    const c: AiConversation = {
      id: nextId("cv"),
      case_id: caseId,
      agent: agent as AiConversation["agent"],
      title,
      created_at: nowISO(),
    };
    s.conversations.push(c);
    return c;
  }

  async appendMessage(input: NewMessageInput): Promise<AiMessage> {
    const s = store();
    const m: AiMessage = {
      id: nextId("m"),
      conversation_id: input.conversation_id,
      role: input.role,
      content: input.content,
      agent: input.agent ?? null,
      citations: input.citations ?? [],
      created_at: nowISO(),
    };
    s.messages.push(m);
    return m;
  }

  async addCaseEvent(input: NewEventInput) {
    const s = store();
    s.events.push({
      id: nextId("ev"),
      case_id: input.case_id,
      event_type: input.event_type,
      title: input.title,
      description: input.description ?? null,
      event_date: input.event_date ?? nowISO(),
      metadata: input.metadata ?? null,
    });
    const c = s.cases.find((x) => x.id === input.case_id);
    if (c) c.updated_at = nowISO();
  }

  /* ─── Settings control center ─── */

  async getSettings() {
    return store().settings;
  }

  async updateSettings(patch: DeepPartial<AppSettings>) {
    const s = store();
    s.settings = applyPatch(s.settings, patch);
    return s.settings;
  }

  async listSessions() {
    return [...store().sessions].sort((a, b) => Number(b.current) - Number(a.current));
  }

  async revokeSession(id: string) {
    const s = store();
    s.sessions = s.sessions.filter((x) => x.id !== id || x.current);
  }

  async revokeOtherSessions() {
    const s = store();
    s.sessions = s.sessions.filter((x) => x.current);
  }

  async listAuditLogs() {
    return [...store().auditLogs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async listBrainSources() {
    return [...store().brainSources].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getBrainProfile() {
    const learned = store().brainSources.filter((b) => b.status === "learned").length;
    return learned > 0 ? { ...demoBrainProfile, trained_on: learned } : null;
  }

  async addBrainSource(input: { title: string; kind: BrainSourceKind; text?: string }) {
    const s = store();
    const b: BrainSource = {
      id: nextId("br"),
      title: input.title,
      kind: input.kind,
      status: "learning",
      pages: input.text ? Math.max(1, Math.round(input.text.length / 1800)) : null,
      insights: null,
      created_at: nowISO(),
    };
    s.brainSources.push(b);
    return b;
  }

  async removeBrainSource(id: string) {
    const s = store();
    s.brainSources = s.brainSources.filter((x) => x.id !== id);
  }

  async listCustomTemplates() {
    return [...store().customTemplates].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createCustomTemplate(input: { title: string; doc_kind: string; description: string }) {
    const s = store();
    const t: CustomTemplate = {
      id: nextId("ct-tpl"),
      title: input.title,
      doc_kind: input.doc_kind,
      description: input.description,
      created_at: nowISO(),
    };
    s.customTemplates.push(t);
    return t;
  }

  async deleteCustomTemplate(id: string) {
    const s = store();
    s.customTemplates = s.customTemplates.filter((x) => x.id !== id);
  }

  async getSubscription(): Promise<Subscription> {
    const s = store();
    const plan = s.settings.billing.plan;
    const cycle = s.settings.billing.cycle;
    const meta = PLAN_FA[plan];
    return {
      plan,
      cycle,
      status: "active",
      renews_at: new Date(Date.now() + 240 * 86_400_000).toISOString(),
      seats: plan === "firm" ? 5 : 1,
      price_rial: cycle === "yearly" ? meta.price_year : meta.price_month,
    };
  }

  async listInvoices(): Promise<Invoice[]> {
    return [
      { id: "inv-1", number: "۱۴۰۴-۰۰۳", date: new Date(Date.now() - 30 * 86_400_000).toISOString(), amount_rial: 27_900_000, status: "paid" },
      { id: "inv-2", number: "۱۴۰۳-۰۱۲", date: new Date(Date.now() - 395 * 86_400_000).toISOString(), amount_rial: 24_500_000, status: "paid" },
    ];
  }
}
