create table if not exists public.lead_briefs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  brand text not null default 'ikingdom',
  source text default 'ikingdom-website',
  origin_page text,
  status text not null default 'received',
  company_name text not null,
  contact_email text,
  contact_phone text,
  city_country text,
  website_url text,
  social_media text,
  problem_solved text,
  differentiator text,
  why_choose_you text,
  main_services text,
  key_service text,
  ideal_client text,
  not_ideal_client text,
  years_experience text,
  clients_served text,
  testimonials text,
  landing_objective text,
  traffic_strategy text,
  design_style text,
  address text,
  main_offer text,
  generated_prompt text,
  raw_payload jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lead_briefs_lead_id on public.lead_briefs(lead_id);
create index if not exists idx_lead_briefs_brand on public.lead_briefs(brand);
create index if not exists idx_lead_briefs_created_at on public.lead_briefs(created_at desc);

alter table public.lead_briefs enable row level security;

drop policy if exists "staff read lead briefs in org" on public.lead_briefs;
create policy "staff read lead briefs in org"
on public.lead_briefs for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
);
