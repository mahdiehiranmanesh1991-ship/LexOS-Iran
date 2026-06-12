import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiAnalysis,
  AiConversation,
  AiMessage,
  AppNotification,
  Contact,
  Court,
  Deadline,
  Draft,
  Hearing,
  KnowledgeNote,
  LegalCase,
  LegalDocument,
  Profile,
  Task,
} from "@/lib/domain/types";
import { daysFromToday, toISODate } from "@/lib/jalali";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

const CASE_REF = "case:cases(id,title,archive_no)";

function withCase<T extends { case?: unknown }>(row: T): T {
  return row;
}

/**
 * Production data source. Every query runs under the caller's JWT, so
 * Postgres RLS (`owner_id = auth.uid()`) is the actual authorization layer —
 * this class only shapes data.
 */
export class SupabaseDataSource implements DataSource {
  readonly mode = "supabase" as const;

  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}

  static async create(): Promise<SupabaseDataSource | null> {
    const client = await createSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return null;
    return new SupabaseDataSource(client, user.id);
  }

  private own<T extends Record<string, unknown>>(row: T): T & { owner_id: string } {
    return { ...row, owner_id: this.userId };
  }

  async getProfile(): Promise<Profile> {
    const { data } = await this.client
      .from("profiles")
      .select("id,full_name,bar_license_no,bar_type,phone,firm_name,city")
      .eq("id", this.userId)
      .maybeSingle();
    return (
      (data as Profile | null) ?? {
        id: this.userId,
        full_name: "کاربر",
        bar_license_no: null,
        bar_type: null,
        phone: null,
        firm_name: null,
        city: null,
      }
    );
  }

  async getDashboard(): Promise<DashboardData> {
    const todayISO = toISODate(new Date());
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);
    const [profile, hearingsQ, deadlinesQ, tasksQ, notifQ, eventsQ, statsQ] = await Promise.all([
      this.getProfile(),
      this.client
        .from("hearings")
        .select(`*, ${CASE_REF}`)
        .eq("status", "upcoming")
        .gte("hearing_at", new Date(Date.now() - 86_400_000).toISOString())
        .order("hearing_at"),
      this.client
        .from("deadlines")
        .select(`*, ${CASE_REF}`)
        .eq("status", "open")
        .lte("due_at", toISODate(horizon))
        .order("due_at"),
      this.client.from("tasks").select(`*, case:cases(id,title)`).eq("status", "open").order("due_on"),
      this.client.from("notifications").select("*").order("created_at", { ascending: false }).limit(10),
      this.client
        .from("case_events")
        .select("*, case:cases(title)")
        .order("event_date", { ascending: false })
        .limit(8),
      Promise.all([
        this.client.from("cases").select("id", { count: "exact", head: true }).eq("status", "active"),
        this.client.from("deadlines").select("id", { count: "exact", head: true }).eq("status", "open"),
        this.client.from("hearings").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
        this.client.from("documents").select("id", { count: "exact", head: true }),
      ]),
    ]);

    const hearings = (hearingsQ.data ?? []) as unknown as Hearing[];
    const deadlines = (deadlinesQ.data ?? []) as unknown as Deadline[];
    const [casesCount, dlCount, hCount, docCount] = statsQ;
    type EventRow = DashboardData["recentEvents"][number] & { case?: { title: string } | null };
    return {
      profile,
      todayHearings: hearings.filter((h) => toISODate(new Date(h.hearing_at)) === todayISO),
      upcomingHearings: hearings.filter((h) => {
        const d = daysFromToday(h.hearing_at);
        return d >= 0 && d <= 14;
      }),
      urgentDeadlines: deadlines,
      openTasks: (tasksQ.data ?? []) as unknown as Task[],
      notifications: (notifQ.data ?? []) as unknown as AppNotification[],
      recentEvents: ((eventsQ.data ?? []) as unknown as EventRow[]).map((e) => ({
        ...e,
        case_title: e.case?.title ?? "",
      })),
      stats: {
        activeCases: casesCount.count ?? 0,
        openDeadlines: dlCount.count ?? 0,
        upcomingHearings: hCount.count ?? 0,
        documents: docCount.count ?? 0,
      },
    };
  }

  async listCases(filter?: CaseFilter): Promise<LegalCase[]> {
    let q = this.client
      .from("cases")
      .select("*, court:courts(*), parties:case_parties(*, contact:contacts(*))")
      .order("updated_at", { ascending: false });
    if (filter?.case_type) q = q.eq("case_type", filter.case_type);
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.stage) q = q.eq("stage", filter.stage);
    if (filter?.q)
      q = q.or(
        `title.ilike.%${filter.q}%,subject.ilike.%${filter.q}%,archive_no.ilike.%${filter.q}%,case_no.ilike.%${filter.q}%`,
      );
    const { data } = await q;
    return (data ?? []) as unknown as LegalCase[];
  }

  async getCase(id: string): Promise<CaseDetail | null> {
    const { data } = await this.client
      .from("cases")
      .select("*, court:courts(*), parties:case_parties(*, contact:contacts(*))")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const [events, hearings, deadlines, documents, analyses, drafts] = await Promise.all([
      this.client.from("case_events").select("*").eq("case_id", id).order("event_date", { ascending: false }),
      this.client.from("hearings").select("*").eq("case_id", id).order("hearing_at", { ascending: false }),
      this.client.from("deadlines").select("*").eq("case_id", id).order("due_at"),
      this.client.from("documents").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      this.client.from("ai_analyses").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      this.client.from("drafts").select("*").eq("case_id", id).order("updated_at", { ascending: false }),
    ]);
    return {
      ...(data as unknown as LegalCase),
      parties: (data as { parties?: CaseDetail["parties"] }).parties ?? [],
      events: (events.data ?? []) as CaseDetail["events"],
      hearings: (hearings.data ?? []) as unknown as Hearing[],
      deadlines: (deadlines.data ?? []) as unknown as Deadline[],
      documents: (documents.data ?? []) as unknown as LegalDocument[],
      analyses: (analyses.data ?? []) as unknown as AiAnalysis[],
      drafts: (drafts.data ?? []) as unknown as Draft[],
    };
  }

  async createCase(input: NewCaseInput): Promise<LegalCase> {
    const { count } = await this.client.from("cases").select("id", { count: "exact", head: true });
    const archiveNo = `${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    const { client_contact_id, opponent_contact_id, ...caseFields } = input;
    const { data, error } = await this.client
      .from("cases")
      .insert(this.own({ ...caseFields, archive_no: archiveNo, status: "active", stage: input.stage ?? "first_instance" }))
      .select()
      .single();
    if (error) throw error;
    const created = data as unknown as LegalCase;
    const parties = [
      client_contact_id && { case_id: created.id, contact_id: client_contact_id, role: "client" },
      opponent_contact_id && { case_id: created.id, contact_id: opponent_contact_id, role: "opponent" },
    ].filter(Boolean) as { case_id: string; contact_id: string; role: string }[];
    if (parties.length)
      await this.client.from("case_parties").insert(parties.map((p) => this.own(p)));
    await this.addCaseEvent({
      case_id: created.id,
      event_type: "filing",
      title: "تشکیل پرونده در سامانه",
    });
    return created;
  }

  async updateCase(id: string, patch: Partial<LegalCase>): Promise<void> {
    await this.client.from("cases").update(patch).eq("id", id);
  }

  async listCourts(): Promise<Court[]> {
    const { data } = await this.client.from("courts").select("*").order("name");
    return (data ?? []) as unknown as Court[];
  }

  async listContacts(): Promise<Contact[]> {
    const { data } = await this.client.from("contacts").select("*").order("full_name");
    return (data ?? []) as unknown as Contact[];
  }

  async createContact(input: NewContactInput): Promise<Contact> {
    const { data, error } = await this.client
      .from("contacts")
      .insert(this.own(input as Record<string, unknown>))
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Contact;
  }

  async findClientConflicts(nameOrId: string): Promise<Contact[]> {
    const q = nameOrId.trim();
    if (!q) return [];
    const { data } = await this.client
      .from("contacts")
      .select("*")
      .eq("kind", "client")
      .or(`full_name.ilike.%${q}%,national_id.eq.${q}`);
    return (data ?? []) as unknown as Contact[];
  }

  async listHearings(): Promise<Hearing[]> {
    const { data } = await this.client.from("hearings").select(`*, ${CASE_REF}`).order("hearing_at");
    return ((data ?? []) as unknown as Hearing[]).map(withCase);
  }

  async createHearing(input: NewHearingInput): Promise<Hearing> {
    const { data, error } = await this.client
      .from("hearings")
      .insert(this.own({ ...input, status: "upcoming" }))
      .select(`*, ${CASE_REF}`)
      .single();
    if (error) throw error;
    await this.addCaseEvent({
      case_id: input.case_id,
      event_type: "hearing",
      title: "تعیین وقت رسیدگی",
      event_date: input.hearing_at,
    });
    return data as unknown as Hearing;
  }

  async listDeadlines(): Promise<Deadline[]> {
    const { data } = await this.client.from("deadlines").select(`*, ${CASE_REF}`).order("due_at");
    return (data ?? []) as unknown as Deadline[];
  }

  async createDeadline(input: NewDeadlineInput): Promise<Deadline> {
    const { data, error } = await this.client
      .from("deadlines")
      .insert(this.own({ status: "open", priority: "high", created_by: "user", ...input }))
      .select(`*, ${CASE_REF}`)
      .single();
    if (error) throw error;
    if (input.case_id)
      await this.addCaseEvent({
        case_id: input.case_id,
        event_type: "deadline",
        title: `ثبت موعد: ${input.title}`,
      });
    return data as unknown as Deadline;
  }

  async setDeadlineStatus(id: string, status: Deadline["status"]): Promise<void> {
    await this.client.from("deadlines").update({ status }).eq("id", id);
  }

  async listTasks(): Promise<Task[]> {
    const { data } = await this.client.from("tasks").select("*, case:cases(id,title)").order("due_on");
    return (data ?? []) as unknown as Task[];
  }

  async toggleTask(id: string): Promise<void> {
    const { data } = await this.client.from("tasks").select("status").eq("id", id).maybeSingle();
    if (data)
      await this.client
        .from("tasks")
        .update({ status: data.status === "open" ? "done" : "open" })
        .eq("id", id);
  }

  async listNotifications(): Promise<AppNotification[]> {
    const { data } = await this.client
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as unknown as AppNotification[];
  }

  async markNotificationsRead(): Promise<void> {
    await this.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
  }

  async listDocuments(): Promise<LegalDocument[]> {
    const { data } = await this.client
      .from("documents")
      .select(`*, ${CASE_REF}`)
      .order("created_at", { ascending: false });
    return (data ?? []) as unknown as LegalDocument[];
  }

  async getDocument(id: string): Promise<LegalDocument | null> {
    const { data } = await this.client
      .from("documents")
      .select(`*, ${CASE_REF}`)
      .eq("id", id)
      .maybeSingle();
    return (data as unknown as LegalDocument) ?? null;
  }

  async createDocument(input: NewDocumentInput): Promise<LegalDocument> {
    const { data, error } = await this.client
      .from("documents")
      .insert(this.own({ tags: [], status: "pending", ...input }))
      .select()
      .single();
    if (error) throw error;
    const doc = data as unknown as LegalDocument;
    if (doc.case_id)
      await this.addCaseEvent({
        case_id: doc.case_id,
        event_type: "document",
        title: `بارگذاری سند: ${doc.title}`,
      });
    return doc;
  }

  async updateDocument(id: string, patch: Partial<LegalDocument>): Promise<void> {
    await this.client.from("documents").update(patch).eq("id", id);
  }

  async listNotes(q?: string): Promise<KnowledgeNote[]> {
    if (q?.trim()) {
      // Semantic search path lives in lib/ai/retrieval (needs embeddings);
      // the repository provides keyword fallback.
      const { data } = await this.client
        .from("knowledge_notes")
        .select("id,kind,title,content_md,tags,case_id,judge_contact_id,outcome,created_at")
        .or(`title.ilike.%${q}%,content_md.ilike.%${q}%`)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as KnowledgeNote[];
    }
    const { data } = await this.client
      .from("knowledge_notes")
      .select("id,kind,title,content_md,tags,case_id,judge_contact_id,outcome,created_at")
      .order("created_at", { ascending: false });
    return (data ?? []) as unknown as KnowledgeNote[];
  }

  async createNote(input: NewNoteInput): Promise<KnowledgeNote> {
    const { data, error } = await this.client
      .from("knowledge_notes")
      .insert(this.own({ tags: [], outcome: "na", ...input }))
      .select("id,kind,title,content_md,tags,case_id,judge_contact_id,outcome,created_at")
      .single();
    if (error) throw error;
    return data as unknown as KnowledgeNote;
  }

  async listDrafts(): Promise<Draft[]> {
    const { data } = await this.client
      .from("drafts")
      .select(`*, ${CASE_REF}`)
      .order("updated_at", { ascending: false });
    return (data ?? []) as unknown as Draft[];
  }

  async getDraft(id: string): Promise<Draft | null> {
    const { data } = await this.client.from("drafts").select(`*, ${CASE_REF}`).eq("id", id).maybeSingle();
    return (data as unknown as Draft) ?? null;
  }

  async createDraft(input: NewDraftInput): Promise<Draft> {
    const { data, error } = await this.client
      .from("drafts")
      .insert(this.own({ status: "draft", version: 1, ...input }))
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Draft;
  }

  async updateDraft(
    id: string,
    patch: Partial<Pick<Draft, "title" | "content_md" | "status">>,
  ): Promise<void> {
    const current = await this.getDraft(id);
    if (!current) return;
    await this.client
      .from("drafts")
      .update({ ...patch, version: current.version + 1, updated_at: new Date().toISOString() })
      .eq("id", id);
    await this.client.from("draft_versions").insert(
      this.own({
        draft_id: id,
        version: current.version + 1,
        content_md: patch.content_md ?? current.content_md,
      }),
    );
  }

  async listAnalyses(caseId?: string): Promise<AiAnalysis[]> {
    let q = this.client
      .from("ai_analyses")
      .select(`*, ${CASE_REF}`)
      .order("created_at", { ascending: false });
    if (caseId) q = q.eq("case_id", caseId);
    const { data } = await q;
    return (data ?? []) as unknown as AiAnalysis[];
  }

  async getAnalysis(id: string): Promise<AiAnalysis | null> {
    const { data } = await this.client
      .from("ai_analyses")
      .select(`*, ${CASE_REF}`)
      .eq("id", id)
      .maybeSingle();
    return (data as unknown as AiAnalysis) ?? null;
  }

  async createAnalysis(input: NewAnalysisInput): Promise<AiAnalysis> {
    const { data, error } = await this.client
      .from("ai_analyses")
      .insert(this.own(input as Record<string, unknown>))
      .select()
      .single();
    if (error) throw error;
    const analysis = data as unknown as AiAnalysis;
    if (analysis.case_id)
      await this.addCaseEvent({
        case_id: analysis.case_id,
        event_type: "ai_analysis",
        title: `تحلیل هوشمند: ${analysis.title}`,
      });
    return analysis;
  }

  async listConversations(): Promise<AiConversation[]> {
    const { data } = await this.client
      .from("ai_conversations")
      .select("*, case:cases(id,title)")
      .order("created_at", { ascending: false });
    return (data ?? []) as unknown as AiConversation[];
  }

  async getMessages(conversationId: string): Promise<AiMessage[]> {
    const { data } = await this.client
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");
    return (data ?? []) as unknown as AiMessage[];
  }

  async createConversation(
    agent: string,
    caseId: string | null,
    title: string,
  ): Promise<AiConversation> {
    const { data, error } = await this.client
      .from("ai_conversations")
      .insert(this.own({ agent, case_id: caseId, title }))
      .select()
      .single();
    if (error) throw error;
    return data as unknown as AiConversation;
  }

  async appendMessage(input: NewMessageInput): Promise<AiMessage> {
    const { data, error } = await this.client
      .from("ai_messages")
      .insert(this.own({ citations: [], ...input }))
      .select()
      .single();
    if (error) throw error;
    return data as unknown as AiMessage;
  }

  async addCaseEvent(input: NewEventInput): Promise<void> {
    await this.client.from("case_events").insert(
      this.own({
        event_date: new Date().toISOString(),
        ...input,
      }),
    );
    await this.client
      .from("cases")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.case_id);
  }
}
