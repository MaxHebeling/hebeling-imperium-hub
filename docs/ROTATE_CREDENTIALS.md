# Rotación de credenciales (tras exposición)

Si **SUPABASE_SERVICE_ROLE_KEY**, **NEXT_PUBLIC_SUPABASE_ANON_KEY** o **RESEND_API_KEY** fueron expuestas (captura, commit, etc.), hay que rotarlas.

---

## 1. Supabase (anon + service_role)

Las keys actuales son JWT (empiezan por `eyJ...`). Al rotar el JWT se generan **nuevas** anon y service_role a la vez.

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. **Project Settings** (icono engranaje) → **API** (o **JWT Keys** según la versión).
3. Busca **Rotate JWT secret** / **Rotate Keys** y ejecútalo.
4. Tras rotar, en la misma página se muestran las **nuevas** keys:
   - **anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
5. Sustituye en `.env.local` esos dos valores por las nuevas keys.
6. Reinicia el servidor (`npm run dev`).

**Nota:** Rotar invalida las keys antiguas de inmediato; cualquier app que siga usando las viejas dejará de conectar hasta que actualices las env.

---

## 2. Resend (API key)

1. Entra en [Resend → API Keys](https://resend.com/api-keys).
2. **Create API Key** → nombre (ej. `hebeling-imperium-hub`) → permisos (Sending access basta).
3. Copia la nueva key (solo se muestra una vez).
4. En `.env.local` pon `RESEND_API_KEY=<nueva_key>`.
5. Reinicia el servidor.
6. En Resend, **borra/revoca** la API key antigua que se expuso.

---

## 3. Después de rotar

- Actualiza **solo** `.env.local` (nunca subas este archivo; ya está en `.gitignore`).
- No pegues las nuevas keys en chat, capturas ni en el repo.
- Si desplegaste en Vercel/otro host, actualiza también las variables de entorno allí.
