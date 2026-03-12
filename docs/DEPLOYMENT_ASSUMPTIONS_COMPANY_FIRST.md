# Deployment Assumptions — Company-First Migration (HEBELING OS)

**Purpose:** Document what must be true for the new company-first experience to appear in production, and why a feature branch may behave differently from production.

---

## 1. Code paths affecting staff post-login destination

These are the **only** places that decide where staff land after login. Both must point to the company-first entry for the new flow to appear.

### 1.1 Client-side redirect (immediate post-login)

| File | Location | Current behavior |
|------|----------|-------------------|
| **`app/login/page.tsx`** | Lines 66–68, inside `handleSubmit` after successful `signInWithPassword` and profile fetch | `router.push("/app/dashboard")` then `router.refresh()` when role is `superadmin` \| `admin` \| `sales` \| `ops`. |

**Effect:** Right after submitting the login form, the browser is sent to this path. If this stays `/app/dashboard`, staff always land on the legacy dashboard regardless of middleware.

### 1.2 Server-side redirect (staff already logged in, visits `/login`)

| File | Location | Current behavior |
|------|----------|-------------------|
| **`middleware.ts`** | Lines 99–105, inside `if (isHubHost)` | When `pathname === "/login"` and `user && isStaff`, redirect to `url.pathname = "/app/dashboard"`. |

**Effect:** If a staff user opens `/login` when already authenticated (e.g. bookmark or link), the middleware redirects them to this path. If this stays `/app/dashboard`, they never see the company list from the login page.

### 1.3 Host detection (hub vs clients)

| File | Location | Logic |
|------|----------|--------|
| **`middleware.ts`** | Lines 84–96 | `isHubHost` = `hostname.startsWith("hub.")` **or** (`localhost` and `appHint !== "clients"`) **or** (`*.vercel.app` and `appHint !== "clients"`). `isClientsHost` = `hostname.startsWith("clients.")` or local/preview with `appHint === "clients"`. |

**Effect:** Production must be reached via a host that matches `isHubHost` (e.g. `hub.hebeling.io` or `www.hebeling.io` if that’s how it’s configured) for staff logic to run. Brand domains (e.g. editorialreino.com) redirect to `https://www.hebeling.io/login` (line 56).

### 1.4 Navigation entry (sidebar)

| File | Location | Current behavior |
|------|----------|-------------------|
| **`components/app-sidebar.tsx`** | Lines 41–42, 139 | First nav item is `href: "/app/dashboard"` (dashboard). Logo link is also `/app/dashboard`. No `/app/companies` link in `navSections`. |

**Effect:** Even if post-login redirect went to `/app/companies`, the sidebar does not expose “Companies” as the primary entry in the current codebase. Users could still open `/app/companies` by URL or bookmark.

### 1.5 Summary table

| Code path | File | Decides |
|-----------|------|--------|
| Post-login (form submit) | `app/login/page.tsx` | First URL staff see after logging in |
| Already-logged-in visit to `/login` | `middleware.ts` | Redirect target when staff hit `/login` |
| Hub vs clients | `middleware.ts` | Whether staff/auth rules run at all |
| Primary nav | `components/app-sidebar.tsx` | Whether “Companies” is the visible entry |

---

## 2. What branch/deployment must include for the new flow to appear

For the **company-first** experience to be what staff see in production, the **deployed** branch must include at least the following.

### 2.1 Redirects updated to company-first entry

- **`app/login/page.tsx`**  
  - Replace `router.push("/app/dashboard")` with `router.push("/app/companies")` (or the canonical company list URL you use).
- **`middleware.ts`**  
  - Replace `url.pathname = "/app/dashboard"` (when staff visit `/login`) with `url.pathname = "/app/companies"`.

Without both changes, staff will continue to land on `/app/dashboard` after login and when opening `/login` while logged in.

### 2.2 Company-first routes and shell

- **`/app/companies`**  
  - A page (or layout with index) that renders the company list or company shell (e.g. list of companies / business units). If this route is missing, redirecting to `/app/companies` will 404.
- **Company-scoped routes** (e.g. Reino Editorial)  
  - e.g. `/app/companies/reino-editorial/projects`, `/app/companies/reino-editorial/projects/[projectId]`, `/app/companies/reino-editorial/ai`, etc.  
  - These can live only on the feature branch until merged; production will not show the new experience until they are deployed.

### 2.3 Optional but recommended

- **Sidebar / primary nav**  
  - Add “Companies” (or equivalent) as the first or primary item pointing to `/app/companies`, and/or demote or remove “Dashboard” as the first item so the default mental model is company-first.
- **`/app/dashboard`**  
  - Decide: redirect to `/app/companies`, keep as secondary page, or remove from nav. Document the decision so deployment and support are consistent.

---

## 3. Why a feature branch may work in preview but not in production

### 3.1 Different branch deployed

- **Preview (e.g. Vercel):** Each PR or branch often gets its own deployment (e.g. `*-git-<branch>-*.vercel.app`). That deployment is built from the **feature branch** that contains the company-first redirects and `/app/companies` routes.
- **Production:** Production is usually tied to a single branch (e.g. `main` or `production`). If the company-first changes have **not** been merged to that branch, production is still running the old code:
  - `app/login/page.tsx` still does `router.push("/app/dashboard")`.
  - `middleware.ts` still redirects staff from `/login` to `/app/dashboard`.
  - `/app/companies` may not exist (404) or may not be linked in the UI.

So: **preview = feature branch code; production = main (or default) branch code.** If the migration lives only on the feature branch, production will keep showing the old behavior until that branch is merged and deployed.

### 3.2 Host and URL differences

- **Preview:** Host is often `*.vercel.app`. Middleware treats it as hub when `appHint !== "clients"` (lines 88–91). Staff login and redirect logic run.
- **Production:** Host is the production domain (e.g. `hub.hebeling.io`, `www.hebeling.io`). Same middleware runs **if** the same code is deployed. If production uses a different domain that doesn’t match `isHubHost` (e.g. no `hub.` prefix and no special handling), behavior could differ; in the current code, `hub.` or the same logic for production host must apply.

So: **same code** on both preview and production gives consistent behavior by host. The main reason production “looks old” is usually **different code** (branch not merged/deployed), not host alone.

### 3.3 Caching and CDN

- After merging, production might serve a cached build or cached redirect. Ensure the production deployment has **rebuilt** from the branch that contains the redirect and route changes, and that any CDN or browser cache isn’t serving an old redirect to `/app/dashboard`.

### 3.4 Environment and config

- The redirect target is **hardcoded** in the repo (`/app/dashboard` vs `/app/companies`), not read from env. So production doesn’t “switch” behavior via env unless you later introduce something like `NEXT_PUBLIC_STAFF_ENTRY_PATH`. Right now, **only the deployed code** determines the post-login destination.

---

## 4. Deployment readiness checklist for company-first migration

Use this before and after deploying the company-first experience to production.

### 4.1 Code and routes

- [ ] **Login page:** `app/login/page.tsx` uses `router.push("/app/companies")` (or the chosen company-first entry URL) for staff roles.
- [ ] **Middleware:** `middleware.ts` redirects staff visiting `/login` to `/app/companies` (same URL as above).
- [ ] **Company list/shell:** Route `/app/companies` exists and renders (company list or shell). No 404 when redirecting here.
- [ ] **Company routes:** Required company routes exist (e.g. `/app/companies/reino-editorial/projects`, `.../projects/[projectId]`, `.../ai`, `.../operations`) and are reachable under the same base path as in preview.
- [ ] **Sidebar/nav (optional):** “Companies” is the primary or first staff entry in the sidebar/nav and points to `/app/companies`; legacy “Dashboard” is demoted, redirected, or removed as decided.

### 4.2 Branch and deployment

- [ ] **Target branch:** The branch that contains the above changes (e.g. `main` or `production`) is the one connected to the **production** deployment in Vercel (or your host).
- [ ] **Merge:** Company-first changes are merged into that branch (no “preview only” leftover).
- [ ] **Build:** Production has run a **new build** after the merge (no stale deploy). Check “Production” deployment in Vercel dashboard and confirm commit/branch.
- [ ] **No conflicting redirects:** No other layer (e.g. Vercel redirects, proxy) forces `/login` or `/` to `/app/dashboard`.

### 4.3 Production behavior verification

- [ ] **Staff login:** Log in as staff on production → first page after login is `/app/companies` (or chosen entry), not `/app/dashboard`.
- [ ] **Staff visits `/login`:** While already logged in as staff, open production `/login` → redirect to `/app/companies`, not `/app/dashboard`.
- [ ] **Company list:** `/app/companies` loads without 404; Reino Editorial (or first company) is selectable.
- [ ] **Reino Editorial:** Navigating to `/app/companies/reino-editorial/projects` and a project detail works; back navigation and links are correct (e.g. StaffProjectHeader with contextual back).

### 4.4 Docs and operations

- [ ] **Canonical URLs:** Document and share with team: staff login URL (e.g. `https://hub.hebeling.io/login` or `https://www.hebeling.io/login`), post-login URL (`/app/companies`), and any brand-domain redirect (e.g. `https://www.hebeling.io/login` in `middleware.ts` line 56).
- [ ] **Rollback:** If rollback is needed, revert the two redirect changes (login page + middleware) and redeploy so staff land on `/app/dashboard` again; company routes can remain for direct URL access if desired.

---

## 5. Quick reference

| Question | Answer |
|----------|--------|
| What controls staff post-login destination? | `app/login/page.tsx` (`router.push`) and `middleware.ts` (redirect when staff visit `/login`). |
| What must the deployed branch include for company-first? | Both redirects pointing to `/app/companies`, and the `/app/companies` route (and company sub-routes) implemented. |
| Why does preview show new flow but production doesn’t? | Preview builds from the feature branch; production builds from default branch. Migration is likely not merged/deployed to production. |
| What to check before go-live? | Use the “Deployment readiness checklist” above (code, branch, build, and verification steps). |
