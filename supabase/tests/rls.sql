begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'a@example.com',
    'password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User A","consent":"true"}'::jsonb,
    now(),
    now(),
    'confirm-a',
    'recovery-a',
    'change-a',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'b@example.com',
    'password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User B Secret","consent":"true"}'::jsonb,
    now(),
    now(),
    'confirm-b',
    'recovery-b',
    'change-b',
    ''
  );

update public.candidate_profiles
set full_name = 'User B Secret', extraction_status = 'confirmed'
where user_id = '22222222-2222-4222-8222-222222222222';

insert into public.jobs (
  id, source, source_id, original_url, title, company, location, work_mode
) values (
  '33333333-3333-4333-8333-333333333333',
  'synthetic',
  'rls-job',
  'https://example.com/jobs/rls',
  'RLS fixture',
  'Fixture Co',
  'Cape Town, Western Cape',
  'remote'
);

insert into public.documents (user_id, storage_path, file_name, mime_type, byte_size, status)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111/doc/a.pdf', 'a.pdf', 'application/pdf', 10, 'uploaded'),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222/doc/b.pdf', 'b.pdf', 'application/pdf', 10, 'uploaded');

insert into public.matches (user_id, job_id, score, eligibility_pass, eligibility_reasons)
values
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 10, true, '[]'::jsonb),
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', 99, true, '["secret"]'::jsonb);

insert into public.applications (id, user_id, job_id, status)
values
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'saved'),
  ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', 'saved');

insert into public.application_events (application_id, user_id, event_type, payload)
values
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'saved', '{}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', 'saved', '{"secret":true}'::jsonb);

insert into storage.objects (bucket_id, name, owner_id)
values
  ('cvs', '11111111-1111-4111-8111-111111111111/doc/a.pdf', '11111111-1111-4111-8111-111111111111'),
  ('cvs', '22222222-2222-4222-8222-222222222222/doc/b.pdf', '22222222-2222-4222-8222-222222222222');

create or replace function public._rls_touch_other_profile()
returns integer
language plpgsql
as $$
declare
  touched integer;
begin
  update public.candidate_profiles
  set full_name = 'hacked'
  where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics touched = row_count;
  return touched;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select is(
  (select count(*)::int from public.candidate_profiles),
  1,
  'user A sees only their profile'
);

select is(
  (select full_name from public.candidate_profiles),
  'User A',
  'user A reads their own name'
);

select is(
  public._rls_touch_other_profile(),
  0,
  'user A cannot update user B profile'
);

select is(
  (select count(*)::int from public.documents),
  1,
  'user A sees only their documents'
);

select cmp_ok(
  (select count(*)::int from public.jobs),
  '>=',
  1,
  'signed-in users can read jobs'
);

select throws_ok(
  $$insert into public.jobs (source, source_id, original_url, title, company, location, work_mode)
    values ('synthetic', 'blocked', 'https://example.com/blocked', 'Blocked', 'Nope', 'Cape Town', 'remote')$$,
  '42501',
  null,
  'signed-in users cannot insert jobs'
);

select is(
  (select count(*)::int from public.matches),
  1,
  'user A sees only their matches'
);

select is(
  (select count(*)::int from public.applications),
  1,
  'user A sees only their applications'
);

select is(
  (select count(*)::int from public.application_events),
  1,
  'user A sees only their application events'
);

select is(
  (select count(*)::int from public.subscriptions),
  1,
  'user A sees only their subscription'
);

select is(
  (select count(*)::int from public.application_preferences),
  1,
  'user A sees only their application preferences'
);

select throws_ok(
  $$insert into public.application_queue (application_id, user_id)
    values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111')$$,
  '42501',
  null,
  'signed-in users cannot insert apply-queue rows'
);

select throws_ok(
  $$update public.subscriptions set plan = 'pro' where user_id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  null,
  'users cannot change their subscription'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'cvs'),
  1,
  'user A sees only their CV objects'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('cvs', '22222222-2222-4222-8222-222222222222/doc/stolen.pdf', '11111111-1111-4111-8111-111111111111')$$,
  '42501',
  null,
  'user A cannot upload into user B folder'
);

set local role anon;

select throws_ok(
  'select count(*) from public.candidate_profiles',
  '42501',
  null,
  'anonymous users cannot read profiles'
);

select throws_ok(
  'select count(*) from public.jobs',
  '42501',
  null,
  'anonymous users cannot read jobs'
);

reset role;

select is(
  (select full_name from public.candidate_profiles where user_id = '22222222-2222-4222-8222-222222222222'),
  'User B Secret',
  'user B profile was not modified'
);

select * from finish();

rollback;
