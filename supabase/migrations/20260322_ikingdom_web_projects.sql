create table if not exists public.ikingdom_web_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid,
  title text not null,
  description text,
  client_name text,
  domain text,
  service_type text check (
    service_type in (
      'landing_page',
      'sitio_corporativo',
      'ecommerce',
      'blog',
      'webapp',
      'rediseno',
      'mantenimiento'
    )
  ),
  current_stage text not null default 'briefing' check (
    current_stage in (
      'briefing',
      'diseno',
      'desarrollo',
      'contenido',
      'revision',
      'testing',
      'lanzamiento',
      'soporte'
    )
  ),
  status text not null default 'draft' check (
    status in ('draft', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')
  ),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  tech_stack text,
  budget numeric(12, 2),
  due_date date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ikingdom_web_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ikingdom_web_projects(id) on delete cascade,
  stage_key text not null check (
    stage_key in (
      'briefing',
      'diseno',
      'desarrollo',
      'contenido',
      'revision',
      'testing',
      'lanzamiento',
      'soporte'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'queued', 'processing', 'review_required', 'approved', 'failed', 'completed')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  unique (project_id, stage_key)
);

create table if not exists public.ikingdom_web_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ikingdom_web_projects(id) on delete cascade,
  stage_key text check (
    stage_key is null or stage_key in (
      'briefing',
      'diseno',
      'desarrollo',
      'contenido',
      'revision',
      'testing',
      'lanzamiento',
      'soporte'
    )
  ),
  file_type text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ikingdom_web_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ikingdom_web_projects(id) on delete cascade,
  deliverable_type text not null,
  title text not null,
  url text,
  status text not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_ikingdom_web_projects_org_id
  on public.ikingdom_web_projects(org_id, created_at desc);

create index if not exists idx_ikingdom_web_projects_client_id
  on public.ikingdom_web_projects(client_id);

create index if not exists idx_ikingdom_web_projects_stage
  on public.ikingdom_web_projects(current_stage, status);

create index if not exists idx_ikingdom_web_stages_project_id
  on public.ikingdom_web_stages(project_id, created_at asc);

create index if not exists idx_ikingdom_web_files_project_id
  on public.ikingdom_web_files(project_id, created_at desc);

create index if not exists idx_ikingdom_web_deliverables_project_id
  on public.ikingdom_web_deliverables(project_id, created_at desc);

alter table public.ikingdom_web_projects enable row level security;
alter table public.ikingdom_web_stages enable row level security;
alter table public.ikingdom_web_files enable row level security;
alter table public.ikingdom_web_deliverables enable row level security;

drop policy if exists "staff manage ikingdom web projects" on public.ikingdom_web_projects;
create policy "staff manage ikingdom web projects"
on public.ikingdom_web_projects
for all
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
)
with check (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "clients read own ikingdom web projects" on public.ikingdom_web_projects;
create policy "clients read own ikingdom web projects"
on public.ikingdom_web_projects
for select
using (client_id = auth.uid());

drop policy if exists "staff manage ikingdom web stages" on public.ikingdom_web_stages;
create policy "staff manage ikingdom web stages"
on public.ikingdom_web_stages
for all
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_stages.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
)
with check (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_stages.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
);

drop policy if exists "clients read own ikingdom web stages" on public.ikingdom_web_stages;
create policy "clients read own ikingdom web stages"
on public.ikingdom_web_stages
for select
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_stages.project_id
      and project.client_id = auth.uid()
  )
);

drop policy if exists "staff manage ikingdom web files" on public.ikingdom_web_files;
create policy "staff manage ikingdom web files"
on public.ikingdom_web_files
for all
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_files.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
)
with check (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_files.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
);

drop policy if exists "clients read own ikingdom web files" on public.ikingdom_web_files;
create policy "clients read own ikingdom web files"
on public.ikingdom_web_files
for select
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_files.project_id
      and project.client_id = auth.uid()
  )
);

drop policy if exists "staff manage ikingdom web deliverables" on public.ikingdom_web_deliverables;
create policy "staff manage ikingdom web deliverables"
on public.ikingdom_web_deliverables
for all
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_deliverables.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
)
with check (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_deliverables.project_id
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
);

drop policy if exists "clients read own ikingdom web deliverables" on public.ikingdom_web_deliverables;
create policy "clients read own ikingdom web deliverables"
on public.ikingdom_web_deliverables
for select
using (
  exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id = ikingdom_web_deliverables.project_id
      and project.client_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('ikingdom-files', 'ikingdom-files', false)
on conflict (id) do nothing;
