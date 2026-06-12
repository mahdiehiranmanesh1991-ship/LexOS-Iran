-- Iranmanesh Legal OS — initial schema (docs/04-DATABASE-DESIGN.md)
-- Postgres 15+ / Supabase. RLS is the authorization layer: owner_id = auth.uid().

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ───────────────────────────── identity ─────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  bar_license_no text,
  bar_type text check (bar_type in ('kanoon', 'markaz')),
  phone text,
  firm_name text,
  city text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── CRM ─────────────────────────────

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('client','opponent','opposing_counsel','judge','expert','other')),
  person_type text not null default 'natural' check (person_type in ('natural','legal')),
  full_name text not null,
  national_id text,
  phone text,
  email text,
  city text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);
create index contacts_owner_idx on public.contacts (owner_id, kind);
create index contacts_national_id_idx on public.contacts (owner_id, national_id);

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade, -- null = global seed
  name text not null,
  kind text not null check (kind in ('dispute_council','civil','family','criminal_1','criminal_2','revolutionary','prosecutor','appeal','supreme','admin_justice','enforcement')),
  province text,
  city text
);
create index courts_owner_idx on public.courts (owner_id);

-- ───────────────────────────── litigation core ─────────────────────────────

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  archive_no text not null,
  case_no text,
  title text not null,
  case_type text not null check (case_type in ('civil','property','criminal','family','commercial','administrative')),
  stage text not null default 'first_instance'
    check (stage in ('pre_filing','first_instance','vakhahi','appeal','cassation','enforcement','closed')),
  status text not null default 'active'
    check (status in ('active','won','lost','settled','suspended','closed')),
  client_position text not null default 'plaintiff'
    check (client_position in ('plaintiff','defendant','complainant','accused','appellant','respondent','third_party')),
  subject text not null,
  claim_value bigint,
  court_id uuid references public.courts (id) on delete set null,
  court_branch text,
  judge_name text,
  filed_at date,
  description text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_owner_status_idx on public.cases (owner_id, status);
create index cases_owner_updated_idx on public.cases (owner_id, updated_at desc);

create table public.case_parties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  role text not null check (role in ('client','opponent','opposing_counsel','co_counsel','third_party')),
  note text
);
create index case_parties_case_idx on public.case_parties (case_id);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  event_type text not null check (event_type in ('filing','hearing','ruling','service','submission','status_change','document','deadline','ai_analysis','draft','note')),
  title text not null,
  description text,
  event_date timestamptz not null default now(),
  metadata jsonb
);
create index case_events_case_date_idx on public.case_events (case_id, event_date desc);
create index case_events_owner_date_idx on public.case_events (owner_id, event_date desc);

-- ───────────────────────────── time ─────────────────────────────

create table public.hearings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  hearing_at timestamptz not null,
  kind text not null default 'trial' check (kind in ('trial','investigation','expert_review','mediation','other')),
  location text,
  notes text,
  result text,
  status text not null default 'upcoming' check (status in ('upcoming','held','postponed','cancelled'))
);
create index hearings_owner_at_idx on public.hearings (owner_id, hearing_at);
create index hearings_case_idx on public.hearings (case_id);

-- Global procedural-deadline rule table (docs/10). Read-only to clients.
create table public.deadline_rules (
  code text primary key,
  title_fa text not null,
  citation text not null,
  days_inside int not null,
  days_abroad int not null,
  category text not null check (category in ('civil','criminal','admin','registration','commercial','family')),
  description_fa text not null default ''
);

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  title text not null,
  rule_code text references public.deadline_rules (code),
  citation text,
  trigger_date date,
  is_abroad boolean not null default false,
  due_at date not null,
  status text not null default 'open' check (status in ('open','done','missed','cancelled')),
  priority text not null default 'high' check (priority in ('critical','high','normal')),
  notes text,
  created_by text not null default 'user' check (created_by in ('user','agent')),
  created_at timestamptz not null default now()
);
create index deadlines_owner_due_idx on public.deadlines (owner_id, due_at);
create index deadlines_case_idx on public.deadlines (case_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  title text not null,
  due_on date,
  status text not null default 'open' check (status in ('open','done')),
  priority text not null default 'normal' check (priority in ('critical','high','normal')),
  created_at timestamptz not null default now()
);
create index tasks_owner_idx on public.tasks (owner_id, status, due_on);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('deadline_upcoming','hearing_upcoming','document_ready','agent_done','system')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_owner_idx on public.notifications (owner_id, created_at desc);

-- ───────────────────────────── documents & vectors ─────────────────────────────

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  title text not null,
  doc_type text not null default 'other'
    check (doc_type in ('petition','brief','ruling','service_notice','contract','poa','evidence','expert_opinion','correspondence','other')),
  storage_path text,
  mime_type text,
  size_bytes bigint,
  pages int,
  extracted_text text,
  ai_summary text,
  tags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index documents_owner_idx on public.documents (owner_id, created_at desc);
create index documents_case_idx on public.documents (case_id);
create index documents_tags_idx on public.documents using gin (tags);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  seq int not null,
  content text not null,
  embedding vector(1536)
);
create index document_chunks_doc_idx on public.document_chunks (document_id, seq);
create index document_chunks_embedding_idx on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ───────────────────────────── AI ─────────────────────────────

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  agent text not null default 'orchestrator',
  title text not null default 'گفتگوی جدید',
  created_at timestamptz not null default now()
);
create index ai_conversations_owner_idx on public.ai_conversations (owner_id, created_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  agent text,
  citations jsonb not null default '[]'::jsonb,
  tool_calls jsonb,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);
create index ai_messages_convo_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  agent text not null,
  kind text not null check (kind in ('case_analysis','contract_review','strategy','evidence_review','hearing_prep','property_analysis','document_summary')),
  title text not null,
  content_md text not null,
  structured jsonb,
  model text,
  created_at timestamptz not null default now()
);
create index ai_analyses_case_idx on public.ai_analyses (case_id, created_at desc);
create index ai_analyses_owner_idx on public.ai_analyses (owner_id, created_at desc);

-- ───────────────────────────── drafting & knowledge ─────────────────────────────

create table public.draft_templates (
  code text primary key,
  title_fa text not null,
  doc_kind text not null check (doc_kind in ('petition','brief','appeal','complaint','notice','contract')),
  description_fa text not null default '',
  skeleton_md text not null,
  required_fields jsonb not null default '[]'::jsonb
);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  template_code text references public.draft_templates (code),
  title text not null,
  doc_kind text not null check (doc_kind in ('petition','brief','appeal','complaint','notice','contract')),
  content_md text not null default '',
  status text not null default 'draft' check (status in ('draft','final')),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index drafts_owner_idx on public.drafts (owner_id, updated_at desc);
create index drafts_case_idx on public.drafts (case_id);

create table public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  draft_id uuid not null references public.drafts (id) on delete cascade,
  version int not null,
  content_md text not null,
  note text,
  created_at timestamptz not null default now()
);
create index draft_versions_draft_idx on public.draft_versions (draft_id, version desc);

create table public.knowledge_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'note' check (kind in ('experience','argument','precedent','note','snippet')),
  title text not null,
  content_md text not null,
  tags text[] not null default '{}',
  case_id uuid references public.cases (id) on delete set null,
  judge_contact_id uuid references public.contacts (id) on delete set null,
  outcome text not null default 'na' check (outcome in ('won','lost','pending','na')),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_notes_owner_idx on public.knowledge_notes (owner_id, created_at desc);
create index knowledge_notes_tags_idx on public.knowledge_notes using gin (tags);
create index knowledge_notes_embedding_idx on public.knowledge_notes
  using hnsw (embedding vector_cosine_ops);

-- Global statutory corpus (docs/10). Read-only to clients; service role seeds it.
create table public.legal_articles (
  id text primary key, -- "<law_code>:<article_no>"
  kind text not null default 'article' check (kind in ('article','ruling')),
  law_code text not null,
  law_title_fa text not null,
  article_no text not null,
  text_fa text not null,
  topic_tags text[] not null default '{}',
  embedding vector(1536)
);
create index legal_articles_law_idx on public.legal_articles (law_code);
create index legal_articles_tags_idx on public.legal_articles using gin (topic_tags);
create index legal_articles_embedding_idx on public.legal_articles
  using hnsw (embedding vector_cosine_ops);

-- ───────────────────────────── updated_at trigger ─────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cases_updated_at before update on public.cases
  for each row execute function public.set_updated_at();
create trigger drafts_updated_at before update on public.drafts
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger knowledge_notes_updated_at before update on public.knowledge_notes
  for each row execute function public.set_updated_at();

-- ───────────────────────────── vector search functions ─────────────────────────────
-- SECURITY INVOKER: RLS applies to the querying user.

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count int default 10,
  p_case_id uuid default null
)
returns table (id uuid, document_id uuid, case_id uuid, content text, similarity float)
language sql stable
as $$
  select c.id, c.document_id, c.case_id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  where c.embedding is not null
    and (p_case_id is null or c.case_id = p_case_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.match_knowledge_notes(
  query_embedding vector(1536),
  match_count int default 6
)
returns table (id uuid, title text, content_md text, tags text[], similarity float)
language sql stable
as $$
  select n.id, n.title, n.content_md, n.tags,
         1 - (n.embedding <=> query_embedding) as similarity
  from public.knowledge_notes n
  where n.embedding is not null
  order by n.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.match_legal_articles(
  query_embedding vector(1536),
  match_count int default 8,
  p_law_code text default null
)
returns table (id text, law_code text, law_title_fa text, article_no text, text_fa text, similarity float)
language sql stable
as $$
  select a.id, a.law_code, a.law_title_fa, a.article_no, a.text_fa,
         1 - (a.embedding <=> query_embedding) as similarity
  from public.legal_articles a
  where a.embedding is not null
    and (p_law_code is null or a.law_code = p_law_code)
  order by a.embedding <=> query_embedding
  limit match_count;
$$;

-- ───────────────────────────── RLS ─────────────────────────────

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.courts enable row level security;
alter table public.cases enable row level security;
alter table public.case_parties enable row level security;
alter table public.case_events enable row level security;
alter table public.hearings enable row level security;
alter table public.deadline_rules enable row level security;
alter table public.deadlines enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.draft_templates enable row level security;
alter table public.drafts enable row level security;
alter table public.draft_versions enable row level security;
alter table public.knowledge_notes enable row level security;
alter table public.legal_articles enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Owner-scoped CRUD for user tables.
do $$
declare t text;
begin
  foreach t in array array[
    'contacts','cases','case_parties','case_events','hearings','deadlines','tasks',
    'notifications','documents','document_chunks','ai_conversations','ai_messages',
    'ai_analyses','drafts','draft_versions','knowledge_notes'
  ]
  loop
    execute format(
      'create policy "owner all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
  end loop;
end $$;

-- Courts: global seed readable by all authenticated; own rows writable.
create policy "courts read" on public.courts
  for select using (owner_id is null or owner_id = auth.uid());
create policy "courts write own" on public.courts
  for insert with check (owner_id = auth.uid());
create policy "courts update own" on public.courts
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "courts delete own" on public.courts
  for delete using (owner_id = auth.uid());

-- Global read-only reference tables (writes only via service role, which bypasses RLS).
create policy "rules read" on public.deadline_rules for select to authenticated using (true);
create policy "templates read" on public.draft_templates for select to authenticated using (true);
create policy "articles read" on public.legal_articles for select to authenticated using (true);

-- ───────────────────────────── storage ─────────────────────────────

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents bucket read own"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents bucket insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents bucket delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
