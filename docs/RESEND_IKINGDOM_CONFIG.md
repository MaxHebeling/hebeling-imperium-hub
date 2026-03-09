# Resend – Configuración iKingdom Intake

## Configuración actual (producción)

Dominio `ikingdom.org` verificado en Resend. En `.env.local`:

- **RESEND_IKINGDOM_TO** = `executive@ikingdom.org`
- **RESEND_FROM** = `"iKingdom <noreply@ikingdom.org>"`

Los correos de notificación del formulario se envían a `executive@ikingdom.org` desde `noreply@ikingdom.org`.

---

## Referencia: modo prueba (solo si se revierte)

Para pruebas locales limitadas al email de la cuenta Resend:

- **RESEND_IKINGDOM_TO** = `maxhebeling@gmail.com`
- **RESEND_FROM** = `"Hebeling <onboarding@resend.dev>"`
