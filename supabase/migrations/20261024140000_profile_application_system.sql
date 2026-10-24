-- Expand the confirmed candidate profile for application reuse.
-- Additive only: existing candidate_profiles, documents, and application_answers stay intact.

alter table public.candidate_profiles
  add column if not exists middle_name text,
  add column if not exists alt_phone text,
  add column if not exists postal_code text,
  add column if not exists location_geoname_id text,
  add column if not exists location_lat numeric,
  add column if not exists location_lng numeric,
  add column if not exists accuracy_confirmed_at timestamptz,
  add column if not exists profile_extended jsonb not null default '{}'::jsonb;

alter table public.documents
  add column if not exists description text,
  add column if not exists is_default boolean not null default false;

alter table public.documents drop constraint if exists documents_kind_check;
alter table public.documents
  add constraint documents_kind_check
  check (
    kind in (
      'cv',
      'cover_letter',
      'tailored_cv',
      'transcript',
      'certificate',
      'professional_certificate',
      'portfolio',
      'other'
    )
  );

create unique index if not exists documents_one_default_cv_idx
  on public.documents (user_id)
  where kind = 'cv' and is_default = true;

create table if not exists public.profile_reusable_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  answer text not null,
  category text not null default 'custom',
  confirmed boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists profile_reusable_answers_user_idx
  on public.profile_reusable_answers (user_id, updated_at desc);

create trigger profile_reusable_answers_updated_at
  before update on public.profile_reusable_answers
  for each row execute function public.set_updated_at();

alter table public.profile_reusable_answers enable row level security;

create policy profile_reusable_answers_select_own
  on public.profile_reusable_answers for select to authenticated
  using (user_id = auth.uid());

create policy profile_reusable_answers_insert_own
  on public.profile_reusable_answers for insert to authenticated
  with check (user_id = auth.uid());

create policy profile_reusable_answers_update_own
  on public.profile_reusable_answers for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profile_reusable_answers_delete_own
  on public.profile_reusable_answers for delete to authenticated
  using (user_id = auth.uid());

revoke all on table public.profile_reusable_answers from anon;
grant select, insert, update, delete on table public.profile_reusable_answers to authenticated;
