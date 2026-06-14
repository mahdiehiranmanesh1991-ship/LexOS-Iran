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
  Profile,
  Task,
} from "@/lib/domain/types";
import type {
  AppSettings,
  AuditLog,
  BrainProfile,
  BrainSource,
  BrainSourceKind,
  CustomTemplate,
  DeepPartial,
  Invoice,
  Subscription,
  UserSession,
} from "@/lib/domain/settings";

export interface CaseDetail extends LegalCase {
  parties: (CaseParty & { contact: Contact })[];
  events: CaseEvent[];
  hearings: Hearing[];
  deadlines: Deadline[];
  documents: LegalDocument[];
  analyses: AiAnalysis[];
  drafts: Draft[];
}

export interface DashboardData {
  profile: Profile;
  todayHearings: Hearing[];
  upcomingHearings: Hearing[];
  urgentDeadlines: Deadline[];
  openTasks: Task[];
  notifications: AppNotification[];
  recentEvents: (CaseEvent & { case_title: string })[];
  stats: { activeCases: number; openDeadlines: number; upcomingHearings: number; documents: number };
}

export type NewCaseInput = Pick<
  LegalCase,
  "title" | "case_type" | "client_position" | "subject"
> &
  Partial<
    Pick<
      LegalCase,
      | "case_no"
      | "claim_value"
      | "court_id"
      | "court_branch"
      | "judge_name"
      | "filed_at"
      | "description"
      | "stage"
    >
  > & { client_contact_id?: string; opponent_contact_id?: string };

export type NewDeadlineInput = {
  case_id: string | null;
  title: string;
  rule_code?: string | null;
  citation?: string | null;
  trigger_date?: string | null;
  is_abroad?: boolean;
  due_at: string;
  priority?: Deadline["priority"];
  notes?: string | null;
  created_by?: "user" | "agent";
};

export type NewHearingInput = Pick<Hearing, "case_id" | "hearing_at" | "kind"> &
  Partial<Pick<Hearing, "location" | "notes">>;

export type NewContactInput = Pick<Contact, "kind" | "person_type" | "full_name"> &
  Partial<Pick<Contact, "national_id" | "phone" | "email" | "city" | "address" | "notes">>;

export type NewDocumentInput = Pick<LegalDocument, "title" | "doc_type"> &
  Partial<
    Pick<
      LegalDocument,
      "case_id" | "storage_path" | "mime_type" | "size_bytes" | "extracted_text" | "tags" | "status"
    >
  >;

export type NewNoteInput = Pick<KnowledgeNote, "kind" | "title" | "content_md"> &
  Partial<Pick<KnowledgeNote, "tags" | "case_id" | "judge_contact_id" | "outcome">>;

export type NewDraftInput = Pick<Draft, "title" | "doc_kind" | "content_md"> &
  Partial<Pick<Draft, "case_id" | "template_code" | "status">>;

export type NewAnalysisInput = Pick<AiAnalysis, "agent" | "kind" | "title" | "content_md"> &
  Partial<Pick<AiAnalysis, "case_id" | "document_id" | "structured" | "model">>;

export type NewEventInput = Pick<CaseEvent, "case_id" | "event_type" | "title"> &
  Partial<Pick<CaseEvent, "description" | "event_date" | "metadata">>;

export type NewMessageInput = Pick<AiMessage, "conversation_id" | "role" | "content"> &
  Partial<Pick<AiMessage, "agent" | "citations">>;

export interface CaseFilter {
  q?: string;
  case_type?: string;
  status?: string;
  stage?: string;
}

/**
 * The repository contract. Two implementations:
 *  - SupabaseDataSource (production: RLS-scoped queries)
 *  - DemoDataSource (in-memory, seeded — powers the public demo)
 * Server-side only.
 */
export interface DataSource {
  readonly mode: "supabase" | "demo";

  getProfile(): Promise<Profile>;
  getDashboard(): Promise<DashboardData>;

  listCases(filter?: CaseFilter): Promise<LegalCase[]>;
  getCase(id: string): Promise<CaseDetail | null>;
  createCase(input: NewCaseInput): Promise<LegalCase>;
  updateCase(id: string, patch: Partial<LegalCase>): Promise<void>;

  listCourts(): Promise<Court[]>;
  listContacts(): Promise<Contact[]>;
  createContact(input: NewContactInput): Promise<Contact>;
  /** Conflict-of-interest probe: opposing-party name/ID vs existing clients. */
  findClientConflicts(nameOrId: string): Promise<Contact[]>;

  listHearings(): Promise<Hearing[]>;
  createHearing(input: NewHearingInput): Promise<Hearing>;

  listDeadlines(): Promise<Deadline[]>;
  createDeadline(input: NewDeadlineInput): Promise<Deadline>;
  setDeadlineStatus(id: string, status: Deadline["status"]): Promise<void>;

  listTasks(): Promise<Task[]>;
  toggleTask(id: string): Promise<void>;

  listNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<void>;

  listDocuments(): Promise<LegalDocument[]>;
  getDocument(id: string): Promise<LegalDocument | null>;
  createDocument(input: NewDocumentInput): Promise<LegalDocument>;
  updateDocument(id: string, patch: Partial<LegalDocument>): Promise<void>;

  listNotes(q?: string): Promise<KnowledgeNote[]>;
  createNote(input: NewNoteInput): Promise<KnowledgeNote>;

  listDrafts(): Promise<Draft[]>;
  getDraft(id: string): Promise<Draft | null>;
  createDraft(input: NewDraftInput): Promise<Draft>;
  updateDraft(id: string, patch: Partial<Pick<Draft, "title" | "content_md" | "status">>): Promise<void>;

  listAnalyses(caseId?: string): Promise<AiAnalysis[]>;
  getAnalysis(id: string): Promise<AiAnalysis | null>;
  createAnalysis(input: NewAnalysisInput): Promise<AiAnalysis>;

  listConversations(): Promise<AiConversation[]>;
  getMessages(conversationId: string): Promise<AiMessage[]>;
  createConversation(agent: string, caseId: string | null, title: string): Promise<AiConversation>;
  appendMessage(input: NewMessageInput): Promise<AiMessage>;

  addCaseEvent(input: NewEventInput): Promise<void>;

  /* ─── Settings control center ─── */
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: DeepPartial<AppSettings>): Promise<AppSettings>;

  listSessions(): Promise<UserSession[]>;
  revokeSession(id: string): Promise<void>;
  revokeOtherSessions(): Promise<void>;

  listAuditLogs(): Promise<AuditLog[]>;

  listBrainSources(): Promise<BrainSource[]>;
  getBrainProfile(): Promise<BrainProfile | null>;
  addBrainSource(input: { title: string; kind: BrainSourceKind; text?: string }): Promise<BrainSource>;
  removeBrainSource(id: string): Promise<void>;

  listCustomTemplates(): Promise<CustomTemplate[]>;
  createCustomTemplate(input: { title: string; doc_kind: string; description: string }): Promise<CustomTemplate>;
  deleteCustomTemplate(id: string): Promise<void>;

  getSubscription(): Promise<Subscription>;
  listInvoices(): Promise<Invoice[]>;
}
