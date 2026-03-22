create table if not exists public.editorial_stage_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  stage_key text not null,
  status text not null default 'ready',
  sequence_number integer not null default 1,
  owner_user_id uuid null,
  reviewer_user_id uuid null,
  approver_user_id uuid null,
  input_version_id uuid null,
  output_version_id uuid null,
  ai_summary text null,
  quality_score numeric(5,2) null,
  started_at timestamptz null,
  submitted_for_review_at timestamptz null,
  approved_at timestamptz null,
  closed_at timestamptz null,
  reopened_from_run_id uuid null references public.editorial_stage_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_stage_runs_status_check check (
    status in ('ready', 'ai_processing', 'human_review', 'changes_requested', 'approved', 'locked', 'failed')
  )
);

create unique index if not exists editorial_stage_runs_project_stage_sequence_idx
  on public.editorial_stage_runs(project_id, stage_key, sequence_number);

create index if not exists editorial_stage_runs_project_status_idx
  on public.editorial_stage_runs(project_id, status);

create table if not exists public.editorial_file_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  stage_run_id uuid null references public.editorial_stage_runs(id) on delete set null,
  source_version_id uuid null references public.editorial_file_versions(id) on delete set null,
  file_role text not null,
  version_number integer not null,
  label text null,
  storage_path text not null,
  preview_path text null,
  mime_type text null,
  checksum text null,
  size_bytes bigint null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  is_locked boolean not null default false,
  constraint editorial_file_versions_role_check check (
    file_role in (
      'manuscript_original',
      'editorial_diagnosis',
      'editorial_working',
      'master_text',
      'interior_pdf',
      'cover_concept',
      'cover_final',
      'proof_pack',
      'distribution_asset'
    )
  )
);

create unique index if not exists editorial_file_versions_project_role_version_idx
  on public.editorial_file_versions(project_id, file_role, version_number);

create index if not exists editorial_file_versions_project_stage_run_idx
  on public.editorial_file_versions(project_id, stage_run_id);

alter table public.editorial_stage_runs
  add constraint editorial_stage_runs_input_version_fk
  foreign key (input_version_id) references public.editorial_file_versions(id) on delete set null;

alter table public.editorial_stage_runs
  add constraint editorial_stage_runs_output_version_fk
  foreign key (output_version_id) references public.editorial_file_versions(id) on delete set null;

create table if not exists public.editorial_findings_v2 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  stage_run_id uuid null references public.editorial_stage_runs(id) on delete set null,
  file_version_id uuid null references public.editorial_file_versions(id) on delete set null,
  job_id uuid null references public.editorial_jobs(id) on delete set null,
  finding_type text not null,
  severity text not null,
  location_ref jsonb null,
  title text not null,
  description text not null,
  suggestion text null,
  evidence_ref jsonb null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_findings_v2_type_check check (
    finding_type in ('editorial', 'structural', 'style', 'grammar', 'layout', 'metadata', 'production', 'commercial')
  ),
  constraint editorial_findings_v2_severity_check check (
    severity in ('info', 'warning', 'critical')
  ),
  constraint editorial_findings_v2_status_check check (
    status in ('open', 'accepted', 'rejected', 'resolved', 'waived')
  )
);

create index if not exists editorial_findings_v2_project_stage_idx
  on public.editorial_findings_v2(project_id, stage_run_id, status, severity);

create table if not exists public.editorial_approvals_v2 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  stage_run_id uuid not null references public.editorial_stage_runs(id) on delete cascade,
  approval_type text not null,
  decision text not null,
  notes text null,
  approved_by uuid null,
  approved_at timestamptz not null default now(),
  constraint editorial_approvals_v2_type_check check (
    approval_type in ('stage_gate', 'content_approval', 'design_approval', 'production_approval', 'publication_approval')
  ),
  constraint editorial_approvals_v2_decision_check check (
    decision in ('approved', 'changes_requested', 'rejected')
  )
);

create index if not exists editorial_approvals_v2_project_stage_idx
  on public.editorial_approvals_v2(project_id, stage_run_id, approved_at desc);

create table if not exists public.editorial_stage_run_checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.editorial_projects(id) on delete cascade,
  stage_run_id uuid not null references public.editorial_stage_runs(id) on delete cascade,
  stage_key text not null,
  status text not null default 'open',
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_stage_run_checklists_status_check check (
    status in ('open', 'completed')
  )
);

create unique index if not exists editorial_stage_run_checklists_stage_run_idx
  on public.editorial_stage_run_checklists(stage_run_id);

create table if not exists public.editorial_stage_run_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.editorial_stage_run_checklists(id) on delete cascade,
  item_key text not null,
  label text not null,
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_by uuid null,
  completed_at timestamptz null,
  evidence_version_id uuid null references public.editorial_file_versions(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists editorial_stage_run_checklist_items_unique_idx
  on public.editorial_stage_run_checklist_items(checklist_id, item_key);

alter table public.editorial_projects
  add column if not exists current_stage_run_id uuid null references public.editorial_stage_runs(id) on delete set null;

alter table public.editorial_projects
  add column if not exists current_version_id uuid null references public.editorial_file_versions(id) on delete set null;

alter table public.editorial_projects
  add column if not exists project_status_v2 text null;

alter table public.editorial_projects
  add constraint editorial_projects_status_v2_check
  check (
    project_status_v2 is null
    or project_status_v2 in ('draft', 'active', 'blocked', 'in_review', 'ready_for_publication', 'published', 'archived')
  );
