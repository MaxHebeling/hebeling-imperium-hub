-- ============================================================================
-- Phase 2: Database Schema for the AI-native editorial pipeline
-- Scope: database only, additive, no external integrations or business logic
-- ============================================================================

begin;

create or replace function public.editorial_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Canonical workflow table -------------------------------------------------

create table if not exists public.editorial_workflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.editorial_projects(id) on delete cascade,
  current_state text not null default 'received',
  status text not null default 'active',
  context jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_workflows_current_state_check check (
    current_state in (
      'received',
      'normalized',
      'analyzed',
      'editing_planned',
      'content_edited',
      'proofread',
      'validated',
      'metadata_ready',
      'cover_ready',
      'layout_ready',
      'qa_passed',
      'packaged',
      'published',
      'marketed'
    )
  ),
  constraint editorial_workflows_status_check check (
    status in ('draft', 'active', 'paused', 'failed', 'completed', 'archived')
  ),
  constraint editorial_workflows_context_check check (jsonb_typeof(context) = 'object'),
  constraint editorial_workflows_metrics_check check (jsonb_typeof(metrics) = 'object')
);

create index if not exists editorial_workflows_current_state_idx
  on public.editorial_workflows(current_state);

create index if not exists editorial_workflows_status_idx
  on public.editorial_workflows(status);

drop trigger if exists editorial_workflows_set_updated_at on public.editorial_workflows;
create trigger editorial_workflows_set_updated_at
before update on public.editorial_workflows
for each row execute function public.editorial_set_updated_at();

-- 2. Manuscript assets --------------------------------------------------------

create table if not exists public.manuscript_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  workflow_id uuid null references public.editorial_workflows(id) on delete set null,
  asset_kind text not null default 'manuscript',
  source_type text not null default 'upload',
  source_label text not null,
  source_uri text null,
  original_file_name text not null,
  mime_type text not null,
  checksum text null,
  size_bytes bigint null,
  extracted_text_uri text null,
  version integer not null default 1,
  is_current boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manuscript_assets_asset_kind_check check (
    asset_kind in (
      'manuscript',
      'normalized_text',
      'analysis_output',
      'edited_manuscript',
      'proofread_manuscript',
      'metadata_asset',
      'cover_asset',
      'layout_asset',
      'package_asset'
    )
  ),
  constraint manuscript_assets_source_type_check check (
    source_type in ('upload', 'import', 'external')
  ),
  constraint manuscript_assets_version_check check (version > 0),
  constraint manuscript_assets_details_check check (jsonb_typeof(details) = 'object')
);

create unique index if not exists manuscript_assets_project_asset_version_idx
  on public.manuscript_assets(project_id, asset_kind, version);

create unique index if not exists manuscript_assets_current_asset_idx
  on public.manuscript_assets(project_id, asset_kind)
  where is_current;

create index if not exists manuscript_assets_workflow_idx
  on public.manuscript_assets(workflow_id);

drop trigger if exists manuscript_assets_set_updated_at on public.manuscript_assets;
create trigger manuscript_assets_set_updated_at
before update on public.manuscript_assets
for each row execute function public.editorial_set_updated_at();

-- 3. Editorial metadata -------------------------------------------------------

create table if not exists public.editorial_metadata (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.editorial_projects(id) on delete cascade,
  author text not null,
  title text not null,
  subtitle text null,
  language text not null,
  genre text not null,
  synopsis text null,
  tags jsonb not null default '[]'::jsonb,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_metadata_tags_check check (jsonb_typeof(tags) = 'array'),
  constraint editorial_metadata_extra_check check (jsonb_typeof(extra) = 'object')
);

create index if not exists editorial_metadata_language_idx
  on public.editorial_metadata(language);

create index if not exists editorial_metadata_genre_idx
  on public.editorial_metadata(genre);

drop trigger if exists editorial_metadata_set_updated_at on public.editorial_metadata;
create trigger editorial_metadata_set_updated_at
before update on public.editorial_metadata
for each row execute function public.editorial_set_updated_at();

-- 4. Pipeline logs ------------------------------------------------------------

create table if not exists public.pipeline_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  workflow_id uuid null references public.editorial_workflows(id) on delete set null,
  stage_id uuid null references public.editorial_project_workflow_stages(id) on delete set null,
  stage_key text null,
  event_type text not null,
  level text not null default 'info',
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint pipeline_logs_level_check check (
    level in ('debug', 'info', 'warning', 'error')
  ),
  constraint pipeline_logs_payload_check check (jsonb_typeof(payload) = 'object')
);

create index if not exists pipeline_logs_project_created_idx
  on public.pipeline_logs(project_id, created_at desc);

create index if not exists pipeline_logs_workflow_created_idx
  on public.pipeline_logs(workflow_id, created_at desc);

create index if not exists pipeline_logs_stage_created_idx
  on public.pipeline_logs(stage_id, created_at desc);

-- 5. Align editorial_projects to the new workflow schema ---------------------

alter table public.editorial_projects
  add column if not exists manuscript_source text null;

alter table public.editorial_projects
  add column if not exists current_status text null;

alter table public.editorial_projects
  add column if not exists metadata_id uuid null;

alter table public.editorial_projects
  add column if not exists current_manuscript_asset_id uuid null;

alter table public.editorial_projects
  add column if not exists workflow_schema_version integer not null default 2;

alter table public.editorial_projects
  add column if not exists pipeline_context jsonb not null default '{}'::jsonb;

alter table public.editorial_projects
  add constraint editorial_projects_manuscript_source_check
  check (
    manuscript_source is null
    or manuscript_source in ('upload', 'import', 'external')
  );

alter table public.editorial_projects
  add constraint editorial_projects_current_status_check
  check (
    current_status is null
    or current_status in (
      'received',
      'normalized',
      'analyzed',
      'editing_planned',
      'content_edited',
      'proofread',
      'validated',
      'metadata_ready',
      'cover_ready',
      'layout_ready',
      'qa_passed',
      'packaged',
      'published',
      'marketed'
    )
  );

alter table public.editorial_projects
  add constraint editorial_projects_pipeline_context_check
  check (jsonb_typeof(pipeline_context) = 'object');

alter table public.editorial_projects
  add constraint editorial_projects_metadata_id_fkey
  foreign key (metadata_id) references public.editorial_metadata(id) on delete set null;

alter table public.editorial_projects
  add constraint editorial_projects_current_manuscript_asset_id_fkey
  foreign key (current_manuscript_asset_id) references public.manuscript_assets(id) on delete set null;

create index if not exists editorial_projects_current_status_idx
  on public.editorial_projects(current_status);

-- 6. Align stage runtime persistence without breaking the legacy catalog -----
-- `editorial_workflow_stages` already exists as the workflow definition catalog.
-- Runtime, per-project stage execution stays normalized in
-- `editorial_project_workflow_stages`.

alter table public.editorial_project_workflow_stages
  add column if not exists workflow_id uuid null references public.editorial_workflows(id) on delete cascade;

alter table public.editorial_project_workflow_stages
  add column if not exists finished_at timestamptz null;

alter table public.editorial_project_workflow_stages
  add column if not exists agent_used jsonb null;

alter table public.editorial_project_workflow_stages
  add column if not exists cost jsonb null;

alter table public.editorial_project_workflow_stages
  add column if not exists output_file uuid null references public.manuscript_assets(id) on delete set null;

alter table public.editorial_project_workflow_stages
  add column if not exists logs jsonb not null default '[]'::jsonb;

alter table public.editorial_project_workflow_stages
  add column if not exists updated_at timestamptz not null default now();

alter table public.editorial_project_workflow_stages
  add constraint editorial_project_workflow_stages_logs_check
  check (jsonb_typeof(logs) = 'array');

alter table public.editorial_project_workflow_stages
  add constraint editorial_project_workflow_stages_agent_used_check
  check (agent_used is null or jsonb_typeof(agent_used) = 'object');

alter table public.editorial_project_workflow_stages
  add constraint editorial_project_workflow_stages_cost_check
  check (cost is null or jsonb_typeof(cost) = 'object');

alter table public.editorial_project_workflow_stages
  add constraint editorial_project_workflow_stages_status_check
  check (
    status in (
      'pending',
      'queued',
      'ready',
      'processing',
      'in_progress',
      'needs_review',
      'review_required',
      'approved',
      'failed',
      'blocked',
      'completed'
    )
  );

create index if not exists editorial_project_workflow_stages_workflow_idx
  on public.editorial_project_workflow_stages(workflow_id);

create index if not exists editorial_project_workflow_stages_status_idx
  on public.editorial_project_workflow_stages(status);

drop trigger if exists editorial_project_workflow_stages_set_updated_at on public.editorial_project_workflow_stages;
create trigger editorial_project_workflow_stages_set_updated_at
before update on public.editorial_project_workflow_stages
for each row execute function public.editorial_set_updated_at();

-- 7. Backfill metadata -------------------------------------------------------

insert into public.editorial_metadata (
  project_id,
  author,
  title,
  subtitle,
  language,
  genre,
  synopsis,
  tags,
  created_at,
  updated_at
)
select
  ep.id,
  coalesce(nullif(trim(ep.author_name), ''), 'Autor desconocido'),
  ep.title,
  ep.subtitle,
  coalesce(nullif(trim(ep.language), ''), 'es'),
  coalesce(nullif(trim(ep.genre), ''), 'general'),
  null,
  '[]'::jsonb,
  ep.created_at,
  coalesce(ep.updated_at, ep.created_at, now())
from public.editorial_projects ep
on conflict (project_id) do nothing;

update public.editorial_projects ep
set metadata_id = em.id
from public.editorial_metadata em
where em.project_id = ep.id
  and ep.metadata_id is null;

-- 8. Backfill workflows ------------------------------------------------------

insert into public.editorial_workflows (
  project_id,
  current_state,
  status,
  context,
  metrics,
  created_at,
  updated_at
)
select
  ep.id,
  case
    when pw.current_phase = 'intake' and pw.current_stage = 'technical_validation' then 'normalized'
    when pw.current_phase = 'intake' then 'received'
    when pw.current_phase = 'editorial_analysis' then 'analyzed'
    when pw.current_phase = 'structural_editing' then 'editing_planned'
    when pw.current_phase = 'line_editing' then 'content_edited'
    when pw.current_phase = 'copyediting' then 'proofread'
    when pw.current_phase = 'text_finalization' then 'validated'
    when pw.current_phase = 'book_specifications' then 'metadata_ready'
    when pw.current_phase = 'book_production' and pw.current_stage in ('cover_design', 'cover_approval') then 'cover_ready'
    when pw.current_phase = 'book_production' then 'layout_ready'
    when pw.current_phase = 'final_proof' then 'qa_passed'
    when pw.current_phase = 'publishing_prep' then 'packaged'
    when pw.current_phase = 'distribution' and coalesce(pw.status, 'active') = 'completed' then 'marketed'
    when pw.current_phase = 'distribution' then 'published'
    when ep.current_stage in ('recepcion') then 'received'
    when ep.current_stage in ('preparacion') then 'analyzed'
    when ep.current_stage in ('edicion_editorial') then 'content_edited'
    when ep.current_stage in ('correccion_linguistica') then 'proofread'
    when ep.current_stage in ('preprensa_kdp') then 'validated'
    when ep.current_stage in ('briefing_portada', 'generacion_portada') then 'cover_ready'
    when ep.current_stage in ('maquetacion_interior') then 'layout_ready'
    when ep.current_stage in ('validacion_paginas') then 'qa_passed'
    when ep.current_stage in ('entrega_final') then 'packaged'
    when ep.current_stage in ('marketing_editorial') then 'marketed'
    else 'received'
  end,
  case
    when coalesce(ep.status, '') = 'completed' then 'completed'
    when coalesce(ep.status, '') = 'failed' then 'failed'
    else 'active'
  end,
  jsonb_strip_nulls(
    jsonb_build_object(
      'legacy_current_stage', ep.current_stage,
      'legacy_status', ep.status,
      'legacy_workflow_phase', pw.current_phase,
      'legacy_workflow_stage', pw.current_stage
    )
  ),
  jsonb_build_object(
    'legacy_progress_percent', coalesce(ep.progress_percent, 0)
  ),
  ep.created_at,
  coalesce(ep.updated_at, ep.created_at, now())
from public.editorial_projects ep
left join public.editorial_project_workflow pw
  on pw.project_id = ep.id
on conflict (project_id) do nothing;

update public.editorial_projects ep
set current_status = ew.current_state,
    manuscript_source = coalesce(ep.manuscript_source, 'upload')
from public.editorial_workflows ew
where ew.project_id = ep.id
  and (ep.current_status is null or ep.manuscript_source is null);

-- 9. Backfill manuscript assets ----------------------------------------------

with ranked_files as (
  select
    ef.*,
    row_number() over (
      partition by ef.project_id
      order by coalesce(ef.version, 1) desc, ef.created_at desc, ef.id desc
    ) as project_rank
  from public.editorial_files ef
  where ef.file_type in ('manuscript_original', 'manuscript', 'original_manuscript')
)
insert into public.manuscript_assets (
  project_id,
  workflow_id,
  asset_kind,
  source_type,
  source_label,
  source_uri,
  original_file_name,
  mime_type,
  checksum,
  size_bytes,
  extracted_text_uri,
  version,
  is_current,
  details,
  uploaded_at,
  created_at,
  updated_at
)
select
  rf.project_id,
  ew.id,
  'manuscript',
  'upload',
  coalesce(nullif(regexp_replace(rf.storage_path, '^.*/', ''), ''), rf.file_type),
  rf.storage_path,
  coalesce(nullif(regexp_replace(rf.storage_path, '^.*/', ''), ''), rf.file_type),
  coalesce(rf.mime_type, 'application/octet-stream'),
  null,
  rf.size_bytes,
  null,
  greatest(coalesce(rf.version, 1), 1),
  rf.project_rank = 1,
  jsonb_build_object(
    'legacy_file_id', rf.id,
    'legacy_stage_key', rf.stage_key,
    'legacy_visibility', rf.visibility
  ),
  rf.created_at,
  rf.created_at,
  rf.created_at
from ranked_files rf
left join public.editorial_workflows ew
  on ew.project_id = rf.project_id
where not exists (
  select 1
  from public.manuscript_assets ma
  where ma.project_id = rf.project_id
    and ma.asset_kind = 'manuscript'
    and ma.version = greatest(coalesce(rf.version, 1), 1)
);

update public.manuscript_assets ma
set workflow_id = ew.id
from public.editorial_workflows ew
where ew.project_id = ma.project_id
  and ma.workflow_id is null;

update public.editorial_projects ep
set current_manuscript_asset_id = ma.id
from public.manuscript_assets ma
where ma.project_id = ep.id
  and ma.asset_kind = 'manuscript'
  and ma.is_current = true
  and ep.current_manuscript_asset_id is null;

-- 10. Link runtime stages to canonical workflows -----------------------------

update public.editorial_project_workflow_stages ps
set workflow_id = ew.id,
    finished_at = coalesce(ps.finished_at, ps.completed_at)
from public.editorial_workflows ew
where ew.project_id = ps.project_id
  and (ps.workflow_id is null or ps.finished_at is null);

commit;
