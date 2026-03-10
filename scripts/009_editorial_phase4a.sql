-- =============================================================
-- Phase 4A: Editorial Workflow Intelligence
-- Reino Editorial AI Engine — Hebeling OS
-- =============================================================

-- =========================
-- ENUMS
-- =========================
do $$ begin
  create type editorial_stage as enum (
    'ingesta',
    'estructura',
    'estilo',
    'ortotipografia',
    'maquetacion',
    'revision_final'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_stage_status as enum (
    'pending',
    'in_progress',
    'completed',
    'blocked',
    'reopened'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_event_type as enum (
    'book_created',
    'stage_started',
    'stage_completed',
    'stage_blocked',
    'stage_reopened',
    'checklist_item_checked',
    'checklist_item_unchecked',
    'member_assigned',
    'member_unassigned',
    'alert_created',
    'alert_resolved',
    'override_applied'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_alert_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_alert_type as enum (
    'no_assignee',
    'incomplete_checklist',
    'stage_overdue',
    'missing_output',
    'blocked_progression'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_role as enum (
    'editor_jefe',
    'editor',
    'corrector',
    'disenador',
    'revisor'
  );
exception
  when duplicate_object then null;
end $$;

-- =========================
-- EDITORIAL BOOKS
-- Central entity — one per book being processed through the pipeline
-- =========================
create table if not exists editorial_books (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  title text not null,
  author text,
  isbn text,
  current_stage editorial_stage not null default 'ingesta',
  overall_status editorial_stage_status not null default 'pending',
  due_date date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- EDITORIAL BOOK MEMBERS
-- Team members assigned to a book, with editorial role & capability flags
-- =========================
create table if not exists editorial_book_members (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references editorial_books(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  editorial_role editorial_role not null default 'editor',
  can_advance_stage boolean not null default false,
  can_reopen_stage boolean not null default false,
  can_override_rules boolean not null default false,
  assigned_stages editorial_stage[] default '{}',
  assigned_at timestamptz not null default now(),
  unique(book_id, user_id)
);

-- =========================
-- STAGE RULE DEFINITIONS
-- Configurable blocking/advisory rules per editorial stage
-- =========================
create table if not exists editorial_stage_rule_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stage editorial_stage not null,
  rule_key text not null,
  rule_label text not null,
  description text,
  is_blocking boolean not null default true,
  is_active boolean not null default true,
  config jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(org_id, stage, rule_key)
);

-- =========================
-- CHECKLIST TEMPLATES
-- Reusable checklist templates per editorial stage
-- =========================
create table if not exists editorial_stage_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stage editorial_stage not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================
-- CHECKLIST TEMPLATE ITEMS
-- Items within a checklist template
-- =========================
create table if not exists editorial_stage_checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references editorial_stage_checklist_templates(id) on delete cascade,
  label text not null,
  description text,
  is_required boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- =========================
-- BOOK STAGE CHECKLISTS
-- One checklist instance per book per stage (instantiated from template)
-- =========================
create table if not exists editorial_book_stage_checklists (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references editorial_books(id) on delete cascade,
  stage editorial_stage not null,
  template_id uuid references editorial_stage_checklist_templates(id) on delete set null,
  status editorial_stage_status not null default 'pending',
  assignee_id uuid references profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  unique(book_id, stage)
);

-- =========================
-- BOOK STAGE CHECKLIST ITEMS
-- Concrete checklist items for a given book+stage checklist
-- =========================
create table if not exists editorial_book_stage_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references editorial_book_stage_checklists(id) on delete cascade,
  template_item_id uuid references editorial_stage_checklist_template_items(id) on delete set null,
  label text not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by uuid references profiles(id) on delete set null,
  checked_at timestamptz,
  position int not null default 0
);

-- =========================
-- WORKFLOW EVENTS
-- Immutable audit trail of all editorial pipeline events
-- =========================
create table if not exists editorial_workflow_events (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references editorial_books(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  event_type editorial_event_type not null,
  stage editorial_stage,
  performed_by uuid references profiles(id) on delete set null,
  target_user_id uuid references profiles(id) on delete set null,
  payload jsonb default '{}',
  reason text,
  is_override boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now()
);

-- =========================
-- BOOK ALERTS
-- Active or resolved alerts per book (visible in dashboard & detail view)
-- =========================
create table if not exists editorial_book_alerts (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references editorial_books(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  alert_type editorial_alert_type not null,
  severity editorial_alert_severity not null default 'warning',
  stage editorial_stage,
  message text not null,
  is_resolved boolean not null default false,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================
create or replace function editorial_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_editorial_books_updated_at on editorial_books;
create trigger set_editorial_books_updated_at
  before update on editorial_books
  for each row execute function editorial_set_updated_at();

-- =========================
-- VIEWS
-- =========================

-- Current stage summary per book
create or replace view editorial_book_current_stage_view as
select
  b.id as book_id,
  b.org_id,
  b.brand_id,
  b.title,
  b.author,
  b.current_stage,
  b.overall_status,
  b.due_date,
  b.created_at,
  b.updated_at,
  cl.id as checklist_id,
  cl.status as stage_status,
  cl.assignee_id,
  p.full_name as assignee_name,
  count(cli.id) filter (where cli.is_required) as required_items_total,
  count(cli.id) filter (where cli.is_required and cli.is_checked) as required_items_done
from editorial_books b
left join editorial_book_stage_checklists cl
  on cl.book_id = b.id and cl.stage = b.current_stage
left join editorial_book_stage_checklist_items cli
  on cli.checklist_id = cl.id
left join profiles p
  on p.id = cl.assignee_id
group by
  b.id, b.org_id, b.brand_id, b.title, b.author,
  b.current_stage, b.overall_status, b.due_date,
  b.created_at, b.updated_at,
  cl.id, cl.status, cl.assignee_id, p.full_name;

-- Books with active unresolved alerts (blocked detection)
create or replace view editorial_blocked_books_view as
select
  b.id as book_id,
  b.org_id,
  b.title,
  b.current_stage,
  b.overall_status,
  b.due_date,
  count(a.id) as alert_count,
  count(a.id) filter (where a.severity = 'critical') as critical_alert_count,
  count(a.id) filter (where a.severity = 'warning') as warning_alert_count,
  max(a.created_at) as latest_alert_at
from editorial_books b
join editorial_book_alerts a
  on a.book_id = b.id and not a.is_resolved
where b.overall_status not in ('completed')
group by b.id, b.org_id, b.title, b.current_stage, b.overall_status, b.due_date
having count(a.id) > 0;

-- Stage metrics per org
create or replace view editorial_stage_metrics_view as
select
  b.org_id,
  b.current_stage as stage,
  count(b.id) as books_in_stage,
  count(b.id) filter (where b.overall_status = 'blocked') as blocked_count,
  count(b.id) filter (where b.overall_status = 'in_progress') as in_progress_count,
  avg(
    extract(epoch from (now() - cl.started_at)) / 86400
  ) filter (where cl.started_at is not null) as avg_days_in_stage
from editorial_books b
left join editorial_book_stage_checklists cl
  on cl.book_id = b.id and cl.stage = b.current_stage
where b.overall_status not in ('completed')
group by b.org_id, b.current_stage;

-- Staff workload
create or replace view editorial_staff_workload_view as
select
  m.user_id,
  m.org_id,
  p.full_name,
  p.email,
  count(distinct m.book_id) as books_assigned,
  count(distinct cl.id) filter (where cl.status = 'in_progress') as active_checklists
from (
  select bm.user_id, bm.book_id, b.org_id
  from editorial_book_members bm
  join editorial_books b on b.id = bm.book_id
) m
left join profiles p on p.id = m.user_id
left join editorial_book_stage_checklists cl
  on cl.book_id = m.book_id and cl.assignee_id = m.user_id
group by m.user_id, m.org_id, p.full_name, p.email;

-- =========================
-- ROW LEVEL SECURITY
-- =========================
alter table editorial_books enable row level security;
alter table editorial_book_members enable row level security;
alter table editorial_stage_rule_definitions enable row level security;
alter table editorial_stage_checklist_templates enable row level security;
alter table editorial_stage_checklist_template_items enable row level security;
alter table editorial_book_stage_checklists enable row level security;
alter table editorial_book_stage_checklist_items enable row level security;
alter table editorial_workflow_events enable row level security;
alter table editorial_book_alerts enable row level security;

-- editorial_books: staff read/write within org
drop policy if exists "staff read editorial books in org" on editorial_books;
create policy "staff read editorial books in org"
on editorial_books for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff insert editorial books" on editorial_books;
create policy "staff insert editorial books"
on editorial_books for insert
with check (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff update editorial books" on editorial_books;
create policy "staff update editorial books"
on editorial_books for update
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- editorial_book_members
drop policy if exists "staff read editorial book members" on editorial_book_members;
create policy "staff read editorial book members"
on editorial_book_members for select
using (
  exists (
    select 1 from editorial_books b
    where b.id = editorial_book_members.book_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff manage editorial book members" on editorial_book_members;
create policy "staff manage editorial book members"
on editorial_book_members for all
using (
  exists (
    select 1 from editorial_books b
    where b.id = editorial_book_members.book_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- editorial_stage_rule_definitions
drop policy if exists "staff read stage rules" on editorial_stage_rule_definitions;
create policy "staff read stage rules"
on editorial_stage_rule_definitions for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "admin manage stage rules" on editorial_stage_rule_definitions;
create policy "admin manage stage rules"
on editorial_stage_rule_definitions for all
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin')
);

-- editorial_stage_checklist_templates
drop policy if exists "staff read checklist templates" on editorial_stage_checklist_templates;
create policy "staff read checklist templates"
on editorial_stage_checklist_templates for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "admin manage checklist templates" on editorial_stage_checklist_templates;
create policy "admin manage checklist templates"
on editorial_stage_checklist_templates for all
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin')
);

-- editorial_stage_checklist_template_items
drop policy if exists "staff read checklist template items" on editorial_stage_checklist_template_items;
create policy "staff read checklist template items"
on editorial_stage_checklist_template_items for select
using (
  exists (
    select 1 from editorial_stage_checklist_templates t
    where t.id = editorial_stage_checklist_template_items.template_id
      and t.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "admin manage checklist template items" on editorial_stage_checklist_template_items;
create policy "admin manage checklist template items"
on editorial_stage_checklist_template_items for all
using (
  exists (
    select 1 from editorial_stage_checklist_templates t
    where t.id = editorial_stage_checklist_template_items.template_id
      and t.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin')
);

-- editorial_book_stage_checklists
drop policy if exists "staff read book stage checklists" on editorial_book_stage_checklists;
create policy "staff read book stage checklists"
on editorial_book_stage_checklists for select
using (
  exists (
    select 1 from editorial_books b
    where b.id = editorial_book_stage_checklists.book_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff manage book stage checklists" on editorial_book_stage_checklists;
create policy "staff manage book stage checklists"
on editorial_book_stage_checklists for all
using (
  exists (
    select 1 from editorial_books b
    where b.id = editorial_book_stage_checklists.book_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- editorial_book_stage_checklist_items
drop policy if exists "staff read checklist items" on editorial_book_stage_checklist_items;
create policy "staff read checklist items"
on editorial_book_stage_checklist_items for select
using (
  exists (
    select 1 from editorial_book_stage_checklists cl
    join editorial_books b on b.id = cl.book_id
    where cl.id = editorial_book_stage_checklist_items.checklist_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff manage checklist items" on editorial_book_stage_checklist_items;
create policy "staff manage checklist items"
on editorial_book_stage_checklist_items for all
using (
  exists (
    select 1 from editorial_book_stage_checklists cl
    join editorial_books b on b.id = cl.book_id
    where cl.id = editorial_book_stage_checklist_items.checklist_id
      and b.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- editorial_workflow_events
drop policy if exists "staff read workflow events" on editorial_workflow_events;
create policy "staff read workflow events"
on editorial_workflow_events for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff insert workflow events" on editorial_workflow_events;
create policy "staff insert workflow events"
on editorial_workflow_events for insert
with check (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- editorial_book_alerts
drop policy if exists "staff read book alerts" on editorial_book_alerts;
create policy "staff read book alerts"
on editorial_book_alerts for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
);

drop policy if exists "staff manage book alerts" on editorial_book_alerts;
create policy "staff manage book alerts"
on editorial_book_alerts for all
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

-- =========================
-- DEFAULT SEED DATA
-- Seed default rules and checklist templates for each stage
-- =========================

-- This function seeds defaults for an org if not already present
create or replace function editorial_seed_defaults(p_org_id uuid)
returns void as $$
declare
  v_template_id uuid;
begin
  -- ---- RULE DEFINITIONS ----
  insert into editorial_stage_rule_definitions
    (org_id, stage, rule_key, rule_label, description, is_blocking, is_active)
  values
    (p_org_id, 'ingesta',        'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'ingesta',        'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'estructura',     'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'estructura',     'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'estilo',         'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'estilo',         'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'ortotipografia', 'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'ortotipografia', 'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'maquetacion',    'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'maquetacion',    'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'revision_final', 'require_assignee',           'Responsable requerido',              'La etapa no puede iniciar sin responsable asignado', true,  true),
    (p_org_id, 'revision_final', 'require_checklist_complete',  'Checklist completado',               'Todos los ítems requeridos deben estar marcados',    true,  true),
    (p_org_id, 'revision_final', 'require_supervisor_approval', 'Aprobación de supervisor requerida', 'Revisión final requiere aprobación de editor jefe',  true,  true)
  on conflict (org_id, stage, rule_key) do nothing;

  -- ---- CHECKLIST TEMPLATES ----

  -- INGESTA
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'ingesta', 'Checklist de Ingesta', 'Verificación inicial del manuscrito')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Recibir archivo original del autor', true, 1),
    (v_template_id, 'Verificar formato del archivo (DOC/DOCX/PDF)', true, 2),
    (v_template_id, 'Registrar metadatos del libro (título, autor, ISBN)', true, 3),
    (v_template_id, 'Confirmar número de páginas y extensión', true, 4),
    (v_template_id, 'Validar derechos de autor y contrato firmado', true, 5),
    (v_template_id, 'Crear carpeta del proyecto en el servidor', false, 6);

  -- ESTRUCTURA
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'estructura', 'Checklist de Estructura', 'Revisión y organización de la estructura del contenido')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Revisar coherencia de capítulos y secciones', true, 1),
    (v_template_id, 'Verificar tabla de contenidos', true, 2),
    (v_template_id, 'Identificar inconsistencias narrativas o temáticas', true, 3),
    (v_template_id, 'Devolver observaciones al autor si aplica', false, 4),
    (v_template_id, 'Aprobar estructura final', true, 5);

  -- ESTILO
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'estilo', 'Checklist de Estilo', 'Revisión y ajuste del estilo narrativo y redacción')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Revisar voz narrativa y consistencia de estilo', true, 1),
    (v_template_id, 'Ajustar registro y tono según guía editorial', true, 2),
    (v_template_id, 'Eliminar redundancias y repeticiones', true, 3),
    (v_template_id, 'Revisar fluidez de párrafos', true, 4),
    (v_template_id, 'Verificar cohesión entre capítulos', false, 5);

  -- ORTOTIPOGRAFIA
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'ortotipografia', 'Checklist de Ortotipografía', 'Corrección ortográfica, gramatical y tipográfica')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Corrección ortográfica completa', true, 1),
    (v_template_id, 'Revisión gramatical y sintáctica', true, 2),
    (v_template_id, 'Normalización tipográfica (comillas, guiones, etc.)', true, 3),
    (v_template_id, 'Verificar uso correcto de mayúsculas y minúsculas', true, 4),
    (v_template_id, 'Revisar números y cifras según normas', true, 5),
    (v_template_id, 'Comprobar referencias bibliográficas', false, 6);

  -- MAQUETACION
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'maquetacion', 'Checklist de Maquetación', 'Diseño y maquetación del libro')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Aplicar plantilla de diseño aprobada', true, 1),
    (v_template_id, 'Maquetar interior del libro', true, 2),
    (v_template_id, 'Diseñar portada según lineamientos', true, 3),
    (v_template_id, 'Verificar márgenes, sangría y paginación', true, 4),
    (v_template_id, 'Revisar calidad de imágenes e ilustraciones', false, 5),
    (v_template_id, 'Exportar PDF de imprenta y digital', true, 6),
    (v_template_id, 'Enviar prueba al autor para validación', false, 7);

  -- REVISION_FINAL
  insert into editorial_stage_checklist_templates (org_id, stage, name, description)
  values (p_org_id, 'revision_final', 'Checklist de Revisión Final', 'Revisión y aprobación final antes de publicación')
  returning id into v_template_id;

  insert into editorial_stage_checklist_template_items (template_id, label, is_required, position) values
    (v_template_id, 'Revisión integral del PDF final', true, 1),
    (v_template_id, 'Verificar datos legales y de copyright', true, 2),
    (v_template_id, 'Confirmar ISBN y datos de catalogación', true, 3),
    (v_template_id, 'Aprobación del autor (firma o confirmación escrita)', true, 4),
    (v_template_id, 'Aprobación del editor jefe', true, 5),
    (v_template_id, 'Enviar a imprenta o plataforma digital', true, 6),
    (v_template_id, 'Registrar fecha de publicación', false, 7);
end;
$$ language plpgsql;
