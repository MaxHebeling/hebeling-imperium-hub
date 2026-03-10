-- =============================================================================
-- Phase 11 — CRM / Sales Pipeline Editorial
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Adds the commercial operating layer for Reino Editorial:
-- lead capture, contact/org management, sales pipeline, proposals,
-- service packages, follow-ups, activity logging, and opportunity-to-project
-- conversion. All records anchor to auth.users ownership and can optionally
-- connect to editorial_projects.
--
-- 12 new tables:
--   1.  editorial_crm_organizations       — client / institution / partner records
--   2.  editorial_crm_contacts            — individual contact persons
--   3.  editorial_crm_leads               — raw or qualified incoming leads
--   4.  editorial_crm_opportunities       — commercial deals / pipeline entries
--   5.  editorial_crm_service_packages    — reusable pricing packages
--   6.  editorial_crm_quotes              — formal proposals / quotations
--   7.  editorial_crm_quote_items         — line items on a quote
--   8.  editorial_crm_activities          — CRM activity log
--   9.  editorial_crm_followups           — dedicated follow-up reminders
--   10. editorial_crm_stage_history       — opportunity stage change audit
--   11. editorial_crm_project_conversions — opportunity-to-project conversion record
--   12. editorial_crm_pipeline_snapshots  — periodic pipeline health metrics
--
-- Seed data: default service packages.
--
-- Depends on:
--   001_schema.sql                (profiles, auth.users)
--   009_editorial_phase4a.sql     (editorial_projects)
--   014_editorial_marketplace.sql (editorial_marketplace_orders)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL CRM ORGANIZATIONS
-- ============================================================
-- Companies, ministries, schools, brands, and other entities
-- that can be leads, clients, or partners.
-- A contact can belong to an organization, and an opportunity
-- can be associated with one.
-- ============================================================

create table if not exists editorial_crm_organizations (
  id                    uuid          primary key default gen_random_uuid(),

  name                  text          not null,
  legal_name            text,

  -- Entity category
  organization_type     text          not null default 'client'
                          check (organization_type in (
                            'client',
                            'ministry',
                            'school',
                            'university',
                            'church',
                            'nonprofit',
                            'business',
                            'agency',
                            'partner',
                            'vendor',
                            'other'
                          )),

  website_url           text,
  email                 text,
  phone                 text,

  -- ISO-3166-1 alpha-2 country code
  country               text,
  city                  text,

  notes                 text,

  -- Internal sales owner
  owner_user_id         uuid          references auth.users(id) on delete set null,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_organizations is
  'CRM organizations — companies, institutions, ministries, agencies and other entities that can be leads, clients, or partners.';
comment on column editorial_crm_organizations.organization_type is
  'client | ministry | school | university | church | nonprofit | business | agency | partner | vendor | other.';

create index if not exists idx_crm_orgs_name
  on editorial_crm_organizations(name);

create index if not exists idx_crm_orgs_owner
  on editorial_crm_organizations(owner_user_id);

create index if not exists idx_crm_orgs_type
  on editorial_crm_organizations(organization_type);

create index if not exists idx_crm_orgs_country
  on editorial_crm_organizations(country)
  where country is not null;


-- ============================================================
-- 2. EDITORIAL CRM CONTACTS
-- ============================================================
-- Individual contact persons. Can belong to an organization.
-- The primary decision-maker or point of contact for a deal.
-- ============================================================

create table if not exists editorial_crm_contacts (
  id                    uuid          primary key default gen_random_uuid(),

  organization_id       uuid
                          references editorial_crm_organizations(id) on delete set null,

  first_name            text          not null,
  last_name             text,

  -- Computed or overridden display name
  display_name          text,

  email                 text,
  phone                 text,
  job_title             text,

  -- BCP-47 language tag (e.g. 'es', 'en')
  preferred_language    text,

  country               text,
  city                  text,

  notes                 text,

  owner_user_id         uuid          references auth.users(id) on delete set null,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_contacts is
  'Individual CRM contact persons. Can belong to a CRM organization.';
comment on column editorial_crm_contacts.display_name is
  'Optional override; if null, UI should render first_name || '' '' || last_name.';

create index if not exists idx_crm_contacts_org
  on editorial_crm_contacts(organization_id);

create index if not exists idx_crm_contacts_email
  on editorial_crm_contacts(email)
  where email is not null;

create index if not exists idx_crm_contacts_owner
  on editorial_crm_contacts(owner_user_id);

create index if not exists idx_crm_contacts_country
  on editorial_crm_contacts(country)
  where country is not null;


-- ============================================================
-- 3. EDITORIAL CRM LEADS
-- ============================================================
-- Raw or qualified incoming leads. A lead can eventually be
-- converted into an opportunity (tracked in
-- editorial_crm_opportunities) without being deleted.
-- ============================================================

create table if not exists editorial_crm_leads (
  id                    uuid          primary key default gen_random_uuid(),

  -- Where this lead came from (e.g. 'website_form', 'referral', 'event', 'cold_call')
  source                text          not null,

  organization_id       uuid
                          references editorial_crm_organizations(id) on delete set null,

  contact_id            uuid
                          references editorial_crm_contacts(id) on delete set null,

  -- Lead qualification lifecycle
  lead_status           text          not null default 'new'
                          check (lead_status in (
                            'new',
                            'contacted',
                            'qualified',
                            'unqualified',
                            'converted',
                            'archived'
                          )),

  -- AI or manual qualification score (0–100)
  lead_score            integer       not null default 0
                          check (lead_score >= 0 and lead_score <= 100),

  -- Nature of the interest
  interest_type         text,

  -- Service areas this lead is interested in
  service_interest      text[],

  -- Rough budget tier (e.g. '<1000', '1000-5000', '>10000')
  budget_range          text,

  -- Rough timeline (e.g. 'immediate', 'within_3_months', 'flexible')
  timeline_expectation  text,

  -- Internal owner and capture agent
  owner_user_id         uuid          references auth.users(id) on delete set null,
  captured_by           uuid          references auth.users(id) on delete set null,

  notes                 text,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_leads is
  'Raw or qualified incoming leads. Converted leads link to editorial_crm_opportunities via lead_id.';
comment on column editorial_crm_leads.source is
  'Lead origin, e.g. "website_form", "referral", "event", "cold_call", "social_media".';
comment on column editorial_crm_leads.lead_score is
  'Integer 0-100. Higher = better qualified. Can be set manually or computed by AI.';

create index if not exists idx_crm_leads_source
  on editorial_crm_leads(source);

create index if not exists idx_crm_leads_org
  on editorial_crm_leads(organization_id);

create index if not exists idx_crm_leads_contact
  on editorial_crm_leads(contact_id);

create index if not exists idx_crm_leads_status
  on editorial_crm_leads(lead_status);

create index if not exists idx_crm_leads_owner
  on editorial_crm_leads(owner_user_id);

create index if not exists idx_crm_leads_score
  on editorial_crm_leads(lead_score desc);

create index if not exists idx_crm_leads_status_score
  on editorial_crm_leads(lead_status, lead_score desc)
  where lead_status in ('new', 'contacted', 'qualified');


-- ============================================================
-- 4. EDITORIAL CRM OPPORTUNITIES
-- ============================================================
-- A commercial deal / pipeline entry. Represents a qualified
-- sales situation with an estimated value and close date.
-- When won, it links to an editorial_projects row via
-- editorial_crm_project_conversions (or won_project_id for quick lookup).
-- ============================================================

create table if not exists editorial_crm_opportunities (
  id                    uuid          primary key default gen_random_uuid(),

  organization_id       uuid
                          references editorial_crm_organizations(id) on delete set null,

  primary_contact_id    uuid
                          references editorial_crm_contacts(id) on delete set null,

  -- Originating lead (optional; opportunities can be created without a lead)
  lead_id               uuid
                          references editorial_crm_leads(id) on delete set null,

  title                 text          not null,
  description           text,

  -- Sales pipeline position
  pipeline_stage        text          not null default 'discovery'
                          check (pipeline_stage in (
                            'discovery',
                            'qualification',
                            'proposal',
                            'negotiation',
                            'verbal_commitment',
                            'won',
                            'lost'
                          )),

  -- High-level deal status
  status                text          not null default 'open'
                          check (status in (
                            'open',
                            'won',
                            'lost',
                            'stalled',
                            'cancelled'
                          )),

  -- Financial projections
  estimated_value       numeric(14,2) not null default 0
                          check (estimated_value >= 0),

  currency              text          not null default 'USD',

  -- Win probability % (0–100); used for weighted pipeline value
  probability_percent   integer       not null default 10
                          check (probability_percent >= 0 and probability_percent <= 100),

  expected_close_date   date,

  -- Internal ownership
  owner_user_id         uuid          references auth.users(id) on delete set null,
  created_by            uuid          references auth.users(id) on delete set null,

  -- Quick reference to the project created on win
  won_project_id        uuid          references editorial_projects(id) on delete set null,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_opportunities is
  'Sales opportunities / deals. Moves through pipeline_stage from discovery to won or lost. Connects to editorial_projects on conversion.';
comment on column editorial_crm_opportunities.pipeline_stage is
  'discovery → qualification → proposal → negotiation → verbal_commitment → won | lost.';
comment on column editorial_crm_opportunities.probability_percent is
  'Win probability in [0, 100]. Used to compute weighted_pipeline_value in snapshots.';
comment on column editorial_crm_opportunities.won_project_id is
  'Denormalized quick-lookup to the editorial_projects row created on win. Canonical record is in editorial_crm_project_conversions.';

create index if not exists idx_crm_opps_org
  on editorial_crm_opportunities(organization_id);

create index if not exists idx_crm_opps_contact
  on editorial_crm_opportunities(primary_contact_id);

create index if not exists idx_crm_opps_lead
  on editorial_crm_opportunities(lead_id);

create index if not exists idx_crm_opps_stage
  on editorial_crm_opportunities(pipeline_stage);

create index if not exists idx_crm_opps_status
  on editorial_crm_opportunities(status);

create index if not exists idx_crm_opps_owner
  on editorial_crm_opportunities(owner_user_id);

create index if not exists idx_crm_opps_close_date
  on editorial_crm_opportunities(expected_close_date)
  where expected_close_date is not null;

-- Fast pipeline board query
create index if not exists idx_crm_opps_open_stage
  on editorial_crm_opportunities(pipeline_stage, owner_user_id)
  where status = 'open';


-- ============================================================
-- 5. EDITORIAL CRM SERVICE PACKAGES
-- ============================================================
-- Reusable pricing packages / service tiers that can be added
-- as line items on quotes. One row per package SKU.
-- ============================================================

create table if not exists editorial_crm_service_packages (
  id                    uuid          primary key default gen_random_uuid(),

  -- Stable machine-readable code (e.g. 'basic_editing')
  code                  text          not null unique,

  name                  text          not null,
  description           text,

  -- Package type / category
  package_type          text          not null
                          check (package_type in (
                            'editing',
                            'design',
                            'formatting',
                            'distribution',
                            'full_publishing',
                            'coaching',
                            'consulting',
                            'marketing',
                            'custom'
                          )),

  base_price            numeric(14,2) not null default 0
                          check (base_price >= 0),

  currency              text          not null default 'USD',

  active                boolean       not null default true,

  -- Extra properties (delivery_days, includes, scope, etc.)
  metadata              jsonb         not null default '{}',

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_service_packages is
  'Reusable service pricing packages used as quote line-item templates.';
comment on column editorial_crm_service_packages.metadata is
  'Extra package info: {delivery_days, includes, scope_words, etc.}.';

create index if not exists idx_crm_packages_type
  on editorial_crm_service_packages(package_type);

create index if not exists idx_crm_packages_active
  on editorial_crm_service_packages(active)
  where active = true;


-- ── Seed: default service packages ──────────────────────────────────────────

insert into editorial_crm_service_packages
  (code, name, description, package_type, base_price, currency)
values
  ('basic_editing',
   'Basic Editing',
   'Copyediting and proofreading for manuscripts up to 50,000 words',
   'editing', 1200.00, 'USD'),

  ('premium_editing',
   'Premium Editing',
   'Developmental editing + line editing + copyediting for manuscripts up to 80,000 words',
   'editing', 3500.00, 'USD'),

  ('full_publishing',
   'Full Publishing Package',
   'End-to-end editorial, design, formatting, and distribution setup',
   'full_publishing', 6500.00, 'USD'),

  ('cover_design',
   'Cover Design',
   'Professional front/back/spine book cover design with up to 3 revisions',
   'design', 650.00, 'USD'),

  ('book_formatting',
   'Book Formatting',
   'Interior layout and formatting for print and ebook (up to 300 pages)',
   'formatting', 450.00, 'USD'),

  ('distribution_setup',
   'Distribution Setup',
   'Configuration and submission to Amazon KDP, Apple Books, and IngramSpark',
   'distribution', 350.00, 'USD'),

  ('author_consulting',
   'Author Consulting Session',
   '60-minute editorial strategy consulting session with senior editor',
   'consulting', 120.00, 'USD')
on conflict (code) do nothing;


-- ============================================================
-- 6. EDITORIAL CRM QUOTES
-- ============================================================
-- Formal proposals / quotations sent to an opportunity.
-- Multiple quotes can exist per opportunity (e.g. revised versions).
-- Only one should normally be in 'accepted' status.
-- ============================================================

create table if not exists editorial_crm_quotes (
  id                    uuid          primary key default gen_random_uuid(),

  -- Every quote belongs to one opportunity
  opportunity_id        uuid          not null
                          references editorial_crm_opportunities(id) on delete cascade,

  -- Human-readable sequential quote number (e.g. 'Q-2024-0042')
  quote_number          text          not null unique,

  title                 text          not null,
  description           text,

  -- Financial summary (computed from line items + manual adjustments)
  subtotal_amount       numeric(14,2) not null default 0,
  discount_amount       numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_amount            numeric(14,2) not null default 0 check (tax_amount >= 0),
  total_amount          numeric(14,2) not null default 0,
  currency              text          not null default 'USD',

  -- Quote lifecycle
  status                text          not null default 'draft'
                          check (status in (
                            'draft',
                            'sent',
                            'viewed',
                            'accepted',
                            'rejected',
                            'expired',
                            'cancelled'
                          )),

  valid_until           date,
  sent_at               timestamptz,
  accepted_at           timestamptz,
  rejected_at           timestamptz,

  created_by            uuid          references auth.users(id) on delete set null,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_quotes is
  'Formal proposals / quotations per opportunity. One row per quote version. Total is computed from line items.';
comment on column editorial_crm_quotes.quote_number is
  'Human-readable sequential identifier, e.g. "Q-2025-0001". Must be unique.';
comment on column editorial_crm_quotes.status is
  'draft → sent → viewed → accepted | rejected | expired | cancelled.';

create index if not exists idx_crm_quotes_opportunity
  on editorial_crm_quotes(opportunity_id);

create index if not exists idx_crm_quotes_status
  on editorial_crm_quotes(status);

create index if not exists idx_crm_quotes_valid_until
  on editorial_crm_quotes(valid_until)
  where valid_until is not null;


-- ============================================================
-- 7. EDITORIAL CRM QUOTE ITEMS
-- ============================================================
-- Line items within a quote. Can reference a service package
-- or be a free-form custom item.
-- ============================================================

create table if not exists editorial_crm_quote_items (
  id                    uuid          primary key default gen_random_uuid(),

  quote_id              uuid          not null
                          references editorial_crm_quotes(id) on delete cascade,

  -- Optional link to a service package template
  package_id            uuid
                          references editorial_crm_service_packages(id) on delete set null,

  -- Item classification
  item_type             text          not null default 'service'
                          check (item_type in (
                            'service',
                            'discount',
                            'fee',
                            'custom'
                          )),

  title                 text          not null,
  description           text,

  -- Pricing
  quantity              numeric(10,3) not null default 1
                          check (quantity > 0),

  unit_price            numeric(14,2) not null default 0
                          check (unit_price >= 0),

  -- Denormalized for fast reads (computed as quantity * unit_price)
  line_total            numeric(14,2) not null default 0,

  -- Display order within the quote
  sort_order            integer       not null default 0,

  created_at            timestamptz   not null default now()
);

comment on table editorial_crm_quote_items is
  'Line items on a quote. Each row represents one service, fee, discount, or custom item.';
comment on column editorial_crm_quote_items.line_total is
  'Denormalized: quantity * unit_price. Maintained by application logic.';

create index if not exists idx_crm_quote_items_quote
  on editorial_crm_quote_items(quote_id);

create index if not exists idx_crm_quote_items_package
  on editorial_crm_quote_items(package_id)
  where package_id is not null;

create index if not exists idx_crm_quote_items_sort
  on editorial_crm_quote_items(quote_id, sort_order asc);


-- ============================================================
-- 8. EDITORIAL CRM ACTIVITIES
-- ============================================================
-- Complete activity log for CRM actions (calls, emails, meetings,
-- notes, etc.). Can link to any CRM entity.
-- ============================================================

create table if not exists editorial_crm_activities (
  id                    uuid          primary key default gen_random_uuid(),

  -- Any or all of these can be set to give context
  organization_id       uuid          references editorial_crm_organizations(id) on delete set null,
  contact_id            uuid          references editorial_crm_contacts(id) on delete set null,
  lead_id               uuid          references editorial_crm_leads(id) on delete set null,
  opportunity_id        uuid          references editorial_crm_opportunities(id) on delete set null,
  quote_id              uuid          references editorial_crm_quotes(id) on delete set null,

  -- Activity classification
  activity_type         text          not null
                          check (activity_type in (
                            'note',
                            'call',
                            'email',
                            'meeting',
                            'whatsapp',
                            'task',
                            'proposal_sent',
                            'proposal_viewed',
                            'follow_up',
                            'status_change',
                            'other'
                          )),

  subject               text          not null,
  description           text,

  performed_by          uuid          references auth.users(id) on delete set null,

  -- For scheduled activities (future)
  scheduled_for         timestamptz,
  completed_at          timestamptz,

  -- What happened / result
  outcome               text,

  -- Flexible extra data (recording URL, email thread ID, etc.)
  metadata              jsonb,

  created_at            timestamptz   not null default now()
);

comment on table editorial_crm_activities is
  'Complete CRM activity log. One row per action — notes, calls, emails, meetings, status changes, etc.';
comment on column editorial_crm_activities.activity_type is
  'note | call | email | meeting | whatsapp | task | proposal_sent | proposal_viewed | follow_up | status_change | other.';

create index if not exists idx_crm_activities_org
  on editorial_crm_activities(organization_id);

create index if not exists idx_crm_activities_contact
  on editorial_crm_activities(contact_id);

create index if not exists idx_crm_activities_lead
  on editorial_crm_activities(lead_id);

create index if not exists idx_crm_activities_opportunity
  on editorial_crm_activities(opportunity_id);

create index if not exists idx_crm_activities_quote
  on editorial_crm_activities(quote_id);

create index if not exists idx_crm_activities_type
  on editorial_crm_activities(activity_type);

create index if not exists idx_crm_activities_performer
  on editorial_crm_activities(performed_by);

create index if not exists idx_crm_activities_scheduled
  on editorial_crm_activities(scheduled_for)
  where scheduled_for is not null;

create index if not exists idx_crm_activities_completed
  on editorial_crm_activities(completed_at)
  where completed_at is not null;

create index if not exists idx_crm_activities_opp_created
  on editorial_crm_activities(opportunity_id, created_at desc)
  where opportunity_id is not null;


-- ============================================================
-- 9. EDITORIAL CRM FOLLOWUPS
-- ============================================================
-- Dedicated follow-up reminders and next-action items.
-- Separate from general activities to support focused
-- task-list views for sales reps.
-- ============================================================

create table if not exists editorial_crm_followups (
  id                    uuid          primary key default gen_random_uuid(),

  -- Primary context (optional: not all follow-ups are tied to an opportunity)
  opportunity_id        uuid
                          references editorial_crm_opportunities(id) on delete cascade,

  contact_id            uuid
                          references editorial_crm_contacts(id) on delete set null,

  title                 text          not null,
  description           text,

  due_at                timestamptz   not null,

  -- Status lifecycle
  status                text          not null default 'open'
                          check (status in (
                            'open',
                            'completed',
                            'cancelled',
                            'overdue'
                          )),

  priority              text          not null default 'medium'
                          check (priority in ('low', 'medium', 'high', 'urgent')),

  assigned_user_id      uuid          references auth.users(id) on delete set null,
  completed_at          timestamptz,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_crm_followups is
  'Follow-up reminders and next-action items for CRM opportunities and contacts.';
comment on column editorial_crm_followups.status is
  'open | completed | cancelled | overdue (overdue is set by a background job).';

create index if not exists idx_crm_followups_opportunity
  on editorial_crm_followups(opportunity_id);

create index if not exists idx_crm_followups_contact
  on editorial_crm_followups(contact_id);

create index if not exists idx_crm_followups_assigned
  on editorial_crm_followups(assigned_user_id);

create index if not exists idx_crm_followups_status
  on editorial_crm_followups(status);

create index if not exists idx_crm_followups_priority
  on editorial_crm_followups(priority);

create index if not exists idx_crm_followups_due
  on editorial_crm_followups(due_at asc);

-- Fast open follow-ups polling for a sales rep
create index if not exists idx_crm_followups_open_due
  on editorial_crm_followups(assigned_user_id, status, due_at asc)
  where status = 'open';


-- ============================================================
-- 10. EDITORIAL CRM STAGE HISTORY
-- ============================================================
-- Immutable log of every pipeline stage change for an opportunity.
-- Enables velocity metrics and funnel analysis.
-- ============================================================

create table if not exists editorial_crm_stage_history (
  id                    uuid          primary key default gen_random_uuid(),

  opportunity_id        uuid          not null
                          references editorial_crm_opportunities(id) on delete cascade,

  old_stage             text,
  new_stage             text          not null,

  changed_by            uuid          references auth.users(id) on delete set null,
  change_reason         text,

  created_at            timestamptz   not null default now()
);

comment on table editorial_crm_stage_history is
  'Immutable audit log of opportunity pipeline stage changes. Used for velocity and funnel analysis.';
comment on column editorial_crm_stage_history.old_stage is
  'NULL for the initial stage when the opportunity is created.';

create index if not exists idx_crm_stage_history_opp
  on editorial_crm_stage_history(opportunity_id);

create index if not exists idx_crm_stage_history_new_stage
  on editorial_crm_stage_history(new_stage);

create index if not exists idx_crm_stage_history_created
  on editorial_crm_stage_history(opportunity_id, created_at asc);


-- ============================================================
-- 11. EDITORIAL CRM PROJECT CONVERSIONS
-- ============================================================
-- Audit record of when a won opportunity is converted into
-- (or connected to) an editorial project. First-class and
-- unique per (opportunity, project) pair.
-- ============================================================

create table if not exists editorial_crm_project_conversions (
  id                    uuid          primary key default gen_random_uuid(),

  opportunity_id        uuid          not null
                          references editorial_crm_opportunities(id) on delete cascade,

  project_id            uuid          not null
                          references editorial_projects(id) on delete cascade,

  converted_by          uuid          references auth.users(id) on delete set null,
  conversion_notes      text,

  created_at            timestamptz   not null default now(),

  -- One conversion record per (opportunity, project) pair
  unique (opportunity_id, project_id)
);

comment on table editorial_crm_project_conversions is
  'Audit record of opportunity-to-project conversions. One row per (opportunity, project) pair. First-class and auditable.';

create index if not exists idx_crm_conversions_opportunity
  on editorial_crm_project_conversions(opportunity_id);

create index if not exists idx_crm_conversions_project
  on editorial_crm_project_conversions(project_id);


-- ============================================================
-- 12. EDITORIAL CRM PIPELINE SNAPSHOTS
-- ============================================================
-- Periodic aggregated pipeline health metrics.
-- Scoped per owner (sales rep) or globally (owner_user_id IS NULL).
-- Generated by a scheduled job for executive dashboards.
-- ============================================================

create table if not exists editorial_crm_pipeline_snapshots (
  id                    uuid          primary key default gen_random_uuid(),

  snapshot_date         date          not null,

  -- NULL = global (all owners); set = per sales rep
  owner_user_id         uuid          references auth.users(id) on delete set null,

  -- Pipeline counts at snapshot time
  total_open_opportunities    integer  not null default 0 check (total_open_opportunities >= 0),
  total_won_opportunities     integer  not null default 0 check (total_won_opportunities >= 0),
  total_lost_opportunities    integer  not null default 0 check (total_lost_opportunities >= 0),

  -- Pipeline financial value
  pipeline_value              numeric(16,2) not null default 0,
  weighted_pipeline_value     numeric(16,2) not null default 0,

  -- Quote metrics
  quotes_sent_count           integer  not null default 0 check (quotes_sent_count >= 0),
  quotes_accepted_count       integer  not null default 0 check (quotes_accepted_count >= 0),

  -- Conversion (opportunity → project)
  conversion_count            integer  not null default 0 check (conversion_count >= 0),

  created_at            timestamptz   not null default now()
);

comment on table editorial_crm_pipeline_snapshots is
  'Periodic pipeline KPI snapshots. NULL owner_user_id = global. Generated by scheduled jobs for executive dashboards.';
comment on column editorial_crm_pipeline_snapshots.weighted_pipeline_value is
  'Sum of (estimated_value * probability_percent / 100) across open opportunities.';

create index if not exists idx_crm_pipeline_snapshots_date
  on editorial_crm_pipeline_snapshots(snapshot_date desc);

create index if not exists idx_crm_pipeline_snapshots_owner
  on editorial_crm_pipeline_snapshots(owner_user_id);

create index if not exists idx_crm_pipeline_snapshots_date_owner
  on editorial_crm_pipeline_snapshots(snapshot_date desc, owner_user_id);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Staff (superadmin, admin, ops) can fully manage all CRM tables.
--   2. Record owners (owner_user_id = auth.uid()) can read/update their own records.
--   3. Quote and pipeline financial data is internal — no non-staff read access.
--   4. Activity logs and follow-ups are writable by staff; assigned users can read theirs.
--   5. Pipeline snapshots are executive/staff read-only; writes are service-role only.
--   6. Regular project authors do NOT gain CRM access automatically.
-- =============================================================================

alter table editorial_crm_organizations       enable row level security;
alter table editorial_crm_contacts            enable row level security;
alter table editorial_crm_leads               enable row level security;
alter table editorial_crm_opportunities       enable row level security;
alter table editorial_crm_service_packages    enable row level security;
alter table editorial_crm_quotes              enable row level security;
alter table editorial_crm_quote_items         enable row level security;
alter table editorial_crm_activities          enable row level security;
alter table editorial_crm_followups           enable row level security;
alter table editorial_crm_stage_history       enable row level security;
alter table editorial_crm_project_conversions enable row level security;
alter table editorial_crm_pipeline_snapshots  enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_crm_organizations
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm orgs"   on editorial_crm_organizations;
create policy "staff read crm orgs"
  on editorial_crm_organizations
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm orgs"  on editorial_crm_organizations;
create policy "staff write crm orgs"
  on editorial_crm_organizations
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Owners can read and update their own organization records
drop policy if exists "owners read own crm orgs"   on editorial_crm_organizations;
create policy "owners read own crm orgs"
  on editorial_crm_organizations
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "owners update own crm orgs" on editorial_crm_organizations;
create policy "owners update own crm orgs"
  on editorial_crm_organizations
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_crm_contacts
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm contacts"  on editorial_crm_contacts;
create policy "staff read crm contacts"
  on editorial_crm_contacts
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm contacts" on editorial_crm_contacts;
create policy "staff write crm contacts"
  on editorial_crm_contacts
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own crm contacts"   on editorial_crm_contacts;
create policy "owners read own crm contacts"
  on editorial_crm_contacts
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "owners update own crm contacts" on editorial_crm_contacts;
create policy "owners update own crm contacts"
  on editorial_crm_contacts
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_crm_leads
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm leads"  on editorial_crm_leads;
create policy "staff read crm leads"
  on editorial_crm_leads
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm leads" on editorial_crm_leads;
create policy "staff write crm leads"
  on editorial_crm_leads
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own crm leads"   on editorial_crm_leads;
create policy "owners read own crm leads"
  on editorial_crm_leads
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "owners update own crm leads" on editorial_crm_leads;
create policy "owners update own crm leads"
  on editorial_crm_leads
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_crm_opportunities
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm opportunities"  on editorial_crm_opportunities;
create policy "staff read crm opportunities"
  on editorial_crm_opportunities
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm opportunities" on editorial_crm_opportunities;
create policy "staff write crm opportunities"
  on editorial_crm_opportunities
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own crm opportunities"   on editorial_crm_opportunities;
create policy "owners read own crm opportunities"
  on editorial_crm_opportunities
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "owners update own crm opportunities" on editorial_crm_opportunities;
create policy "owners update own crm opportunities"
  on editorial_crm_opportunities
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_crm_service_packages (reference data)
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read packages (needed for quote builder UI)
drop policy if exists "staff read service packages"  on editorial_crm_service_packages;
create policy "staff read service packages"
  on editorial_crm_service_packages
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Admin only can manage packages
drop policy if exists "admin manage service packages" on editorial_crm_service_packages;
create policy "admin manage service packages"
  on editorial_crm_service_packages
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_crm_quotes
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm quotes"  on editorial_crm_quotes;
create policy "staff read crm quotes"
  on editorial_crm_quotes
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm quotes" on editorial_crm_quotes;
create policy "staff write crm quotes"
  on editorial_crm_quotes
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Quote creators can read their own quotes
drop policy if exists "creators read own crm quotes" on editorial_crm_quotes;
create policy "creators read own crm quotes"
  on editorial_crm_quotes
  for select
  using (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_crm_quote_items
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm quote items"  on editorial_crm_quote_items;
create policy "staff read crm quote items"
  on editorial_crm_quote_items
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm quote items" on editorial_crm_quote_items;
create policy "staff write crm quote items"
  on editorial_crm_quote_items
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_crm_activities
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm activities"  on editorial_crm_activities;
create policy "staff read crm activities"
  on editorial_crm_activities
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm activities" on editorial_crm_activities;
create policy "staff write crm activities"
  on editorial_crm_activities
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Performers can read activities they created
drop policy if exists "performers read own activities" on editorial_crm_activities;
create policy "performers read own activities"
  on editorial_crm_activities
  for select
  using (performed_by = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 9: editorial_crm_followups
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm followups"  on editorial_crm_followups;
create policy "staff read crm followups"
  on editorial_crm_followups
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write crm followups" on editorial_crm_followups;
create policy "staff write crm followups"
  on editorial_crm_followups
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Assignees can read and update follow-ups assigned to them
drop policy if exists "assigned users read own followups"   on editorial_crm_followups;
create policy "assigned users read own followups"
  on editorial_crm_followups
  for select
  using (assigned_user_id = auth.uid());

drop policy if exists "assigned users update own followups" on editorial_crm_followups;
create policy "assigned users update own followups"
  on editorial_crm_followups
  for update
  using (assigned_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 10: editorial_crm_stage_history (audit trail — read-only for users)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm stage history"  on editorial_crm_stage_history;
create policy "staff read crm stage history"
  on editorial_crm_stage_history
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Stage history is written by application code only (service-role).
-- No user-facing insert policy.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 11: editorial_crm_project_conversions
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read crm conversions"  on editorial_crm_project_conversions;
create policy "staff read crm conversions"
  on editorial_crm_project_conversions
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write crm conversions" on editorial_crm_project_conversions;
create policy "admin write crm conversions"
  on editorial_crm_project_conversions
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 12: editorial_crm_pipeline_snapshots (executive data — read-only)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read pipeline snapshots"  on editorial_crm_pipeline_snapshots;
create policy "staff read pipeline snapshots"
  on editorial_crm_pipeline_snapshots
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Snapshot owners (sales reps) can read their own snapshots
drop policy if exists "owners read own pipeline snapshots" on editorial_crm_pipeline_snapshots;
create policy "owners read own pipeline snapshots"
  on editorial_crm_pipeline_snapshots
  for select
  using (owner_user_id = auth.uid());

-- Pipeline snapshot writes are service-role only (scheduled jobs).


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
