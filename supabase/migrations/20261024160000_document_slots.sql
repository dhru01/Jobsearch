-- Granular document slots for profile uploads (identity, qualifications). Legacy kind values stay valid.

alter table public.documents
  add column if not exists slot text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.documents drop constraint if exists documents_kind_check;

alter table public.documents
  add constraint documents_kind_check
  check (
    kind in (
      'cv',
      'cover_letter',
      'tailored_cv',
      'identity',
      'qualification',
      'transcript',
      'certificate',
      'professional_certificate',
      'portfolio',
      'other'
    )
  );

create index if not exists documents_user_slot_idx
  on public.documents (user_id, slot)
  where slot is not null;
