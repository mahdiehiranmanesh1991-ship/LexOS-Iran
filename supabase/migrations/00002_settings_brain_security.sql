-- Iranmanesh Legal OS — settings control center (docs/11)
-- Adds: brain_sources, custom_templates, user_sessions, audit_logs.
-- All persisted preferences live in profiles.settings (jsonb), already present.

-- ───────────────────── Personal Legal Brain corpus ─────────────────────

create table public.brain_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'brief'
    check (kind in ('pleading','brief','appeal','contract','opinion')),
  status text not null default 'queued'
    check (status in ('queued','learning','learned','failed')),
  pages int,
  extracted_text text,
  insights jsonb,            -- string[] of learned style notes
  embedding vector(1536),    -- optional, for style retrieval
  created_at timestamptz not null default now()
);
create index brain_sources_owner_idx on public.brain_sources (owner_id, created_at desc);

-- The learned style profile is stored on profiles.settings -> 'brain_profile'.

-- ───────────────────── user template library ─────────────────────

create table public.custom_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  doc_kind text not null,
  description text not null default '',
  content_md text not null default '',
  created_at timestamptz not null default now()
);
create index custom_templates_owner_idx on public.custom_templates (owner_id, created_at desc);

-- ───────────────────── security: sessions + audit ─────────────────────

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  device text not null default '',
  browser text not null default '',
  os text not null default '',
  ip text not null default '',
  location text not null default '',
  current boolean not null default false,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index user_sessions_owner_idx on public.user_sessions (owner_id, current desc, last_active desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  detail text not null default '',
  ip text not null default '',
  level text not null default 'info' check (level in ('info','security','danger')),
  created_at timestamptz not null default now()
);
create index audit_logs_owner_idx on public.audit_logs (owner_id, created_at desc);

-- ───────────────────── RLS (owner-scoped, like every user table) ─────────────────────

alter table public.brain_sources enable row level security;
alter table public.custom_templates enable row level security;
alter table public.user_sessions enable row level security;
alter table public.audit_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['brain_sources','custom_templates','user_sessions','audit_logs']
  loop
    execute format(
      'create policy "owner all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
  end loop;
end $$;
