# Phase 7 Closure Plan — Company-First Migration

**HEBELING OS · Phase 7C (validation) + Phase 7D (cleanup)**

---

## Important note about this workspace

In the current branch snapshot, **`/app/companies` and `/staff/*` route trees are not present**. The audit below assumes Phase 7A/7B are implemented (on your branch or to be merged) and defines the exact steps to **close Phase 7** once that code is in place. Where the current codebase contradicts the “implemented” state (e.g. login still redirects to `/app/dashboard`), it is called out so you can align the branch.

---

# 1. Current Phase 7 status

## 1.1 What you described as complete (Phase 7A + 7B)

| Area | Status (per your context) | Notes |
|------|---------------------------|--------|
| Company-first shell | Done | Shell with business units, secondary nav |
| `/app/companies` | Done | Entry to company list / company context |
| Business units / secondary navigation | Done | Per-company nav |
| Reino Editorial operational core | Done | Under `/app/companies/reino-editorial/` |
| — `projects` | Done | List + `[projectId]` |
| — `ai` | Done | AI module |
| — `operations` | Done | Operations module |
| Legacy routes | Present | `/staff/*` still exist |
| Staff login redirect | “Changed in code” to `/app/companies` | Must be verified (see 2.1) |

## 1.2 What this workspace currently has (if 7A/7B not merged)

| Item | Current state in repo |
|------|------------------------|
| Staff login redirect | **Still** `router.push("/app/dashboard")` in `app/login/page.tsx` (line 68) |
| Middleware post-login redirect | **Still** `url.pathname = "/app/dashboard"` in `middleware.ts` (line 104) |
| Primary staff entry | `/app/dashboard` (single layout under `app/app/`) |
| Sidebar | `AppSidebar` with links to `/app/dashboard`, `/app/crm`, `/app/projects`, etc. — no `/app/companies` |
| `/app/companies` | **Does not exist** (no such folder under `app/`) |
| `/staff/*` | **Does not exist** (no `app/staff/` folder) |
| StaffProjectHeader / backHref | **Does not exist** in codebase |

So: **Phase 7 is not fully reflected in this snapshot.** The closure plan below is the exact checklist to apply once 7A/7B are in the tree (or to implement the missing redirect/shell behavior).

## 1.3 What is still pending (to close Phase 7)

- **7C — Validation**
  - Staff login lands on `/app/companies` (not `/app/dashboard`) in both middleware and login page.
  - Company-first shell is the real staff entry (no bypass to legacy dashboard).
  - Reino Editorial routes work end-to-end; legacy `/staff/*` still work and are safe.
  - Production vs preview behavior is documented and consistent.

- **7D — Cleanup / consolidation**
  - Contextual `backHref` in StaffProjectHeader (back to company context, not legacy).
  - Optional redirect strategy: `/staff/*` → `/app/companies/reino-editorial/*` (or keep legacy as-is and document).
  - Decision for `/app/dashboard`: keep as legacy entry, redirect to `/app/companies`, or remove from primary nav.
  - Remove or update hybrid links that still point to legacy-only paths.
  - Decide which placeholders stay and which are migrated next.

---

# 2. What blocks full closure (Step 2)

## 2.1 Login and first screen

| Blocker | Where | Fix |
|--------|--------|-----|
| Login still sends staff to `/app/dashboard` | `app/login/page.tsx` | Change `router.push("/app/dashboard")` → `router.push("/app/companies")` (or target company if you have one). |
| Middleware still redirects staff on `/login` to dashboard | `middleware.ts` | Change `url.pathname = "/app/dashboard"` → `"/app/companies"` when staff is logged in and hits `/login`. |
| Root `/` or bookmarks | Users may have `/app/dashboard` bookmarked | Either redirect `/app/dashboard` → `/app/companies` or keep dashboard and add nav to Companies; decide in 7D. |

## 2.2 `/staff/login` vs `/login`

| Item | Risk |
|------|------|
| Single staff login at `/login` | No `/staff/login` in current codebase. If production or docs assume `https://.../staff/login`, either add a redirect `/staff/login` → `/login` or move login to `/staff/login` and redirect `/login` → `/staff/login`. Define one canonical URL and document it. |
| Brand redirect to `hebeling.io/login` | `middleware.ts` line 56 redirects brand domains to `https://www.hebeling.io/login`. Ensure production domain matches. |

## 2.3 `/app/dashboard` role

- Dashboard is still the **default post-login** in current code and the **first sidebar item**.
- Until redirect is changed, company-first is not the real entry.
- **Decision needed:** After 7D, should `/app/dashboard`:
  - **A)** Redirect to `/app/companies`, or  
  - **B)** Remain but become secondary (e.g. “Global overview”) and primary nav entry becomes Companies, or  
  - **C)** Be removed from sidebar and only reachable by URL (legacy).

## 2.4 Legacy `/staff` links in components

- In this snapshot there are **no** `/staff` links (no staff routes).
- Once you have both `/staff/*` and `/app/companies/reino-editorial/*`, audit:
  - Any `<Link href="/staff/...">` or `router.push("/staff/...")`.
  - StaffProjectHeader (or equivalent) “Back” links: should go to company context (e.g. `/app/companies/reino-editorial/projects`) when the user came from there, not to `/staff/...` only.

## 2.5 StaffProjectHeader `backHref` behavior

- **Assumption:** There is (or will be) a `StaffProjectHeader` used on project/detail pages with a “Back” link.
- **Required:** `backHref` should be **contextual**:
  - From company flow → back to e.g. `/app/companies/reino-editorial/projects` (or list).
  - From legacy staff flow → back to e.g. `/staff/books` if you keep it.
- Implement by passing `backHref` from the page (or layout) that knows the entry context (company slug + section).

## 2.6 Duplicated AI / operations JSX

- You mentioned “duplicated AI / operations JSX”.
- **Action:** Identify two places that render the same (or nearly same) AI or operations UI:
  - One under `/app/companies/reino-editorial/ai` (and possibly operations).
  - One under legacy (e.g. `/staff/ai` or `/app/ai`).
- **7D:** Prefer a single set of components; company routes should use the same components with company context (e.g. `companySlug`). Remove or thin the duplicate to a small wrapper that passes context.

## 2.7 Routes that are still bridges/placeholders

- In this repo, `app/app/roles/page.tsx` is a placeholder (“Coming soon”).
- After 7A/7B, list any routes that are:
  - Redirect-only (e.g. `/app/payments` → finance-vault).
  - “Coming soon” placeholders.
  - Bridges that only redirect legacy → company.
- 7D should decide: migrate next vs keep as placeholder vs remove from nav.

## 2.8 Deployment / production branch

- Ensure the branch that has 7A/7B (and then 7C/7D) is the one deployed to production/preview.
- Document:
  - Canonical staff login URL: `/login` or `/staff/login`.
  - Post-login URL: `/app/companies`.
  - Any env or host rules (e.g. `hub.` vs `www.`).

---

# 3. Phase 7C — Validation checklist (Step 3)

Use this to confirm Phase 7 is behaviorally complete before cleanup.

## 3.1 Staff login lands on `/app/companies`

- [ ] **Login page:** After successful staff login, `router.push` (or equivalent) goes to `/app/companies` (not `/app/dashboard`).  
  - **File:** `app/login/page.tsx`.
- [ ] **Middleware:** When a staff user visits `/login` while already logged in, redirect goes to `/app/companies`.  
  - **File:** `middleware.ts`.
- [ ] **Manual test:** Log in as staff → first full page is company list or company-scoped shell (e.g. reino-editorial), not the old dashboard.

## 3.2 Company-first shell is the real entry

- [ ] No automatic redirect from `/app/companies` to `/app/dashboard`.
- [ ] Primary sidebar (or top-level nav) for staff includes “Companies” (or equivalent) and leads to `/app/companies`.
- [ ] Choosing a company (e.g. Reino Editorial) shows secondary nav (Projects, AI, Operations) under that company.

## 3.3 Reino Editorial routes work end-to-end

- [ ] `GET /app/companies` (or equivalent) loads and shows companies.
- [ ] `GET /app/companies/reino-editorial` (or first segment after companies) loads company shell.
- [ ] `GET /app/companies/reino-editorial/projects` — list loads.
- [ ] `GET /app/companies/reino-editorial/projects/[projectId]` — detail loads; back/crumb goes to company projects.
- [ ] `GET /app/companies/reino-editorial/ai` — AI module loads.
- [ ] `GET /app/companies/reino-editorial/operations` — Operations module loads.
- [ ] No 404 or runtime errors on the above in production/preview.

## 3.4 Legacy routes remain safe

- [ ] If `/staff/*` exists: visiting `/staff/...` (e.g. `/staff/books`, `/staff/ai`) still works for staff (no broken links or 404).
- [ ] If legacy is deprecated: redirects from `/staff/*` to `/app/companies/reino-editorial/*` are defined and tested (see 7D).
- [ ] Middleware allows both `/app/*` and `/staff/*` for staff (if both are still valid).

## 3.5 Production / preview behavior

- [ ] Same redirect and entry behavior on preview (e.g. Vercel preview) as production, or differences are documented.
- [ ] Brand-domain redirect to hub login uses the correct production URL (e.g. `www.hebeling.io/login` or chosen canonical).

---

# 4. Phase 7D — Cleanup / consolidation (Step 4)

## 4.1 Contextual `backHref` in StaffProjectHeader

- [ ] **Define contract:** `StaffProjectHeader` accepts e.g. `backHref` and optional `backLabel`.
- [ ] **Company project list:** From `/app/companies/reino-editorial/projects`, link to project detail; detail page passes `backHref="/app/companies/reino-editorial/projects"` (or derive from `companySlug`).
- [ ] **Company project detail:** “Back” goes to company projects list, not to `/staff/books` or `/app/projects`.
- [ ] **Legacy (if kept):** From `/staff/books`, detail page passes `backHref="/staff/books"`.
- **Files to touch:** Component that renders the project header (e.g. `StaffProjectHeader` or page/layout that uses it), and each project detail page/layout under company and under staff.

## 4.2 Redirect strategy from `/staff/*` to `/app/companies/reino-editorial/*`

**Option A — Keep both (recommended short-term)**  
- Leave `/staff/*` as-is; no redirect.  
- Nav and new links point to `/app/companies/reino-editorial/*`.  
- Document that `/staff/*` is legacy; eventually deprecate.

**Option B — Redirect legacy → company**  
- In middleware or in a layout/page: if path is `/staff/books` → redirect to `/app/companies/reino-editorial/projects`; `/staff/books/[id]` → `/app/companies/reino-editorial/projects/[id]`; `/staff/ai` → `/app/companies/reino-editorial/ai`; etc.  
- **File:** `middleware.ts` or a catch-all under `app/staff/`.

- [ ] **Decision recorded:** A or B (and if B, exact mapping table).
- [ ] If B: implement redirects and test; update any links that pointed to `/staff/*`.

## 4.3 Decision for `/app/dashboard`

- [ ] **Choose one:**
  - **Redirect:** From `/app/dashboard` redirect to `/app/companies` (middleware or page redirect). Sidebar no longer has “Dashboard” as first item, or links to Companies.
  - **Keep as secondary:** Dashboard stays; add “Companies” as primary entry in sidebar; optional “Dashboard” for global overview.
  - **Remove from nav:** Dashboard route still works by URL but is removed from sidebar.
- [ ] Implement the chosen behavior and update sidebar (e.g. `components/app-sidebar.tsx` or company-shell nav).

## 4.4 Removal of unnecessary hybrid links

- [ ] Search codebase for:
  - `href="/app/dashboard"` (if dashboard is no longer entry).
  - `href="/staff/...` (if redirecting or deprecating).
  - Any link that sends users to legacy when the same flow exists under company (e.g. “Books” linking to `/staff/books` instead of `/app/companies/reino-editorial/projects`).
- [ ] Replace or remove so that primary paths are company-first; keep legacy links only where you decided to keep legacy.

## 4.5 Placeholders: migrate next vs wait

- [ ] List placeholders (e.g. Roles “Coming soon”, Analytics stub, etc.).
- [ ] For each: **migrate next** (add to 7D or next sprint) or **leave as-is** (stay in nav or hidden).
- [ ] Ensure no placeholder is the only way to reach a critical flow; company routes are the main path.

---

# 5. Recommended order of execution

1. **Align branch**  
   - Merge or confirm branch that has Phase 7A/7B (company shell, `/app/companies`, reino-editorial, and optionally legacy `/staff/*`).

2. **7C — Validation (no new features)**  
   - Update staff login redirect to `/app/companies`: `app/login/page.tsx` and `middleware.ts`.  
   - Run full 7C checklist (login, shell as entry, reino-editorial E2E, legacy safe, prod/preview).

3. **7D — Decisions (no code yet)**  
   - Decide: `/staff/*` redirect (A vs B).  
   - Decide: `/app/dashboard` (redirect vs keep vs remove from nav).  
   - Decide: which placeholders to migrate next vs leave.

4. **7D — Back + nav**  
   - Implement contextual `backHref` in StaffProjectHeader (or equivalent).  
   - Update sidebar/nav so Companies is primary; apply dashboard decision.

5. **7D — Redirects and link cleanup**  
   - If redirecting `/app/dashboard` or `/staff/*`, add redirects.  
   - Replace/remove hybrid links; document canonical URLs.

6. **7D — Duplication**  
   - Consolidate duplicated AI/operations UI into shared components used by company routes (and optionally legacy wrappers).

7. **Document and ship**  
   - Document staff login URL, post-login URL, and any redirect rules.  
   - Deploy; re-run 7C checklist on production/preview.

---

# 6. Files likely to change next

| Purpose | File(s) |
|--------|--------|
| Staff login redirect (post-login URL) | `app/login/page.tsx` |
| Middleware post-login redirect | `middleware.ts` |
| Dashboard redirect (if redirecting to companies) | `middleware.ts` or `app/app/dashboard/page.tsx` (redirect) |
| Primary nav / sidebar entry to Companies | `components/app-sidebar.tsx` or company-shell nav component |
| Back link on project/detail pages | StaffProjectHeader (or equivalent), and pages under `app/companies/reino-editorial/projects/[projectId]` (and legacy if kept) |
| Legacy → company redirects (if Option B) | `middleware.ts` or `app/staff/...` redirect routes |
| Replace legacy links with company links | Any component that links to `/staff/...` or `/app/dashboard` as primary entry |
| Consolidate AI/operations UI | Components used by `app/companies/reino-editorial/ai` and `.../operations` and legacy equivalents |
| App layout (if company shell is under different layout) | `app/app/layout.tsx` or `app/app/companies/` layout(s) |

---

# 7. Summary

| Deliverable | Where |
|-------------|--------|
| Current Phase 7 status | §1 |
| What is complete | §1.1 |
| What is still pending | §1.3 |
| Exact 7C validation checklist | §3 |
| Exact 7D implementation checklist | §4 |
| Recommended order of execution | §5 |
| Files likely to change next | §6 |

Phase 7 is fully closed when: (1) staff login lands on `/app/companies`, (2) company-first shell is the real entry, (3) Reino Editorial routes work end-to-end, (4) legacy is either kept and safe or redirected and documented, and (5) 7D decisions are implemented (backHref, dashboard, links, optional redirects, and duplication removed).
