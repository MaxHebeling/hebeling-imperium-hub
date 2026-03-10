-- =============================================================================
-- Phase 12 — Client Billing, Contracts & Renewals
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Adds the legal-commercial-financial client layer for Reino Editorial:
-- contracts, amendments, signatures, invoices, payment schedules,
-- payment receipt/allocation, renewals, and billing auditability.
--
-- 13 new tables:
--   1.  editorial_client_accounts          — billing account per CRM organization
--   2.  editorial_contract_templates       — reusable contract templates
--   3.  editorial_client_contracts         — contracts issued to clients
--   4.  editorial_contract_versions        — contract revisions / amendments
--   5.  editorial_contract_signatures      — signer and signature tracking
--   6.  editorial_invoices                 — invoices issued to clients
--   7.  editorial_invoice_items            — invoice line items
--   8.  editorial_payment_schedules        — expected payment milestones
--   9.  editorial_received_payments        — actual payments received
--   10. editorial_payment_allocations      — payment-to-invoice/schedule allocation
--   11. editorial_contract_renewals        — renewal lifecycle per contract
--   12. editorial_billing_events           — immutable audit trail
--   13. editorial_billing_snapshots        — periodic financial KPIs
--
-- Seed data: default contract templates.
--
-- Depends on:
--   001_schema.sql                        (profiles, auth.users)
--   009_editorial_phase4a.sql             (editorial_projects, editorial_files)
--   017_editorial_crm_sales_pipeline.sql  (editorial_crm_organizations,
--                                          editorial_crm_contacts,
--                                          editorial_crm_opportunities,
--                                          editorial_crm_quotes)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL CLIENT ACCOUNTS
-- ============================================================
-- The billing account / legal customer profile.
-- One account per billable entity (company, individual, institution).
-- Links CRM organizations to billing, invoicing, and contracts.
-- ============================================================

create table if not exists editorial_client_accounts (
  id                      uuid          primary key default gen_random_uuid(),

  -- CRM context (optional — account can exist independently)
  organization_id         uuid          references editorial_crm_organizations(id) on delete set null,
  primary_contact_id      uuid          references editorial_crm_contacts(id) on delete set null,

  -- Unique human-readable billing reference (e.g. 'CA-0001')
  account_code            text          not null unique,

  display_name            text          not null,
  legal_name              text,
  tax_id                  text,

  -- Billing contact info
  billing_email           text,
  billing_phone           text,

  -- Billing address
  billing_country         text,
  billing_state           text,
  billing_city            text,
  billing_address_line1   text,
  billing_address_line2   text,
  postal_code             text,

  -- Financial defaults for this account
  preferred_currency      text          not null default 'USD',
  payment_terms_days      integer       not null default 15
                            check (payment_terms_days >= 0),

  active                  boolean       not null default true,

  owner_user_id           uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_client_accounts is
  'Billing account per billable entity. Links CRM organizations to contracts, invoices, and payment records.';
comment on column editorial_client_accounts.account_code is
  'Human-readable unique code, e.g. "CA-0001". Used on invoices and contracts.';
comment on column editorial_client_accounts.payment_terms_days is
  'Default net payment term in days (e.g. 15 = Net-15, 30 = Net-30).';

create index if not exists idx_client_accounts_org
  on editorial_client_accounts(organization_id);

create index if not exists idx_client_accounts_contact
  on editorial_client_accounts(primary_contact_id);

create index if not exists idx_client_accounts_owner
  on editorial_client_accounts(owner_user_id);

create index if not exists idx_client_accounts_active
  on editorial_client_accounts(active)
  where active = true;


-- ============================================================
-- 2. EDITORIAL CONTRACT TEMPLATES
-- ============================================================
-- Reusable contract templates that pre-fill the contract body
-- when creating a new client contract. Versioned via version_label.
-- ============================================================

create table if not exists editorial_contract_templates (
  id                      uuid          primary key default gen_random_uuid(),

  -- Stable machine-readable code (e.g. 'publishing_standard')
  code                    text          not null unique,

  name                    text          not null,
  description             text,

  -- Contract category
  contract_type           text          not null
                            check (contract_type in (
                              'publishing',
                              'editing',
                              'design',
                              'distribution',
                              'service_agreement',
                              'nda',
                              'consulting',
                              'custom'
                            )),

  -- Full contract body text (markdown or plain text)
  template_body           text          not null,

  default_currency        text          not null default 'USD',

  active                  boolean       not null default true,

  -- Human-readable version identifier (e.g. 'v2.1')
  version_label           text,

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_contract_templates is
  'Reusable contract templates used to pre-populate new client contracts.';
comment on column editorial_contract_templates.template_body is
  'Full template body in markdown or plain text. May contain {{placeholders}}.';
comment on column editorial_contract_templates.version_label is
  'Human-readable version string, e.g. "v2.1 (2025-01)".';

create index if not exists idx_contract_templates_type
  on editorial_contract_templates(contract_type);

create index if not exists idx_contract_templates_active
  on editorial_contract_templates(active)
  where active = true;


-- ── Seed: default contract templates ──────────────────────────────────────

insert into editorial_contract_templates
  (code, name, description, contract_type, template_body, version_label)
values
  ('publishing_standard',
   'Publishing Agreement (Standard)',
   'Standard full-service publishing agreement for book projects',
   'publishing',
   E'# PUBLISHING AGREEMENT\n\nThis Publishing Agreement ("Agreement") is entered into between **{{publisher_name}}** ("Publisher") and **{{client_name}}** ("Author").\n\n## 1. SCOPE OF SERVICES\nPublisher agrees to provide the services described in Schedule A attached hereto.\n\n## 2. PAYMENT TERMS\nAuthor agrees to pay the amounts set forth in Schedule B per the payment schedule agreed.\n\n## 3. INTELLECTUAL PROPERTY\nAuthor retains copyright ownership. Publisher is granted limited rights for the purposes described herein.\n\n## 4. TERM AND TERMINATION\nThis Agreement commences on {{start_date}} and continues until {{end_date}} unless terminated earlier.\n\n## 5. GOVERNING LAW\nThis Agreement shall be governed by the laws of {{governing_jurisdiction}}.',
   'v1.0'),

  ('editing_agreement',
   'Editorial Services Agreement',
   'Agreement for copyediting, line editing, or proofreading services',
   'editing',
   E'# EDITORIAL SERVICES AGREEMENT\n\nThis Agreement is between **{{provider_name}}** ("Editor") and **{{client_name}}** ("Client").\n\n## 1. SERVICES\nEditor agrees to provide editorial services as described in the attached Scope of Work.\n\n## 2. DELIVERABLES\nEditor will deliver the edited manuscript within {{delivery_days}} business days of receiving the final manuscript.\n\n## 3. FEES\nClient agrees to pay {{total_fee}} {{currency}} per the payment schedule attached.\n\n## 4. REVISIONS\nUp to {{revision_rounds}} rounds of revisions are included.\n\n## 5. CONFIDENTIALITY\nEditor agrees to keep the manuscript and all related materials confidential.',
   'v1.0'),

  ('design_services',
   'Design Services Agreement',
   'Agreement for cover design, interior layout, or formatting services',
   'design',
   E'# DESIGN SERVICES AGREEMENT\n\nThis Agreement is between **{{provider_name}}** ("Designer") and **{{client_name}}** ("Client").\n\n## 1. SCOPE\nDesigner will provide the design services described in the attached project brief.\n\n## 2. DELIVERABLES\nFinal files will be delivered in formats agreed upon (PDF, AI, PNG, etc.) within {{delivery_days}} business days.\n\n## 3. REVISIONS\nUp to {{revision_rounds}} design rounds are included. Additional rounds billed at {{hourly_rate}}/hr.\n\n## 4. USAGE RIGHTS\nUpon receipt of full payment, Client receives unlimited commercial usage rights to the final designs.\n\n## 5. FEES\nTotal fee: {{total_fee}} {{currency}}.',
   'v1.0'),

  ('distribution_agreement',
   'Distribution Services Agreement',
   'Agreement for book distribution channel setup and management',
   'distribution',
   E'# DISTRIBUTION SERVICES AGREEMENT\n\nThis Agreement governs distribution services provided by **{{provider_name}}** ("Distributor") to **{{client_name}}** ("Publisher").\n\n## 1. CHANNELS\nDistributor will submit the Work to the channels listed in Schedule A.\n\n## 2. RESPONSIBILITIES\nPublisher is responsible for providing print-ready files, cover art, and accurate metadata.\n\n## 3. TIMELINE\nInitial distribution setup will be completed within {{setup_days}} business days of receiving all required materials.\n\n## 4. FEES\nDistribution setup fee: {{setup_fee}} {{currency}}. Ongoing management: {{monthly_fee}} {{currency}}/month.\n\n## 5. TERM\nThis Agreement is effective for {{contract_months}} months from the start date.',
   'v1.0'),

  ('nda_standard',
   'Non-Disclosure Agreement (Standard)',
   'Standard mutual or one-way NDA for manuscript and project confidentiality',
   'nda',
   E'# NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into between **{{party_a}}** and **{{party_b}}** (collectively, the "Parties").\n\n## 1. CONFIDENTIAL INFORMATION\nEach Party may disclose confidential information to the other Party solely for the purpose of evaluating or executing a potential business relationship.\n\n## 2. OBLIGATIONS\nThe receiving Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to third parties without prior written consent.\n\n## 3. TERM\nThis Agreement remains in effect for {{nda_term_years}} years from the date of execution.\n\n## 4. GOVERNING LAW\nThis Agreement shall be governed by the laws of {{governing_jurisdiction}}.',
   'v1.0'),

  ('consulting_agreement',
   'Author Consulting Agreement',
   'Agreement for editorial strategy and author coaching sessions',
   'consulting',
   E'# CONSULTING AGREEMENT\n\nThis Consulting Agreement is between **{{consultant_name}}** ("Consultant") and **{{client_name}}** ("Client").\n\n## 1. SERVICES\nConsultant will provide the consulting services described in the attached Statement of Work.\n\n## 2. SESSIONS\nServices include {{session_count}} consulting sessions of {{session_duration_minutes}} minutes each.\n\n## 3. FEES\nTotal consulting fee: {{total_fee}} {{currency}}, payable per the schedule attached.\n\n## 4. CONFIDENTIALITY\nConsultant will keep all Client information confidential.\n\n## 5. INTELLECTUAL PROPERTY\nAny written materials produced specifically for Client during consulting sessions become Client property upon full payment.',
   'v1.0')
on conflict (code) do nothing;


-- ============================================================
-- 3. EDITORIAL CLIENT CONTRACTS
-- ============================================================
-- Actual contracts issued to clients. Connects CRM, projects,
-- and quotes. Tracks full lifecycle from draft through signature
-- to expiry or renewal.
-- ============================================================

create table if not exists editorial_client_contracts (
  id                      uuid          primary key default gen_random_uuid(),

  client_account_id       uuid          not null
                            references editorial_client_accounts(id) on delete cascade,

  -- Optional connections to other system entities
  project_id              uuid          references editorial_projects(id) on delete set null,
  opportunity_id          uuid          references editorial_crm_opportunities(id) on delete set null,
  quote_id                uuid          references editorial_crm_quotes(id) on delete set null,
  template_id             uuid          references editorial_contract_templates(id) on delete set null,

  -- Unique human-readable contract number (e.g. 'CTR-2025-0001')
  contract_number         text          not null unique,

  title                   text          not null,

  contract_type           text          not null
                            check (contract_type in (
                              'publishing',
                              'editing',
                              'design',
                              'distribution',
                              'service_agreement',
                              'nda',
                              'consulting',
                              'custom'
                            )),

  -- Contract lifecycle status
  status                  text          not null default 'draft'
                            check (status in (
                              'draft',
                              'sent',
                              'under_review',
                              'signed',
                              'active',
                              'expired',
                              'terminated',
                              'cancelled',
                              'renewed'
                            )),

  -- Financial value locked in the contract
  currency                text          not null default 'USD',
  contract_value          numeric(14,2) not null default 0
                            check (contract_value >= 0),

  -- Key dates
  effective_date          date,
  start_date              date,
  end_date                date,
  renewal_date            date,        -- when renewal process should begin
  termination_date        date,

  -- Renewal configuration
  auto_renew              boolean       not null default false,
  renewal_term_months     integer       check (renewal_term_months is null or renewal_term_months > 0),

  -- Execution timestamps
  signed_at               timestamptz,
  cancelled_at            timestamptz,

  -- Internal ownership
  created_by              uuid          references auth.users(id) on delete set null,
  owner_user_id           uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_client_contracts is
  'Client contracts. Tracks full lifecycle from draft through signature to expiry or renewal. Links CRM, projects, and quotes.';
comment on column editorial_client_contracts.contract_number is
  'Human-readable sequential identifier, e.g. "CTR-2025-0001".';
comment on column editorial_client_contracts.renewal_date is
  'Date when the renewal process should begin (e.g. 60 days before end_date).';
comment on column editorial_client_contracts.auto_renew is
  'When true, a renewal record should be created automatically before renewal_date.';

create index if not exists idx_contracts_account
  on editorial_client_contracts(client_account_id);

create index if not exists idx_contracts_project
  on editorial_client_contracts(project_id);

create index if not exists idx_contracts_opportunity
  on editorial_client_contracts(opportunity_id);

create index if not exists idx_contracts_quote
  on editorial_client_contracts(quote_id);

create index if not exists idx_contracts_template
  on editorial_client_contracts(template_id);

create index if not exists idx_contracts_status
  on editorial_client_contracts(status);

create index if not exists idx_contracts_renewal_date
  on editorial_client_contracts(renewal_date)
  where renewal_date is not null;

create index if not exists idx_contracts_end_date
  on editorial_client_contracts(end_date)
  where end_date is not null;

create index if not exists idx_contracts_owner
  on editorial_client_contracts(owner_user_id);

-- Fast expiry/renewal monitoring query
create index if not exists idx_contracts_active_end
  on editorial_client_contracts(status, end_date)
  where status in ('active', 'signed') and end_date is not null;


-- ============================================================
-- 4. EDITORIAL CONTRACT VERSIONS
-- ============================================================
-- Stores contract revisions and amendments. Each version can
-- carry its own document file and body text.
-- UNIQUE(contract_id, version_number) — sequential per contract.
-- ============================================================

create table if not exists editorial_contract_versions (
  id                      uuid          primary key default gen_random_uuid(),

  contract_id             uuid          not null
                            references editorial_client_contracts(id) on delete cascade,

  -- Monotonically increasing version number (1 = initial draft)
  version_number          integer       not null
                            check (version_number >= 1),

  -- Human-readable version label (e.g. 'Amendment 1 – Scope Change')
  version_label           text,

  -- Signed/reviewed document stored in the editorial file pipeline
  document_file_id        uuid
                            references editorial_files(id) on delete set null,

  -- Full contract body text for this version
  body_text               text,

  -- Summary of what changed from the previous version
  change_summary          text,

  status                  text          not null default 'draft'
                            check (status in (
                              'draft',
                              'sent',
                              'signed',
                              'superseded',
                              'cancelled'
                            )),

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),

  unique (contract_id, version_number)
);

comment on table editorial_contract_versions is
  'Contract revisions and amendments. One row per version per contract. UNIQUE(contract_id, version_number).';
comment on column editorial_contract_versions.change_summary is
  'Plain-text summary of changes from the previous version for audit purposes.';

create index if not exists idx_contract_versions_contract
  on editorial_contract_versions(contract_id);

create index if not exists idx_contract_versions_file
  on editorial_contract_versions(document_file_id)
  where document_file_id is not null;

create index if not exists idx_contract_versions_status
  on editorial_contract_versions(status);

create index if not exists idx_contract_versions_contract_num
  on editorial_contract_versions(contract_id, version_number desc);


-- ============================================================
-- 5. EDITORIAL CONTRACT SIGNATURES
-- ============================================================
-- Tracks all required signers and their signature status.
-- Supports both internal and client-side signers.
-- Stores optional e-signature provider reference.
-- ============================================================

create table if not exists editorial_contract_signatures (
  id                      uuid          primary key default gen_random_uuid(),

  contract_id             uuid          not null
                            references editorial_client_contracts(id) on delete cascade,

  -- The specific contract version being signed (optional)
  contract_version_id     uuid
                            references editorial_contract_versions(id) on delete set null,

  -- Signer details
  signer_name             text          not null,
  signer_email            text,
  signer_role             text,         -- e.g. 'CEO', 'Legal Representative'

  -- Who this signer represents
  signer_type             text          not null
                            check (signer_type in (
                              'client',
                              'internal',
                              'witness',
                              'legal',
                              'other'
                            )),

  -- Signature lifecycle
  signature_status        text          not null default 'pending'
                            check (signature_status in (
                              'pending',
                              'sent',
                              'viewed',
                              'signed',
                              'declined',
                              'expired',
                              'revoked'
                            )),

  signed_at               timestamptz,

  -- E-signature provider details (e.g. DocuSign, SignNow, HelloSign)
  signature_provider      text,
  signature_reference     text,         -- envelope ID, request ID, etc.

  -- IP address at time of signing (for legal purposes)
  ip_address              inet,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_contract_signatures is
  'Signer records per contract. Tracks signature status, e-signature provider details, and IP address for legal auditability.';
comment on column editorial_contract_signatures.signature_reference is
  'Provider-side envelope or request ID (e.g. DocuSign envelope ID).';
comment on column editorial_contract_signatures.ip_address is
  'IP address captured at signing time for legal audit trail.';

create index if not exists idx_signatures_contract
  on editorial_contract_signatures(contract_id);

create index if not exists idx_signatures_version
  on editorial_contract_signatures(contract_version_id)
  where contract_version_id is not null;

create index if not exists idx_signatures_email
  on editorial_contract_signatures(signer_email)
  where signer_email is not null;

create index if not exists idx_signatures_type
  on editorial_contract_signatures(signer_type);

create index if not exists idx_signatures_status
  on editorial_contract_signatures(signature_status);

-- Monitoring query: pending signatures on active contracts
create index if not exists idx_signatures_pending
  on editorial_contract_signatures(contract_id, signature_status)
  where signature_status in ('pending', 'sent');


-- ============================================================
-- 6. EDITORIAL INVOICES
-- ============================================================
-- Invoices issued to client accounts. Supports multiple invoice
-- types (standard, deposit, milestone, recurring, etc.).
-- balance_due = total_amount - amount_paid (maintained by application).
-- ============================================================

create table if not exists editorial_invoices (
  id                      uuid          primary key default gen_random_uuid(),

  client_account_id       uuid          not null
                            references editorial_client_accounts(id) on delete cascade,

  -- Optional connections
  contract_id             uuid          references editorial_client_contracts(id) on delete set null,
  project_id              uuid          references editorial_projects(id) on delete set null,
  quote_id                uuid          references editorial_crm_quotes(id) on delete set null,

  -- Unique human-readable invoice number (e.g. 'INV-2025-0042')
  invoice_number          text          not null unique,

  title                   text          not null,
  description             text,

  -- Invoice classification
  invoice_type            text          not null default 'standard'
                            check (invoice_type in (
                              'standard',
                              'deposit',
                              'milestone',
                              'recurring',
                              'final',
                              'adjustment',
                              'refund'
                            )),

  -- Invoice lifecycle
  status                  text          not null default 'draft'
                            check (status in (
                              'draft',
                              'issued',
                              'sent',
                              'partially_paid',
                              'paid',
                              'overdue',
                              'void',
                              'cancelled',
                              'refunded'
                            )),

  -- Financial summary (maintained by application; derived from line items)
  subtotal_amount         numeric(14,2) not null default 0,
  discount_amount         numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_amount              numeric(14,2) not null default 0 check (tax_amount >= 0),
  total_amount            numeric(14,2) not null default 0,
  amount_paid             numeric(14,2) not null default 0 check (amount_paid >= 0),
  balance_due             numeric(14,2) not null default 0,

  currency                text          not null default 'USD',

  -- Dates
  issue_date              date          not null,
  due_date                date,
  paid_at                 timestamptz,
  voided_at               timestamptz,

  -- Optional billing period (for recurring or milestone invoices)
  billing_period_start    date,
  billing_period_end      date,

  -- Ownership
  created_by              uuid          references auth.users(id) on delete set null,
  owner_user_id           uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_invoices is
  'Invoices issued to client accounts. Supports deposit, milestone, recurring, and standard billing. balance_due is maintained by the application.';
comment on column editorial_invoices.invoice_number is
  'Human-readable sequential identifier, e.g. "INV-2025-0001".';
comment on column editorial_invoices.balance_due is
  'Denormalized: total_amount - amount_paid. Updated on each payment allocation.';
comment on column editorial_invoices.billing_period_start is
  'Start of the billing period for recurring or milestone invoices.';

create index if not exists idx_invoices_account
  on editorial_invoices(client_account_id);

create index if not exists idx_invoices_contract
  on editorial_invoices(contract_id);

create index if not exists idx_invoices_project
  on editorial_invoices(project_id);

create index if not exists idx_invoices_quote
  on editorial_invoices(quote_id);

create index if not exists idx_invoices_status
  on editorial_invoices(status);

create index if not exists idx_invoices_issue_date
  on editorial_invoices(issue_date desc);

create index if not exists idx_invoices_due_date
  on editorial_invoices(due_date)
  where due_date is not null;

create index if not exists idx_invoices_owner
  on editorial_invoices(owner_user_id);

-- Fast overdue invoice query
create index if not exists idx_invoices_unpaid_due
  on editorial_invoices(status, due_date)
  where status in ('issued', 'sent', 'partially_paid') and due_date is not null;


-- ============================================================
-- 7. EDITORIAL INVOICE ITEMS
-- ============================================================
-- Line items composing an invoice. Mirrors the quote_items pattern.
-- ============================================================

create table if not exists editorial_invoice_items (
  id                      uuid          primary key default gen_random_uuid(),

  invoice_id              uuid          not null
                            references editorial_invoices(id) on delete cascade,

  -- Item classification
  item_type               text          not null default 'service'
                            check (item_type in (
                              'service',
                              'discount',
                              'fee',
                              'tax',
                              'adjustment',
                              'refund',
                              'custom'
                            )),

  title                   text          not null,
  description             text,

  -- Pricing
  quantity                numeric(10,3) not null default 1
                            check (quantity > 0),

  unit_price              numeric(14,2) not null default 0
                            check (unit_price >= 0),

  -- Denormalized: quantity * unit_price (for discounts may be negative)
  line_total              numeric(14,2) not null default 0,

  -- Display order within the invoice
  sort_order              integer       not null default 0,

  created_at              timestamptz   not null default now()
);

comment on table editorial_invoice_items is
  'Line items composing an invoice. Mirrors editorial_crm_quote_items structure.';
comment on column editorial_invoice_items.line_total is
  'Denormalized: quantity * unit_price. Maintained by application logic.';

create index if not exists idx_invoice_items_invoice
  on editorial_invoice_items(invoice_id);

create index if not exists idx_invoice_items_sort
  on editorial_invoice_items(invoice_id, sort_order asc);


-- ============================================================
-- 8. EDITORIAL PAYMENT SCHEDULES
-- ============================================================
-- Expected payment milestones for a contract/invoice/project.
-- Tracks what is expected vs. what has been paid.
-- ============================================================

create table if not exists editorial_payment_schedules (
  id                      uuid          primary key default gen_random_uuid(),

  client_account_id       uuid          not null
                            references editorial_client_accounts(id) on delete cascade,

  -- Optional context links
  contract_id             uuid          references editorial_client_contracts(id) on delete set null,
  invoice_id              uuid          references editorial_invoices(id) on delete set null,
  project_id              uuid          references editorial_projects(id) on delete set null,

  -- Schedule classification
  schedule_type           text          not null
                            check (schedule_type in (
                              'deposit',
                              'milestone',
                              'recurring',
                              'final_balance',
                              'renewal',
                              'manual'
                            )),

  -- Schedule lifecycle
  status                  text          not null default 'scheduled'
                            check (status in (
                              'scheduled',
                              'partially_paid',
                              'paid',
                              'overdue',
                              'cancelled'
                            )),

  title                   text          not null,
  description             text,

  due_date                date          not null,

  -- Financial tracking
  expected_amount         numeric(14,2) not null default 0 check (expected_amount >= 0),
  currency                text          not null default 'USD',
  paid_amount             numeric(14,2) not null default 0 check (paid_amount >= 0),
  remaining_amount        numeric(14,2) not null default 0,

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_payment_schedules is
  'Expected payment milestones per contract/invoice/project. Tracks expected vs. received amounts.';
comment on column editorial_payment_schedules.remaining_amount is
  'Denormalized: expected_amount - paid_amount. Updated on each allocation.';

create index if not exists idx_pay_schedules_account
  on editorial_payment_schedules(client_account_id);

create index if not exists idx_pay_schedules_contract
  on editorial_payment_schedules(contract_id);

create index if not exists idx_pay_schedules_invoice
  on editorial_payment_schedules(invoice_id);

create index if not exists idx_pay_schedules_project
  on editorial_payment_schedules(project_id);

create index if not exists idx_pay_schedules_type
  on editorial_payment_schedules(schedule_type);

create index if not exists idx_pay_schedules_status
  on editorial_payment_schedules(status);

create index if not exists idx_pay_schedules_due
  on editorial_payment_schedules(due_date asc);

-- Overdue schedule monitoring
create index if not exists idx_pay_schedules_unpaid_due
  on editorial_payment_schedules(status, due_date)
  where status in ('scheduled', 'partially_paid');


-- ============================================================
-- 9. EDITORIAL RECEIVED PAYMENTS
-- ============================================================
-- Actual payments received from clients. Not yet allocated to
-- specific invoices — allocation is a separate step
-- (editorial_payment_allocations).
-- ============================================================

create table if not exists editorial_received_payments (
  id                      uuid          primary key default gen_random_uuid(),

  client_account_id       uuid          not null
                            references editorial_client_accounts(id) on delete cascade,

  -- Client-provided or provider-assigned reference
  payment_reference       text,

  -- Payment method used
  payment_method          text          not null
                            check (payment_method in (
                              'cash',
                              'bank_transfer',
                              'credit_card',
                              'debit_card',
                              'stripe',
                              'paypal',
                              'check',
                              'wire',
                              'other'
                            )),

  payment_provider        text,         -- e.g. 'stripe', 'paypal', 'banamex'
  provider_transaction_id text,         -- provider-side reference for reconciliation

  -- Payment allocation lifecycle
  status                  text          not null default 'received'
                            check (status in (
                              'received',
                              'pending',
                              'allocated',
                              'partially_allocated',
                              'failed',
                              'reversed',
                              'refunded'
                            )),

  amount                  numeric(14,2) not null default 0 check (amount >= 0),
  currency                text          not null default 'USD',

  received_at             timestamptz   not null default now(),
  recorded_by             uuid          references auth.users(id) on delete set null,

  notes                   text,

  created_at              timestamptz   not null default now()
);

comment on table editorial_received_payments is
  'Payments received from clients. Unallocated by default; allocation is done in editorial_payment_allocations.';
comment on column editorial_received_payments.provider_transaction_id is
  'Provider-side transaction ID (e.g. Stripe charge ID) for reconciliation.';
comment on column editorial_received_payments.status is
  'received → partially_allocated | allocated | reversed | refunded | failed.';

create index if not exists idx_received_payments_account
  on editorial_received_payments(client_account_id);

create index if not exists idx_received_payments_reference
  on editorial_received_payments(payment_reference)
  where payment_reference is not null;

create index if not exists idx_received_payments_method
  on editorial_received_payments(payment_method);

create index if not exists idx_received_payments_status
  on editorial_received_payments(status);

create index if not exists idx_received_payments_received_at
  on editorial_received_payments(received_at desc);

-- Unallocated payment monitoring
create index if not exists idx_received_payments_unallocated
  on editorial_received_payments(status, client_account_id)
  where status in ('received', 'partially_allocated');


-- ============================================================
-- 10. EDITORIAL PAYMENT ALLOCATIONS
-- ============================================================
-- Allocation of a received payment to specific invoices and/or
-- payment schedule milestones. One row per allocation line.
-- At least one of invoice_id or payment_schedule_id must be set.
-- ============================================================

create table if not exists editorial_payment_allocations (
  id                      uuid          primary key default gen_random_uuid(),

  payment_id              uuid          not null
                            references editorial_received_payments(id) on delete cascade,

  -- At least one target must be provided
  invoice_id              uuid          references editorial_invoices(id) on delete set null,
  payment_schedule_id     uuid          references editorial_payment_schedules(id) on delete set null,
  project_id              uuid          references editorial_projects(id) on delete set null,

  allocated_amount        numeric(14,2) not null default 0 check (allocated_amount > 0),

  allocated_at            timestamptz   not null default now(),
  allocated_by            uuid          references auth.users(id) on delete set null,

  notes                   text,

  created_at              timestamptz   not null default now(),

  -- At least one of invoice_id or payment_schedule_id must be present
  constraint chk_allocation_has_target check (
    invoice_id is not null or payment_schedule_id is not null
  )
);

comment on table editorial_payment_allocations is
  'Allocation of a received payment to invoices and/or payment schedules. CHECK ensures at least one target is always set.';
comment on column editorial_payment_allocations.allocated_amount is
  'Amount of the parent payment applied to this specific invoice or schedule milestone.';

create index if not exists idx_allocations_payment
  on editorial_payment_allocations(payment_id);

create index if not exists idx_allocations_invoice
  on editorial_payment_allocations(invoice_id)
  where invoice_id is not null;

create index if not exists idx_allocations_schedule
  on editorial_payment_allocations(payment_schedule_id)
  where payment_schedule_id is not null;

create index if not exists idx_allocations_project
  on editorial_payment_allocations(project_id)
  where project_id is not null;

create index if not exists idx_allocations_allocated_at
  on editorial_payment_allocations(allocated_at desc);


-- ============================================================
-- 11. EDITORIAL CONTRACT RENEWALS
-- ============================================================
-- First-class renewal tracking per contract. Supports auto and
-- manual renewal workflows, upsells, extensions, and renegotiations.
-- ============================================================

create table if not exists editorial_contract_renewals (
  id                      uuid          primary key default gen_random_uuid(),

  -- The contract this renewal process is for
  contract_id             uuid          not null
                            references editorial_client_contracts(id) on delete cascade,

  -- The contract that was renewed (for chains of renewals)
  previous_contract_id    uuid
                            references editorial_client_contracts(id) on delete set null,

  -- Renewal lifecycle
  renewal_status          text          not null default 'pending'
                            check (renewal_status in (
                              'pending',
                              'in_review',
                              'approved',
                              'renewed',
                              'declined',
                              'expired',
                              'cancelled'
                            )),

  renewal_type            text          not null default 'manual'
                            check (renewal_type in (
                              'manual',
                              'auto',
                              'upsell',
                              'extension',
                              'renegotiation'
                            )),

  -- Proposed renewal terms
  proposed_start_date     date,
  proposed_end_date       date,
  proposed_value          numeric(14,2) check (proposed_value is null or proposed_value >= 0),
  currency                text          not null default 'USD',

  -- The new contract created on successful renewal
  renewed_contract_id     uuid
                            references editorial_client_contracts(id) on delete set null,

  notes                   text,
  managed_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_contract_renewals is
  'Renewal tracking per contract. Supports auto/manual renewals, upsells, extensions, and renegotiations. Fully auditable.';
comment on column editorial_contract_renewals.renewed_contract_id is
  'Set when the renewal results in a new contract. NULL while renewal is in progress.';

create index if not exists idx_renewals_contract
  on editorial_contract_renewals(contract_id);

create index if not exists idx_renewals_previous_contract
  on editorial_contract_renewals(previous_contract_id)
  where previous_contract_id is not null;

create index if not exists idx_renewals_status
  on editorial_contract_renewals(renewal_status);

create index if not exists idx_renewals_type
  on editorial_contract_renewals(renewal_type);

create index if not exists idx_renewals_renewed_contract
  on editorial_contract_renewals(renewed_contract_id)
  where renewed_contract_id is not null;

create index if not exists idx_renewals_managed_by
  on editorial_contract_renewals(managed_by);

-- Monitoring: pending / in-review renewals
create index if not exists idx_renewals_active
  on editorial_contract_renewals(renewal_status, managed_by)
  where renewal_status in ('pending', 'in_review', 'approved');


-- ============================================================
-- 12. EDITORIAL BILLING EVENTS
-- ============================================================
-- Immutable audit trail for all contract and billing lifecycle events.
-- Written by application code / service-role only.
-- ============================================================

create table if not exists editorial_billing_events (
  id                      uuid          primary key default gen_random_uuid(),

  -- Any or all context links may be set
  client_account_id       uuid          references editorial_client_accounts(id) on delete set null,
  contract_id             uuid          references editorial_client_contracts(id) on delete set null,
  invoice_id              uuid          references editorial_invoices(id) on delete set null,
  payment_id              uuid          references editorial_received_payments(id) on delete set null,
  renewal_id              uuid          references editorial_contract_renewals(id) on delete set null,

  -- Event classification (free-form; allows extension without schema change)
  event_type              text          not null,

  -- Actor (null = system/automated)
  actor_user_id           uuid          references auth.users(id) on delete set null,

  summary                 text          not null,
  payload                 jsonb,

  created_at              timestamptz   not null default now()
);

comment on table editorial_billing_events is
  'Immutable audit trail for contract and billing lifecycle events. Written by application code / service-role only.';
comment on column editorial_billing_events.event_type is
  'e.g. "contract_signed", "invoice_issued", "payment_received", "payment_allocated", "renewal_initiated", "contract_expired".';
comment on column editorial_billing_events.actor_user_id is
  'NULL when triggered by an automated workflow or scheduled job.';

create index if not exists idx_billing_events_account
  on editorial_billing_events(client_account_id);

create index if not exists idx_billing_events_contract
  on editorial_billing_events(contract_id);

create index if not exists idx_billing_events_invoice
  on editorial_billing_events(invoice_id);

create index if not exists idx_billing_events_payment
  on editorial_billing_events(payment_id);

create index if not exists idx_billing_events_renewal
  on editorial_billing_events(renewal_id);

create index if not exists idx_billing_events_type
  on editorial_billing_events(event_type);

create index if not exists idx_billing_events_actor
  on editorial_billing_events(actor_user_id);

create index if not exists idx_billing_events_created
  on editorial_billing_events(created_at desc);

create index if not exists idx_billing_events_account_created
  on editorial_billing_events(client_account_id, created_at desc)
  where client_account_id is not null;


-- ============================================================
-- 13. EDITORIAL BILLING SNAPSHOTS
-- ============================================================
-- Periodic aggregated financial summary metrics per client account
-- or globally (client_account_id IS NULL).
-- Generated by a scheduled job for billing dashboards.
-- ============================================================

create table if not exists editorial_billing_snapshots (
  id                      uuid          primary key default gen_random_uuid(),

  snapshot_date           date          not null,

  -- NULL = global; set = per client account
  client_account_id       uuid          references editorial_client_accounts(id) on delete set null,

  -- Financial KPIs at snapshot time
  total_contract_value    numeric(14,2) not null default 0,
  total_invoiced          numeric(14,2) not null default 0,
  total_collected         numeric(14,2) not null default 0,
  total_outstanding       numeric(14,2) not null default 0,

  -- Operational counts
  overdue_invoices_count  integer       not null default 0 check (overdue_invoices_count >= 0),
  active_contracts_count  integer       not null default 0 check (active_contracts_count >= 0),
  pending_renewals_count  integer       not null default 0 check (pending_renewals_count >= 0),

  created_at              timestamptz   not null default now()
);

comment on table editorial_billing_snapshots is
  'Periodic billing KPI snapshots per client account (or global). Generated by scheduled jobs for dashboards.';
comment on column editorial_billing_snapshots.total_outstanding is
  'Sum of balance_due across non-void invoices for this account.';

create index if not exists idx_billing_snapshots_date
  on editorial_billing_snapshots(snapshot_date desc);

create index if not exists idx_billing_snapshots_account
  on editorial_billing_snapshots(client_account_id);

create index if not exists idx_billing_snapshots_date_account
  on editorial_billing_snapshots(snapshot_date desc, client_account_id);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Staff (superadmin, admin, ops) can fully manage all billing tables.
--   2. Record owners (owner_user_id = auth.uid()) can read/update their records.
--   3. Billing, contract, invoice, and payment data is internal by default.
--   4. Billing event writes and snapshot writes are service-role only.
--   5. Future client portal access should be added via separate policies.
-- =============================================================================

alter table editorial_client_accounts         enable row level security;
alter table editorial_contract_templates      enable row level security;
alter table editorial_client_contracts        enable row level security;
alter table editorial_contract_versions       enable row level security;
alter table editorial_contract_signatures     enable row level security;
alter table editorial_invoices                enable row level security;
alter table editorial_invoice_items           enable row level security;
alter table editorial_payment_schedules       enable row level security;
alter table editorial_received_payments       enable row level security;
alter table editorial_payment_allocations     enable row level security;
alter table editorial_contract_renewals       enable row level security;
alter table editorial_billing_events          enable row level security;
alter table editorial_billing_snapshots       enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_client_accounts
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read client accounts"   on editorial_client_accounts;
create policy "staff read client accounts"
  on editorial_client_accounts
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write client accounts"  on editorial_client_accounts;
create policy "staff write client accounts"
  on editorial_client_accounts
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own client accounts" on editorial_client_accounts;
create policy "owners read own client accounts"
  on editorial_client_accounts
  for select
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_contract_templates (reference data)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read contract templates"   on editorial_contract_templates;
create policy "staff read contract templates"
  on editorial_contract_templates
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin manage contract templates" on editorial_contract_templates;
create policy "admin manage contract templates"
  on editorial_contract_templates
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_client_contracts
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read client contracts"  on editorial_client_contracts;
create policy "staff read client contracts"
  on editorial_client_contracts
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write client contracts" on editorial_client_contracts;
create policy "staff write client contracts"
  on editorial_client_contracts
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own contracts" on editorial_client_contracts;
create policy "owners read own contracts"
  on editorial_client_contracts
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "owners update own contracts" on editorial_client_contracts;
create policy "owners update own contracts"
  on editorial_client_contracts
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_contract_versions
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read contract versions"  on editorial_contract_versions;
create policy "staff read contract versions"
  on editorial_contract_versions
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write contract versions" on editorial_contract_versions;
create policy "staff write contract versions"
  on editorial_contract_versions
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_contract_signatures
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read contract signatures"  on editorial_contract_signatures;
create policy "staff read contract signatures"
  on editorial_contract_signatures
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write contract signatures" on editorial_contract_signatures;
create policy "staff write contract signatures"
  on editorial_contract_signatures
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_invoices
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read invoices"  on editorial_invoices;
create policy "staff read invoices"
  on editorial_invoices
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write invoices" on editorial_invoices;
create policy "staff write invoices"
  on editorial_invoices
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "owners read own invoices"   on editorial_invoices;
create policy "owners read own invoices"
  on editorial_invoices
  for select
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_invoice_items
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read invoice items"  on editorial_invoice_items;
create policy "staff read invoice items"
  on editorial_invoice_items
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write invoice items" on editorial_invoice_items;
create policy "staff write invoice items"
  on editorial_invoice_items
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_payment_schedules
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read payment schedules"  on editorial_payment_schedules;
create policy "staff read payment schedules"
  on editorial_payment_schedules
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write payment schedules" on editorial_payment_schedules;
create policy "staff write payment schedules"
  on editorial_payment_schedules
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 9: editorial_received_payments
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read received payments"  on editorial_received_payments;
create policy "staff read received payments"
  on editorial_received_payments
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write received payments"  on editorial_received_payments;
create policy "admin write received payments"
  on editorial_received_payments
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 10: editorial_payment_allocations
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read payment allocations"  on editorial_payment_allocations;
create policy "staff read payment allocations"
  on editorial_payment_allocations
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write payment allocations"  on editorial_payment_allocations;
create policy "admin write payment allocations"
  on editorial_payment_allocations
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 11: editorial_contract_renewals
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read contract renewals"  on editorial_contract_renewals;
create policy "staff read contract renewals"
  on editorial_contract_renewals
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff write contract renewals" on editorial_contract_renewals;
create policy "staff write contract renewals"
  on editorial_contract_renewals
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "managers read own renewals" on editorial_contract_renewals;
create policy "managers read own renewals"
  on editorial_contract_renewals
  for select
  using (managed_by = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 12: editorial_billing_events (audit trail — service-role writes only)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read billing events"  on editorial_billing_events;
create policy "staff read billing events"
  on editorial_billing_events
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only — no user-facing insert/update policy.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 13: editorial_billing_snapshots (executive data — service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read billing snapshots"  on editorial_billing_snapshots;
create policy "staff read billing snapshots"
  on editorial_billing_snapshots
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only (generated by scheduled jobs).


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
