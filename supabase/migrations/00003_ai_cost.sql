-- Iranmanesh Legal OS — AI cost tracking & governance (docs/14)
-- Per-call usage events + a per-user monthly rollup for O(1) quota/budget checks.
-- Writes go exclusively through ai_record_usage() (atomic event + rollup).

-- ───────────────────── per-call usage events ─────────────────────

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  route text not null,
  feature text not null,
  provider text not null check (provider in ('anthropic','openai')),
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  total_tokens int not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_events_owner_idx on public.ai_usage_events (owner_id, created_at desc);
create index ai_usage_events_created_idx on public.ai_usage_events (created_at desc);
create index ai_usage_events_feature_idx on public.ai_usage_events (feature);

-- ───────────────────── per-user monthly rollup ─────────────────────

create table public.ai_usage_monthly (
  owner_id uuid not null references auth.users (id) on delete cascade,
  period date not null,                    -- first day of month (UTC)
  calls int not null default 0,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  cost_usd numeric(14,6) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_id, period)
);
create index ai_usage_monthly_period_idx on public.ai_usage_monthly (period);

-- ───────────────────── atomic recorder (event + rollup) ─────────────────────
-- SECURITY DEFINER: runs as owner, bypassing RLS to write the rollup. owner_id
-- is always supplied explicitly by the server pipeline (docs/07). One round trip,
-- race-free via the upsert.

create or replace function public.ai_record_usage(
  p_owner uuid,
  p_route text,
  p_feature text,
  p_provider text,
  p_model text,
  p_tokens_in int,
  p_tokens_out int,
  p_cost numeric
) returns void
language plpgsql
security definer set search_path = public
as $$
declare m date := date_trunc('month', now() at time zone 'utc')::date;
begin
  insert into public.ai_usage_events
    (owner_id, route, feature, provider, model, tokens_in, tokens_out, total_tokens, cost_usd)
  values
    (p_owner, p_route, p_feature, p_provider, p_model, p_tokens_in, p_tokens_out,
     p_tokens_in + p_tokens_out, p_cost);

  insert into public.ai_usage_monthly
    (owner_id, period, calls, tokens_in, tokens_out, cost_usd, updated_at)
  values
    (p_owner, m, 1, p_tokens_in, p_tokens_out, p_cost, now())
  on conflict (owner_id, period) do update set
    calls       = public.ai_usage_monthly.calls + 1,
    tokens_in   = public.ai_usage_monthly.tokens_in + excluded.tokens_in,
    tokens_out  = public.ai_usage_monthly.tokens_out + excluded.tokens_out,
    cost_usd    = public.ai_usage_monthly.cost_usd + excluded.cost_usd,
    updated_at  = now();
end;
$$;

-- Platform-wide spend for a month (aggregate number only — safe for any caller).
create or replace function public.ai_platform_month_spend(p_period date)
returns numeric
language sql
security definer set search_path = public
stable
as $$
  select coalesce(sum(cost_usd), 0) from public.ai_usage_monthly where period = p_period;
$$;

-- ───────────────────── RLS ─────────────────────
-- Users may read their OWN usage (for an in-app cost view). Writes happen only
-- via the service role / SECURITY DEFINER recorder — no client write policy.

alter table public.ai_usage_events enable row level security;
alter table public.ai_usage_monthly enable row level security;

create policy "own usage events" on public.ai_usage_events
  for select using (owner_id = auth.uid());
create policy "own usage monthly" on public.ai_usage_monthly
  for select using (owner_id = auth.uid());

grant execute on function public.ai_platform_month_spend(date) to authenticated, service_role;
grant execute on function public.ai_record_usage(uuid, text, text, text, text, int, int, numeric) to service_role;
