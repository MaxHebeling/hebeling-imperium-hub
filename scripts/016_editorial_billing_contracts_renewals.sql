-- =========================================================
-- Phase 12 — Client Billing, Contracts & Renewals
-- scripts/016_editorial_billing_contracts_renewals.sql
-- =========================================================

begin;

-- =========================================================
-- TABLE 1: editorial_client_accounts
-- =========================================================

create table if not exists public.editorial_client_accounts (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid null
    references public.editorial_crm_organizations(id)
    on delete set null,

  primary_contact_id uuid null
    references public.editorial_crm_contacts(id)
    on delete set null,

  account_code text not null unique,
  display_name text not null,
  legal_name text null,
  tax_id text null,
  billing_email text null,
  billing_phone text null,

  billing_country text null,
  billing_state text null,
  billing_city text null,
  billing_address_line1 text null,
  billing_address_line2 text null,
  postal_code text null,

  preferred_currency text not null default 'USD',
  payment_terms_days integer not null default 15,
  active boolean not null default true,

  owner_user_id uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_client_accounts_payment_terms_check
    check (payment_terms_days >= 0)
);

comment on table public.editorial_client_accounts is
'Billing account / legal customer profile; links CRM organization and contact to billing.';

comment on column public.editorial_client_accounts.account_code is
'Unique human-readable account code for invoicing and reporting.';

create index if not exists idx_editorial_client_accounts_organization_id
  on public.editorial_client_accounts (organization_id);

create index if not exists idx_editorial_client_accounts_primary_contact_id
  on public.editorial_client_accounts (primary_contact_id);

create index if not exists idx_editorial_client_accounts_account_code
  on public.editorial_client_accounts (account_code);

create index if not exists idx_editorial_client_accounts_owner_user_id
  on public.editorial_client_accounts (owner_user_id);

create index if not exists idx_editorial_client_accounts_active
  on public.editorial_client_accounts (active);


-- =========================================================
-- TABLE 2: editorial_contract_templates
-- =========================================================

create table if not exists public.editorial_contract_templates (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,
  description text null,
  contract_type text not null,
  template_body text not null,
  default_currency text not null default 'USD',
  active boolean not null default true,
  version_label text null,

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_contract_templates_type_check
    check (
      contract_type in (
        'publishing',
        'editing',
        'design',
        'distribution',
        'service_agreement',
        'nda',
        'consulting',
        'custom'
      )
    )
);

comment on table public.editorial_contract_templates is
'Reusable contract templates for generating client contracts.';

-- Seed default contract templates (idempotent)
insert into public.editorial_contract_templates (code, name, description, contract_type, template_body, default_currency)
values
  ('publishing_standard',   'Standard Publishing Agreement',     'Standard book publishing contract template.',           'publishing',        'Placeholder template body for Standard Publishing Agreement. Replace with actual legal text.', 'USD'),
  ('editing_agreement',    'Editorial Services Agreement',      'Agreement for editing and editorial services.',        'editing',          'Placeholder template body for Editorial Services Agreement. Replace with actual legal text.',  'USD'),
  ('design_services',      'Design Services Agreement',         'Cover and interior design services contract.',          'design',           'Placeholder template body for Design Services Agreement. Replace with actual legal text.',   'USD'),
  ('distribution_agreement','Distribution Services Agreement',  'Distribution and channel placement agreement.',        'distribution',     'Placeholder template body for Distribution Services Agreement. Replace with actual legal text.', 'USD'),
  ('nda_standard',         'Standard NDA',                     'Non-disclosure agreement template.',                    'nda',              'Placeholder template body for Standard NDA. Replace with actual legal text.',                'USD'),
  ('consulting_agreement',  'Consulting Services Agreement',   'Author consulting and strategy services.',              'consulting',       'Placeholder template body for Consulting Services Agreement. Replace with actual legal text.',  'USD')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  contract_type = excluded.contract_type,
  template_body = excluded.template_body,
  default_currency = excluded.default_currency,
  active = true;

create index if not exists idx_editorial_contract_templates_code
  on public.editorial_contract_templates (code);

create index if not exists idx_editorial_contract_templates_contract_type
  on public.editorial_contract_templates (contract_type);

create index if not exists idx_editorial_contract_templates_active
  on public.editorial_contract_templates (active);


-- =========================================================
-- TABLE 3: editorial_client_contracts
-- =========================================================

create table if not exists public.editorial_client_contracts (
  id uuid primary key default gen_random_uuid(),

  client_account_id uuid not null
    references public.editorial_client_accounts(id)
    on delete cascade,

  project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  opportunity_id uuid null
    references public.editorial_crm_opportunities(id)
    on delete set null,

  quote_id uuid null
    references public.editorial_crm_quotes(id)
    on delete set null,

  template_id uuid null
    references public.editorial_contract_templates(id)
    on delete set null,

  contract_number text not null unique,
  title text not null,
  contract_type text not null,

  status text not null default 'draft',

  currency text not null default 'USD',
  contract_value numeric(12,2) not null default 0,

  effective_date date null,
  start_date date null,
  end_date date null,
  renewal_date date null,
  termination_date date null,

  auto_renew boolean not null default false,
  renewal_term_months integer null,

  signed_at timestamptz null,
  cancelled_at timestamptz null,

  created_by uuid null references auth.users(id),
  owner_user_id uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_client_contracts_type_check
    check (
      contract_type in (
        'publishing',
        'editing',
        'design',
        'distribution',
        'service_agreement',
        'nda',
        'consulting',
        'custom'
      )
    ),

  constraint editorial_client_contracts_status_check
    check (
      status in (
        'draft',
        'sent',
        'under_review',
        'signed',
        'active',
        'expired',
        'terminated',
        'cancelled',
        'renewed'
      )
    ),

  constraint editorial_client_contracts_value_check
    check (contract_value >= 0)
);

comment on table public.editorial_client_contracts is
'Actual contracts issued to clients; links to CRM, projects, and quotes.';

create index if not exists idx_editorial_client_contracts_client_account_id
  on public.editorial_client_contracts (client_account_id);

create index if not exists idx_editorial_client_contracts_project_id
  on public.editorial_client_contracts (project_id);

create index if not exists idx_editorial_client_contracts_opportunity_id
  on public.editorial_client_contracts (opportunity_id);

create index if not exists idx_editorial_client_contracts_quote_id
  on public.editorial_client_contracts (quote_id);

create index if not exists idx_editorial_client_contracts_template_id
  on public.editorial_client_contracts (template_id);

create index if not exists idx_editorial_client_contracts_contract_number
  on public.editorial_client_contracts (contract_number);

create index if not exists idx_editorial_client_contracts_status
  on public.editorial_client_contracts (status);

create index if not exists idx_editorial_client_contracts_renewal_date
  on public.editorial_client_contracts (renewal_date);

create index if not exists idx_editorial_client_contracts_end_date
  on public.editorial_client_contracts (end_date);

create index if not exists idx_editorial_client_contracts_owner_user_id
  on public.editorial_client_contracts (owner_user_id);


-- =========================================================
-- TABLE 4: editorial_contract_versions
-- =========================================================

create table if not exists public.editorial_contract_versions (
  id uuid primary key default gen_random_uuid(),

  contract_id uuid not null
    references public.editorial_client_contracts(id)
    on delete cascade,

  version_number integer not null,
  version_label text null,
  document_file_id uuid null
    references public.editorial_files(id)
    on delete set null,

  body_text text null,
  change_summary text null,

  status text not null default 'draft',

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),

  constraint editorial_contract_versions_status_check
    check (
      status in (
        'draft',
        'sent',
        'signed',
        'superseded',
        'cancelled'
      )
    ),

  constraint editorial_contract_versions_version_number_check
    check (version_number > 0),

  constraint editorial_contract_versions_contract_version_uniq
    unique (contract_id, version_number)
);

comment on table public.editorial_contract_versions is
'Contract revisions and amendments; one row per version per contract.';

create index if not exists idx_editorial_contract_versions_contract_id
  on public.editorial_contract_versions (contract_id);

create index if not exists idx_editorial_contract_versions_document_file_id
  on public.editorial_contract_versions (document_file_id);

create index if not exists idx_editorial_contract_versions_status
  on public.editorial_contract_versions (status);


-- =========================================================
-- TABLE 5: editorial_contract_signatures
-- =========================================================

create table if not exists public.editorial_contract_signatures (
  id uuid primary key default gen_random_uuid(),

  contract_id uuid not null
    references public.editorial_client_contracts(id)
    on delete cascade,

  contract_version_id uuid null
    references public.editorial_contract_versions(id)
    on delete set null,

  signer_name text not null,
  signer_email text null,
  signer_role text null,
  signer_type text not null,

  signature_status text not null default 'pending',

  signed_at timestamptz null,
  signature_provider text null,
  signature_reference text null,
  ip_address inet null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_contract_signatures_signer_type_check
    check (signer_type in ('client', 'internal', 'witness', 'legal', 'other')),

  constraint editorial_contract_signatures_status_check
    check (
      signature_status in (
        'pending',
        'sent',
        'viewed',
        'signed',
        'declined',
        'expired',
        'revoked'
      )
    )
);

comment on table public.editorial_contract_signatures is
'Signature and signer tracking for contracts.';

create index if not exists idx_editorial_contract_signatures_contract_id
  on public.editorial_contract_signatures (contract_id);

create index if not exists idx_editorial_contract_signatures_contract_version_id
  on public.editorial_contract_signatures (contract_version_id);

create index if not exists idx_editorial_contract_signatures_signer_email
  on public.editorial_contract_signatures (signer_email);

create index if not exists idx_editorial_contract_signatures_signer_type
  on public.editorial_contract_signatures (signer_type);

create index if not exists idx_editorial_contract_signatures_signature_status
  on public.editorial_contract_signatures (signature_status);


-- =========================================================
-- TABLE 6: editorial_invoices
-- =========================================================

create table if not exists public.editorial_invoices (
  id uuid primary key default gen_random_uuid(),

  client_account_id uuid not null
    references public.editorial_client_accounts(id)
    on delete cascade,

  contract_id uuid null
    references public.editorial_client_contracts(id)
    on delete set null,

  project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  quote_id uuid null
    references public.editorial_crm_quotes(id)
    on delete set null,

  invoice_number text not null unique,
  title text not null,
  description text null,

  invoice_type text not null default 'standard',
  status text not null default 'draft',

  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,

  currency text not null default 'USD',

  issue_date date not null,
  due_date date null,
  paid_at timestamptz null,
  voided_at timestamptz null,

  billing_period_start date null,
  billing_period_end date null,

  created_by uuid null references auth.users(id),
  owner_user_id uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_invoices_type_check
    check (
      invoice_type in (
        'standard',
        'deposit',
        'milestone',
        'recurring',
        'final',
        'adjustment',
        'refund'
      )
    ),

  constraint editorial_invoices_status_check
    check (
      status in (
        'draft',
        'issued',
        'sent',
        'partially_paid',
        'paid',
        'overdue',
        'void',
        'cancelled',
        'refunded'
      )
    ),

  constraint editorial_invoices_amounts_check
    check (
      subtotal_amount >= 0 and
      discount_amount >= 0 and
      tax_amount >= 0 and
      total_amount >= 0 and
      amount_paid >= 0 and
      balance_due >= 0
    )
);

comment on table public.editorial_invoices is
'Invoices issued to client accounts; links to contracts, projects, and quotes.';

create index if not exists idx_editorial_invoices_client_account_id
  on public.editorial_invoices (client_account_id);

create index if not exists idx_editorial_invoices_contract_id
  on public.editorial_invoices (contract_id);

create index if not exists idx_editorial_invoices_project_id
  on public.editorial_invoices (project_id);

create index if not exists idx_editorial_invoices_quote_id
  on public.editorial_invoices (quote_id);

create index if not exists idx_editorial_invoices_invoice_number
  on public.editorial_invoices (invoice_number);

create index if not exists idx_editorial_invoices_status
  on public.editorial_invoices (status);

create index if not exists idx_editorial_invoices_issue_date
  on public.editorial_invoices (issue_date);

create index if not exists idx_editorial_invoices_due_date
  on public.editorial_invoices (due_date);

create index if not exists idx_editorial_invoices_owner_user_id
  on public.editorial_invoices (owner_user_id);


-- =========================================================
-- TABLE 7: editorial_invoice_items
-- =========================================================

create table if not exists public.editorial_invoice_items (
  id uuid primary key default gen_random_uuid(),

  invoice_id uuid not null
    references public.editorial_invoices(id)
    on delete cascade,

  item_type text not null default 'service',
  title text not null,
  description text null,

  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  constraint editorial_invoice_items_item_type_check
    check (
      item_type in (
        'service',
        'discount',
        'fee',
        'tax',
        'adjustment',
        'refund',
        'custom'
      )
    ),

  constraint editorial_invoice_items_quantity_check
    check (quantity > 0),

  constraint editorial_invoice_items_amounts_check
    check (unit_price >= 0 and line_total >= 0)
);

comment on table public.editorial_invoice_items is
'Line items for invoices.';

create index if not exists idx_editorial_invoice_items_invoice_id
  on public.editorial_invoice_items (invoice_id);

create index if not exists idx_editorial_invoice_items_sort_order
  on public.editorial_invoice_items (sort_order);


-- =========================================================
-- TABLE 8: editorial_payment_schedules
-- =========================================================

create table if not exists public.editorial_payment_schedules (
  id uuid primary key default gen_random_uuid(),

  client_account_id uuid not null
    references public.editorial_client_accounts(id)
    on delete cascade,

  contract_id uuid null
    references public.editorial_client_contracts(id)
    on delete set null,

  invoice_id uuid null
    references public.editorial_invoices(id)
    on delete set null,

  project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  schedule_type text not null,
  status text not null default 'scheduled',

  title text not null,
  description text null,

  due_date date not null,
  expected_amount numeric(12,2) not null default 0,
  currency text not null default 'USD',

  paid_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) not null default 0,

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_payment_schedules_type_check
    check (
      schedule_type in (
        'deposit',
        'milestone',
        'recurring',
        'final_balance',
        'renewal',
        'manual'
      )
    ),

  constraint editorial_payment_schedules_status_check
    check (
      status in (
        'scheduled',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled'
      )
    ),

  constraint editorial_payment_schedules_amounts_check
    check (
      expected_amount >= 0 and
      paid_amount >= 0 and
      remaining_amount >= 0
    )
);

comment on table public.editorial_payment_schedules is
'Expected client payment plan / milestones.';

create index if not exists idx_editorial_payment_schedules_client_account_id
  on public.editorial_payment_schedules (client_account_id);

create index if not exists idx_editorial_payment_schedules_contract_id
  on public.editorial_payment_schedules (contract_id);

create index if not exists idx_editorial_payment_schedules_invoice_id
  on public.editorial_payment_schedules (invoice_id);

create index if not exists idx_editorial_payment_schedules_project_id
  on public.editorial_payment_schedules (project_id);

create index if not exists idx_editorial_payment_schedules_schedule_type
  on public.editorial_payment_schedules (schedule_type);

create index if not exists idx_editorial_payment_schedules_status
  on public.editorial_payment_schedules (status);

create index if not exists idx_editorial_payment_schedules_due_date
  on public.editorial_payment_schedules (due_date);


-- =========================================================
-- TABLE 9: editorial_received_payments
-- =========================================================

create table if not exists public.editorial_received_payments (
  id uuid primary key default gen_random_uuid(),

  client_account_id uuid not null
    references public.editorial_client_accounts(id)
    on delete cascade,

  payment_reference text null,
  payment_method text not null,
  payment_provider text null,
  provider_transaction_id text null,

  status text not null default 'received',

  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',

  received_at timestamptz not null default now(),
  recorded_by uuid null references auth.users(id),

  notes text null,

  created_at timestamptz not null default now(),

  constraint editorial_received_payments_method_check
    check (
      payment_method in (
        'cash',
        'bank_transfer',
        'credit_card',
        'debit_card',
        'stripe',
        'paypal',
        'check',
        'wire',
        'other'
      )
    ),

  constraint editorial_received_payments_status_check
    check (
      status in (
        'received',
        'pending',
        'allocated',
        'partially_allocated',
        'failed',
        'reversed',
        'refunded'
      )
    ),

  constraint editorial_received_payments_amount_check
    check (amount >= 0)
);

comment on table public.editorial_received_payments is
'Payments received from clients; allocations link to invoices/schedules.';

create index if not exists idx_editorial_received_payments_client_account_id
  on public.editorial_received_payments (client_account_id);

create index if not exists idx_editorial_received_payments_payment_reference
  on public.editorial_received_payments (payment_reference);

create index if not exists idx_editorial_received_payments_payment_method
  on public.editorial_received_payments (payment_method);

create index if not exists idx_editorial_received_payments_status
  on public.editorial_received_payments (status);

create index if not exists idx_editorial_received_payments_received_at
  on public.editorial_received_payments (received_at);


-- =========================================================
-- TABLE 10: editorial_payment_allocations
-- =========================================================

create table if not exists public.editorial_payment_allocations (
  id uuid primary key default gen_random_uuid(),

  payment_id uuid not null
    references public.editorial_received_payments(id)
    on delete cascade,

  invoice_id uuid null
    references public.editorial_invoices(id)
    on delete set null,

  payment_schedule_id uuid null
    references public.editorial_payment_schedules(id)
    on delete set null,

  project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  allocated_amount numeric(12,2) not null default 0,
  allocated_at timestamptz not null default now(),
  allocated_by uuid null references auth.users(id),

  notes text null,

  created_at timestamptz not null default now(),

  constraint editorial_payment_allocations_target_check
    check (invoice_id is not null or payment_schedule_id is not null),

  constraint editorial_payment_allocations_amount_check
    check (allocated_amount > 0)
);

comment on table public.editorial_payment_allocations is
'Allocation of received payments to invoices and/or payment schedules.';

create index if not exists idx_editorial_payment_allocations_payment_id
  on public.editorial_payment_allocations (payment_id);

create index if not exists idx_editorial_payment_allocations_invoice_id
  on public.editorial_payment_allocations (invoice_id);

create index if not exists idx_editorial_payment_allocations_payment_schedule_id
  on public.editorial_payment_allocations (payment_schedule_id);

create index if not exists idx_editorial_payment_allocations_project_id
  on public.editorial_payment_allocations (project_id);

create index if not exists idx_editorial_payment_allocations_allocated_at
  on public.editorial_payment_allocations (allocated_at);


-- =========================================================
-- TABLE 11: editorial_contract_renewals
-- =========================================================

create table if not exists public.editorial_contract_renewals (
  id uuid primary key default gen_random_uuid(),

  contract_id uuid not null
    references public.editorial_client_contracts(id)
    on delete cascade,

  previous_contract_id uuid null
    references public.editorial_client_contracts(id)
    on delete set null,

  renewal_status text not null default 'pending',
  renewal_type text not null default 'manual',

  proposed_start_date date null,
  proposed_end_date date null,
  proposed_value numeric(12,2) null,
  currency text not null default 'USD',

  renewed_contract_id uuid null
    references public.editorial_client_contracts(id)
    on delete set null,

  notes text null,
  managed_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_contract_renewals_status_check
    check (
      renewal_status in (
        'pending',
        'in_review',
        'approved',
        'renewed',
        'declined',
        'expired',
        'cancelled'
      )
    ),

  constraint editorial_contract_renewals_type_check
    check (
      renewal_type in (
        'manual',
        'auto',
        'upsell',
        'extension',
        'renegotiation'
      )
    ),

  constraint editorial_contract_renewals_proposed_value_check
    check (proposed_value is null or proposed_value >= 0)
);

comment on table public.editorial_contract_renewals is
'Renewal tracking and lifecycle management for contracts.';

create index if not exists idx_editorial_contract_renewals_contract_id
  on public.editorial_contract_renewals (contract_id);

create index if not exists idx_editorial_contract_renewals_previous_contract_id
  on public.editorial_contract_renewals (previous_contract_id);

create index if not exists idx_editorial_contract_renewals_renewal_status
  on public.editorial_contract_renewals (renewal_status);

create index if not exists idx_editorial_contract_renewals_renewal_type
  on public.editorial_contract_renewals (renewal_type);

create index if not exists idx_editorial_contract_renewals_renewed_contract_id
  on public.editorial_contract_renewals (renewed_contract_id);

create index if not exists idx_editorial_contract_renewals_managed_by
  on public.editorial_contract_renewals (managed_by);


-- =========================================================
-- TABLE 12: editorial_billing_events
-- =========================================================

create table if not exists public.editorial_billing_events (
  id uuid primary key default gen_random_uuid(),

  client_account_id uuid null
    references public.editorial_client_accounts(id)
    on delete set null,

  contract_id uuid null
    references public.editorial_client_contracts(id)
    on delete set null,

  invoice_id uuid null
    references public.editorial_invoices(id)
    on delete set null,

  payment_id uuid null
    references public.editorial_received_payments(id)
    on delete set null,

  renewal_id uuid null
    references public.editorial_contract_renewals(id)
    on delete set null,

  event_type text not null,
  actor_user_id uuid null references auth.users(id),

  summary text not null,
  payload jsonb null,

  created_at timestamptz not null default now()
);

comment on table public.editorial_billing_events is
'Audit trail for contract and billing lifecycle events.';

create index if not exists idx_editorial_billing_events_client_account_id
  on public.editorial_billing_events (client_account_id);

create index if not exists idx_editorial_billing_events_contract_id
  on public.editorial_billing_events (contract_id);

create index if not exists idx_editorial_billing_events_invoice_id
  on public.editorial_billing_events (invoice_id);

create index if not exists idx_editorial_billing_events_payment_id
  on public.editorial_billing_events (payment_id);

create index if not exists idx_editorial_billing_events_renewal_id
  on public.editorial_billing_events (renewal_id);

create index if not exists idx_editorial_billing_events_event_type
  on public.editorial_billing_events (event_type);

create index if not exists idx_editorial_billing_events_actor_user_id
  on public.editorial_billing_events (actor_user_id);

create index if not exists idx_editorial_billing_events_created_at
  on public.editorial_billing_events (created_at desc);


-- =========================================================
-- TABLE 13: editorial_billing_snapshots
-- =========================================================

create table if not exists public.editorial_billing_snapshots (
  id uuid primary key default gen_random_uuid(),

  snapshot_date date not null,
  client_account_id uuid null
    references public.editorial_client_accounts(id)
    on delete set null,

  total_contract_value numeric(14,2) not null default 0,
  total_invoiced numeric(14,2) not null default 0,
  total_collected numeric(14,2) not null default 0,
  total_outstanding numeric(14,2) not null default 0,
  overdue_invoices_count integer not null default 0,
  active_contracts_count integer not null default 0,
  pending_renewals_count integer not null default 0,

  created_at timestamptz not null default now(),

  constraint editorial_billing_snapshots_counts_check
    check (
      total_contract_value >= 0 and
      total_invoiced >= 0 and
      total_collected >= 0 and
      total_outstanding >= 0 and
      overdue_invoices_count >= 0 and
      active_contracts_count >= 0 and
      pending_renewals_count >= 0
    )
);

comment on table public.editorial_billing_snapshots is
'Periodic financial summary metrics for billing dashboards.';

create index if not exists idx_editorial_billing_snapshots_snapshot_date
  on public.editorial_billing_snapshots (snapshot_date);

create index if not exists idx_editorial_billing_snapshots_client_account_id
  on public.editorial_billing_snapshots (client_account_id);


-- =========================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================

alter table public.editorial_client_accounts        enable row level security;
alter table public.editorial_contract_templates     enable row level security;
alter table public.editorial_client_contracts       enable row level security;
alter table public.editorial_contract_versions      enable row level security;
alter table public.editorial_contract_signatures    enable row level security;
alter table public.editorial_invoices              enable row level security;
alter table public.editorial_invoice_items         enable row level security;
alter table public.editorial_payment_schedules      enable row level security;
alter table public.editorial_received_payments      enable row level security;
alter table public.editorial_payment_allocations    enable row level security;
alter table public.editorial_contract_renewals      enable row level security;
alter table public.editorial_billing_events         enable row level security;
alter table public.editorial_billing_snapshots      enable row level security;

-- Staff = users with active editorial_staff_profiles. Finance/leadership can be further restricted by department if needed.


-- =========================================================
-- RLS: editorial_client_accounts
-- =========================================================

create policy editorial_client_accounts_select_owner_staff
  on public.editorial_client_accounts
  for select
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_accounts_insert_staff
  on public.editorial_client_accounts
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_accounts_update_owner_staff
  on public.editorial_client_accounts
  for update
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_accounts_delete_staff
  on public.editorial_client_accounts
  for delete
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_contract_templates
-- =========================================================

create policy editorial_contract_templates_select_staff
  on public.editorial_contract_templates
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_contract_templates_manage_staff
  on public.editorial_contract_templates
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_client_contracts
-- =========================================================

create policy editorial_client_contracts_select_owner_staff
  on public.editorial_client_contracts
  for select
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_contracts_insert_staff
  on public.editorial_client_contracts
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_contracts_update_owner_staff
  on public.editorial_client_contracts
  for update
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_client_contracts_delete_staff
  on public.editorial_client_contracts
  for delete
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_contract_versions (via contract)
-- =========================================================

create policy editorial_contract_versions_select_staff_owner
  on public.editorial_contract_versions
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_client_contracts c
      where c.id = contract_id
        and (c.owner_user_id = auth.uid() or exists (
          select 1
          from public.editorial_staff_profiles sp
          where sp.user_id = auth.uid()
            and sp.active = true
        ))
    )
  );

create policy editorial_contract_versions_manage_staff
  on public.editorial_contract_versions
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_contract_signatures (via contract)
-- =========================================================

create policy editorial_contract_signatures_select_staff_owner
  on public.editorial_contract_signatures
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_client_contracts c
      where c.id = contract_id
        and (c.owner_user_id = auth.uid() or exists (
          select 1
          from public.editorial_staff_profiles sp
          where sp.user_id = auth.uid()
            and sp.active = true
        ))
    )
  );

create policy editorial_contract_signatures_manage_staff
  on public.editorial_contract_signatures
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_invoices
-- =========================================================

create policy editorial_invoices_select_owner_staff
  on public.editorial_invoices
  for select
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_invoices_insert_staff
  on public.editorial_invoices
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_invoices_update_owner_staff
  on public.editorial_invoices
  for update
  using (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_invoices_delete_staff
  on public.editorial_invoices
  for delete
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_invoice_items (via invoice)
-- =========================================================

create policy editorial_invoice_items_select_staff_owner
  on public.editorial_invoice_items
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_invoices i
      where i.id = invoice_id
        and (i.owner_user_id = auth.uid() or exists (
          select 1
          from public.editorial_staff_profiles sp
          where sp.user_id = auth.uid()
            and sp.active = true
        ))
    )
  );

create policy editorial_invoice_items_manage_staff
  on public.editorial_invoice_items
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_payment_schedules
-- =========================================================

create policy editorial_payment_schedules_select_staff
  on public.editorial_payment_schedules
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_payment_schedules_manage_staff
  on public.editorial_payment_schedules
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_received_payments (write = staff/service only)
-- =========================================================

create policy editorial_received_payments_select_staff
  on public.editorial_received_payments
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_received_payments_manage_staff
  on public.editorial_received_payments
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_payment_allocations (write = staff/service only)
-- =========================================================

create policy editorial_payment_allocations_select_staff
  on public.editorial_payment_allocations
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_payment_allocations_manage_staff
  on public.editorial_payment_allocations
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_contract_renewals
-- =========================================================

create policy editorial_contract_renewals_select_staff
  on public.editorial_contract_renewals
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_client_contracts c
      where c.id = contract_id
        and (c.owner_user_id = auth.uid() or exists (
          select 1
          from public.editorial_staff_profiles sp
          where sp.user_id = auth.uid()
            and sp.active = true
        ))
    )
  );

create policy editorial_contract_renewals_manage_staff
  on public.editorial_contract_renewals
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_billing_events (read = staff; write = staff/service)
-- =========================================================

create policy editorial_billing_events_select_staff
  on public.editorial_billing_events
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_billing_events_insert_staff
  on public.editorial_billing_events
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_billing_snapshots
-- =========================================================

create policy editorial_billing_snapshots_select_staff
  on public.editorial_billing_snapshots
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_billing_snapshots_manage_staff
  on public.editorial_billing_snapshots
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


commit;
