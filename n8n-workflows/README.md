# HEBELING OS — n8n Workflows

Este directorio contiene los workflows de n8n para el motor editorial de Reino Editorial.

---

## ¿Cuál workflow importar?

### ✅ `editorial-ai-process.json` — **USA ESTE PRIMERO**

> **WF-02: Editorial AI Pipeline**
> Webhook path: `POST /webhook/editorial-ai-process`

Este es el workflow que **HEBELING OS activa automáticamente** cuando el staff hace clic en _"Ejecutar Pipeline IA"_ en la ficha de un proyecto.

**No requiere credenciales adicionales en n8n** — las credenciales de Supabase se incluyen en el payload que envía la app.

**Configuración requerida en `.env.local` / Vercel:**
```
N8N_WEBHOOK_URL=https://<tu-instancia>.app.n8n.cloud/webhook/editorial-ai-process
```

**Flujo:**
```
Webhook (POST /editorial-ai-process)
  └─→ Validar Payload (project_id requerido)
        ├─→ [válido] Actualizar Status en Supabase (PATCH)
        │     └─→ Registrar Actividad en Supabase (POST)
        │           └─→ Responder 200 ✓
        └─→ [inválido] Responder Error 400
```

---

### ⚠️ `hebeling-os-pipeline-cleaned.json` — Uso específico

> **WF-01: Manuscript Intake** (ingesta de manuscritos por URL)
> Webhook path: `POST /webhook/manuscript-intake`

Este workflow está diseñado para recibir manuscritos **por URL de archivo** (no desde el botón de pipeline de la app). Es un flujo alternativo que **requiere credenciales de Supabase configuradas en n8n**.

---

## Cómo importar un workflow en n8n Cloud

1. Ve a **n8n Cloud** → tu instancia
2. Menú lateral → **Workflows** → **Importar desde archivo**
3. Sube el archivo JSON correspondiente
4. Haz clic en **Activar** (toggle arriba a la derecha)
5. Copia la URL del webhook que te muestra n8n y ponla en la variable `N8N_WEBHOOK_URL` de HEBELING OS

---

## Variables de entorno necesarias en HEBELING OS

| Variable | Descripción |
|---|---|
| `N8N_WEBHOOK_URL` | URL del webhook en n8n Cloud (ej: `https://maxhebeling.app.n8n.cloud/webhook/editorial-ai-process`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública de Supabase (se incluye automáticamente en el payload a n8n) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase (se incluye en el payload) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase (se incluye en el payload para que n8n pueda actualizar tablas) |
