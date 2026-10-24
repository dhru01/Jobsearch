-- Auto-apply foundation: richer profiles, application workflows, queue, answers.
-- Extends existing tables; does not replace candidate_profiles, documents, or applications.

alter table public.candidate_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_name text,
  add column if not exists country text default 'ZA',
  add column if not exists province text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists nationality text,
  add column if not exists work_authorisation text,
  add column if not exists availability_date date,
  add column if not exists notice_period text,
  add column if not exists skills_detail jsonb not null default '{}'::jsonb;

alter table public.documents drop constraint if exists documents_kind_check;
alter table public.documents
  add constraint documents_kind_check
  check (kind in ('cv', 'cover_letter', 'tailored_cv', 'transcript', 'certificate', 'other'));

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications
  add constraint applications_status_check
  check (
    status in (
      'saved',
      'draft',
      'prepared',
      'opened',
      'queued',
      'preparing',
      'awaiting_approval',
      'applying',
      'submitted',
      'unverified',
      'failed',
      'action_required',
      'interview',
      'rejected',
      'offer',
      'withdrawn'
    )
  );

alter table public.applications
  add column if not exists match_score numeric,
  add column if not exists workflow text not null default 'assisted'
    check (workflow in ('assisted', 'mock', 'greenhouse', 'unsupported')),
  add column if not exists answers_json jsonb not null default '{}'::jsonb,
  add column if not exists evidence_path text,
  add column if not exists error_message text,
  add column if not exists submitted_at timestamptz,
  add column if not exists queued_at timestamptz;

create table if not exists public.application_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  mode text not null default 'approval_required'
    check (mode in ('manual', 'approval_required', 'automatic')),
  auto_submit_consent_at timestamptz,
  paused boolean not null default false,
  min_score numeric not null default 50,
  max_per_day int not null default 5 check (max_per_day >= 0 and max_per_day <= 50),
  preferred_titles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  min_salary numeric,
  employment_types text[] not null default '{}',
  excluded_companies text[] not null default '{}',
  excluded_industries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  question text not null,
  answer text not null,
  source text not null default 'openai' check (source in ('profile', 'openai', 'user')),
  needs_user boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.application_queue (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'held'
    check (status in ('held', 'pending', 'running', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  next_run_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_answers_user_idx
  on public.application_answers (user_id, created_at desc);
create index if not exists application_queue_status_idx
  on public.application_queue (status, next_run_at);

create trigger application_preferences_updated_at
  before update on public.application_preferences
  for each row execute function public.set_updated_at();

create trigger application_queue_updated_at
  before update on public.application_queue
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

  insert into public.application_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

insert into public.application_preferences (user_id)
select user_id from public.candidate_profiles
on conflict (user_id) do nothing;

alter table public.application_preferences enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_queue enable row level security;

create policy application_preferences_select_own
  on public.application_preferences for select to authenticated
  using (user_id = auth.uid());

create policy application_preferences_update_own
  on public.application_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy application_answers_select_own
  on public.application_answers for select to authenticated
  using (user_id = auth.uid());

create policy application_answers_insert_own
  on public.application_answers for insert to authenticated
  with check (user_id = auth.uid());

create policy application_answers_update_own
  on public.application_answers for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy application_answers_delete_own
  on public.application_answers for delete to authenticated
  using (user_id = auth.uid());

create policy application_queue_select_own
  on public.application_queue for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.application_preferences from anon;
revoke all on table public.application_answers from anon;
revoke all on table public.application_queue from anon;

grant select, update on table public.application_preferences to authenticated;
grant select, insert, update, delete on table public.application_answers to authenticated;
grant select on table public.application_queue to authenticated;

revoke insert, delete on table public.application_preferences from authenticated;
revoke insert, update, delete on table public.application_queue from authenticated;
