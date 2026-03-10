-- =============================================================================
-- Phase 9–13 Architecture Audit Fixes
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Addresses all Tier-1 (critical) and select Tier-2 (important) issues
-- identified in docs/architecture-audit-phases-9-13.md
--
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS / OR REPLACE.
-- Does NOT modify any existing row data.
-- Depends on: 015–019 already applied.
-- =============================================================================

-- ============================================================
-- 0. SHARED TRIGGER FUNCTION — set_updated_at
-- ============================================================
-- Creates a single reusable trigger function that sets
-- updated_at = now() before every UPDATE on tables that carry
-- that column.  Applied to all 26+ tables below.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Reusable before-update trigger that stamps updated_at = now(). Applied to all editorial_* tables with an updated_at column.';


-- ============================================================
-- 1. editorial_project_members (missing foundational table)
-- ============================================================
-- This table was referenced in every phase RLS specification
-- but was never created.  It is the correct anchor for all
-- project-level access control across staff, authors, and
-- external collaborators.
-- ============================================================

create table if not exists editorial_project_members (
  id          uuid        primary key default gen_random_uuid(),

  project_id  uuid        not null
                references editorial_projects(id) on delete cascade,

  -- The member — can be a staff user, author, or future external collaborator
  user_id     uuid        not null
                references auth.users(id) on delete cascade,

  -- Member role within this project
  role        text        not null default 'viewer'
                check (role in (
                  'owner',       -- project creator / primary owner
                  'editor',      -- can edit and submit stages
                  'reviewer',    -- can approve / reject stages
                  'viewer'       -- read-only access
                )),

  added_by    uuid        references auth.users(id) on delete set null,

  created_at  timestamptz not null default now(),

  unique (project_id, user_id)
);

comment on table editorial_project_members is
  'Project membership table. Enables multi-user project access without relying on single created_by ownership. Used as the primary anchor for project-scoped RLS across distribution, billing, and CRM.';
comment on column editorial_project_members.role is
  'owner | editor | reviewer | viewer. Controls what operations the member can perform on project-related records.';

create index if not exists idx_proj_members_project
  on editorial_project_members(project_id);

create index if not exists idx_proj_members_user
  on editorial_project_members(user_id);

create index if not exists idx_proj_members_project_user
  on editorial_project_members(project_id, user_id);

alter table editorial_project_members enable row level security;

-- Staff can fully manage membership
drop policy if exists "staff manage project members" on editorial_project_members;
create policy "staff manage project members"
  on editorial_project_members for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Members can read their own memberships
drop policy if exists "users read own memberships" on editorial_project_members;
create policy "users read own memberships"
  on editorial_project_members for select
  using (user_id = auth.uid());


-- ============================================================
-- 2. CRITICAL: Fix UNIQUE on editorial_distribution_submissions
-- ============================================================
-- The original UNIQUE(project_id, channel_id, format_id) silently
-- breaks when format_id IS NULL (PostgreSQL treats NULL != NULL in
-- unique constraints, so duplicates accumulate unchecked).
-- Replace with two partial unique indexes.
-- ============================================================

-- Drop the broken unique constraint (added inline in the table definition)
alter table editorial_distribution_submissions
  drop constraint if exists editorial_distribution_submissions_project_id_channel_id_form;

-- Also try alternate name patterns Postgres may have auto-generated:
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'editorial_distribution_submissions'::regclass
    and contype = 'u'
    and conname ilike '%project_id%channel_id%';
  if con_name is not null then
    execute 'alter table editorial_distribution_submissions drop constraint ' || quote_ident(con_name);
  end if;
exception when others then null;
end $$;

-- Case 1: format_id IS NULL — unique per (project, channel)
create unique index if not exists uq_dist_submissions_no_format
  on editorial_distribution_submissions(project_id, channel_id)
  where format_id is null;

-- Case 2: format_id IS NOT NULL — unique per (project, channel, format)
create unique index if not exists uq_dist_submissions_with_format
  on editorial_distribution_submissions(project_id, channel_id, format_id)
  where format_id is not null;

comment on index uq_dist_submissions_no_format is
  'Prevents duplicate channel-level submissions for the same project when no format is specified.';
comment on index uq_dist_submissions_with_format is
  'Prevents duplicate format-specific submissions for the same project+channel+format combination.';


-- ============================================================
-- 3. CRITICAL: Fix editorial_financial_ledger ON DELETE CASCADE
-- ============================================================
-- project_id had ON DELETE CASCADE — deleting a project would
-- silently erase its entire financial history. Financial ledger
-- entries are immutable audit records and must survive project
-- deletion.  Change to SET NULL and add a reference text column
-- for human-readable project identity after deletion.
-- ============================================================

-- Add project_reference_code for post-deletion traceability
alter table editorial_financial_ledger
  add column if not exists project_reference_code text;

comment on column editorial_financial_ledger.project_reference_code is
  'Human-readable backup of the project title/code. Preserved even if the project is deleted (project_id becomes NULL).';

-- Drop the old CASCADE FK and replace with SET NULL
-- (Cannot ALTER FK constraint in-place in Postgres; must drop and re-add)
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'editorial_financial_ledger'::regclass
    and contype = 'f'
    and conname ilike '%project_id%';
  if con_name is not null then
    execute 'alter table editorial_financial_ledger drop constraint ' || quote_ident(con_name);
    execute 'alter table editorial_financial_ledger add constraint fk_ledger_project
               foreign key (project_id) references editorial_projects(id) on delete set null';
  end if;
exception when others then
  raise notice 'Could not modify ledger project_id FK: %', sqlerrm;
end $$;


-- ============================================================
-- 4. CRITICAL: Fix editorial_sla_trackers ON DELETE CASCADE
-- ============================================================
-- All four context FKs (project, task, order, submission) used
-- CASCADE, meaning deleting any one entity destroyed the SLA
-- tracker including its breach history.
-- Change all to SET NULL to preserve audit trails.
-- ============================================================

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'editorial_sla_trackers'::regclass
      and contype = 'f'
      and conname in (
        select conname from pg_constraint
        where conrelid = 'editorial_sla_trackers'::regclass
          and contype = 'f'
      )
  loop
    begin
      execute 'alter table editorial_sla_trackers drop constraint ' || quote_ident(con.conname);
    exception when others then
      raise notice 'Skipping constraint %: %', con.conname, sqlerrm;
    end;
  end loop;
end $$;

-- Re-add all four FKs with SET NULL
alter table editorial_sla_trackers
  add constraint if not exists fk_sla_policy
    foreign key (sla_policy_id) references editorial_sla_policies(id) on delete restrict,
  add constraint if not exists fk_sla_project
    foreign key (project_id)    references editorial_projects(id) on delete set null,
  add constraint if not exists fk_sla_task
    foreign key (task_id)       references editorial_operational_tasks(id) on delete set null,
  add constraint if not exists fk_sla_order
    foreign key (order_id)      references editorial_marketplace_orders(id) on delete set null,
  add constraint if not exists fk_sla_submission
    foreign key (submission_id) references editorial_distribution_submissions(id) on delete set null;

-- Update the not-null check to be compatible with post-deletion nulls:
-- The original CHECK required at least one to be non-null *at insert time*.
-- After SET NULL deletions, all four may become null — that's acceptable for audit.
-- The original constraint is an INSERT/UPDATE constraint (checked at DML time, not retroactively),
-- so existing rows that become all-null after a cascade are fine.


-- ============================================================
-- 5. CRITICAL: Fix editorial_alerts context FKs (same issue)
-- ============================================================
-- task_id ON DELETE CASCADE removes alerts when a task is
-- deleted, destroying operational alert history.
-- ============================================================

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'editorial_alerts'::regclass
      and contype = 'f'
      and conname ilike 'fk_alert%'
  loop
    begin
      execute 'alter table editorial_alerts drop constraint ' || quote_ident(con.conname);
    exception when others then
      raise notice 'Skipping %: %', con.conname, sqlerrm;
    end;
  end loop;
end $$;

-- Re-add with SET NULL to preserve alert history
alter table editorial_alerts
  add constraint if not exists fk_alert_project
    foreign key (project_id)    references editorial_projects(id) on delete set null,
  add constraint if not exists fk_alert_task
    foreign key (task_id)       references editorial_operational_tasks(id) on delete set null,
  add constraint if not exists fk_alert_order
    foreign key (order_id)      references editorial_marketplace_orders(id) on delete set null,
  add constraint if not exists fk_alert_submission
    foreign key (submission_id) references editorial_distribution_submissions(id) on delete set null;


-- ============================================================
-- 6. Add updated_at column to tables that are missing it
-- ============================================================

-- editorial_distribution_formats (mutable: enabled, page_count, file refs change)
alter table editorial_distribution_formats
  add column if not exists updated_at timestamptz not null default now();

-- editorial_distribution_issues (mutable: status changes, resolved_by, resolved_at)
alter table editorial_distribution_issues
  add column if not exists updated_at timestamptz not null default now();

-- editorial_distribution_identifiers (immutable once set — no updated_at needed)
-- editorial_distribution_artifacts    (immutable once generated — no updated_at needed)
-- editorial_distribution_events       (immutable audit trail — no updated_at needed)
-- editorial_intelligence_events       (immutable audit trail — no updated_at needed)
-- editorial_billing_events            (immutable audit trail — no updated_at needed)
-- editorial_os_events                 (immutable audit trail — no updated_at needed)


-- ============================================================
-- 7. Apply set_updated_at triggers to all mutable tables
-- ============================================================
-- Phases 015–019 have 26+ tables with updated_at columns but
-- no triggers to keep them current. Apply the shared function.
-- ============================================================

-- Helper: create trigger only if it doesn't already exist
do $$
declare
  t record;
begin
  for t in values
    ('editorial_book_metadata'),
    ('editorial_distribution_submissions'),
    ('editorial_distribution_formats'),
    ('editorial_distribution_issues'),
    ('editorial_staff_profiles'),
    ('editorial_operational_tasks'),
    ('editorial_sla_trackers'),
    ('editorial_financial_ledger'),
    ('editorial_alerts'),
    ('editorial_crm_organizations'),
    ('editorial_crm_contacts'),
    ('editorial_crm_leads'),
    ('editorial_crm_opportunities'),
    ('editorial_crm_service_packages'),
    ('editorial_crm_quotes'),
    ('editorial_crm_followups'),
    ('editorial_client_accounts'),
    ('editorial_contract_templates'),
    ('editorial_client_contracts'),
    ('editorial_contract_signatures'),
    ('editorial_invoices'),
    ('editorial_payment_schedules'),
    ('editorial_contract_renewals'),
    ('editorial_metric_definitions'),
    ('editorial_forecast_models'),
    ('editorial_forecast_runs'),
    ('editorial_scorecards'),
    ('editorial_anomaly_signals'),
    ('editorial_executive_reports'),
    ('editorial_recommendation_signals')
  loop
    begin
      execute format(
        'create trigger trg_%s_updated_at
           before update on %I
           for each row execute function public.set_updated_at()',
        replace(t.column1, 'editorial_', ''),
        t.column1
      );
    exception
      when duplicate_object then null; -- trigger already exists, skip
    end;
  end loop;
end $$;


-- ============================================================
-- 8. UNIQUE constraints for snapshot tables
-- ============================================================
-- Prevents duplicate rows from retry-looping scheduled jobs.
-- ============================================================

-- editorial_kpi_snapshots: unique per (date, scope_type) for global,
-- and (date, scope_type, scope_id) for scoped snapshots
create unique index if not exists uq_kpi_snapshots_global
  on editorial_kpi_snapshots(snapshot_date, scope_type)
  where scope_id is null;

create unique index if not exists uq_kpi_snapshots_scoped
  on editorial_kpi_snapshots(snapshot_date, scope_type, scope_id)
  where scope_id is not null;

-- editorial_crm_pipeline_snapshots: one global + one per owner per day
create unique index if not exists uq_crm_pipeline_snapshots_global
  on editorial_crm_pipeline_snapshots(snapshot_date)
  where owner_user_id is null;

create unique index if not exists uq_crm_pipeline_snapshots_owner
  on editorial_crm_pipeline_snapshots(snapshot_date, owner_user_id)
  where owner_user_id is not null;

-- editorial_billing_snapshots: one global + one per client account per day
create unique index if not exists uq_billing_snapshots_global
  on editorial_billing_snapshots(snapshot_date)
  where client_account_id is null;

create unique index if not exists uq_billing_snapshots_account
  on editorial_billing_snapshots(snapshot_date, client_account_id)
  where client_account_id is not null;

-- editorial_metric_snapshots: one value per (metric, date, period, scope)
create unique index if not exists uq_metric_snapshots_global
  on editorial_metric_snapshots(metric_definition_id, snapshot_date, period_type, scope_type)
  where scope_id is null;

create unique index if not exists uq_metric_snapshots_scoped
  on editorial_metric_snapshots(metric_definition_id, snapshot_date, period_type, scope_type, scope_id)
  where scope_id is not null;


-- ============================================================
-- 9. Balance/rating recomputation triggers
-- ============================================================
-- editorial_invoices.amount_paid + balance_due
-- editorial_payment_schedules.paid_amount + remaining_amount
-- editorial_professionals.rating
-- editorial_service_listings.rating + orders_count
-- ============================================================

-- 9a. Invoice balance recomputation
create or replace function public.recompute_invoice_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_total      numeric(14,2);
  v_paid       numeric(14,2);
begin
  -- Determine the affected invoice_id
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  if v_invoice_id is null then
    return coalesce(new, old);
  end if;

  select total_amount into v_total
  from editorial_invoices
  where id = v_invoice_id;

  select coalesce(sum(allocated_amount), 0) into v_paid
  from editorial_payment_allocations
  where invoice_id = v_invoice_id;

  update editorial_invoices
  set
    amount_paid = v_paid,
    balance_due = v_total - v_paid,
    updated_at  = now()
  where id = v_invoice_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_allocation_recompute_invoice on editorial_payment_allocations;
create trigger trg_allocation_recompute_invoice
  after insert or update or delete on editorial_payment_allocations
  for each row execute function public.recompute_invoice_balance();

-- 9b. Payment schedule recomputation
create or replace function public.recompute_schedule_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule_id uuid;
  v_expected    numeric(14,2);
  v_paid        numeric(14,2);
begin
  v_schedule_id := coalesce(new.payment_schedule_id, old.payment_schedule_id);

  if v_schedule_id is null then
    return coalesce(new, old);
  end if;

  select expected_amount into v_expected
  from editorial_payment_schedules
  where id = v_schedule_id;

  select coalesce(sum(allocated_amount), 0) into v_paid
  from editorial_payment_allocations
  where payment_schedule_id = v_schedule_id;

  update editorial_payment_schedules
  set
    paid_amount      = v_paid,
    remaining_amount = v_expected - v_paid,
    updated_at       = now()
  where id = v_schedule_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_allocation_recompute_schedule on editorial_payment_allocations;
create trigger trg_allocation_recompute_schedule
  after insert or update or delete on editorial_payment_allocations
  for each row execute function public.recompute_schedule_balance();

-- 9c. Professional aggregate rating + total_projects
create or replace function public.recompute_professional_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professional_id uuid;
  v_avg_rating      numeric(3,2);
  v_total_projects  integer;
begin
  -- editorial_reviews → professional via order → service_listing → professional
  select o.provider_id
  into v_professional_id
  from editorial_marketplace_orders o
  where o.id = coalesce(new.order_id, old.order_id)
  limit 1;

  if v_professional_id is null then
    return coalesce(new, old);
  end if;

  select
    coalesce(avg(r.rating::numeric), 0),
    count(distinct o2.id)
  into v_avg_rating, v_total_projects
  from editorial_marketplace_orders o2
  left join editorial_reviews r on r.order_id = o2.id
  where o2.provider_id = v_professional_id;

  update editorial_professionals
  set
    rating         = round(v_avg_rating, 2),
    total_projects = v_total_projects
  where user_id = v_professional_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_review_recompute_professional on editorial_reviews;
create trigger trg_review_recompute_professional
  after insert or update or delete on editorial_reviews
  for each row execute function public.recompute_professional_rating();

-- 9d. Service listing aggregate rating + orders_count
create or replace function public.recompute_listing_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_avg_rating numeric(3,2);
  v_orders_cnt integer;
begin
  select o.listing_id
  into v_listing_id
  from editorial_marketplace_orders o
  where o.id = coalesce(new.order_id, old.order_id)
  limit 1;

  if v_listing_id is null then
    return coalesce(new, old);
  end if;

  select
    coalesce(avg(r.rating::numeric), 0),
    count(distinct o2.id)
  into v_avg_rating, v_orders_cnt
  from editorial_marketplace_orders o2
  left join editorial_reviews r on r.order_id = o2.id
  where o2.listing_id = v_listing_id;

  update editorial_service_listings
  set
    rating       = round(v_avg_rating, 2),
    orders_count = v_orders_cnt
  where id = v_listing_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_review_recompute_listing on editorial_reviews;
create trigger trg_review_recompute_listing
  after insert or update or delete on editorial_reviews
  for each row execute function public.recompute_listing_rating();


-- ============================================================
-- 10. Missing composite indexes for high-traffic queries
-- ============================================================

-- editorial_financial_ledger: project P&L and period reports
create index if not exists idx_fin_ledger_project_direction_date
  on editorial_financial_ledger(project_id, direction, entry_date)
  where project_id is not null;

create index if not exists idx_fin_ledger_date_direction
  on editorial_financial_ledger(entry_date, direction);

-- editorial_invoices: "my overdue invoices" dashboard
create index if not exists idx_invoices_owner_status_due
  on editorial_invoices(owner_user_id, status, due_date)
  where owner_user_id is not null;

-- editorial_crm_opportunities: sales pipeline board
create index if not exists idx_crm_opps_owner_stage_close
  on editorial_crm_opportunities(owner_user_id, pipeline_stage, expected_close_date)
  where owner_user_id is not null and status = 'open';

-- editorial_crm_activities: "my upcoming activities"
create index if not exists idx_crm_activities_performer_scheduled
  on editorial_crm_activities(performed_by, scheduled_for)
  where completed_at is null;

-- editorial_operational_tasks: department task board
create index if not exists idx_op_tasks_dept_status_due
  on editorial_operational_tasks(department_id, status, due_at)
  where department_id is not null;

-- editorial_contract_signatures: "awaiting signature" queue
create index if not exists idx_signatures_contract_status
  on editorial_contract_signatures(contract_id, signature_status);

-- editorial_billing_events: account timeline
create index if not exists idx_billing_events_account_type_created
  on editorial_billing_events(client_account_id, event_type, created_at desc)
  where client_account_id is not null;

-- editorial_metric_snapshots: all metrics for a scope on a date
create index if not exists idx_metric_snapshots_scope_date_period
  on editorial_metric_snapshots(scope_type, scope_id, snapshot_date desc, period_type)
  where scope_id is not null;


-- ============================================================
-- 11. Add received_payment_id to editorial_financial_ledger
-- ============================================================
-- Bridges Phase 10 (financial ledger) with Phase 12 (billing
-- payments) for reconciliation traceability.
-- ============================================================

alter table editorial_financial_ledger
  add column if not exists received_payment_id uuid
    references editorial_received_payments(id) on delete set null;

comment on column editorial_financial_ledger.received_payment_id is
  'Links this ledger entry to a Phase 12 received payment for reconciliation. NULL for non-payment entries.';

create index if not exists idx_fin_ledger_payment
  on editorial_financial_ledger(received_payment_id)
  where received_payment_id is not null;


-- ============================================================
-- 12. Add anomaly_signal_id to editorial_alerts
-- ============================================================
-- Bridges Phase 10 (operational alerts) with Phase 13 (anomaly
-- signals) so high-severity anomalies generate actionable alerts.
-- ============================================================

alter table editorial_alerts
  add column if not exists anomaly_signal_id uuid
    references editorial_anomaly_signals(id) on delete set null;

comment on column editorial_alerts.anomaly_signal_id is
  'Links this alert to the Phase 13 anomaly signal that triggered it. NULL for manually created alerts.';

create index if not exists idx_alerts_anomaly_signal
  on editorial_alerts(anomaly_signal_id)
  where anomaly_signal_id is not null;


-- ============================================================
-- 13. CRM owner policies: add staff role guard
-- ============================================================
-- The original owner_user_id = auth.uid() policies allowed any
-- authenticated user to read CRM records.  Require staff role.
-- ============================================================

-- editorial_crm_organizations
drop policy if exists "owners read own crm orgs"   on editorial_crm_organizations;
drop policy if exists "owners update own crm orgs" on editorial_crm_organizations;
create policy "staff owners read crm orgs"
  on editorial_crm_organizations for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      public.get_my_role() in ('superadmin', 'admin')
      or owner_user_id = auth.uid()
    )
  );
create policy "staff owners update crm orgs"
  on editorial_crm_organizations for update
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and owner_user_id = auth.uid()
  );

-- editorial_crm_contacts
drop policy if exists "owners read own crm contacts"   on editorial_crm_contacts;
drop policy if exists "owners update own crm contacts" on editorial_crm_contacts;
create policy "staff owners read crm contacts"
  on editorial_crm_contacts for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      public.get_my_role() in ('superadmin', 'admin')
      or owner_user_id = auth.uid()
    )
  );
create policy "staff owners update crm contacts"
  on editorial_crm_contacts for update
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and owner_user_id = auth.uid()
  );

-- editorial_crm_leads
drop policy if exists "owners read own crm leads"   on editorial_crm_leads;
drop policy if exists "owners update own crm leads" on editorial_crm_leads;
create policy "staff owners read crm leads"
  on editorial_crm_leads for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      public.get_my_role() in ('superadmin', 'admin')
      or owner_user_id = auth.uid()
    )
  );
create policy "staff owners update crm leads"
  on editorial_crm_leads for update
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and owner_user_id = auth.uid()
  );

-- editorial_crm_opportunities
drop policy if exists "owners read own crm opportunities"   on editorial_crm_opportunities;
drop policy if exists "owners update own crm opportunities" on editorial_crm_opportunities;
create policy "staff owners read crm opportunities"
  on editorial_crm_opportunities for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      public.get_my_role() in ('superadmin', 'admin')
      or owner_user_id = auth.uid()
    )
  );
create policy "staff owners update crm opportunities"
  on editorial_crm_opportunities for update
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and owner_user_id = auth.uid()
  );


-- ============================================================
-- 14. Simplify author RLS in distribution tables
-- ============================================================
-- Replace the redundant sub-select against profiles with a
-- direct auth.uid() comparison and add project_members support.
-- ============================================================

-- editorial_book_metadata
drop policy if exists "authors read own book metadata" on editorial_book_metadata;
create policy "authors read own book metadata"
  on editorial_book_metadata for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_book_metadata.project_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_formats
drop policy if exists "authors read own dist formats" on editorial_distribution_formats;
create policy "authors read own dist formats"
  on editorial_distribution_formats for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_formats.project_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_submissions
drop policy if exists "authors read own submissions" on editorial_distribution_submissions;
create policy "authors read own submissions"
  on editorial_distribution_submissions for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_submissions.project_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_identifiers
drop policy if exists "authors read own dist identifiers" on editorial_distribution_identifiers;
create policy "authors read own dist identifiers"
  on editorial_distribution_identifiers for select
  using (
    exists (
      select 1
      from editorial_distribution_submissions s
      join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_identifiers.submission_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_artifacts
drop policy if exists "authors read own dist artifacts" on editorial_distribution_artifacts;
create policy "authors read own dist artifacts"
  on editorial_distribution_artifacts for select
  using (
    exists (
      select 1
      from editorial_distribution_submissions s
      join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_artifacts.submission_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_issues
drop policy if exists "authors read own dist issues" on editorial_distribution_issues;
create policy "authors read own dist issues"
  on editorial_distribution_issues for select
  using (
    exists (
      select 1
      from editorial_distribution_submissions s
      join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_issues.submission_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );

-- editorial_distribution_events
drop policy if exists "authors read own dist events" on editorial_distribution_events;
create policy "authors read own dist events"
  on editorial_distribution_events for select
  using (
    exists (
      select 1
      from editorial_distribution_submissions s
      join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_events.submission_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from editorial_project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    )
  );


-- ============================================================
-- 15. RLS for new columns + project_members (015)
-- ============================================================

-- editorial_distribution_channels: restrict public read to staff
-- (channels are internal config; any auth'd user was too permissive)
drop policy if exists "anyone reads dist channels" on editorial_distribution_channels;
create policy "staff read dist channels"
  on editorial_distribution_channels for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Also allow authenticated users to see active channel names
-- (e.g., for author portal "where is my book distributed?" view)
create policy "authenticated users read active channels"
  on editorial_distribution_channels for select
  using (active = true and auth.uid() is not null);

-- ============================================================
-- END OF AUDIT FIX MIGRATION
-- =============================================================================
