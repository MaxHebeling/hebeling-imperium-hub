-- Hebeling OS: business units (Empresas) for company-first architecture
-- Run once. Idempotent (ON CONFLICT).

create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  business_type text not null default 'internal',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_units is 'Top-level business units of Hebeling OS: Reino Editorial, iKingdom, Lead Hunter, Imperium, Max Hebeling.';

create index if not exists idx_business_units_slug on public.business_units (slug);
create index if not exists idx_business_units_active on public.business_units (active);

-- Seed the five primary business units
insert into public.business_units (code, slug, name, business_type)
values
  ('reino_editorial', 'reino-editorial', 'Reino Editorial', 'internal'),
  ('ikingdom',        'ikingdom',        'iKingdom',        'internal'),
  ('lead_hunter',     'lead-hunter',     'Lead Hunter',     'internal'),
  ('imperium',       'imperium',       'Imperium',        'internal'),
  ('max_hebeling',   'max-hebeling',   'Max Hebeling',    'internal')
on conflict (code) do update set
  name = excluded.name,
  slug = excluded.slug,
  active = true,
  updated_at = now();

update public.business_units
set active = false,
    updated_at = now()
where code = 'convocation_os';

-- Optional: allow authenticated read for app
alter table public.business_units enable row level security;

drop policy if exists "authenticated read business_units" on public.business_units;
create policy "authenticated read business_units"
  on public.business_units for select
  to authenticated
  using (active = true);
