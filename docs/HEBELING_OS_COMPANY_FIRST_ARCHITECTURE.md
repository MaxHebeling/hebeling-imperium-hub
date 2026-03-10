# Hebeling OS — Company-First Architecture Restructuring

**Official architecture:** multi-business operating system with four primary business units and shared infrastructure. This document is the canonical restructuring plan.

---

## 1. Current Architecture Audit

### 1.1 Current Route Structure

| Area | Path | Purpose |
|------|------|---------|
| **Landing** | `/` | Hebeling Imperium Command landing; Staff Login → `/login` |
| **Login** | `/login`, `/client-login` | Auth entry points |
| **BOS App** | `/app/*` | Main staff app ("Hebeling BOS") under `app/app/` |
| **Staff Editorial** | `/(staff)/staff/*` | Reino Editorial staff UI (Panel, Libros, AI, Operaciones) |
| **Author** | `/author/*` | Author portal (dashboard, projects) |
| **Portal** | `/portal/*` | Portal (overview, editorial/projects) |
| **Apply** | `/apply`, `/apply/ikingdom-diagnosis` | iKingdom application flow |
| **External** | `/external/ikingdom-intake` | External iKingdom intake |

### 1.2 BOS App Routes (`/app/`)

- `/app/dashboard` — Dashboard
- `/app/crm` — CRM
- `/app/deals` — Deals
- `/app/projects` — Generic projects
- `/app/websites` — Websites
- `/app/documents` — Documents
- `/app/finance-vault` — Finance vault
- `/app/automations` — Automations
- `/app/analytics` — Analytics
- `/app/organizations` — Organizations
- `/app/team` — Team
- `/app/roles` — Roles
- `/app/settings`, `/app/settings/api-docs` — Settings
- **Editorial (Reino)** — `/app/editorial`, `/app/editorial/projects`, `/app/editorial/projects/[projectId]`

### 1.3 Staff Editorial Routes (`/staff/`)

- `/staff/login` — Staff login
- `/staff/dashboard` — Panel
- `/staff/books` — Libros (project list)
- `/staff/books/[projectId]` — Project detail (pipeline, files, AI, etc.)
- `/staff/ai` — AI
- `/staff/operations` — Operaciones

### 1.4 Layouts and Dashboards

- **`app/app/layout.tsx`** — Uses `AppSidebar` + `AppTopbar`; guards by `profiles.role` (superadmin, admin, sales, ops); redirects non-staff to `/portal/overview`.
- **`app/(staff)/layout.tsx`** — Route group only; no shared layout (each page can use its own shell, e.g. `StaffShell` with `StaffSidebar`).
- **Dashboards:** `app/app/dashboard/page.tsx` (BOS), `app/(staff)/staff/dashboard/page.tsx` (Reino staff), `app/portal/overview/page.tsx` (portal).

### 1.5 Shared Components

- **Global:** `AppSidebar`, `AppTopbar`, `dashboard-content`, `organizations-content`, `author-nav`, `portal-nav`, `language-selector`, `theme-provider`.
- **Editorial (staff):** `components/editorial/staff/*` — `StaffShell`, `StaffSidebar`, `StaffHeader`, `StaffProjectTabs`, `StaffPipelineTab`, `StaffFilesTab`, `StaffCommentsTab`, `StaffAssignmentsTab`, `StaffAlertsPanel`, `AiStageAssistPanel`, `StaffProjectSummaryTab`, `StaffProjectHeader`, `StaffEmptyState`, `mobile-nav`, `sidebar`.

### 1.6 Editorial-Related Code Locations

- **Routes:** `/app/editorial/*` (BOS), `/(staff)/staff/*` (Reino staff), `/author/(dashboard)/projects/*`, `/portal/editorial/projects/*`.
- **API:** `api/editorial/*`, `api/staff/projects/*`, `api/author/projects/*`.
- **Lib:** `lib/editorial/*` (ai, alerts, db, metrics, operations, permissions, pipeline, staff, storage, types, workflow, workflow-events).

### 1.7 Current Architecture Classification

**Hybrid / tools-first.**

- **BOS** is **tools-first**: top-level nav is Operations (dashboard, CRM, deals), Assets (projects, websites, documents), Finance, Automation, Intelligence, System. Editorial is one subsection under Assets/Editorial.
- **Staff Editorial** is a **separate** entry (`/staff/*`) with its own sidebar and branding ("Staff Editorial"), not under a "Reino Editorial" company in the nav.
- There is **no top-level "Empresas"** or company switcher; no clear separation of "Reino Editorial" vs "iKingdom" vs "Imperium" vs "Max Hebeling" as primary navigation.

### 1.8 What to Preserve

- All **Reino Editorial** functionality: staff books/projects, pipeline, AI, operations, author portal, editorial API and `lib/editorial` logic.
- **BOS** shared infrastructure pages and behavior (CRM, clients, finance, automations, analytics, settings) but **repositioned** under shared-infra routes, not mixed with company-specific editorial.
- **Auth and profiles** (Supabase, `profiles`, `organizations`); add **business unit** concept without breaking existing `org_id` usage where it means "tenant."

### 1.9 Conflicts with New Official Architecture

- Editorial appears in two places: `/app/editorial` (BOS) and `/staff/*` (standalone). New architecture requires **one** Reino Editorial module under **Empresas → Reino Editorial**.
- No route like `/companies/reino-editorial/*` or equivalent; no "Empresas" in sidebar.
- Shared infrastructure (CRM, Billing, etc.) is at same level as generic "projects" and "editorial"; they should be under a clear **Infraestructura Compartida** layer.
- Existing DB has `organizations` and `companies` (B2B); no **business_units** (Reino Editorial, iKingdom, Imperium, Max Hebeling) table.

---

## 2. New Master Architecture

### 2.1 Global Layer

- **Dashboard Global** — Single global dashboard (cross-company KPIs, alerts, shortcuts).
- **Shared infrastructure modules** (cross-company):
  - CRM
  - Clients
  - Billing
  - Files
  - Intelligence
  - Automations / AI
- **Settings** — Platform settings, roles, orgs, API docs (and per-business-unit settings where needed).

### 2.2 Business Layer (Empresas)

- **Reino Editorial** — Full internal module: Overview, Projects, Pipeline, AI Review, Authors, Staff, Marketplace, Distribution, Operations, Reports.
- **iKingdom** — Placeholder: Overview, Applications (e.g. intake/diagnosis), Settings. No overbuild.
- **Imperium** — Placeholder: Overview, Settings. No overbuild.
- **Max Hebeling** — Placeholder: Overview, Settings. No overbuild.

### 2.3 Internal Company Modules (Reino Editorial)

| Module | Purpose |
|--------|---------|
| Overview | Landing for Reino Editorial (current editorial landing + pipeline summary). |
| Projects | List and detail of editorial projects (current books/projects). |
| Pipeline | Stage-based pipeline view per project. |
| AI Review | AI findings, decisions, quality, governance. |
| Authors | Author-facing access and project visibility (bridge to Author Portal). |
| Staff | Staff assignments, workload, roles (editorial staff). |
| Marketplace | Professionals, services, orders (editorial marketplace). |
| Distribution | Channels, submissions, exports (editorial distribution). |
| Operations | Tasks, SLAs, alerts, OS (editorial OS). |
| Reports | Analytics, forecasts, scorecards (editorial intelligence). |

Other three businesses: only **Overview** + **Settings** (or minimal placeholders) until product requirements exist.

---

## 3. Proposed Route Map

Company-first structure:

```
/
/login
/client-login

/dashboard                          ← Dashboard Global (optional alias for /app/dashboard)

/app                                ← Hebeling OS shell (layout with global nav)
/app/dashboard                      ← Dashboard Global
/app/companies                       ← Empresas list / switcher
/app/companies/reino-editorial      ← Reino Editorial hub (overview)
/app/companies/reino-editorial/overview
/app/companies/reino-editorial/projects
/app/companies/reino-editorial/projects/[projectId]
/app/companies/reino-editorial/pipeline              (optional; can live under projects/[projectId])
/app/companies/reino-editorial/ai                    ← AI Review
/app/companies/reino-editorial/authors               ← Authors (bridge)
/app/companies/reino-editorial/staff                ← Staff
/app/companies/reino-editorial/marketplace
/app/companies/reino-editorial/distribution
/app/companies/reino-editorial/operations
/app/companies/reino-editorial/reports

/app/companies/ikingdom
/app/companies/ikingdom/overview
/app/companies/ikingdom/applications                 (e.g. diagnosis / intake)

/app/companies/imperium
/app/companies/imperium/overview

/app/companies/max-hebeling
/app/companies/max-hebeling/overview

/app/crm                            ← Infraestructura Compartida
/app/clients
/app/billing
/app/files
/app/intelligence
/app/automations
/app/settings
```

**Recommendation:** Keep the `/app` prefix for the OS app (already used and avoids collision with `/author`, `/portal`, `/apply`). So:

- **Global:** `/app/dashboard`, `/app/companies`, then `/app/crm`, `/app/clients`, etc.
- **Reino Editorial:** `/app/companies/reino-editorial/*` (all editorial features under this tree).

**Author Portal** and **Portal** can stay as-is for now (`/author`, `/portal`); they are different entry points (author vs client). Optionally later: redirect or link from Reino Editorial "Authors" to `/author` with context.

**Staff Editorial** current URLs (`/staff/dashboard`, `/staff/books`, ...) should be **migrated** to `/app/companies/reino-editorial/*` (e.g. `/staff/books` → `/app/companies/reino-editorial/projects`, `/staff/books/[projectId]` → `/app/companies/reino-editorial/projects/[projectId]`) with redirects so bookmarks and links keep working.

---

## 4. Data Model Changes

### 4.1 New Table: `business_units`

Represents the four primary businesses (Reino Editorial, iKingdom, Imperium, Max Hebeling). Keeps "companies" for B2B/CRM and introduces a clear platform concept.

```sql
-- scripts/0XX_business_units.sql (run once)
create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  business_type text not null default 'internal',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_units is 'Top-level business units of Hebeling OS: Reino Editorial, iKingdom, Imperium, Max Hebeling.';

create index idx_business_units_slug on public.business_units (slug);
create index idx_business_units_active on public.business_units (active);

-- Seed
insert into public.business_units (code, slug, name, business_type)
values
  ('reino_editorial', 'reino-editorial', 'Reino Editorial', 'internal'),
  ('ikingdom',        'ikingdom',        'iKingdom',        'internal'),
  ('imperium',       'imperium',       'Imperium',        'internal'),
  ('max_hebeling',   'max-hebeling',   'Max Hebeling',    'internal')
on conflict (code) do update set name = excluded.name, slug = excluded.slug, active = true;
```

### 4.2 Where to Add `business_unit_id` (or keep scoping as-is)

**Do NOT add `business_unit_id` to:**

- `editorial_projects`, `editorial_stages`, `editorial_files`, and the rest of the **editorial_*** tables. They are already scoped by `org_id` and are used only in the context of Reino Editorial. Adding a business unit FK would be redundant unless you introduce multi-org + multi–business-unit and need to filter by business unit at the DB level. For a single-org deployment, routing and layout are enough.

**Add `business_unit_id` (optional but recommended) only where:**

- **Shared infrastructure** tables are used by more than one business unit and you need to segment data by business unit. Examples:
  - **CRM:** If you later have separate CRM "instances" per business unit, add `business_unit_id` to `editorial_crm_organizations` (or the global CRM table if it becomes shared). For now, Phase 11 CRM can remain as-is; when iKingdom/Imperium get their own CRM views, add the column and backfill.
  - **Client accounts / Billing:** Same idea — `editorial_client_accounts`, `editorial_client_contracts`, etc. can get `business_unit_id` when you need to separate billing by business unit.
  - **Intelligence / Analytics:** If reports or scorecards are scoped per business unit, add `business_unit_id` to the relevant snapshot/report tables.

**Pragmatic recommendation for Step 4:**

1. Create **`business_units`** and seed the four rows.
2. **Do not** add `business_unit_id` to editorial_* tables in this refactor; keep editorial scoped by `org_id` and by route context (`/app/companies/reino-editorial`).
3. Optionally add `business_unit_id` to **profiles** (or a new `profile_business_units` join) if you need "this user has access to these business units." That enables future RLS or UI filtering by business unit.
4. In a **later** migration, add `business_unit_id` to shared-infra tables (CRM, clients, billing, intelligence) when you actually need multi–business-unit separation.

---

## 5. Reino Editorial Mapping Inside Hebeling OS

### 5.1 Company-Internal (Reino Editorial Only)

- Editorial projects, stages, files, jobs, comments, exports.
- Editorial pipeline (ingesta → revisión final).
- AI: prompt templates, findings, decisions, job runs, quality checks, scores, policies, model configs, prompt versions, audit events, review queues.
- Staff: staff profiles, assignments, operational tasks, SLAs, workload snapshots, alerts, KPI snapshots, OS events.
- Marketplace (editorial): professionals, service listings, orders, messages, deliverables, reviews, payments, AI matches.
- Distribution (editorial): channels, book metadata, formats, submissions, identifiers, artifacts, issues, events, jobs.
- CRM (editorial): organizations, contacts, leads, opportunities, quotes, activities, follow-ups, stage history, project conversions, pipeline snapshots.
- Billing (editorial): client accounts, contract templates, contracts, versions, signatures, invoices, payment schedules, received payments, allocations, renewals, billing events, snapshots.
- Intelligence (editorial): metric definitions, metric snapshots, forecast models/runs/values, scorecards, trend analyses, anomaly signals, executive reports, recommendation signals, intelligence events.

All of the above stay **inside** the Reino Editorial module in the UI (routes under `/app/companies/reino-editorial/*`) and in the DB remain as they are (no mandatory `business_unit_id` for editorial_* tables unless you decide to add it later).

### 5.2 Shared Infrastructure (Cross-Company)

- **CRM** — In the new nav, "CRM" under Infraestructura can be the **same** app as today (`/app/crm`). If the schema is currently editorial_crm_*, it is still Reino-focused; a true shared CRM would be a separate or generalized schema. For the refactor, keep `/app/crm` as shared route; data can stay in editorial_crm_* and be filtered by context (e.g. when entered from Reino, filter by business unit or org).
- **Clients** — Same: `/app/clients` as shared route; underlying data may be `editorial_client_accounts` or future shared `clients` table.
- **Billing** — `/app/billing` as shared route; data can be editorial billing tables, optionally scoped by `business_unit_id` later.
- **Files** — `/app/files` for shared file library if needed; editorial files stay under projects.
- **Intelligence** — `/app/intelligence` for cross-company analytics; today’s analytics can remain under Reino and this can be a global view later.
- **Automations** — `/app/automations` as shared.

### 5.3 Contextual Bridge

- **Reino Editorial → CRM:** From Reino, "CRM" can deep-link to `/app/crm?business_unit=reino-editorial` or show CRM data for the current company context.
- **Reino Editorial → Billing:** Same: link to `/app/billing` with context (e.g. `business_unit=reino-editorial` or `client_account` filter).
- **Reino Editorial → Intelligence:** Link to `/app/intelligence` with scope=reino-editorial, or keep a "Reports" tab under Reino that uses the same intelligence backend scoped to editorial.
- **Authors:** "Authors" under Reino Editorial can link to the existing Author Portal (`/author`) or embed it; no need to move author routes under companies.

---

## 6. Navigation / Sidebar Strategy

### 6.1 Global Sidebar (Top-Level)

When the user is in the Hebeling OS app (`/app/*`), the **main sidebar** shows:

1. **Dashboard** → `/app/dashboard` (Dashboard Global)
2. **Empresas** (section)
   - **Reino Editorial** → `/app/companies/reino-editorial`
   - **iKingdom** → `/app/companies/ikingdom`
   - **Imperium** → `/app/companies/imperium`
   - **Max Hebeling** → `/app/companies/max-hebeling`
3. **Infraestructura Compartida** (section)
   - **CRM** → `/app/crm`
   - **Clients** → `/app/clients`
   - **Billing** → `/app/billing`
   - **Files** → `/app/files`
   - **Intelligence** → `/app/intelligence`
   - **Automations** → `/app/automations`
4. **Settings** → `/app/settings`

Implementation: replace or extend the current `AppSidebar` `navSections` so the first level is company-first (Empresas + Infraestructura + Settings). "Empresas" can be a collapsible section with four links; shared infra is another section.

### 6.2 Company-Specific Secondary Navigation

When the user is **inside** a company (e.g. `/app/companies/reino-editorial/*`), show a **secondary** nav (sub-sidebar or top tabs) for that company’s modules.

**Reino Editorial secondary nav:**

- Overview → `/app/companies/reino-editorial/overview`
- Projects → `/app/companies/reino-editorial/projects`
- Pipeline → (under projects or dedicated)
- AI Review → `/app/companies/reino-editorial/ai`
- Authors → `/app/companies/reino-editorial/authors`
- Staff → `/app/companies/reino-editorial/staff`
- Marketplace → `/app/companies/reino-editorial/marketplace`
- Distribution → `/app/companies/reino-editorial/distribution`
- Operations → `/app/companies/reino-editorial/operations`
- Reports → `/app/companies/reino-editorial/reports`

Implementation: a **layout** at `app/app/companies/reino-editorial/layout.tsx` that wraps children with a second nav (e.g. horizontal tabs or a left sub-nav). Reuse existing editorial staff components (e.g. tabs, shell) where possible.

**iKingdom / Imperium / Max Hebeling:** Secondary nav with only "Overview" and optionally "Settings" or "Applications" (for iKingdom).

### 6.3 Breadcrumbs

- **Global:** Hebeling OS > Dashboard (or current section).
- **Inside company:** Hebeling OS > Empresas > Reino Editorial > Projects (or current module).
- **Inside project:** … > Reino Editorial > Projects > [Project title].

Use `pathname` and a small breadcrumb component; optionally store "current company" in a context or search param for consistent back-navigation.

### 6.4 Context Switching

- From global sidebar, clicking "Reino Editorial" goes to `/app/companies/reino-editorial` (overview).
- From Reino Editorial, a "Switch company" or "Empresas" link in the header can return to `/app/companies` or open the global sidebar so the user can pick another business unit.
- No need to persist "current company" in DB for now; URL is the source of truth.

---

## 7. Implementation Plan (Ordered)

### Phase A — Shell and navigation (no URL moves yet)

| Step | Objective | Files / folders | Affects | Risk | Dependency | How to test |
|------|------------|-----------------|---------|------|------------|-------------|
| A1 | Add `business_units` table and seed | New migration `0XX_business_units.sql` | DB | Low | None | Run migration; query `business_units`. |
| A2 | Update global sidebar to company-first structure | `components/app-sidebar.tsx` | Layout, nav | Low | None | Open `/app/dashboard`; see Empresas + Infraestructura. |
| A3 | Create companies layout and placeholder pages | `app/app/companies/layout.tsx`, `app/app/companies/page.tsx`, `app/app/companies/reino-editorial/page.tsx`, same for ikingdom, imperium, max-hebeling | Routes | Low | A2 | Navigate to `/app/companies`, `/app/companies/reino-editorial`. |
| A4 | Add Reino Editorial secondary nav layout | `app/app/companies/reino-editorial/layout.tsx` + nav component | Layout | Low | A3 | Enter Reino Editorial; see secondary nav (Overview, Projects, …). |

### Phase B — Move Reino Editorial under companies

| Step | Objective | Files / folders | Affects | Risk | Dependency | How to test |
|------|------------|-----------------|---------|------|------------|-------------|
| B1 | Create new route tree under `companies/reino-editorial` | e.g. `overview`, `projects`, `projects/[projectId]`, `ai`, `authors`, `staff`, `marketplace`, `distribution`, `operations`, `reports` | Routes | Medium | A4 | Each URL loads. |
| B2 | Copy or move staff editorial pages into new tree | From `(staff)/staff/*` and `app/editorial/*` into `app/app/companies/reino-editorial/*`; reuse components | Routes, pages | Medium | B1 | Projects list and project detail work under `/app/companies/reino-editorial/projects`. |
| B3 | Point API and links to new paths | Update `Link`/`href` and API base paths if any; keep API routes under `api/editorial`, `api/staff` | Components, API | Medium | B2 | No broken links; API still used. |
| B4 | Add redirects from old URLs to new | `next.config` redirects or middleware: `/staff/*` → `/app/companies/reino-editorial/*`, `/app/editorial/*` → `/app/companies/reino-editorial/*` | Routes | Low | B2 | Old bookmarks redirect. |
| B5 | Remove or deprecate duplicate editorial entry under BOS | Remove or redirect `/app/editorial` to `/app/companies/reino-editorial` | Routes | Low | B4 | Single entry for editorial. |

### Phase C — Shared infra and cleanup

| Step | Objective | Files / folders | Affects | Risk | Dependency | How to test |
|------|------------|-----------------|---------|------|------------|-------------|
| C1 | Ensure shared infra routes are under `/app/crm`, `/app/clients`, etc. | Already there; optionally rename or group under a layout | Routes | Low | None | CRM, Billing, etc. open from global nav. |
| C2 | Add breadcrumbs and optional "current company" in header | Header/topbar component | UI | Low | A2 | Breadcrumbs show Hebeling OS > Empresas > Reino Editorial > … |
| C3 | (Optional) Add `business_unit_id` to profiles or role table | Migration + RLS if needed | DB, RLS | Medium | A1 | Staff can only see allowed business units. |

### Phase D — Placeholder businesses

| Step | Objective | Files / folders | Affects | Risk | Dependency | How to test |
|------|------------|-----------------|---------|------|------------|-------------|
| D1 | iKingdom overview + applications placeholder | `app/app/companies/ikingdom/overview/page.tsx`, `app/app/companies/ikingdom/applications/page.tsx` | Routes | Low | A3 | Placeholder content. |
| D2 | Imperium, Max Hebeling overview placeholders | Same pattern | Routes | Low | A3 | Placeholder content. |

---

## 8. Migration Plan

### 8.1 Single migration: `business_units`

- **File:** e.g. `scripts/022_business_units.sql`.
- **Content:** Create `business_units` table; unique on `code` and `slug`; seed four rows.
- **RLS:** Optional; if the table is read-only for the app, a simple "authenticated can read" policy is enough.
- **Rollback:** `drop table if exists business_units;` (only if no FKs reference it yet).

### 8.2 Add `business_unit_id` only where necessary (later)

- Do **not** add to `editorial_*` in the first refactor.
- When you need multi–business-unit CRM/Billing/Intelligence, add a **second migration** that:
  - Adds `business_unit_id` to the chosen tables (e.g. `editorial_crm_organizations`, `editorial_client_accounts`).
  - Backfills existing rows (e.g. set to `reino_editorial` id).
  - Updates RLS to filter by `business_unit_id` where applicable.

---

## 9. Risks and How to Avoid Breaking Current Functionality

| Risk | Mitigation |
|------|-------------|
| Broken links after moving routes | Add redirects from `/staff/*` and `/app/editorial/*` to new paths; update all internal `Link`/`href` in one pass. |
| API assumptions on path | APIs stay at `api/editorial`, `api/staff`; no change. If any client assumed path prefix, search for `/staff` or `/app/editorial` and update. |
| Auth and role checks | Keep same `profiles.role` and org checks; add optional business-unit access later. Non-staff still redirect to portal. |
| Editorial logic in lib | No change to `lib/editorial`; only route and layout layer changes. |
| DB regression | New migration is additive (`business_units` only); no alter on existing tables in step 1. |
| Two "editors" of same project | After move, remove or redirect `/app/editorial` so only one entry point exists: `/app/companies/reino-editorial`. |
| Author Portal | Do not move author routes; keep `/author`. Link from Reino "Authors" to `/author` or embed. |
| Portal (client) | Keep `/portal`; no conflict with company-first app routes. |

---

## 10. Summary Checklist

- [ ] Run migration `022_business_units.sql` (or equivalent).
- [ ] Update `AppSidebar` to company-first (Empresas + Infraestructura + Settings).
- [ ] Create `/app/companies` layout and placeholder company pages.
- [ ] Create `/app/companies/reino-editorial` layout with secondary nav.
- [ ] Create new pages under `/app/companies/reino-editorial/*` (overview, projects, ai, staff, etc.) by moving/copying from `(staff)/staff` and `app/editorial`.
- [ ] Update all internal links and redirects from `/staff` and `/app/editorial` to new paths.
- [ ] Remove or redirect `/app/editorial` to avoid duplicate entry.
- [ ] Add breadcrumbs and optional company context in header.
- [ ] (Later) Add `business_unit_id` to shared-infra tables and RLS if needed.

This keeps Reino Editorial as a full module inside Hebeling OS, preserves existing code and data, and introduces a clear company-first structure with minimal breakage and a safe migration path.
