# iKingdom Intake — Flujo completo (end-to-end)

Ruta pública: **`/external/ikingdom-intake`**

## Estructura validada

- **20 campos** en el formulario (Contact, Location, Project, Materials, Current Presence, Budget & Timeline, Additional).
- **Requeridos:** full_name, email, company, page_type, business_description, goal. **Opcionales:** el resto.
- **6 columnas nuevas en Supabase:** country, state_region, city, postal_code, address_line_1, address_line_2.
- **Teléfono:** en el frontend se usa estado interno `phoneValue`; en el **payload al backend se envía como `whatsapp`**.
- **Dependencias:** react-phone-number-input, country-state-city.

## 1. Frontend

- **Archivo:** `app/external/ikingdom-intake/page.tsx`
- Formulario con secciones: Contact, Location, Project, Available Materials, Current Presence, Budget & Timeline, Additional Details.
- Validación: full_name, email, company, page_type, business_description, goal requeridos; resto opcional; email y website_url validados.
- Teléfono: selector internacional (react-phone-number-input); país/estado con country-state-city. El valor se manda en el payload como **whatsapp**.
- Al enviar: se construye `project_description` (texto con todas las secciones) y se envía payload a la API.

## 2. Submit (payload → API)

- **POST** `/api/external/ikingdom-intake`
- **Body (JSON):** full_name, company, email, **whatsapp** (valor del teléfono), country, state_region, city, postal_code, address_line_1, address_line_2, project_description.
- La API responde 200 con `{ ok: true, data }` o 4xx/5xx con `{ error: "..." }`.

## 3. Backend (API)

- **Archivo:** `app/api/external/ikingdom-intake/route.ts`
- Valida: full_name, email, project_description obligatorios.
- Normaliza todos los campos (trim, empty string → null para opcionales).
- Inserta una fila en Supabase en la tabla `external_forms_ikingdom` con todas las columnas (incluidas las de ubicación).
- Si la inserción falla (p. ej. columnas inexistentes), responde 500.

## 4. Supabase

- **Tabla:** `external_forms_ikingdom`
- **Columnas necesarias:** id, full_name, company, email, whatsapp, project_description (ya existentes) + **country, state_region, city, postal_code, address_line_1, address_line_2** (añadidas con el script).
- **Script:** `scripts/008_add_location_to_external_forms_ikingdom.sql` — **hay que ejecutarlo en el SQL Editor de Supabase** para que el insert y el flujo completo funcionen.

## 5. Email (Resend)

- Tras insertar en Supabase, si están configurados `RESEND_API_KEY` y `RESEND_IKINGDOM_TO`, se envía un correo.
- El email incluye: nombre, email, empresa, teléfono, país, state/region, city, postal code, address line 1 y 2, y la descripción del proyecto (intake completo con saltos de línea).
- Si Resend falla, no se devuelve error al cliente; el registro ya está guardado en Supabase.

## 6. Confirmación (frontend)

- Tras `res.ok` el frontend pone `setSuccess(true)` y muestra la pantalla de confirmación: logo, icono de check, “Thank you for your request”, “Your project information has been successfully submitted.”, “Our team will review your request and contact you shortly to schedule a discovery conversation.”, “ikingdom.org”.

## Checklist para que quede completo

1. **Frontend:** formulario en `/external/ikingdom-intake` con todos los campos y validación.
2. **Submit:** mismo formulario envía el payload correcto a la API.
3. **Supabase:** script `008_add_location_to_external_forms_ikingdom.sql` ejecutado en el proyecto de Supabase.
4. **Email:** variables de entorno Resend configuradas; el email muestra todos los datos.
5. **Confirmación:** tras enviar, se muestra la pantalla de éxito sin errores.
