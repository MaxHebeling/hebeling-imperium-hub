# Reino Editorial AI Engine — Database Architecture Audit
## Phases 9–13 · Migrations 015–019
### Senior Staff-Level Review · March 2026

---

## 1. Executive Summary

### Overall Assessment

The schema architecture is **ambitious and structurally coherent** in concept. The table naming
convention is disciplined (`editorial_*`), the use of UUID primary keys and TIMESTAMPTZ is
consistent throughout, and the business domain is well-decomposed across phases. Seed data is
well-considered, and the indexing strategy improves meaningfully with each phase.

However, there are **eight issues severe enough to cause runtime failures, data loss, or security
breaches in production**, and a further set of design weaknesses that will compound into
maintenance debt at scale.

### Key Strengths

- Consistent `editorial_*` table prefix across all 60+ tables.
- `gen_random_uuid()` used universally as the primary key strategy.
- `CREATE TABLE IF NOT EXISTS` and `DROP POLICY IF EXISTS` makes migrations re-runnable.
- `CHECK` constraints are extensively used, replacing enum types with safer text + check patterns.
- Partial indexes (`WHERE status IN (...)`, `WHERE active = true`) are used correctly throughout.
- Composite indexes for the most common dashboard query patterns exist in the later phases.
- Seed data for channels, departments, SLA policies, metric definitions, and scorecards is included.
- `ON DELETE RESTRICT` on `editorial_sla_policies` prevents orphaned SLA trackers. Correct.
- `editorial_staff_profiles.user_id` has a `UNIQUE` constraint. Correct.
- `editorial_distribution_submissions` has `UNIQUE(project_id, channel_id, format_id)`. Intent is correct — but execution has a fatal NULL bug (see §3.1).

### Top Risks (Severity Order)

| # | Issue | Risk Level |
|---|-------|------------|
| 1 | `editorial_project_members` table never created but referenced in design | **CRITICAL — runtime NULL policies** |
| 2 | `UNIQUE(project_id, channel_id, format_id)` broken by nullable `format_id` | **CRITICAL — deduplication fails silently** |
| 3 | `editorial_financial_ledger.project_id ON DELETE CASCADE` deletes financial history | **CRITICAL — data loss** |
| 4 | `editorial_staff_profiles.user_id ON DELETE CASCADE` blocked by `ON DELETE RESTRICT` on assignments | **CRITICAL — user deletion runtime error** |
| 5 | 26+ tables have `updated_at` with no trigger; column is permanently stale | **HIGH — data integrity** |
| 6 | Phases 009–013 use `profiles(id)` FKs; Phases 014–019 use `auth.users(id)` — inconsistent RLS | **HIGH — security** |
| 7 | Stale denormalized columns (`rating`, `balance_due`, `amount_paid`, `orders_count`) with no enforcement | **HIGH — data integrity** |
| 8 | `org_id` scoping disappears from Phase 14 onward; multi-tenant boundary breaks | **HIGH — multi-tenant security** |

### Go / No-Go Recommendation

**Conditional GO** — The schema can proceed to implementation, but the eight critical issues in §3
**must be resolved before running any migration in production**. The improvements in §4 should be
addressed before the first staff dashboard is built to avoid costly retroactive migrations.

---

## 2. Migration Dependency Review

### File Inventory

```
009_editorial_phase4a.sql       Phase 4A — Core tables (projects, files, jobs, comments)
010_editorial_phase4b.sql       Phase 4B — AI automation (prompt templates, findings, decisions)
011_editorial_phase5.sql        Phase 5  — AI governance (policies, model configs, quality)
012_editorial_phase6.sql        Phase 6  — AI production pipeline
013_editorial_phase7.sql        Phase 7  — AI editorial assistant
014_editorial_marketplace.sql   Phase 8  — Marketplace (professionals, listings, orders, payments)
015_editorial_distribution_engine.sql  Phase 9  — Distribution
016_reino_editorial_os.sql      Phase 10 — Editorial OS
017_editorial_crm_sales_pipeline.sql   Phase 11 — CRM / Sales
018_editorial_billing_contracts_renewals.sql  Phase 12 — Billing / Contracts
019_editorial_analytics_forecasting_intelligence.sql  Phase 13 — Analytics
```

> **Note:** The problem statement refers to migration numbers 013–017 for phases 9–13. The actual
> files are numbered 015–019. This is a documentation inconsistency only — the files are in the
> correct dependency order.

### Dependency Graph (015–019)

```
009 ──────────────────────────────────────────────────────────────────────► ALL
014 (marketplace_orders, professionals, service_listings, payments, files) ──► 015, 016, 017, 018
015 (dist_submissions, dist_channels, dist_formats, dist_jobs) ──────────► 016, 019
016 (operational_tasks, staff_profiles, departments, sla_trackers) ──────► 017, 018
017 (crm_organizations, crm_contacts, crm_opportunities, crm_quotes) ───► 018, 019
018 (client_accounts, client_contracts, invoices) ───────────────────────► 019
```

### Ordering Analysis

| Migration | Prerequisite | Status |
|-----------|-------------|--------|
| 015 | Needs `editorial_projects` (009), `editorial_files` (009) | ✅ Correct |
| 015 | Needs `auth.users` (Supabase built-in) | ✅ Correct |
| 016 | Needs `editorial_projects` (009), `editorial_marketplace_orders` (014), `editorial_distribution_submissions` (015) | ✅ Correct |
| 017 | Needs `editorial_projects` (009) | ✅ Correct |
| 018 | Needs `editorial_crm_organizations`, `editorial_crm_contacts`, `editorial_crm_opportunities`, `editorial_crm_quotes` (all 017) | ✅ Correct |
| 019 | Needs `editorial_metric_definitions` (self), `editorial_projects` (009), `editorial_crm_opportunities` (017), `editorial_client_accounts` (018) | ✅ Correct |

**No circular dependencies detected.** The ordering is safe for a clean database run.

### Hidden Risk: Missing Table in Design vs Reality

The architectural specification for every phase from 9 onward mentions
`editorial_project_members` as a core table for RLS policy anchoring. **This table does not exist
in any migration file (001–019).** The RLS policies instead fall back to `p.created_by` checks,
which is weaker and not equivalent to a membership model. See §6 for full impact.

---

## 3. Critical Issues (Must Fix Before Implementation)

### 3.1 UNIQUE Constraint Broken by Nullable Foreign Key

**File:** `015_editorial_distribution_engine.sql`
**Table:** `editorial_distribution_submissions`

```sql
unique (project_id, channel_id, format_id)
```

`format_id` is nullable (`references editorial_distribution_formats(id) ON DELETE SET NULL`).
In PostgreSQL, `NULL != NULL` in unique constraint evaluation. This means **multiple rows can
coexist with the same `(project_id, channel_id)` pair when `format_id IS NULL`**, completely
defeating the deduplication constraint for channel-level submissions not tied to a specific format.

**Concrete failure scenario:** A staff member submits project P to Amazon KDP without selecting a
format. This is recorded with `format_id = NULL`. Ten minutes later, they click Submit again. A
second row is inserted — no constraint violation. The project now has two draft submissions to
Amazon KDP. If both are processed, the channel receives two submissions for the same book.

**Fix:**

```sql
-- Remove the broken constraint:
-- unique (project_id, channel_id, format_id)

-- Replace with a partial unique index for NULL format_id:
create unique index uq_dist_submissions_no_format
  on editorial_distribution_submissions(project_id, channel_id)
  where format_id is null;

-- And retain the non-null case:
create unique index uq_dist_submissions_with_format
  on editorial_distribution_submissions(project_id, channel_id, format_id)
  where format_id is not null;
```

---

### 3.2 Financial Ledger Cascades Delete on Project Deletion

**File:** `016_reino_editorial_os.sql`
**Table:** `editorial_financial_ledger`

```sql
project_id uuid references editorial_projects(id) on delete cascade,
```

Deleting an `editorial_project` (e.g. archived → purged) **silently destroys every financial
ledger entry for that project**. Financial records must be immutable and auditable even after a
project is archived or deleted.

**Fix:**

```sql
-- Change ON DELETE behavior:
project_id uuid references editorial_projects(id) on delete set null,
```

Additionally, add a hard NOT NULL constraint via application logic, or add a `project_code` text
column to preserve the project identity even after deletion:

```sql
project_reference_code text, -- human-readable backup of project title/code
```

The same concern applies to `editorial_billing_events`:
```sql
client_account_id uuid references editorial_client_accounts(id) on delete set null, -- ✅ already correct
contract_id       uuid references editorial_client_contracts(id)  on delete set null, -- ✅ already correct
```
Billing events are already correctly using `SET NULL`. Apply the same pattern to
`editorial_financial_ledger`.

---

### 3.3 User Deletion Deadlock: CASCADE vs RESTRICT Conflict

**Files:** `016_reino_editorial_os.sql`
**Tables:** `editorial_staff_profiles`, `editorial_project_assignments`

```sql
-- editorial_staff_profiles:
user_id uuid not null references auth.users(id) on delete cascade,

-- editorial_project_assignments:
staff_profile_id uuid not null references editorial_staff_profiles(id) on delete restrict,
```

When a user is deleted from `auth.users`, PostgreSQL attempts to cascade-delete their
`editorial_staff_profiles` row. However, if that staff profile has any associated
`editorial_project_assignments` rows (which use `ON DELETE RESTRICT`), **the cascade fails with a
foreign key violation**. The user cannot be deleted until all assignments are manually removed.

This makes user offboarding a manual multi-step process that will break if not properly handled,
and creates silent failure modes in automated user cleanup flows.

**Fix:** Choose one of:

1. **(Recommended)** Change `editorial_staff_profiles` to `ON DELETE RESTRICT`, and implement a
   soft-delete workflow that sets `active = false` and nullifies assignment records explicitly:
   ```sql
   user_id uuid not null references auth.users(id) on delete restrict,
   ```
   Add a `deactivated_at timestamptz` column for soft-delete audit trail.

2. Change `editorial_project_assignments.staff_profile_id` to `ON DELETE SET NULL` (makes
   assignments anonymous on staff removal — only acceptable if staff assignments are tracked
   historically, not operationally).

---

### 3.4 `editorial_project_members` Referenced in Design but Never Created

**Referenced in:** All phase specifications (§ ROW LEVEL SECURITY sections), problem statements
for phases 9–13.

**Reality:** Zero migration files create this table. The actual RLS policies fall back to:
```sql
p.created_by = (select id from profiles where id = auth.uid() limit 1)
```

This is a **single-owner model**, not a membership model. It means:
- A project with three co-editors can only have one "author" who can read distribution data.
- Staff who are assigned to projects via `editorial_project_assignments` (Phase 10) have no RLS
  path to access their project's distribution or metadata records unless they have admin role.
- The architectural intent of project-member-based access is completely unimplemented.

**Fix:**

```sql
create table if not exists editorial_project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references editorial_projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'viewer'
                check (role in ('owner', 'editor', 'reviewer', 'viewer')),
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (project_id, user_id)
);
```

Then update RLS policies across phases 015–019 to use:
```sql
exists (
  select 1 from editorial_project_members pm
  where pm.project_id = <table>.project_id
    and pm.user_id = auth.uid()
)
```

---

### 3.5 `updated_at` Columns Are Permanently Stale (No Triggers)

**Files:** 015–019 (all)
**Count:** 26+ tables with `updated_at timestamptz not null default now()` and **zero triggers
to update the value after the initial insert.**

The only `updated_at` trigger in the codebase is in `005_create_vercel_projects_table.sql` for
`vercel_projects`. This pattern was never applied to the editorial tables.

As a result, `updated_at` on every `editorial_distribution_submissions`, `editorial_invoices`,
`editorial_client_contracts`, `editorial_crm_opportunities`, `editorial_scorecard_results`, and
every other mutable table is **frozen at the creation timestamp forever**.

Applications reading `updated_at` for change detection, incremental syncs, or display ("Last
updated: 3 days ago") will produce incorrect results immediately.

**Fix:** Add a reusable trigger function and apply it to every table with `updated_at`:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Apply to each table, e.g.:
create trigger trg_editorial_invoices_updated_at
  before update on editorial_invoices
  for each row execute function public.set_updated_at();
```

This function should be created in a base migration (ideally `001_schema.sql` or a new
`001b_functions.sql`) and applied to all mutable tables. Supabase also exposes
`moddatetime` from the `pg_catalog` extensions — either approach is acceptable.

---

### 3.6 Multi-Tenant `org_id` Boundary Vanishes at Phase 14

**Files:** 009–013 (inclusive) vs 014–019
**Tables:** `editorial_projects`, `editorial_ai_policies`, all Phase 4–7 tables carry `org_id`
as the tenant boundary. Every RLS policy gates on `org_id = public.get_my_org_id()`.

From Phase 14 (`014_editorial_marketplace.sql`) onward, **`org_id` disappears entirely**. The
marketplace, distribution, OS, CRM, billing, and analytics tables have no `org_id` column and no
org-scoped RLS. Instead, policies rely on:
- Role checks: `public.get_my_role() in ('superadmin', 'admin', 'ops')`
- Ownership checks: `owner_user_id = auth.uid()`
- Project chain joins: `exists (select 1 from editorial_projects p where p.org_id = public.get_my_org_id())`

The project-chain join approach (used in 015) partially preserves the tenant boundary, but:
1. It requires a JOIN every time, adding latency to every policy evaluation.
2. Tables like `editorial_crm_organizations`, `editorial_distribution_channels`,
   `editorial_staff_profiles`, and `editorial_departments` have NO project-chain join and are
   accessible to any authenticated user with the right role, regardless of org.
3. If the system is ever multi-org (multiple Reino instances), **CRM leads, staff profiles, and
   financial ledger entries from one org are visible to admins of another org.**

**Fix (short term):** Add `org_id` to Phase 14+ tables that represent org-specific entities:
```sql
-- In editorial_crm_organizations, editorial_staff_profiles, editorial_departments, etc.:
org_id uuid not null references organizations(id) on delete cascade,
```

Then add `org_id = public.get_my_org_id()` to all RLS policies.

**Fix (medium term):** Introduce a `get_my_org_id()` join shortcut as a security-definer
function that returns the org from the project chain, to avoid repeating the JOIN.

---

### 3.7 Stale Denormalized Financial Columns with No Enforcement

**Files:** `014_editorial_marketplace.sql`, `018_editorial_billing_contracts_renewals.sql`

The following columns are explicitly acknowledged as "maintained by the application" but have no
triggers, CHECK constraints, or function-based enforcement:

| Table | Column | Computed From |
|-------|--------|--------------|
| `editorial_professionals` | `rating`, `total_projects` | `editorial_reviews`, order count |
| `editorial_service_listings` | `rating`, `orders_count` | `editorial_reviews`, order count |
| `editorial_invoices` | `amount_paid`, `balance_due` | `editorial_payment_allocations` |
| `editorial_payment_schedules` | `paid_amount`, `remaining_amount` | `editorial_payment_allocations` |

**Critical risk on `balance_due`:** If `amount_paid` and `balance_due` get out of sync — due to
a failed transaction, a partial rollback, or a bug in allocation logic — an invoice could show a
zero balance while money is actually still owed, or vice versa. For a financial system, this is
unacceptable without a compensating control.

**Fix (recommended):** Use triggers to recompute on allocation:

```sql
create or replace function recompute_invoice_balance()
returns trigger language plpgsql security definer as $$
begin
  update editorial_invoices
  set
    amount_paid  = (select coalesce(sum(allocated_amount), 0)
                    from editorial_payment_allocations
                    where invoice_id = coalesce(new.invoice_id, old.invoice_id)),
    balance_due  = total_amount - (select coalesce(sum(allocated_amount), 0)
                                   from editorial_payment_allocations
                                   where invoice_id = coalesce(new.invoice_id, old.invoice_id)),
    updated_at   = now()
  where id = coalesce(new.invoice_id, old.invoice_id);
  return new;
end;
$$;

create trigger trg_allocation_recompute_invoice
  after insert or update or delete on editorial_payment_allocations
  for each row execute function recompute_invoice_balance();
```

Apply equivalent triggers for `payment_schedules.paid_amount` and `professional.rating`.

---

### 3.8 `SLA Tracker` Cascades from All Four Context Sources

**File:** `016_reino_editorial_os.sql`
**Table:** `editorial_sla_trackers`

```sql
project_id    uuid references editorial_projects(id)             on delete cascade,
task_id       uuid references editorial_operational_tasks(id)    on delete cascade,
order_id      uuid references editorial_marketplace_orders(id)   on delete cascade,
submission_id uuid references editorial_distribution_submissions(id) on delete cascade,
```

All four FKs use `ON DELETE CASCADE`. **Deleting any one of these entities silently removes the
SLA tracker**, destroying the SLA breach history. An SLA tracker that recorded a breach should
be retained for audit even if the associated entity is deleted.

For SLA breaches in particular, the record is an operational compliance artifact. Losing it
makes it impossible to report on SLA performance over time.

**Fix:** Change all four to `ON DELETE SET NULL`:
```sql
project_id    uuid references editorial_projects(id)             on delete set null,
task_id       uuid references editorial_operational_tasks(id)    on delete set null,
order_id      uuid references editorial_marketplace_orders(id)   on delete set null,
submission_id uuid references editorial_distribution_submissions(id) on delete set null,
```

Remove or adjust the `CHECK` constraint accordingly to allow all-null after deletion:
```sql
-- Keep the constraint only for INSERT, or remove it if history must survive:
-- constraint chk_sla_tracker_has_context check (...) -- add INITIALLY DEFERRED, or move to app layer
```

---

## 4. Important Improvements (Should Fix)

### 4.1 Missing `updated_at` on Mutable Distribution Tables

**File:** `015_editorial_distribution_engine.sql`

`editorial_distribution_formats` and `editorial_distribution_issues` are both lifecycle-mutable
tables (formats get `enabled` toggled; issues transition from `open → acknowledged → resolved`)
but neither has an `updated_at` column.

```sql
-- Add to editorial_distribution_formats:
updated_at timestamptz not null default now()

-- Add to editorial_distribution_issues:
updated_at timestamptz not null default now()
```

Then apply `set_updated_at` triggers (from §3.5).

---

### 4.2 Snapshot Tables Lack Uniqueness — Duplicate Accumulation Risk

All snapshot tables are written by scheduled jobs. Without unique constraints, failed jobs that
retry will insert duplicate rows for the same date+scope, corrupting dashboard aggregations.

| Table | Missing Unique Constraint |
|-------|--------------------------|
| `editorial_kpi_snapshots` | `(snapshot_date, scope_type, scope_id)` |
| `editorial_crm_pipeline_snapshots` | `(snapshot_date, owner_user_id)` |
| `editorial_billing_snapshots` | `(snapshot_date, client_account_id)` |
| `editorial_metric_snapshots` | `(metric_definition_id, snapshot_date, period_type, scope_type, scope_id)` |

`editorial_workload_snapshots` has `UNIQUE(staff_profile_id, snapshot_date)` — this is correct
and should be used as the pattern for all other snapshot tables.

```sql
-- Example fix for kpi_snapshots:
alter table editorial_kpi_snapshots
  add constraint uq_kpi_snapshots_scope_date
  unique (snapshot_date, scope_type, scope_id);

-- Partial unique for NULL scope_id (global snapshots):
create unique index uq_kpi_snapshots_global
  on editorial_kpi_snapshots(snapshot_date, scope_type)
  where scope_id is null;
```

---

### 4.3 `editorial_alerts` Cascades from Task Deletion — Loses Operational History

**File:** `016_reino_editorial_os.sql`

```sql
task_id uuid references editorial_operational_tasks(id) on delete cascade,
```

Cancelling or deleting an operational task removes all associated alerts, including those that
were already acknowledged or resolved. The operational alert history is valuable for post-mortems.

**Fix:** Use `ON DELETE SET NULL` for all context FKs on `editorial_alerts`.

---

### 4.4 `editorial_financial_ledger`: `amount >= 0` CHECK Blocks Legitimate Corrections

**File:** `016_reino_editorial_os.sql`

```sql
amount numeric(14,2) not null check (amount >= 0),
```

All financial adjustments must be represented as positive amounts with a `direction` toggle. This
is workable but creates a semantic gap: you cannot represent a **negative adjustment** (e.g.
partial reversal) as a single atomic ledger entry. Every correction requires two entries.

Consider:
- Removing the `>= 0` constraint and allowing negative amounts with a clear sign convention.
- Or documenting the two-entry correction pattern explicitly in comments.

---

### 4.5 `editorial_crm_opportunities.won_project_id` Duplicates `editorial_crm_project_conversions`

**File:** `017_editorial_crm_sales_pipeline.sql`

The same conversion event is recorded in two places:
1. `editorial_crm_opportunities.won_project_id` (a denormalized FK on the opportunity)
2. `editorial_crm_project_conversions` (a dedicated join table with `converted_by` and `conversion_notes`)

These can become inconsistent. The conversion table is the richer record.

**Fix:** Keep the conversion table as authoritative. Remove `won_project_id` from the
opportunities table and populate it via a view or join for read convenience. If you must keep it
for performance, add a trigger that populates it from the conversion table:

```sql
create trigger trg_sync_won_project_id
  after insert on editorial_crm_project_conversions
  for each row
  execute function sync_opportunity_won_project_id();
```

---

### 4.6 `editorial_kpi_snapshots` Made Obsolete by `editorial_metric_snapshots`

**Files:** `016_reino_editorial_os.sql`, `019_editorial_analytics_forecasting_intelligence.sql`

`editorial_kpi_snapshots` has **hardcoded integer columns** for six specific KPIs
(`total_active_projects`, `total_sla_breaches`, etc.). Phase 13 then introduces
`editorial_metric_snapshots` — a far more flexible, extensible time-series store for any metric.

The KPI snapshot columns now exist as a rigid subset of what metric_snapshots can represent. Once
Phase 13 is operational, `editorial_kpi_snapshots` is functionally superseded and will create
dual-write complexity.

**Recommendation:** Continue writing to `editorial_kpi_snapshots` in the short term for backward
compatibility. Plan a deprecation path: migrate the KPI snapshot scheduled job to write into
`editorial_metric_snapshots` instead, then drop the old table in a future migration.

---

### 4.7 `editorial_payment_allocations`: Nullable `project_id` Context Is Weak

**File:** `018_editorial_billing_contracts_renewals.sql`

```sql
project_id uuid references editorial_projects(id) on delete set null,
```

The `project_id` on allocations is optional context only. Combined with the fact that `invoice_id`
and `payment_schedule_id` are also both nullable (with only a CHECK that one must be non-null),
a record exists with a valid `payment_id` and a `project_id` only — no invoice or schedule link.
This orphaned allocation would not update any balance.

**Fix:** The existing CHECK (`invoice_id is not null or payment_schedule_id is not null`) is
correct. Verify it is enforced and not accidentally bypassable by service-role. Do not rely on
`project_id` alone as the allocation target.

---

### 4.8 Missing Composite Indexes for High-Traffic Dashboard Queries

| Table | Missing Index | Expected Query Pattern |
|-------|-------------|----------------------|
| `editorial_financial_ledger` | `(project_id, direction, entry_date)` | Project P&L summary |
| `editorial_financial_ledger` | `(entry_date, direction, entry_type)` | Period income/expense report |
| `editorial_invoices` | `(owner_user_id, status)` | "My overdue invoices" view |
| `editorial_crm_activities` | `(performed_by, scheduled_for)` | "My upcoming activities" |
| `editorial_crm_opportunities` | `(owner_user_id, pipeline_stage, expected_close_date)` | Sales pipeline board |
| `editorial_operational_tasks` | `(department_id, status, due_at)` | Department task board |
| `editorial_contract_signatures` | `(contract_id, signature_status)` | "Awaiting signature" view |

---

## 5. Naming / Consistency Recommendations

### 5.1 User Reference Column Names

There are **13 different column names** used across the schema to refer to a user performing an
action:

| Column Name | Files | Recommended Standardization |
|-------------|-------|----------------------------|
| `created_by` | 009–019 | ✅ Keep — creation actor |
| `owner_user_id` | 015–019 | ✅ Keep — ownership / responsibility |
| `assigned_to` | 009–013 | Rename to `assigned_user_id` for consistency with Phase 16+ |
| `assigned_user_id` | 016, 017 | ✅ Target naming |
| `actor_user_id` | 015, 016, 019 | ✅ Keep — event/audit actor |
| `performed_by` | 017 | Rename to `actor_user_id` for audit tables |
| `managed_by` | 018 | Rename to `owner_user_id` (renewals) or `assigned_user_id` |
| `recorded_by` | 018 | Rename to `created_by` (payments are created, not recorded) |
| `initiated_by` | 010, 013 | Rename to `created_by` |
| `decided_by` | 010 | ✅ Domain-specific — acceptable |
| `submitted_by` | 011, 015 | ✅ Domain-specific — acceptable |
| `resolved_by` | 015, 016 | ✅ Domain-specific — acceptable |
| `captured_by` | 017 | Rename to `created_by` |
| `generated_by` | 019 | Rename to `created_by` |

**Recommendation:** Apply `created_by` for creation, `owner_user_id` for responsibility,
`actor_user_id` for audit events. Reserve domain-specific names only for fields that are
semantically distinct (e.g. `submitted_by` is distinct from `created_by` if a submission workflow
separates creation from submission).

### 5.2 Active Flag

- `active` (boolean) — used in 015, 016, 017, 018, 019 ✅
- `is_active` — used in 010 (`editorial_ai_prompt_templates.is_active`) ❌

**Fix:** Rename `is_active` to `active` in `editorial_ai_prompt_templates` for consistency.

### 5.3 Hardcoded Stage Values as Text vs Enum

Phases 009–013 create PostgreSQL `ENUM` types (`editorial_stage`, `editorial_project_status`).
Phases 015–019 use `text + CHECK`. This is intentional (the problem spec says phases 11+ avoid
enum blocks), but the mixed approach means:
- Phase 009's `editorial_projects.current_stage` is typed as `editorial_stage ENUM`.
- Phase 015's `editorial_distribution_formats.format_type` is `text + CHECK`.

Joins and comparisons between the two will silently cast. This is acceptable in PostgreSQL, but
developers should be aware that the ENUM type in phase 009 can prevent new stage values from
being added without a schema migration, whereas text + CHECK can be altered with a constraint
change. **Standardize on text + CHECK for all future phases** (already the current direction).

### 5.4 `code` Field Consistency

All reference/catalog tables correctly use a `code TEXT NOT NULL UNIQUE` field as a stable
machine-readable identifier. This is a strong convention applied consistently across phases
015–019. ✅

---

## 6. RLS / Security Review

### 6.1 Author Access Relies on `p.created_by = profiles.id` — Fragile and Narrow

**File:** `015_editorial_distribution_engine.sql` (and all author policies)

```sql
-- Author can read their own distribution data:
p.created_by = (select id from profiles where id = auth.uid() limit 1)
```

Issues:
1. This does a **subquery against `profiles`** where the join condition is `profiles.id =
   auth.uid()` — which is always true if the profile exists (since `profiles.id` is a PK
   reference to `auth.users.id`). This is equivalent to `p.created_by = auth.uid()`. The
   subquery is unnecessary and adds latency.
2. It implements a **single-owner model**: only the user who `created_by` a project can read its
   distribution data. A project with multiple stakeholders (co-author, editor) has no access.
3. As noted in §3.4, `editorial_project_members` is the intended solution but doesn't exist.

**Fix:** Simplify immediately:
```sql
p.created_by = auth.uid()
```
And when `editorial_project_members` is created, expand to:
```sql
exists (
  select 1 from editorial_project_members pm
  where pm.project_id = p.id and pm.user_id = auth.uid()
)
```

### 6.2 CRM Owner Policies Are Insufficiently Guarded

**File:** `017_editorial_crm_sales_pipeline.sql`

```sql
create policy "owners read own crm orgs" on editorial_crm_organizations
  for select using (owner_user_id = auth.uid());
```

This allows **any authenticated user** (including authors, professionals) to read CRM
organizations where they are listed as `owner_user_id`. This is an internal CRM. The intent is
staff-only access.

**Fix:** Require a staff role check in addition to ownership:
```sql
using (
  owner_user_id = auth.uid()
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
)
```

### 6.3 `editorial_distribution_channels` Publicly Readable

```sql
create policy "anyone reads dist channels"
  on editorial_distribution_channels for select
  using (auth.uid() is not null);
```

Any authenticated user — including marketplace professionals or external clients — can enumerate
all distribution channels. If channel configuration or metadata_schema contains sensitive routing
information, this is an exposure. At minimum, scope to staff roles. If channel names genuinely
need to be visible to authors, use a separate `active = true AND public = true` flag.

### 6.4 `editorial_staff_profiles` Self-Read Policy Correct, But Update Policy Too Broad

```sql
-- Staff can read own profile
using (user_id = auth.uid());

-- Staff can update own profile
using (user_id = auth.uid());
```

Allowing staff to update their own capacity_points and skills fields is appropriate. However,
the policy also allows them to update their `department_id`, `role_title`, and `active` fields,
which should be admin-only. 

**Fix:** Restrict self-update to safe fields via column-level security or a policy condition:
```sql
-- Or split into two policies:
-- Admin can update all fields
-- Self can only update display_name, timezone, skills
```

### 6.5 Analytics and Intelligence Tables Correctly Restricted

Phase 019 (`editorial_analytics_forecasting_intelligence`) correctly restricts all analytics
tables to staff/admin reads and service-role writes. Anomaly signals allow staff to update
status (acknowledge/resolve). Executive reports allow ops to read published ones. This policy
model is well-designed. ✅

### 6.6 Billing Tables: Service-Role Write Reliance Not Explicit

**File:** `018_editorial_billing_contracts_renewals.sql`

Comments on `editorial_billing_events` state: "writes are service-role only." However, no
explicit policy denies writes from non-service-role users. This works because Supabase
service-role bypasses RLS entirely, but:
- There is no policy that **explicitly blocks** regular admin users from inserting billing events.
- If an admin user has `INSERT` privileges granted at the PostgreSQL role level, they could write
  directly.

**Recommendation:** Add explicit deny policies or document that no INSERT policy = no user
inserts (because RLS in default-deny mode blocks all unmatched operations):
```sql
comment on table editorial_billing_events is
  '... Write access: service-role only. No user INSERT policy is intentional — RLS blocks all non-service-role writes.';
```

---

## 7. Data Model Overlap Review

### 7.1 `editorial_payments` (Phase 8) vs `editorial_received_payments` (Phase 12)

| | Phase 8 `editorial_payments` | Phase 12 `editorial_received_payments` |
|-|----------------------------|-----------------------------------------|
| **Scope** | Marketplace order-specific escrow | Client account-level direct billing |
| **Tied to** | `editorial_marketplace_orders` | `editorial_client_accounts` |
| **Payment flow** | Buyer escrow → provider release | Client wire/stripe → Reino account |
| **Status values** | `pending, held, released, refunded, disputed` | `received, allocated, failed, reversed` |
| **Allocation** | N/A (direct to order) | `editorial_payment_allocations` table |

**Verdict:** The separation is **justified**. These represent conceptually different payment
flows: marketplace escrow (transactional, order-specific) vs. direct client billing (contractual,
account-level). They should remain separate.

**Risk:** There is no bridge table or process that prevents a marketplace payment from also being
logged as a received_payment, resulting in double-counting in the financial ledger.

**Recommendation:** Document the boundary explicitly. The financial ledger (Phase 10) should be
the single reconciliation point: both `editorial_payments` releases and `editorial_received_payments`
should trigger ledger entries. Add a `source_table` and `source_record_id` to the ledger if not
already present — the current ledger has `order_id` for marketplace, but no `payment_id` for
Phase 12 payments.

### 7.2 `editorial_financial_ledger` (Phase 10) vs Invoices/Payments (Phase 12)

The financial ledger is the operational write-ahead log for project economics. Invoices and
payments are the client-facing billing system. These serve different purposes, but they need
explicit integration:

- A `received_payment` allocation to an invoice should create a ledger `income` entry.
- A `contractor_payout` should reference a payment schedule.
- Currently, **there is no automatic linkage between Phase 12 payment events and Phase 10 ledger
  entries.** Both must be written independently by application code.

**Recommendation:** Add a `received_payment_id uuid references editorial_received_payments(id)`
column to `editorial_financial_ledger` for Phase 12 payment reconciliation traceability.

### 7.3 `editorial_alerts` (Phase 10) vs `editorial_anomaly_signals` (Phase 13)

| | Phase 10 `editorial_alerts` | Phase 13 `editorial_anomaly_signals` |
|-|-----------------------------|--------------------------------------|
| **Source** | Operational events (SLA breach, task overdue) | Analytics engine (statistical deviation) |
| **Lifecycle** | open → acknowledged → resolved → dismissed | open → acknowledged → resolved → ignored |
| **Action** | `assigned_user_id` takes action | Staff updates status |
| **Linked to** | project, task, order, submission | metric, project |

**Verdict:** Separation is **justified** but the lifecycle patterns are nearly identical.
Anomaly signals should ideally generate `editorial_alerts` when they reach error/critical
severity, creating an actionable workflow. Currently there is no such bridge.

**Recommendation:** Add an `anomaly_signal_id uuid references editorial_anomaly_signals(id)` FK
to `editorial_alerts`, and document that the anomaly detection job should create alert records
for high-severity signals.

### 7.4 Audit/Event Table Proliferation (7 tables)

| Table | Phase | Scope |
|-------|-------|-------|
| `activity_logs` | 001 schema | General system events |
| `editorial_ai_audit_events` | 011 | AI governance events |
| `editorial_distribution_events` | 015 | Distribution submission lifecycle |
| `editorial_os_events` | 016 | OS-level entity changes |
| `editorial_crm_stage_history` | 017 | Opportunity stage changes |
| `editorial_billing_events` | 018 | Billing/contract lifecycle |
| `editorial_intelligence_events` | 019 | Analytics generation events |

All seven tables serve the same fundamental purpose: "record what changed, when, by whom, and
what was the payload." The schema differs only in which FKs are optional.

**Verdict:** Having domain-separated event tables is defensible for keeping audit data co-located
with its domain. However, **cross-domain reporting** (e.g., "show me every event touching project
P across all systems") requires UNION queries across all 7 tables, which is painful at scale.

**Recommendation:** Introduce a unified `editorial_event_log` table as the canonical event stream
for external consumers and BI tools:
```sql
create table editorial_event_log (
  id            uuid primary key default gen_random_uuid(),
  domain        text not null,  -- 'distribution', 'crm', 'billing', 'os', 'ai', 'intelligence'
  event_type    text not null,
  entity_type   text not null,
  entity_id     uuid,
  project_id    uuid references editorial_projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  summary       text,
  payload       jsonb,
  created_at    timestamptz not null default now()
);
```

Keep the domain-specific event tables for operational write performance; cross-domain reads hit
`editorial_event_log` which aggregates from each domain table via triggers or CDC.

---

## 8. Indexing / Performance Review

### 8.1 Missing Composite Indexes (High Priority)

| Table | Missing Index | Impact |
|-------|-------------|--------|
| `editorial_financial_ledger` | `(project_id, direction, entry_date)` | Project P&L report will full-scan ledger |
| `editorial_financial_ledger` | `(entry_date, direction)` | Monthly income/expense report |
| `editorial_invoices` | `(owner_user_id, status, due_date)` | "My overdue invoices" dashboard |
| `editorial_crm_opportunities` | `(owner_user_id, pipeline_stage, expected_close_date)` | Sales pipeline board (high frequency) |
| `editorial_crm_activities` | `(performed_by, scheduled_for)` | "My upcoming activities" |
| `editorial_operational_tasks` | `(department_id, status, due_at)` | Department task board |
| `editorial_contract_signatures` | `(contract_id, signature_status)` | "Awaiting signature" queue |
| `editorial_billing_events` | `(client_account_id, event_type, created_at)` | Account timeline |

### 8.2 `editorial_metric_snapshots` — Scale Risk

This table will grow fastest of all tables (a daily job writing 12+ metrics × N scopes = thousands
of rows/day). The existing composite index
`(metric_definition_id, period_type, snapshot_date DESC)` is the most important and is present. ✅

However, for the "all metrics for a department on a given date" query:
```sql
-- Missing:
create index idx_metric_snapshots_scope_date_type
  on editorial_metric_snapshots(scope_type, scope_id, snapshot_date desc, period_type);
```

Consider partitioning by `snapshot_date` (monthly or quarterly range partitioning) once the
table exceeds 10M rows.

### 8.3 `editorial_sla_trackers` — Active SLA Query Performance

The partial index `idx_sla_trackers_active_due` (on `status = 'active'`, ordered by `due_at`) is
correct and will cover the critical "breach scanning" job. ✅

### 8.4 `editorial_crm_activities` — Timeline Query Performance

The table has 10 separate single-column indexes. For a timeline query joining multiple context
fields (`opportunity_id AND completed_at IS NULL`), a partial composite index would be more
efficient:
```sql
create index idx_crm_activities_opp_pending
  on editorial_crm_activities(opportunity_id, scheduled_for)
  where completed_at is null;
```

### 8.5 Good Patterns Already Present

- All snapshot tables with `UNIQUE` constraints get their uniqueness index for free.
- `editorial_distribution_submissions`: `(project_id, status)` composite index exists ✅
- `editorial_alerts`: Partial index on open/acknowledged status ✅
- `editorial_anomaly_signals`: Partial index on open/acknowledged status ✅
- `editorial_project_assignments`: Partial index on `active = true` ✅

---

## 9. Reporting / Analytics Readiness Review

### 9.1 Revenue Attribution Is Incomplete

There is no single path from a paid invoice to the editorial project it funds. The chain is:
`invoice → contract → project` (optional FK), or `invoice → project` (direct optional FK). But
`editorial_financial_ledger` is the "official" project economics store, while invoices are the
client-facing billing system. These two systems have no enforced reconciliation.

**A finance analyst building a "revenue by project" report must query both systems and reconcile
manually.** This is a significant reporting gap.

### 9.2 JSONB Fields That Will Become Analytics Bottlenecks

| Table | Column | Risk |
|-------|--------|------|
| `editorial_projects.metadata` | ISBN, genre, word_count | Cannot be filtered/grouped without extraction |
| `editorial_scorecard_results.component_scores` | Per-component breakdown | Trend over time requires JSONB path queries |
| `editorial_forecast_values` (all estimates) | All structured ✅ | No JSONB risk |
| `editorial_executive_reports.highlights` | KPI highlights | Cannot be searched/aggregated |
| `editorial_crm_leads.service_interest[]` | Array field | Can be queried with `@>` but not indexed by value efficiently |

**Recommendation:** For `editorial_projects.metadata`, promote high-cardinality fields (ISBN,
genre, language, word_count) to proper columns in `editorial_book_metadata` (Phase 9 already
creates this table). Migrate existing metadata content there.

### 9.3 Materialized Views Needed at Scale

| Dashboard | Source Tables | Recommended Materialized View |
|-----------|-------------|------------------------------|
| Executive pipeline value | `crm_opportunities` (status=open) | `mv_live_pipeline_value` — refreshed hourly |
| Outstanding receivables | `invoices` (status=issued/overdue) | `mv_outstanding_invoices` — refreshed daily |
| Staff workload board | `project_assignments + workload_snapshots` | `mv_current_workload` — refreshed every 15 min |
| Project health overview | `projects + sla_trackers + alerts` | `mv_project_health` — refreshed every 15 min |

### 9.4 Phase 13 Analytics Architecture Is Correct But Requires Write Jobs

`editorial_metric_snapshots`, `editorial_forecast_runs`, and `editorial_scorecard_results` are
all designed to be populated by **scheduled jobs, not triggers**. This is architecturally correct
for analytics (ETL-pull vs trigger-push). However, the jobs themselves are not defined in any
migration. The schema is production-ready for analytics; the job definitions are not.

**Recommendation:** Create a `editorial_scheduled_jobs` registry table (or use a tool like
pg_cron or an external scheduler like Vercel Cron + Supabase Edge Functions) and document the
job schedule alongside the schema.

---

## 10. Final Recommended Action Plan

### Tier 1: Fix Before Any Migration Runs

```
[ ] §3.1 — Fix UNIQUE(project_id, channel_id, format_id) with two partial unique indexes
[ ] §3.2 — Change editorial_financial_ledger.project_id ON DELETE to SET NULL
[ ] §3.3 — Resolve staff_profiles ON DELETE CASCADE vs project_assignments RESTRICT deadlock
[ ] §3.4 — Create editorial_project_members table and update author RLS policies across 015+
[ ] §3.5 — Create set_updated_at() trigger function and apply to all 26 updated_at tables
[ ] §3.6 — Add org_id to Phase 14+ tables for multi-tenant scoping (at least crm, staff, departments)
[ ] §3.7 — Add database triggers for invoice.balance_due, payment_schedules.paid_amount, professional.rating
[ ] §3.8 — Change editorial_sla_trackers all context FKs to ON DELETE SET NULL
```

### Tier 2: Fix Before Building First Dashboard

```
[ ] §4.1 — Add updated_at + trigger to editorial_distribution_formats, editorial_distribution_issues
[ ] §4.2 — Add UNIQUE constraints to all snapshot tables (kpi, pipeline, billing, metric)
[ ] §4.3 — Change editorial_alerts context FKs to ON DELETE SET NULL
[ ] §4.5 — Resolve won_project_id / crm_project_conversions dual record-keeping
[ ] §6.1 — Simplify author RLS to p.created_by = auth.uid(), plan migration to project_members model
[ ] §6.2 — Add staff role guard to CRM owner_user_id = auth.uid() policies
[ ] §8.1 — Add missing composite indexes for high-frequency dashboard queries
```

### Tier 3: Fix Before Production Go-Live

```
[ ] §5.1 — Standardize user reference column names (captured_by, generated_by → created_by, etc.)
[ ] §5.2 — Rename is_active to active in editorial_ai_prompt_templates
[ ] §7.2 — Add received_payment_id FK to editorial_financial_ledger for Phase 12 reconciliation
[ ] §7.3 — Bridge editorial_anomaly_signals → editorial_alerts for high-severity signals
[ ] §7.4 — Plan editorial_event_log unified event stream for cross-domain BI reporting
[ ] §9.1 — Document and implement revenue attribution path from invoice to ledger
[ ] §9.3 — Create initial materialized views for live pipeline, outstanding receivables, workload
```

### Tier 4: Scalability Hardening (Pre-Scale)

```
[ ] Consider range partitioning on editorial_metric_snapshots by snapshot_date
[ ] Add analytical summary triggers or CDC from domain event tables to unified editorial_event_log
[ ] Implement pg_cron or Vercel Cron job registry for metric snapshot and scorecard generation
[ ] Review JSONB fields in editorial_projects.metadata — promote high-cardinality fields to columns
[ ] Evaluate read replicas for analytics queries against metric_snapshots and forecast_values
```

---

*Audit conducted: March 2026. Based on direct review of scripts/009–019. All line-number
references verified against actual file content.*
