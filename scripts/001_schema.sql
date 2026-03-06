-- Enable UUID extension
create extension if not exists "pgcrypto";

-- =========================
-- 1) ENUMS
-- =========================
do $$ begin
  create type app_role as enum ('superadmin', 'admin', 'sales', 'ops', 'client');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type tenant_status as enum ('lead', 'active', 'paused', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type project_phase as enum ('discovery', 'copy', 'design', 'development', 'qa', 'deploy', 'support');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type project_status as enum ('pending', 'in_progress', 'waiting_client', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type website_status as enum ('draft', 'in_progress', 'live', 'paused', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception
  when duplicate_object then null;
end $$;

-- =========================
-- 2) ORGANIZATIONS
-- =========================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- =========================
-- 3) BRANDS
-- =========================
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  primary_domain text,
  created_at timestamptz not null default now(),
  unique(org_id, slug)
);

-- =========================
-- 4) PROFILES
-- links auth.users to app roles/org/tenant
-- =========================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid,
  full_name text,
  email text,
  role app_role not null default 'client',
  created_at timestamptz not null default now()
);

-- =========================
-- 5) TENANTS (clients)
-- =========================
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  name text not null,
  slug text not null,
  status tenant_status not null default 'lead',
  primary_contact_name text,
  primary_contact_email text,
  created_at timestamptz not null default now(),
  unique(org_id, slug)
);

-- add FK now that tenants exists
alter table profiles
  drop constraint if exists profiles_tenant_id_fkey;

alter table profiles
  add constraint profiles_tenant_id_fkey
  foreign key (tenant_id) references tenants(id) on delete set null;

-- =========================
-- 6) COMPANIES
-- =========================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  name text not null,
  website text,
  created_at timestamptz not null default now()
);

-- =========================
-- 7) CONTACTS
-- =========================
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================
-- 8) PIPELINES / STAGES / DEALS
-- =========================
create table if not exists pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  name text not null,
  position int not null default 0
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  stage_id uuid references stages(id) on delete set null,
  title text not null,
  value numeric(12,2) default 0,
  currency text default 'USD',
  owner_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================
-- 9) PROJECTS / TASKS
-- =========================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  phase project_phase not null default 'discovery',
  status project_status not null default 'pending',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

-- =========================
-- 10) DOCUMENTS
-- =========================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  type text not null,
  status text,
  file_url text,
  created_at timestamptz not null default now()
);

-- =========================
-- 11) WEBSITES
-- =========================
create table if not exists websites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  primary_domain text,
  environment text default 'production',
  status website_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now()
);

-- =========================
-- 12) TICKETS
-- =========================
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  subject text not null,
  message text not null,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now()
);

-- =========================
-- 13) ACTIVITY LOGS
-- =========================
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- =========================
-- 14) HELPER FUNCTION
-- current user's role
-- =========================
create or replace function public.get_my_role()
returns app_role
language sql
stable
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.get_my_org_id()
returns uuid
language sql
stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

create or replace function public.get_my_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from profiles where id = auth.uid()
$$;

-- =========================
-- 15) ENABLE RLS
-- =========================
alter table organizations enable row level security;
alter table brands enable row level security;
alter table profiles enable row level security;
alter table tenants enable row level security;
alter table companies enable row level security;
alter table contacts enable row level security;
alter table pipelines enable row level security;
alter table stages enable row level security;
alter table deals enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table websites enable row level security;
alter table tickets enable row level security;
alter table activity_logs enable row level security;

-- =========================
-- 16) RLS POLICIES
-- superadmin/admin/sales/ops = same org
-- client = only their tenant
-- =========================

-- organizations
drop policy if exists "org read own" on organizations;
create policy "org read own"
on organizations for select
using (id = public.get_my_org_id());

-- brands
drop policy if exists "brands read own org" on brands;
create policy "brands read own org"
on brands for select
using (org_id = public.get_my_org_id());

-- profiles
drop policy if exists "profiles read own org" on profiles;
create policy "profiles read own org"
on profiles for select
using (
  org_id = public.get_my_org_id()
);

drop policy if exists "profile read self" on profiles;
create policy "profile read self"
on profiles for select
using (id = auth.uid());

-- tenants
drop policy if exists "staff read tenants in org" on tenants;
create policy "staff read tenants in org"
on tenants for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own tenant" on tenants;
create policy "client read own tenant"
on tenants for select
using (
  id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- companies
drop policy if exists "staff read companies in org" on companies;
create policy "staff read companies in org"
on companies for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

-- contacts
drop policy if exists "staff read contacts in org" on contacts;
create policy "staff read contacts in org"
on contacts for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own contacts" on contacts;
create policy "client read own contacts"
on contacts for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- pipelines
drop policy if exists "staff read pipelines in org" on pipelines;
create policy "staff read pipelines in org"
on pipelines for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

-- stages
drop policy if exists "staff read stages in org" on stages;
create policy "staff read stages in org"
on stages for select
using (
  exists (
    select 1 from pipelines p
    where p.id = stages.pipeline_id
      and p.org_id = public.get_my_org_id()
  )
);

-- deals
drop policy if exists "staff read deals in org" on deals;
create policy "staff read deals in org"
on deals for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own deals" on deals;
create policy "client read own deals"
on deals for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- projects
drop policy if exists "staff read projects in org" on projects;
create policy "staff read projects in org"
on projects for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own projects" on projects;
create policy "client read own projects"
on projects for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- tasks
drop policy if exists "staff read tasks in org" on tasks;
create policy "staff read tasks in org"
on tasks for select
using (
  exists (
    select 1 from projects p
    where p.id = tasks.project_id
      and p.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
);

drop policy if exists "client read own tasks" on tasks;
create policy "client read own tasks"
on tasks for select
using (
  exists (
    select 1 from projects p
    where p.id = tasks.project_id
      and p.tenant_id = public.get_my_tenant_id()
      and public.get_my_role() = 'client'
  )
);

-- documents
drop policy if exists "staff read docs in org" on documents;
create policy "staff read docs in org"
on documents for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own docs" on documents;
create policy "client read own docs"
on documents for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- websites
drop policy if exists "staff read websites in org" on websites;
create policy "staff read websites in org"
on websites for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own websites" on websites;
create policy "client read own websites"
on websites for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- tickets
drop policy if exists "staff read tickets in org" on tickets;
create policy "staff read tickets in org"
on tickets for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "client read own tickets" on tickets;
create policy "client read own tickets"
on tickets for select
using (
  tenant_id = public.get_my_tenant_id()
  and public.get_my_role() = 'client'
);

-- activity logs
drop policy if exists "staff read logs in org" on activity_logs;
create policy "staff read logs in org"
on activity_logs for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);
