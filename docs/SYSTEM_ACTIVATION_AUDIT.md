# SYSTEM ACTIVATION AUDIT — Hebeling Imperium Hub

**Fecha:** 7 de marzo de 2026  
**Stack:** Next.js 16.1.6, React 19, Supabase (Auth + Postgres), Turbopack

---

## 1. System Overview

El **Hebeling Imperium Hub** es una plataforma multi-tenant que opera en dos portales:

- **Hub (staff):** `hub.hebelingimperium.com` — panel para roles `superadmin`, `admin`, `sales`, `ops`.
- **Portal clientes:** `clients.*` — portal para usuarios con rol `client`.

**Routing por dominio:**
- Dominios de marca (ikingdom.org, editorialreino.com, imperiug.org, maxhebeling.com) redirigen `/apply` a formularios de aplicación; el resto va a hub login.
- `localhost` + `?app=clients` simula el portal clientes; por defecto es hub.

**Tecnologías clave:**
- **Auth:** Supabase Auth + tabla `profiles` (role, org_id, tenant_id).
- **DB:** PostgreSQL en Supabase con RLS por org/tenant.
- **APIs:** Next.js Route Handlers (`/api/leads`, `/api/finance/*`, `/api/vercel/*`).
- **Email:** Resend (notificaciones y confirmación de leads).

---

## 2. Module Inventory

### Core
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Landing / Command** | `/` | Página de entrada “Hebeling Imperium Command” con link a Staff Login. |
| **App shell** | `/app/*` (layout) | Layout con sidebar, topbar, auth y comprobación de rol staff. |
| **Dashboard** | `/app/dashboard` | Resumen con métricas (brands, tenants, projects, websites, tickets, deals, leads, documents), actividad reciente y deals. |

### Apps (catálogo de módulos)
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Apps** | `/app/apps`, `/app/apps/[id]` | Catálogo de “módulos” (CRM, Deals, Projects, etc.) con estado enabled/disabled. **Datos mock en cliente**, no persistencia en DB. |

### Finance
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Payments** | `/app/payments` | Redirige a `/app/finance-vault`. |
| **Finance Vault** | `/app/finance-vault` | Módulo financiero protegido por cookie; desbloqueo vía contraseña (`FINANCE_MODULE_KEY`) o passkey (placeholder). UI con planner; **no usa tablas Supabase**. |

### CRM
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **CRM** | `/app/crm`, `/app/crm/[id]` | Lista de tenants (clientes), contactos, leads; vista detalle por tenant con projects, websites, documents, tickets. Creación de tenants. |
| **Deals** | `/app/deals` | Pipeline de deals (pipelines, stages, deals), creación y movimiento entre etapas. |
| **Clients** | `/app/clients`, `/app/clients/[id]` | Alias/vista de clientes (tenants); listado y detalle. |

### Auth
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Staff login** | `/login` | Login con email/password; redirección a `/app/dashboard` si role es staff. |
| **Client login** | `/client-login` | Login para clientes; redirección a `/portal/overview`. |
| **Session** | Middleware + `lib/supabase/*` | Actualización de sesión Supabase, lectura de `profiles`, protección por host y ruta. |

### API
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Leads** | `POST/GET /api/leads` | Crea lead (tabla `leads`), deal asociado, activity_log, envía emails (Resend). |
| **Finance unlock** | `POST /api/finance/unlock` | Verifica `FINANCE_MODULE_KEY`, setea cookie de desbloqueo. |
| **Finance lock** | `POST /api/finance/lock` | Borra cookie de Finance Vault. |
| **Vercel import** | `POST /api/vercel/import-projects` | Importa proyectos Vercel a `vercel_projects` (requiere `VERCEL_ACCESS_TOKEN`, `VERCEL_TEAM_ID`, `SUPABASE_SERVICE_ROLE_KEY`). |
| **Vercel sync** | `POST /api/vercel/sync` | Sincroniza deployments con tabla `websites` (requiere `VERCEL_TOKEN`, `ORG_ID`). |

### Portals
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Apply (genérico)** | `/apply` | Formulario multi-step por marca; POST a `/api/leads`. |
| **Apply iKingdom diagnosis** | `/apply/ikingdom-diagnosis` | Formulario largo de diagnóstico; guardado en localStorage y envío a `/api/leads`. |
| **Portal overview** | `/portal/overview` | Dashboard cliente con proyectos y estado. **Datos mock (array estático)**, no Supabase. |

### System / Config
| Módulo | Ruta(s) | Descripción |
|--------|---------|-------------|
| **Organizations** | `/app/organizations`, `/app/organizations/[id]` | Listado y detalle de organizaciones (Supabase). |
| **Team** | `/app/team`, `/app/team/[id]` | Gestión de “miembros” con roles. **Datos mock en cliente**, no tabla `profiles` para listado. |
| **Settings** | `/app/settings`, `/app/settings/api-docs` | Perfil, organización, marcas; página de API docs. |
| **Projects** | `/app/projects`, `/app/projects/[id]` | Proyectos y tareas (tablas `projects`, `tasks`). |
| **Websites** | `/app/websites`, `/app/websites/[id]` | Sitios web con opción de enlace a Vercel; tabla `websites` y `vercel_projects`. |
| **Documents** | `/app/documents` | Listado y alta de documentos (tabla `documents`). |
| **Automations** | `/app/automations`, `/app/automations/[id]` | UI de automatizaciones (triggers/acciones). **Mock data**, sin backend. |
| **AI** | `/app/ai` | UI de “inteligencia” por módulo. **Mock data**, sin integración real. |
| **Analytics** | `/app/analytics` | **No existe página** — enlace en sidebar lleva a 404. |
| **Roles & Permissions** | `/app/roles` | **No existe página** — enlace en sidebar lleva a 404. |

---

## 3. Functional Status

| Estado | Significado |
|--------|-------------|
| **Completo** | Flujo end-to-end con Supabase/API y uso real. |
| **Parcial** | UI lista pero datos mock, o falta integración (ej. solo lectura). |
| **Incompleto** | Página no existe o solo redirección/placeholder. |

| Módulo | Estado | Notas |
|--------|--------|--------|
| Landing (/) | Completo | Funciona; warning de `quality={100}` en Image si no está en `images.qualities`. |
| Login (staff / client) | Completo | Supabase Auth + profiles; redirección por rol. |
| Dashboard | Completo | Métricas y actividad desde Supabase. |
| CRM | Completo | Tenants, contactos, leads desde DB; creación de tenants. |
| Deals | Completo | Pipelines, stages, deals; insert y actualización. |
| Clients | Completo | Lista y detalle desde tenants/projects/websites/documents/tickets. |
| Projects | Completo | CRUD proyectos y tareas. |
| Websites | Completo | CRUD + integración Vercel (import/sync). |
| Documents | Completo | Listado e inserción; borrado. |
| Organizations | Completo | Lectura organizaciones. |
| Settings | Completo | Perfil, org, marcas; api-docs. |
| Apply / Apply iKingdom | Completo | Formularios envían a `/api/leads` correctamente. |
| API Leads | Completo | Crea lead, deal, activity_log y envía emails. |
| Finance Vault | Parcial | Unlock/lock por API; UI planner sin persistencia en DB. |
| Finance unlock/lock API | Completo | Cookie + `FINANCE_MODULE_KEY`. |
| Portal overview | Parcial | Layout y nav ok; datos de proyectos son mock. |
| Team | Parcial | UI completa con datos mock; no usa `profiles` para listado. |
| Apps (catálogo) | Parcial | UI con mock; no hay persistencia de “módulos activos”. |
| Automations | Parcial | UI y detalle con mock; sin engine de automatizaciones. |
| AI | Parcial | UI con mock; sin LLM/API real. |
| Payments | Incompleto | Solo redirect a finance-vault. |
| Analytics | Incompleto | Ruta no existe → 404. |
| Roles & Permissions | Incompleto | Ruta no existe → 404. |
| Vercel import/sync API | Parcial | Dependen de env vars y org; pueden fallar si no están configurados. |

---

## 4. Dependencies

### 4.1 Supabase por módulo

| Módulo | Tablas / Uso |
|--------|----------------|
| Middleware / Auth | `auth.getUser()`, `profiles` (id, role, org_id, tenant_id, full_name, email). |
| App layout | `profiles`, `organizations`. |
| Dashboard | `brands`, `tenants`, `projects`, `websites`, `tickets`, `deals`, `leads`, `documents`, `activity_logs`. |
| CRM | `profiles`, `tenants`, `contacts`, `leads`, `projects`, `websites`, `documents`, `tickets`. |
| Deals | `profiles`, `pipelines`, `stages`, `deals`, `tenants`, `brands`. |
| Projects | `profiles`, `projects`, `tasks`, `tenants`, `brands`. |
| Websites | `profiles`, `brands`, `tenants`, `websites`, `vercel_projects`. |
| Documents | `profiles`, `documents`, `tenants`, `brands`. |
| Organizations | `organizations`. |
| Settings | `profiles`, `brands` (y org vía profile). |
| API Leads (helpers) | `leads`, `lead_code_counters`, `stages`, `deals`, `activity_logs` (service role). |
| Vercel import | `profiles`, `vercel_projects` (service role). |
| Vercel sync | `websites` (service role). |
| Portal overview | Ninguna (mock). |
| Finance Vault | Ninguna. |

### 4.2 Tablas Supabase (schema + migraciones)

- **001_schema.sql:** organizations, brands, profiles, tenants, companies, contacts, pipelines, stages, deals, projects, tasks, documents, websites, tickets, activity_logs, RLS, get_my_role/get_my_org_id/get_my_tenant_id.
- **002:** seed org + brands (hebeling-imperium-group, ikingdom, editorial-reino, imperiug, max-hebeling).
- **003:** contact_id, source en deals y contacts.
- **004:** vercel_project_id, preview_url, framework, repo_name, deployment_status, last_synced_at en websites.
- **005:** vercel_projects.
- **006:** leads, lead_code_counters; deals.lead_id, lead_code, pipeline, stage, status, owner.

Todas las tablas listadas deben existir y tener RLS/policies aplicadas para que los módulos que las usan funcionen.

### 4.3 Variables de entorno

| Variable | Uso | Obligatoria |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y middleware Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y middleware Supabase | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | API leads, Vercel import/sync, helpers admin | Sí (para leads y Vercel) |
| `FINANCE_MODULE_KEY` | Desbloqueo Finance Vault | Opcional (sin ella no se puede desbloquear) |
| `RESEND_API_KEY` | Emails de leads | Sí (para notificaciones/confirmación) |
| `RESEND_FROM_EMAIL` | Remitente emails | Opcional (hay fallback) |
| `INTERNAL_NOTIFICATION_EMAIL` | Destino notificación interna leads | Opcional |
| `NEXT_PUBLIC_APP_URL` | Links en emails (CRM) | Opcional (hay fallback) |
| `VERCEL_ACCESS_TOKEN` | Import proyectos Vercel | Para import |
| `VERCEL_TEAM_ID` | Import proyectos Vercel | Para import |
| `VERCEL_TOKEN` | Sync deployments | Para sync |
| `ORG_ID` | Sync Vercel (org por defecto) | Opcional (hay default en código) |

Si `NEXT_PUBLIC_SUPABASE_*` no están disponibles en runtime (p. ej. middleware), el error observado es: *"Your project's URL and Key are required to create a Supabase client!"* (middleware.ts).

---

## 5. Route Structure & Protected Routes

### Rutas públicas (sin auth)

- `/` — Landing.
- `/login` — Formulario login staff (redirige a dashboard si ya staff).
- `/client-login` — Formulario login cliente (redirige a portal si ya client).
- `/apply`, `/apply/ikingdom-diagnosis` — Formularios de aplicación (por dominio o acceso directo).

### Rutas protegidas Hub (staff: superadmin, admin, sales, ops)

- Todas bajo `/app/*`: dashboard, crm, deals, clients, projects, websites, documents, finance-vault, payments, automations, ai, apps, organizations, team, settings, settings/api-docs.
- Si no hay usuario o no es staff → redirect a `/login`.

### Rutas protegidas Portal (rol client)

- `/portal/*` (ej. `/portal/overview`).
- Si no hay usuario o no es client → redirect a `/client-login`.
- Si es client y va a `/client-login` → redirect a `/portal/overview`.

### APIs

- `/api/leads` — Pública (POST desde formularios).
- `/api/finance/unlock`, `/api/finance/lock` — Sin verificación de auth en el código (protegidas por secreto/cookie).
- `/api/vercel/import-projects`, `/api/vercel/sync` — Deben ser llamadas por backend o con token; no hay auth en la ruta.

### Rutas en sidebar sin página

- `/app/analytics` → 404.
- `/app/roles` → 404.

---

## 6. Activation Checklist

Usar este checklist para validar el OS de punta a punta.

1. **Entorno**
   - [ ] Crear `.env.local` (archivo, no directorio) con al menos:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
   - [ ] Opcional: `FINANCE_MODULE_KEY`, `RESEND_FROM_EMAIL`, `INTERNAL_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_APP_URL`.
   - [ ] Para Vercel: `VERCEL_ACCESS_TOKEN`, `VERCEL_TEAM_ID` y/o `VERCEL_TOKEN`, `ORG_ID` si aplica.

2. **Supabase**
   - [ ] Proyecto creado; URL y anon key coinciden con `.env.local`.
   - [ ] Ejecutar migraciones en orden: 001 → 002 → 003 → 004 → 005 → 006.
   - [ ] Confirmar que existen: organizations, brands, profiles, tenants, companies, contacts, pipelines, stages, deals, projects, tasks, documents, websites, tickets, activity_logs, leads, lead_code_counters, vercel_projects.
   - [ ] Seed 002 ejecutado (org + 4 brands).
   - [ ] Al menos un usuario en Auth con perfil en `profiles` (org_id, role staff o client).

3. **Auth y middleware**
   - [ ] `npm run dev` con env cargada; ninguna petición a `/` falla por “URL and Key are required”.
   - [ ] Login en `/login` con usuario staff → redirección a `/app/dashboard`.
   - [ ] Login en `/client-login` con usuario client → redirección a `/portal/overview`.
   - [ ] Acceso a `/app/dashboard` sin sesión → redirección a `/login`.

4. **Dashboard**
   - [ ] `/app/dashboard` carga sin error.
   - [ ] Métricas (brands, tenants, projects, etc.) coherentes con datos en Supabase (o 0 si vacío).
   - [ ] Actividad reciente y deals recientes se muestran.

5. **CRM y Deals**
   - [ ] `/app/crm` lista tenants; se puede crear tenant.
   - [ ] `/app/crm/[id]` muestra detalle con projects, websites, documents, tickets.
   - [ ] `/app/deals` muestra pipelines/stages/deals; se puede crear deal y mover entre etapas.

6. **Projects, Websites, Documents**
   - [ ] `/app/projects` y `/app/projects/[id]`: listar, crear, editar proyectos y tareas.
   - [ ] `/app/websites`: listar y crear websites; si hay Vercel config, probar import/sync.
   - [ ] `/app/documents`: listar y crear documentos.

7. **Leads y Apply**
   - [ ] Envío desde `/apply` o `/apply/ikingdom-diagnosis` → POST a `/api/leads`.
   - [ ] Respuesta 200 con `leadCode`; registro en `leads` y deal creado en `deals`.
   - [ ] Emails (notificación interna y confirmación) enviados si `RESEND_API_KEY` está configurado.

8. **Finance**
   - [ ] `/app/finance-vault` muestra estado bloqueado si no hay cookie.
   - [ ] POST a `/api/finance/unlock` con `FINANCE_MODULE_KEY` correcto → cookie set → vault desbloqueado.
   - [ ] `/api/finance/lock` limpia cookie.

9. **Portal cliente**
   - [ ] Usuario client en `/portal/overview` ve la página (aunque sea con datos mock).
   - [ ] Layout y navegación del portal correctos.

10. **Organizations y Settings**
    - [ ] `/app/organizations` lista organizaciones.
    - [ ] `/app/settings` muestra perfil y organización; `/app/settings/api-docs` carga.

11. **Rutas rotas**
    - [ ] Decidir: crear páginas placeholder para `/app/analytics` y `/app/roles` o quitar enlaces del sidebar.

12. **Build**
    - [ ] `npm run build` completa sin errores críticos (Typescript puede estar en ignoreBuildErrors).
    - [ ] Revisar warning de `quality={100}` en Image si se usa; añadir `images.qualities` en `next.config.mjs` si se desea 100.

---

## 7. Risks / Missing Parts

- **Env en middleware:** Si `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están disponibles en el proceso que ejecuta el middleware (p. ej. `.env.local` es un directorio o no se carga), toda la app falla con “URL and Key are required”. Asegurar que son leídas en el entorno de ejecución (dev/build).

- **Org ID inconsistente:** `lib/leads/helpers.ts` usa `ORG_ID = "4059832a-ff39-43e6-984f-d9e866dfb8a4"`; `api/vercel/sync/route.ts` usa `process.env.ORG_ID || "c9d2af49-8ca2-45b6-a9b3-f6e33b77c3a7"`. Unificar a una sola fuente (env o constante compartida) para evitar leads/deals en una org y sync en otra.

- **Rutas 404 en navegación:** Sidebar enlaza a `/app/analytics` y `/app/roles`; no existen páginas. Riesgo de confusión; crear páginas o eliminar enlaces.

- **Portal overview con datos mock:** `/portal/overview` no consulta `projects` (ni otras tablas) del tenant del cliente. Para producción hay que sustituir el array estático por datos desde Supabase filtrados por `tenant_id`/profile.

- **Team sin backend:** Team usa datos mock; no lista `profiles` de la org. Para “team real” hace falta consultar `profiles` (y quizá invitaciones) y alinear roles con el esquema.

- **Finance Vault sin persistencia:** El módulo finance no guarda datos en Supabase; solo cookie de desbloqueo. Si se requiere guardar planificación o transacciones, falta modelo de datos y APIs.

- **Automations / AI:** Solo UI y datos mock; no hay engine de automatizaciones ni integración con LLM/API externa.

- **RLS en lead_code_counters:** Script 006 define policy “staff read counters” con `USING (true)`; en producción revisar si debe restringirse a service role o por org.

- **Vercel APIs:** Import/sync dependen de tokens y org; sin ellos las rutas pueden fallar. Documentar y, si se exponen, proteger (auth o API key).

- **Deprecación middleware:** Next.js 16 avisa de que el convenio “middleware” está deprecado en favor de “proxy”. Planificar migración cuando la doc esté estable.

- **Imagen de calidad 100:** `quality={100}` en la landing puede generar warning si `images.qualities` no incluye 100 en `next.config.mjs` (actualmente `images.unoptimized: true`).

---

*Fin del System Activation Audit.*
