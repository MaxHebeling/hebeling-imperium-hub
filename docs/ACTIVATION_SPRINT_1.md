# Activation Sprint 1 — Stabilize the OS

**Objetivo:** Solo ítems críticos para estabilizar el OS (env, DB, login, Apply, rutas rotas).

---

## 1. Critical issues

| # | Issue | Root cause | Files involved |
|---|--------|------------|----------------|
| 1 | App crashes on any request when Supabase env is missing | `updateSession()` calls `createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` without checking; Supabase throws when URL/Key are undefined. | `lib/supabase/middleware.ts`, `middleware.ts` (calls updateSession) |
| 2 | No single source for required env vars | No `.env.example`; env vars are scattered across codebase; wrong/missing env is found only at runtime. | All files using `process.env.*`; no `.env.example` |
| 3 | Sidebar links to Analytics and Roles return 404 | Sidebar defines `/app/analytics` and `/app/roles` but no `app/app/analytics/page.tsx` nor `app/app/roles/page.tsx` exist. | `components/app-sidebar.tsx`; missing `app/app/analytics/page.tsx`, `app/app/roles/page.tsx` |
| 4 | Apply → Leads/Deals can fail if pipeline/stages missing | `createDealFromLead()` looks for a stage with name "New" or "Lead"; seed 002 does not create pipelines/stages, so `stage_id` is always null and deal may still insert but pipeline UX may expect stages. | `lib/leads/helpers.ts` (createDealFromLead); `scripts/002_seed_org_brands.sql` (no pipeline/stages) |
| 5 | Leads API fails if service role key or leads table missing | `getAdminClient()` and inserts into `leads`/`deals`/`activity_logs` require `SUPABASE_SERVICE_ROLE_KEY` and migrations 001+006. Unclear order and no checklist. | `lib/leads/helpers.ts`, `app/api/leads/route.ts`; scripts 001, 006 |
| 6 | Client login redirects to portal but portal layout doesn’t enforce client role | Portal layout only checks `user`; if a staff user somehow hits portal host, they could see portal. Middleware already restricts by host, so this is low; documented for clarity. | `app/portal/layout.tsx`, `middleware.ts` |

---

## 2. Fix plan (priority order)

### P1 — Env and middleware (avoid crash)

1. **Add env guard in Supabase middleware**  
   - **File:** `lib/supabase/middleware.ts`  
   - **Change:** At the start of `updateSession()`, if `!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, return a result that does not call `createServerClient` (e.g. `{ supabaseResponse, user: null, profile: null, supabase: null }` or similar so caller can short‑circuit).  
   - **File:** `middleware.ts`  
   - **Change:** After calling `updateSession`, if the returned object indicates “no Supabase” (e.g. null supabase or explicit flag), skip role/path logic and return a plain JSON or HTML response with status 503 and message like “Server misconfiguration: Supabase URL and Anon Key are required. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.” so the app doesn’t crash and the cause is clear.

2. **Add `.env.example`**  
   - **File:** `.env.example` (new)  
   - **Content:** List all required and optional env vars with placeholder values and short comments (see section 3 below).  
   - Ensures required variables are documented and can be validated manually or via a small script.

### P2 — Supabase migrations and tables

3. **Document migration order and required tables**  
   - **File:** `docs/ACTIVATION_SPRINT_1.md` (this doc) or `scripts/README.md`  
   - **Content:** Run in order: `001_schema.sql` → `002_seed_org_brands.sql` → `003_add_contact_id_to_deals.sql` → `004_add_vercel_columns_to_websites.sql` → `005_create_vercel_projects_table.sql` → `006_create_ikingdom_leads_table.sql`.  
   - List tables required for Sprint 1: `organizations`, `brands`, `profiles`, `tenants`, `pipelines`, `stages`, `deals`, `leads`, `lead_code_counters`, `activity_logs`, plus the rest of 001 and 006.

4. **Seed default pipeline + stage for leads**  
   - **File:** New script `scripts/007_seed_default_pipeline.sql` (or append to 002).  
   - **Content:** Insert one pipeline for the seeded org (e.g. name `"iKingdom"` or `"Default"`) and one stage with name `"Lead"` or `"New"` so `createDealFromLead()` can resolve `stage_id`.  
   - Prevents deals from leads always having `stage_id` null and keeps pipeline/deals UX consistent.

### P3 — Login flow (validation only for Sprint 1)

5. **No code change required**  
   - Staff: `/login` → Auth + profile.role in STAFF_ROLES → redirect to `/app/dashboard`.  
   - Client: `/client-login` → Auth + profile.role === "client" → redirect to `/portal/overview`.  
   - Middleware enforces `/app/*` = staff, `/portal/*` = client.  
   - Add test steps (see section 5) to validate both flows.

### P4 — Apply → Leads / Deals / Emails

6. **Ensure Leads API has clear errors**  
   - **File:** `app/api/leads/route.ts`  
   - **Change:** In `catch`, if error message indicates missing env (e.g. from `getAdminClient()` or Supabase), return 503 with a safe message like “Server configuration error. Check SUPABASE_SERVICE_ROLE_KEY and database migrations.” so clients don’t get a generic 500 and logs are clearer.

7. **Optional: validate RESEND_API_KEY for emails**  
   - **File:** `lib/leads/email.ts`  
   - Already skips sending when `RESEND_API_KEY` is missing and logs a warning. No change required; document in .env.example that leads will be created but emails won’t send without it.

### P5 — Broken sidebar links and 404 routes

8. **Add placeholder pages for Analytics and Roles**  
   - **Files:** `app/app/analytics/page.tsx`, `app/app/roles/page.tsx` (new).  
   - **Content:** Simple page with title and short “Coming soon” or “Placeholder” message so the routes return 200 and the sidebar doesn’t lead to 404.  
   - Alternative: remove the two items from the sidebar in `components/app-sidebar.tsx` until real pages exist; for Sprint 1, placeholders are preferable to avoid 404s.

---

## 3. Required environment variables (validation checklist)

Use this to validate before running the app.

| Variable | Required for | Used in |
|----------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, middleware, all Supabase reads | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Leads API (create lead/deal/activity), Vercel API | `lib/leads/helpers.ts`, `app/api/vercel/import-projects/route.ts`, `app/api/vercel/sync/route.ts` |
| `RESEND_API_KEY` | Lead notification + confirmation emails | `lib/leads/email.ts` |
| `FINANCE_MODULE_KEY` | Unlocking Finance Vault | `app/api/finance/unlock/route.ts` |
| `RESEND_FROM_EMAIL` | Optional; sender for Resend | `lib/leads/email.ts` |
| `INTERNAL_NOTIFICATION_EMAIL` | Optional; internal lead notification recipient | `lib/leads/email.ts` |
| `NEXT_PUBLIC_APP_URL` | Optional; links in emails | `lib/leads/email.ts` |
| `VERCEL_ACCESS_TOKEN`, `VERCEL_TEAM_ID` | Optional; Vercel import | `app/api/vercel/import-projects/route.ts` |
| `VERCEL_TOKEN`, `ORG_ID` | Optional; Vercel sync | `app/api/vercel/sync/route.ts` |

**Sprint 1 minimum:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.  
Ensure `.env.local` is a **file** (not a directory); otherwise Next won’t load env and middleware will fail.

---

## 4. Supabase migrations and required tables

- **Order:** 001 → 002 → 003 → 004 → 005 → 006 → (new) 007 for default pipeline/stage.
- **Tables required for:**
  - **Login / middleware:** `auth.users` (Supabase), `profiles`, `organizations`.
  - **Dashboard:** `brands`, `tenants`, `projects`, `websites`, `tickets`, `deals`, `leads`, `documents`, `activity_logs`.
  - **Apply / Leads API:** `organizations`, `leads`, `lead_code_counters`, `deals`, `stages`, `pipelines`, `activity_logs` (001 + 006; pipeline/stage seed so a “Lead”/“New” stage exists).

Validation: After running migrations, in Supabase SQL editor run a quick check that tables exist and seed org exists, e.g. `select id, slug from organizations;` and `select id, name from pipelines;` (after 007).

---

## 5. Test steps

### Env and middleware

1. Remove or rename `NEXT_PUBLIC_SUPABASE_URL` from `.env.local` (or use a run without it). Open `/`. Expect: no uncaught exception; response 503 or similar with message that Supabase URL/Key are required.  
2. Restore env. Open `/`. Expect: landing page loads (200).

### Supabase and migrations

3. Run migrations 001 through 006 (and 007 if added).  
4. In Supabase: confirm `organizations` has one row; `pipelines` and `stages` have at least one pipeline and one stage named "Lead" or "New".  
5. Create (or confirm) one user in Auth and one row in `profiles` with `org_id` = that org, `role` = `admin` or `superadmin`.  
6. Create one profile with `role` = `client` and `tenant_id` set to a valid tenant for portal tests.

### Login flow

7. **Staff:** Log in at `/login` with staff credentials. Expect: redirect to `/app/dashboard`. Open `/app/settings`. Expect: 200, no redirect to login.  
8. **Client:** Log in at `/client-login` with client credentials (on host that resolves as client portal, or with `?app=clients` on localhost). Expect: redirect to `/portal/overview`.  
9. **Staff on portal:** As staff, go to `/portal/overview` (if reachable). Expect: redirect to login or to hub (per middleware).  
10. **Client on app:** As client, go to `/app/dashboard`. Expect: redirect to `/portal/overview` (from app layout).

### Apply form and leads

11. Open `/apply` (or `/apply/ikingdom-diagnosis`). Fill minimum required (e.g. full_name, email, whatsapp) and submit.  
12. Expect: 200, JSON `success: true` and `leadCode` in response.  
13. In Supabase: new row in `leads` with that `lead_code`; new row in `deals` with same `lead_code`; new row in `activity_logs` for `lead_created`.  
14. If `RESEND_API_KEY` is set: internal and confirmation emails sent (check logs or inbox).

### Sidebar and 404

15. As staff, click every sidebar link. Expect: no 404. In particular:  
    - `/app/analytics` → 200 (placeholder page).  
    - `/app/roles` → 200 (placeholder page).  
16. Optional: Open `/app/analytics` and `/app/roles` in incognito after login; expect 200.

---

## 6. Summary

- **Critical issues:** Env missing → crash; no .env.example; 404 on Analytics/Roles; leads/deals depend on pipeline/stages and correct migrations.  
- **Root causes and files:** Listed in section 1.  
- **Fix plan:** P1 env + middleware guard + .env.example; P2 migration order + seed pipeline/stage; P3 login validation (tests only); P4 Leads API error handling; P5 placeholder pages for Analytics and Roles.  
- **Test steps:** Env/middleware, migrations, staff/client login, Apply → leads/deals/emails, sidebar links no 404.

After Sprint 1: app doesn’t crash on missing env, required env is documented, migrations and pipeline/stage seed are defined, login and Apply flow are validated, and sidebar has no 404s.

---

## 7. Implemented in this sprint

The following were implemented:

- **P1:** Env guard in `lib/supabase/middleware.ts` (return `configError: true` when URL/Key missing); `middleware.ts` returns 503 with clear message when `configError`. `.env.example` added with all variables documented.
- **P2:** `scripts/007_seed_default_pipeline.sql` added (idempotent pipeline "iKingdom" + stage "Lead" for the seeded org).
- **P4:** `app/api/leads/route.ts` catch block returns 503 with a safe config message when env or Supabase-related errors are detected.
- **P5:** `app/app/analytics/page.tsx` and `app/app/roles/page.tsx` added as placeholder pages so sidebar links no longer 404.
