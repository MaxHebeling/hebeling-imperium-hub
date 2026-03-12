# Staff Dashboard — Fase 3

Panel interno del equipo editorial (Reino Editorial AI Engine). Base inicial sin romper el Author Portal.

## Arquitectura

- **Route group:** `app/(staff)/` — no afecta la URL; rutas reales son `/staff/*`.
- **Rutas:**
  - `/staff/login` — login público (Supabase Auth).
  - `/staff/dashboard` — panel principal (protegido).
  - `/staff/books` — listado de proyectos (protegido).
  - `/staff/books/[projectId]` — detalle de proyecto (protegido).

- **Layout:**
  - `(staff)/layout.tsx`: metadata y wrapper mínimo.
  - `staff/layout.tsx`: obtiene sesión en servidor, pasa `userEmail` a `StaffShell`.
  - `StaffShell` (client): en `/staff/login` solo pinta `children`; en el resto pinta sidebar + header + main + bottom nav.

- **Navegación:**
  - **Desktop:** sidebar fija (Panel, Libros, Cerrar sesión).
  - **Mobile:** bottom nav (Panel, Libros); mismo estilo que Author Portal (mobile-first).

- **Seguridad:** middleware redirige a `/staff/login` si no hay sesión en rutas protegidas; si hay sesión en `/staff/login` redirige a `/staff/dashboard`. Por ahora no se exige rol staff (TODO: restringir a `isStaff` cuando exista modelo editorial staff).

- **Componentes:** `components/editorial/staff/` — `sidebar.tsx`, `staff-header.tsx`, `mobile-nav.tsx`, `staff-shell.tsx`, y para el detalle de libro: `staff-project-header.tsx`, `staff-project-tabs.tsx`, `staff-project-summary-tab.tsx`, `staff-pipeline-tab.tsx`, `staff-files-tab.tsx`, `staff-comments-tab.tsx`, `staff-assignments-tab.tsx`. Reutilizan Tailwind + shadcn y diseño sobrio.

## Flujo de datos (integración real)

- **Origen:** Supabase vía `getAdminClient()` (service role) en `lib/editorial/db/queries.ts`. El Staff Dashboard no usa API routes: las páginas son Server Components que llaman directamente a los servicios.

- **Servicios staff:** `lib/editorial/staff/services.ts`
  - `listStaffProjects()` → listado para `/staff/books` y para el dashboard. Usa `listEditorialProjects(ORG_ID)` + `getProfilesByIds(created_by)` y calcula `progress_percent` con `calculateProgressPercent(current_stage)`.
  - `getStaffDashboard()` → usa `listStaffProjects()` y deriva conteos (activos, en revisión, completados este mes) y `recentProjects` ordenados por última actividad.
  - `getStaffProject(projectId)` → detalle para `/staff/books/[projectId]`. Usa `getEditorialProject`, `getProjectStages`, `getProjectFiles`, `getProjectComments`, `getProjectActivity`, `getProjectMembers`, `getProfilesByIds`; progress de nuevo con `calculateProgressPercent`.

- **Progreso:** Una sola fuente de verdad: `lib/editorial/pipeline/progress.ts` → `calculateProgressPercent(stage)` con `EDITORIAL_STAGE_PROGRESS` de `lib/editorial/pipeline/constants.ts`. Se usa en los servicios staff al exponer datos; el valor en BD puede quedar desfasado hasta el próximo avance de etapa.

## Dónde se reutiliza lógica existente

| Uso | Dónde está |
|-----|-------------|
| Listado de proyectos por org | `listEditorialProjects(orgId)` en `lib/editorial/db/queries.ts` |
| Proyecto por id | `getEditorialProject(projectId)` en `lib/editorial/db/queries.ts` |
| Etapas, archivos, comentarios | `getProjectStages`, `getProjectFiles`, `getProjectComments` en `lib/editorial/db/queries.ts` |
| Progreso % por etapa | `calculateProgressPercent(stage)` en `lib/editorial/pipeline/progress.ts` |
| Etiquetas de etapas | `EDITORIAL_STAGE_LABELS` en `lib/editorial/pipeline/constants.ts` |
| Org id | `ORG_ID` en `lib/leads/helpers.ts` |
| Cliente Supabase (admin) | `getAdminClient()` en `lib/leads/helpers.ts` |

**Nuevo en esta fase:** `getProfilesByIds`, `getProjectActivity`, `getProjectMembers` en `lib/editorial/db/queries.ts`; tipos `StaffProjectListItem`, `StaffDashboardData`, `StaffProjectDetail`, `EditorialActivityLogEntry`, `StaffProjectMember` en `lib/editorial/types/editorial.ts`; y `lib/editorial/staff/services.ts` (listStaffProjects, getStaffDashboard, getStaffProject).

## Detalle de libro (`/staff/books/[projectId]`) — UX

- **Header:** Título, autor, etapa actual, estado, progreso (%) y responsable. Botón «Volver a libros» siempre visible. Información crítica sin scroll.
- **Tabs:** Resumen, Pipeline, Archivos, Comentarios, Asignaciones. En móvil la lista de tabs hace scroll horizontal para no colapsar; en desktop las tabs caben en una fila. Primera pestaña por defecto: Resumen.
- **Pipeline:** Las 6 etapas editoriales en orden; por cada una: icono de estado (completado / en proceso / pendiente), badge de estado, fechas (inicio, fin, aprobación) y «Aprobado por» cuando aplica. La etapa actual se marca con badge «Actual».
- **Archivos:** Agrupados por etapa; cada ítem muestra tipo, versión, visibilidad (Solo equipo / Visible autor / Público) y tamaño. Botón «Subir archivo» preparado (acción por implementar).
- **Comentarios:** Dos bloques — «Internos» (solo equipo) y «Visibles para el autor», para operar con claridad sin mezclar alcances.
- **Asignaciones:** Cinco roles fijos — Autor, Editor, Revisor, Corrector, Diseñador. Los que existen en `editorial_project_members` (author, editor, reviewer) muestran la persona; Corrector y Diseñador muestran «Por asignar» hasta que existan en datos.
- **Estilo:** Sin recargar; cards con bordes suaves, badges discretos, tipografía clara. Mobile-first: touch targets adecuados, contenido apilado y tabs scrolleables.

## MVP Fase 3A — Resumen final

### Archivos clave

| Área | Archivos |
|------|----------|
| **Rutas** | `app/(staff)/layout.tsx`, `app/(staff)/staff/layout.tsx`, `app/(staff)/staff/login/page.tsx`, `app/(staff)/staff/dashboard/page.tsx`, `app/(staff)/staff/books/page.tsx`, `app/(staff)/staff/books/[projectId]/page.tsx` |
| **Loading** | `app/(staff)/staff/loading.tsx`, `app/(staff)/staff/books/[projectId]/loading.tsx` |
| **Shell / nav** | `components/editorial/staff/staff-shell.tsx`, `components/editorial/staff/sidebar.tsx`, `components/editorial/staff/staff-header.tsx`, `components/editorial/staff/mobile-nav.tsx` |
| **Detalle libro** | `components/editorial/staff/staff-project-header.tsx`, `components/editorial/staff/staff-project-tabs.tsx`, `staff-project-summary-tab.tsx`, `staff-pipeline-tab.tsx`, `staff-files-tab.tsx`, `staff-comments-tab.tsx`, `staff-assignments-tab.tsx` |
| **Empty state** | `components/editorial/staff/staff-empty-state.tsx` |
| **Servicios / datos** | `lib/editorial/staff/services.ts`, `lib/editorial/db/queries.ts` (getProfilesByIds, getProjectActivity, getProjectMembers), `lib/editorial/types/editorial.ts` (StageWithApprover, StaffProjectDetail, etc.) |
| **Middleware** | `middleware.ts` (reglas para `/staff` y `/staff/login`) |

- **Rutas funcionales:** `/staff/login`, `/staff/dashboard`, `/staff/books`, `/staff/books/[projectId]`.
- **Consistencia visual:** Títulos `text-xl md:text-2xl`, header sticky con título por sección (Panel / Libros / Detalle), contenido con `max-w-4xl mx-auto`, empty states con `StaffEmptyState`.
- **Mobile-first:** Bottom nav fijo, tabs con scroll horizontal, `pb-20` en main para no tapar navegación, touch targets y focus-visible en enlaces.
- **Loading:** `staff/loading.tsx` (dashboard y listado), `staff/books/[projectId]/loading.tsx` (detalle) con skeletons.
- **Author Portal:** No modificado; rutas `/author/*` y layout `(dashboard)` intactos.

## Pendientes Fase 3B

1. **Auth:** Restringir `/staff/*` a rol staff en middleware (`isStaff` o tabla editorial staff).
2. **Subida de archivos:** Conectar botón «Subir archivo» en pestaña Archivos con API/upload (usar `projectId` en `StaffFilesTab`).
3. **Acciones de pipeline:** Botones/acciones por etapa (solicitar revisión, aprobar, etc.) cuando exista lógica de negocio.
4. **Comentarios:** Formulario para añadir comentarios (internos vs visibles al autor).
5. **Asignaciones:** Alta/baja de miembros (corrector, diseñador) cuando existan en modelo.
6. **PWA:** Manifest y service worker si se requiere instalable.

## TODOs pendientes (genérico)

1. **Auth / roles**
   - [ ] Restringir `/staff/*` (excepto login) a usuarios con rol staff en middleware (p. ej. `isStaff` o tabla `editorial_staff`).

2. **PWA**
   - [ ] Añadir manifest y service worker si se desea instalable.

3. **Sin tocar**
   - Author Portal (`/author/*`) y rutas existentes del hub (`/app/*`, `/portal/*`) no se modifican.
