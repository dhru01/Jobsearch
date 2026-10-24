-- Week 1 foundation: profiles, documents, jobs, matches, applications, subscriptions.
-- Later weeks add ingestion, tailored documents, and billing on these tables.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  headline text,
  summary text,
  skills text[] not null default '{}',
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  qualifications jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  years_experience numeric,
  extraction_status text not null default 'pending_confirmation'
    check (extraction_status in ('pending_confirmation', 'confirmed')),
  consent_accepted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'cv'
    check (kind in ('cv', 'cover_letter', 'tailored_cv')),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  extracted_json jsonb,
  error_message text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracted', 'confirmed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  original_url text not null,
  title text not null,
  company text not null,
  description text not null default '',
  requirements text not null default '',
  location text not null,
  province text,
  city text,
  work_mode text not null
    check (work_mode in ('remote', 'hybrid', 'on_site')),
  posted_at timestamptz,
  last_verified_at timestamptz,
  min_qualification text
    check (
      min_qualification is null
      or min_qualification in (
        'matric', 'certificate', 'diploma', 'bachelors', 'honours', 'masters', 'doctorate'
      )
    ),
  min_years_experience numeric,
  skills text[] not null default '{}',
  is_stale boolean not null default false,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  score numeric not null,
  breakdown jsonb not null default '{}'::jsonb,
  eligibility_pass boolean not null,
  eligibility_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  status text not null default 'saved'
    check (
      status in (
        'saved', 'draft', 'prepared', 'opened', 'submitted', 'unverified', 'rejected', 'withdrawn'
      )
    ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_created_idx on public.documents (user_id, created_at desc);
create index matches_user_score_idx on public.matches (user_id, score desc);
create index applications_user_created_idx on public.applications (user_id, created_at desc);
create index application_events_application_idx on public.application_events (application_id, created_at);
create index jobs_stale_idx on public.jobs (is_stale);

create trigger candidate_profiles_updated_at
  before update on public.candidate_profiles
  for each row execute function public.set_updated_at();

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.candidate_profiles (user_id, email, full_name, consent_accepted_at)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'consent' = 'true' then now()
      else null
    end
  );

  insert into public.subscriptions (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.candidate_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.jobs enable row level security;
alter table public.matches enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.subscriptions enable row level security;

create policy candidate_profiles_select_own
  on public.candidate_profiles for select to authenticated
  using (user_id = auth.uid());

create policy candidate_profiles_insert_own
  on public.candidate_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy candidate_profiles_update_own
  on public.candidate_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy candidate_profiles_delete_own
  on public.candidate_profiles for delete to authenticated
  using (user_id = auth.uid());

create policy documents_select_own
  on public.documents for select to authenticated
  using (user_id = auth.uid());

create policy documents_insert_own
  on public.documents for insert to authenticated
  with check (user_id = auth.uid());

create policy documents_update_own
  on public.documents for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy documents_delete_own
  on public.documents for delete to authenticated
  using (user_id = auth.uid());

create policy jobs_select_authenticated
  on public.jobs for select to authenticated
  using (true);

create policy matches_select_own
  on public.matches for select to authenticated
  using (user_id = auth.uid());

create policy matches_insert_own
  on public.matches for insert to authenticated
  with check (user_id = auth.uid());

create policy matches_update_own
  on public.matches for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy matches_delete_own
  on public.matches for delete to authenticated
  using (user_id = auth.uid());

create policy applications_select_own
  on public.applications for select to authenticated
  using (user_id = auth.uid());

create policy applications_insert_own
  on public.applications for insert to authenticated
  with check (user_id = auth.uid());

create policy applications_update_own
  on public.applications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy applications_delete_own
  on public.applications for delete to authenticated
  using (user_id = auth.uid());

create policy application_events_select_own
  on public.application_events for select to authenticated
  using (user_id = auth.uid());

create policy application_events_insert_own
  on public.application_events for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.applications
      where applications.id = application_id
        and applications.user_id = auth.uid()
    )
  );

create policy subscriptions_select_own
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.candidate_profiles from anon;
revoke all on table public.documents from anon;
revoke all on table public.jobs from anon;
revoke all on table public.matches from anon;
revoke all on table public.applications from anon;
revoke all on table public.application_events from anon;
revoke all on table public.subscriptions from anon;

grant select, insert, update, delete on table public.candidate_profiles to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select on table public.jobs to authenticated;
grant select, insert, update, delete on table public.matches to authenticated;
grant select, insert, update, delete on table public.applications to authenticated;
grant select, insert on table public.application_events to authenticated;
grant select on table public.subscriptions to authenticated;

revoke insert, update, delete on table public.jobs from authenticated;
revoke insert, update, delete on table public.subscriptions from authenticated;
revoke update, delete on table public.application_events from authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

create policy cvs_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy cvs_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy cvs_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy cvs_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
