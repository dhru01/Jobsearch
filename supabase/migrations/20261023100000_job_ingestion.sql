-- Week 2: cross-source dedupe fingerprint and ingestion audit (service role only).

alter table public.jobs
  add column if not exists fingerprint text;

create unique index if not exists jobs_fingerprint_unique
  on public.jobs (fingerprint)
  where fingerprint is not null;

create index if not exists jobs_source_verified_idx
  on public.jobs (source, last_verified_at);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_counts jsonb not null default '{}'::jsonb,
  inserted int not null default 0,
  updated int not null default 0,
  skipped_duplicate int not null default 0,
  stale_marked int not null default 0,
  rescored_users int not null default 0,
  errors jsonb not null default '[]'::jsonb
);

alter table public.ingestion_runs enable row level security;

revoke all on table public.ingestion_runs from anon, authenticated;
