-- Optional salary and employment metadata for job discovery filters.

alter table public.jobs
  add column if not exists employment_type text,
  add column if not exists salary_text text,
  add column if not exists salary_min numeric;

create index if not exists jobs_employment_type_idx on public.jobs (employment_type);
create index if not exists jobs_salary_min_idx on public.jobs (salary_min);
