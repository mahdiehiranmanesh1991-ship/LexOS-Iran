/**
 * Domain types — mirror of the database schema (docs/04) and the single
 * vocabulary shared by UI, data layer, and AI agents.
 */

export type CaseType =
  | "civil"
  | "property"
  | "criminal"
  | "family"
  | "commercial"
  | "administrative";

export type CaseStage =
  | "pre_filing"
  | "first_instance"
  | "vakhahi"
  | "appeal"
  | "cassation"
  | "enforcement"
  | "closed";

export type CaseStatus = "active" | "won" | "lost" | "settled" | "suspended" | "closed";

export type ClientPosition =
  | "plaintiff"
  | "defendant"
  | "complainant"
  | "accused"
  | "appellant"
  | "respondent"
  | "third_party";

export type PartyRole = "client" | "opponent" | "opposing_counsel" | "co_counsel" | "third_party";

export type ContactKind = "client" | "opponent" | "opposing_counsel" | "judge" | "expert" | "other";
export type PersonType = "natural" | "legal";

export type CourtKind =
  | "dispute_council"
  | "civil"
  | "family"
  | "criminal_1"
  | "criminal_2"
  | "revolutionary"
  | "prosecutor"
  | "appeal"
  | "supreme"
  | "admin_justice"
  | "enforcement";

export type HearingKind = "trial" | "investigation" | "expert_review" | "mediation" | "other";
export type HearingStatus = "upcoming" | "held" | "postponed" | "cancelled";

export type DeadlineStatus = "open" | "done" | "missed" | "cancelled";
export type DeadlinePriority = "critical" | "high" | "normal";

export type DocType =
  | "petition"
  | "brief"
  | "ruling"
  | "service_notice"
  | "contract"
  | "poa"
  | "evidence"
  | "expert_opinion"
  | "correspondence"
  | "other";

export type DocStatus = "pending" | "processing" | "ready" | "failed";

export type EventType =
  | "filing"
  | "hearing"
  | "ruling"
  | "service"
  | "submission"
  | "status_change"
  | "document"
  | "deadline"
  | "ai_analysis"
  | "draft"
  | "note";

export type AgentCode =
  | "orchestrator"
  | "case_analyzer"
  | "deadline_agent"
  | "contract_agent"
  | "property_agent"
  | "strategy_agent"
  | "evidence_agent"
  | "research_agent"
  | "drafting_agent";

export type AnalysisKind =
  | "case_analysis"
  | "contract_review"
  | "strategy"
  | "evidence_review"
  | "hearing_prep"
  | "property_analysis"
  | "document_summary";

export type NoteKind = "experience" | "argument" | "precedent" | "note" | "snippet";
export type NoteOutcome = "won" | "lost" | "pending" | "na";

export type DraftKind = "petition" | "brief" | "appeal" | "complaint" | "notice" | "contract";

export interface Profile {
  id: string;
  full_name: string;
  bar_license_no: string | null;
  bar_type: "kanoon" | "markaz" | null;
  phone: string | null;
  firm_name: string | null;
  city: string | null;
}

export interface Contact {
  id: string;
  kind: ContactKind;
  person_type: PersonType;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Court {
  id: string;
  name: string;
  kind: CourtKind;
  province: string | null;
  city: string | null;
}

export interface CaseParty {
  id: string;
  case_id: string;
  contact_id: string;
  role: PartyRole;
  note: string | null;
  contact?: Contact;
}

export interface LegalCase {
  id: string;
  archive_no: string;
  case_no: string | null;
  title: string;
  case_type: CaseType;
  stage: CaseStage;
  status: CaseStatus;
  client_position: ClientPosition;
  subject: string;
  claim_value: number | null;
  court_id: string | null;
  court_branch: string | null;
  judge_name: string | null;
  filed_at: string | null;
  description: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  court?: Court | null;
  parties?: CaseParty[];
}

export interface CaseEvent {
  id: string;
  case_id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  event_date: string;
  metadata: Record<string, unknown> | null;
}

export interface Hearing {
  id: string;
  case_id: string;
  hearing_at: string;
  kind: HearingKind;
  location: string | null;
  notes: string | null;
  result: string | null;
  status: HearingStatus;
  case?: Pick<LegalCase, "id" | "title" | "archive_no">;
}

export interface DeadlineRule {
  code: string;
  title_fa: string;
  citation: string;
  days_inside: number;
  days_abroad: number;
  category: "civil" | "criminal" | "admin" | "registration" | "commercial" | "family";
  description_fa: string;
}

export interface Deadline {
  id: string;
  case_id: string | null;
  title: string;
  rule_code: string | null;
  citation: string | null;
  trigger_date: string | null;
  is_abroad: boolean;
  due_at: string;
  status: DeadlineStatus;
  priority: DeadlinePriority;
  notes: string | null;
  created_by: "user" | "agent";
  case?: Pick<LegalCase, "id" | "title" | "archive_no">;
}

export interface Task {
  id: string;
  case_id: string | null;
  title: string;
  due_on: string | null;
  status: "open" | "done";
  priority: DeadlinePriority;
  case?: Pick<LegalCase, "id" | "title">;
}

export interface AppNotification {
  id: string;
  kind: "deadline_upcoming" | "hearing_upcoming" | "document_ready" | "agent_done" | "system";
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface LegalDocument {
  id: string;
  case_id: string | null;
  title: string;
  doc_type: DocType;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  pages: number | null;
  extracted_text: string | null;
  ai_summary: string | null;
  tags: string[];
  status: DocStatus;
  created_at: string;
  case?: Pick<LegalCase, "id" | "title" | "archive_no">;
}

export interface Citation {
  kind: "article" | "document" | "note" | "rule";
  id: string;
  label: string;
  locator?: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  agent: AgentCode | null;
  citations: Citation[];
  created_at: string;
}

export interface AiConversation {
  id: string;
  case_id: string | null;
  agent: AgentCode;
  title: string;
  created_at: string;
  case?: Pick<LegalCase, "id" | "title">;
}

export interface AnalysisItem {
  title: string;
  detail: string;
  severity?: "high" | "medium" | "low";
  citation?: string;
}

export interface AnalysisStructured {
  risks?: AnalysisItem[];
  weaknesses?: AnalysisItem[];
  opportunities?: AnalysisItem[];
  missing_evidence?: AnalysisItem[];
  suggested_articles?: { law: string; article: string; why: string }[];
  next_steps?: string[];
}

export interface AiAnalysis {
  id: string;
  case_id: string | null;
  document_id: string | null;
  agent: AgentCode;
  kind: AnalysisKind;
  title: string;
  content_md: string;
  structured: AnalysisStructured | null;
  model: string | null;
  created_at: string;
  case?: Pick<LegalCase, "id" | "title">;
}

export interface DraftTemplate {
  code: string;
  title_fa: string;
  doc_kind: DraftKind;
  description_fa: string;
  skeleton_md: string;
}

export interface Draft {
  id: string;
  case_id: string | null;
  template_code: string | null;
  title: string;
  doc_kind: DraftKind;
  content_md: string;
  status: "draft" | "final";
  version: number;
  created_at: string;
  updated_at: string;
  case?: Pick<LegalCase, "id" | "title" | "archive_no">;
}

export interface KnowledgeNote {
  id: string;
  kind: NoteKind;
  title: string;
  content_md: string;
  tags: string[];
  case_id: string | null;
  judge_contact_id: string | null;
  outcome: NoteOutcome;
  created_at: string;
  similarity?: number;
}

export interface LegalArticle {
  id: string;
  kind: "article" | "ruling";
  law_code: string;
  law_title_fa: string;
  article_no: string;
  text_fa: string;
  topic_tags: string[];
  similarity?: number;
}
