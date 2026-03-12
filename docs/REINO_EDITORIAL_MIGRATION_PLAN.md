# Reino Editorial — Company-First Migration Plan

## Context

Reino Editorial routes are being migrated from legacy `/staff/*` surfaces to
company-first routes under `/app/companies/reino-editorial/*`.

### Already migrated (Phase 1)

| Surface | Legacy route | Company-first route | Status |
|---------|-------------|---------------------|--------|
| Projects list | `/staff/books` | `/app/companies/reino-editorial/projects` | ✅ Live |
| Project detail | `/app/projects/[id]` | `/app/companies/reino-editorial/projects/[id]` | ✅ Live |
| AI Review | `/staff/ai` | `/app/companies/reino-editorial/ai` | ✅ Stub live |
| Operations | `/staff/operations` | `/app/companies/reino-editorial/operations` | ✅ Stub live |

Legacy routes retain visible banners and TODO markers. No redirects applied yet.

---

## Phase 2 — Next surfaces to migrate

### Priority order and rationale

#### 1. 🥇 Pipeline (migrate next)

**Why first:**
- The editorial pipeline (Ingesta → Estructura → Estilo → Ortotipografía →
  Maquetación → Revisión Final) is the **operational core** of Reino Editorial.
  Every project's state is expressed through this pipeline.
- It is already modelled in the database (`editorial_stages`, `editorial_projects`)
  and partially visualised in the project detail page.
- Making the Pipeline a first-class company-first surface at
  `/app/companies/reino-editorial/pipeline` creates a single authoritative view
  of where all projects stand across all stages — high daily value for the
  editorial team.
- **Migration safety:** The pipeline logic lives in shared helper functions that
  both the Author Portal and Staff Dashboard already consume. No risky schema
  changes are required; the new route is a read surface on existing data.

**Target route:** `/app/companies/reino-editorial/pipeline`

---

#### 2. 🥈 Reports (migrate second)

**Why second:**
- Reports aggregate pipeline data (throughput per stage, average cycle time,
  author turnaround) and are naturally downstream of a fully migrated Pipeline
  surface.
- Migrating Reports before Staff avoids building reporting views on stale legacy
  staff data. Once Pipeline is live and company-scoped, Reports can be reliably
  scoped to Reino Editorial with accurate, deduplicated metrics.
- **Migration safety:** Reports are currently read-only analytical surfaces.
  They carry zero write risk — a failed render degrades gracefully. This makes
  them low-risk to migrate even while the Staff surface is still in transition.

**Target route:** `/app/companies/reino-editorial/reports`

---

#### 3. 🥉 Staff (migrate last)

**Why last:**
- The Staff surface involves write operations: assigning team members to stages,
  approving transitions, uploading files, and leaving comments. These require
  robust Supabase RLS policies scoped to the company context before the
  company-first route can safely replace the legacy `/staff/*` surfaces.
- Migrating Pipeline and Reports first provides Staff with a reliable foundation:
  pipeline state is authoritative and report data is validated, so Staff
  assignees can act on trustworthy information from day one on the new surface.
- **Migration safety:** Higher risk due to write operations. Requires thorough
  RLS policy review, role-based access validation, and QA on the author/staff
  permission boundary before the legacy redirect can be applied.

**Target route:** `/app/companies/reino-editorial/staff`

---

## Migration checklist per surface

Each surface must clear these gates before the legacy redirect is applied:

- [ ] Company-first page is live and accessible via sidebar navigation
- [ ] Data is correctly scoped to Reino Editorial (brand filter verified)
- [ ] Supabase RLS policies reviewed and tested for the company context
- [ ] Author Portal routes unaffected (smoke-tested)
- [ ] Legacy page banner updated to note redirect is imminent
- [ ] Redirect added (HTTP 301 from legacy route to company-first route)
- [ ] Legacy page removed after redirect is confirmed stable (≥ 2 weeks)

---

## Notes

- Do not apply redirects until each surface's checklist is complete.
- Legacy routes (`/staff/books`, `/staff/ai`, `/staff/operations`) retain their
  TODO banners until their redirect gates are cleared.
- All company-first pages must reuse the shared Editorial Core Engine logic —
  no duplicate pipeline helpers.
