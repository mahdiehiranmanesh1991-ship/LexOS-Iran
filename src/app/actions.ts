"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDataSource } from "@/lib/data";
import { computeDeadline } from "@/lib/domain/deadlines";
import type {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientPosition,
  ContactKind,
  DeadlineStatus,
  DocType,
  DraftKind,
  HearingKind,
  NoteKind,
  PersonType,
} from "@/lib/domain/types";
import { parseDateInput, toISODate } from "@/lib/jalali";

/** Server Actions — every mutation passes through here (Zod-validated). */

const CaseSchema = z.object({
  title: z.string().min(2).max(300),
  case_type: z.enum(["civil", "property", "criminal", "family", "commercial", "administrative"]),
  client_position: z.enum(["plaintiff", "defendant", "complainant", "accused", "appellant", "respondent", "third_party"]),
  subject: z.string().min(2).max(2000),
  case_no: z.string().max(40).optional().or(z.literal("")),
  claim_value: z.string().optional().or(z.literal("")),
  court_id: z.string().optional().or(z.literal("")),
  court_branch: z.string().max(60).optional().or(z.literal("")),
  judge_name: z.string().max(120).optional().or(z.literal("")),
  filed_at: z.string().optional().or(z.literal("")),
  description: z.string().max(8000).optional().or(z.literal("")),
  client_contact_id: z.string().optional().or(z.literal("")),
  opponent_contact_id: z.string().optional().or(z.literal("")),
});

export async function createCaseAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = CaseSchema.safeParse(raw);
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const v = parsed.data;
  const filed = v.filed_at ? parseDateInput(v.filed_at) : null;
  const db = await getDataSource();
  const created = await db.createCase({
    title: v.title,
    case_type: v.case_type as CaseType,
    client_position: v.client_position as ClientPosition,
    subject: v.subject,
    case_no: v.case_no || null,
    claim_value: v.claim_value ? Number(v.claim_value.replace(/[^\d]/g, "")) || null : null,
    court_id: v.court_id || null,
    court_branch: v.court_branch || null,
    judge_name: v.judge_name || null,
    filed_at: filed ? toISODate(filed) : null,
    description: v.description || null,
    client_contact_id: v.client_contact_id || undefined,
    opponent_contact_id: v.opponent_contact_id || undefined,
  });
  revalidatePath("/cases");
  redirect(`/cases/${created.id}`);
}

export async function updateCaseStateAction(
  caseId: string,
  patch: { stage?: CaseStage; status?: CaseStatus },
) {
  const db = await getDataSource();
  await db.updateCase(caseId, patch);
  await db.addCaseEvent({
    case_id: caseId,
    event_type: "status_change",
    title: "به‌روزرسانی وضعیت پرونده",
  });
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
}

const ContactSchema = z.object({
  kind: z.enum(["client", "opponent", "opposing_counsel", "judge", "expert", "other"]),
  person_type: z.enum(["natural", "legal"]),
  full_name: z.string().min(2).max(200),
  national_id: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().max(120).optional().or(z.literal("")),
  city: z.string().max(60).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createContactAction(formData: FormData) {
  const parsed = ContactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const v = parsed.data;
  const db = await getDataSource();
  await db.createContact({
    kind: v.kind as ContactKind,
    person_type: v.person_type as PersonType,
    full_name: v.full_name,
    national_id: v.national_id || null,
    phone: v.phone || null,
    email: v.email || null,
    city: v.city || null,
    address: v.address || null,
    notes: v.notes || null,
  });
  revalidatePath("/contacts");
}

const DeadlineSchema = z.object({
  case_id: z.string().optional().or(z.literal("")),
  title: z.string().min(2).max(300),
  mode: z.enum(["rule", "manual"]),
  rule_code: z.string().optional().or(z.literal("")),
  trigger_date: z.string().optional().or(z.literal("")),
  is_abroad: z.string().optional(),
  due_at: z.string().optional().or(z.literal("")),
  priority: z.enum(["critical", "high", "normal"]).default("high"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createDeadlineAction(formData: FormData) {
  const parsed = DeadlineSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const v = parsed.data;
  const db = await getDataSource();

  if (v.mode === "rule") {
    const trigger = v.trigger_date ? parseDateInput(v.trigger_date) : null;
    if (!v.rule_code || !trigger) throw new Error("قاعده و تاریخ ابلاغ الزامی است");
    const comp = computeDeadline(v.rule_code, trigger, v.is_abroad === "on");
    await db.createDeadline({
      case_id: v.case_id || null,
      title: v.title || comp.rule.title_fa,
      rule_code: comp.rule.code,
      citation: comp.rule.citation,
      trigger_date: toISODate(trigger),
      is_abroad: comp.isAbroad,
      due_at: comp.dueISO,
      priority: v.priority,
      notes: v.notes || comp.explanationFa,
    });
  } else {
    const due = v.due_at ? parseDateInput(v.due_at) : null;
    if (!due) throw new Error("تاریخ سررسید نامعتبر است");
    await db.createDeadline({
      case_id: v.case_id || null,
      title: v.title,
      due_at: toISODate(due),
      priority: v.priority,
      notes: v.notes || null,
    });
  }
  revalidatePath("/calendar");
  if (v.case_id) revalidatePath(`/cases/${v.case_id}`);
  revalidatePath("/");
}

/** Confirm an agent-proposed deadline (the propose→confirm contract, docs/09). */
export async function confirmDeadlineProposalAction(payload: {
  case_id: string | null;
  title: string;
  rule_code: string;
  citation: string;
  trigger_date: string;
  is_abroad: boolean;
  due_at: string;
  explanation: string;
}) {
  const db = await getDataSource();
  await db.createDeadline({
    case_id: payload.case_id,
    title: payload.title,
    rule_code: payload.rule_code,
    citation: payload.citation,
    trigger_date: payload.trigger_date,
    is_abroad: payload.is_abroad,
    due_at: payload.due_at,
    priority: "critical",
    notes: payload.explanation,
    created_by: "agent",
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  if (payload.case_id) revalidatePath(`/cases/${payload.case_id}`);
}

export async function setDeadlineStatusAction(id: string, status: DeadlineStatus) {
  const db = await getDataSource();
  await db.setDeadlineStatus(id, status);
  revalidatePath("/calendar");
  revalidatePath("/");
}

const HearingSchema = z.object({
  case_id: z.string().min(1),
  date: z.string().min(4),
  time: z.string().optional().or(z.literal("")),
  kind: z.enum(["trial", "investigation", "expert_review", "mediation", "other"]),
  location: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createHearingAction(formData: FormData) {
  const parsed = HearingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const v = parsed.data;
  const date = parseDateInput(v.date);
  if (!date) throw new Error("تاریخ نامعتبر است");
  if (v.time) {
    const [h, m] = v.time.split(":").map(Number);
    date.setHours(h || 9, m || 0, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  const db = await getDataSource();
  await db.createHearing({
    case_id: v.case_id,
    hearing_at: date.toISOString(),
    kind: v.kind as HearingKind,
    location: v.location || null,
    notes: v.notes || null,
  });
  revalidatePath("/calendar");
  revalidatePath(`/cases/${v.case_id}`);
  revalidatePath("/");
}

const NoteSchema = z.object({
  kind: z.enum(["experience", "argument", "precedent", "note", "snippet"]),
  title: z.string().min(2).max(300),
  content_md: z.string().min(2).max(20_000),
  tags: z.string().max(300).optional().or(z.literal("")),
  case_id: z.string().optional().or(z.literal("")),
  outcome: z.enum(["won", "lost", "pending", "na"]).default("na"),
});

export async function createNoteAction(formData: FormData) {
  const parsed = NoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const v = parsed.data;
  const db = await getDataSource();
  await db.createNote({
    kind: v.kind as NoteKind,
    title: v.title,
    content_md: v.content_md,
    tags: v.tags ? v.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean) : [],
    case_id: v.case_id || null,
    outcome: v.outcome,
  });
  revalidatePath("/knowledge");
}

export async function saveDraftAction(
  id: string,
  patch: { title?: string; content_md?: string; status?: "draft" | "final" },
) {
  const db = await getDataSource();
  await db.updateDraft(id, patch);
  revalidatePath(`/drafts/${id}`);
  revalidatePath("/drafts");
}

export async function createBlankDraftAction(formData: FormData) {
  const kind = (formData.get("doc_kind") as DraftKind) ?? "brief";
  const caseId = (formData.get("case_id") as string) || null;
  const title = ((formData.get("title") as string) || "پیش‌نویس جدید").trim();
  const db = await getDataSource();
  const draft = await db.createDraft({
    title,
    doc_kind: kind,
    case_id: caseId,
    content_md: "",
  });
  redirect(`/drafts/${draft.id}`);
}

export async function toggleTaskAction(id: string) {
  const db = await getDataSource();
  await db.toggleTask(id);
  revalidatePath("/");
}

export async function markNotificationsReadAction() {
  const db = await getDataSource();
  await db.markNotificationsRead();
  revalidatePath("/");
}

export async function createConversationAction(agent: string, caseId: string | null) {
  const db = await getDataSource();
  const convo = await db.createConversation(agent, caseId, "گفتگوی جدید");
  return convo.id;
}

const DocMetaSchema = z.object({
  doc_type: z.enum(["petition", "brief", "ruling", "service_notice", "contract", "poa", "evidence", "expert_opinion", "correspondence", "other"]),
  case_id: z.string().optional().or(z.literal("")),
  title: z.string().min(1).max(300),
});

export async function updateDocumentMetaAction(id: string, formData: FormData) {
  const parsed = DocMetaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("ورودی نامعتبر");
  const db = await getDataSource();
  await db.updateDocument(id, {
    doc_type: parsed.data.doc_type as DocType,
    case_id: parsed.data.case_id || null,
    title: parsed.data.title,
  });
  revalidatePath("/documents");
}
