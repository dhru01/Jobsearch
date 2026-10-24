-- GeoNames SA reference table (`SA_Locations`) is loaded outside migrations.
-- This migration adds indexes and read policies when the table exists.

do $$
begin
  if to_regclass('public."SA_Locations"') is null then
    raise notice 'SA_Locations not present; skip search indexes and RLS';
    return;
  end if;

  execute 'create extension if not exists pg_trgm with schema extensions';

  execute '
    create index if not exists sa_locations_name_ilike_idx
      on public."SA_Locations" (lower(name) text_pattern_ops)';

  execute '
    create index if not exists sa_locations_country_population_idx
      on public."SA_Locations" (country_code, population desc)';

  execute 'alter table public."SA_Locations" enable row level security';

  execute 'drop policy if exists "SA_Locations read for authenticated" on public."SA_Locations"';
  execute '
    create policy "SA_Locations read for authenticated"
      on public."SA_Locations"
      for select
      to authenticated
      using (true)';

  execute 'drop policy if exists "SA_Locations read for anon" on public."SA_Locations"';
  execute '
    create policy "SA_Locations read for anon"
      on public."SA_Locations"
      for select
      to anon
      using (true)';
end $$;
