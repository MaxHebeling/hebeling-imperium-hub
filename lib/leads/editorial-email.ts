import { Resend } from "resend";
import { Lead } from "./helpers";

const INTERNAL_EMAIL =
  process.env.INTERNAL_NOTIFICATION_EMAIL || "max@hebeling.io";
const EDITORIAL_EMAIL =
  process.env.EDITORIAL_NOTIFICATION_EMAIL || "max@hebeling.io";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY not configured - editorial email notifications disabled"
    );
    return null;
  }
  return new Resend(apiKey);
}

/* ────────────────────────────────────────────────────────────
   1. Internal notification — sent to staff when a new
      editorial lead arrives.
   ──────────────────────────────────────────────────────────── */

function buildInternalNotificationHtml(lead: Lead): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0dad0;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1B40C0 0%,#132e90 100%);padding:32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Nuevo Lead Editorial</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Reino Editorial — Campaña de captación</p>
</td></tr>

<!-- Lead Code -->
<tr><td style="padding:24px 32px 0;">
  <table cellpadding="0" cellspacing="0" style="background:#EEF2FC;border:2px solid #1B40C0;border-radius:8px;padding:16px 24px;width:100%;">
  <tr><td>
    <span style="color:#1B40C0;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Código de Lead</span>
    <p style="margin:4px 0 0;color:#1B40C0;font-size:22px;font-weight:700;font-family:'SF Mono',Monaco,monospace;">${lead.lead_code}</p>
  </td></tr>
  </table>
</td></tr>

<!-- Contact Info -->
<tr><td style="padding:24px 32px;">
  <h2 style="margin:0 0 16px;color:#1a1814;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Información de Contacto</h2>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">Nombre</span>
      <p style="margin:4px 0 0;color:#1a1814;font-size:15px;font-weight:500;">${lead.full_name}</p>
    </td></tr>
    ${lead.email ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">Email</span>
      <p style="margin:4px 0 0;font-size:15px;"><a href="mailto:${lead.email}" style="color:#1B40C0;text-decoration:none;">${lead.email}</a></p>
    </td></tr>` : ""}
    ${lead.whatsapp ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">WhatsApp</span>
      <p style="margin:4px 0 0;font-size:15px;"><a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}" style="color:#22c55e;text-decoration:none;">${lead.whatsapp}</a></p>
    </td></tr>` : ""}
    ${lead.country ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">País</span>
      <p style="margin:4px 0 0;color:#1a1814;font-size:15px;font-weight:500;">${lead.country}</p>
    </td></tr>` : ""}
    ${lead.main_service ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">Tipo de manuscrito</span>
      <p style="margin:4px 0 0;color:#1a1814;font-size:15px;font-weight:500;">${lead.main_service}</p>
    </td></tr>` : ""}
    ${lead.form_type ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e0dad0;">
      <span style="color:#6b6458;font-size:13px;">Origen</span>
      <p style="margin:4px 0 0;color:#1a1814;font-size:15px;font-weight:500;">${lead.form_type} — ${lead.origin_page || "web"}</p>
    </td></tr>` : ""}
  </table>
</td></tr>

${lead.project_description ? `
<tr><td style="padding:0 32px 24px;">
  <h2 style="margin:0 0 12px;color:#1a1814;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Descripción del Proyecto</h2>
  <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.6;background:#f7f5f0;padding:16px;border-radius:8px;">${lead.project_description}</p>
</td></tr>
` : ""}

<!-- CTA -->
<tr><td style="padding:0 32px 32px;" align="center">
  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hub.hebeling.io"}/app/crm" style="display:inline-block;background:#1B40C0;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Ver en CRM</a>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f7f5f0;padding:20px 32px;text-align:center;">
  <p style="margin:0;color:#6b6458;font-size:12px;">Email generado automáticamente por Reino Editorial</p>
  <p style="margin:6px 0 0;color:#a09588;font-size:11px;">Hebeling Imperium Group</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`.trim();
}

export async function sendEditorialLeadNotification(
  lead: Lead
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const recipients = [INTERNAL_EMAIL];
  if (EDITORIAL_EMAIL !== INTERNAL_EMAIL) {
    recipients.push(EDITORIAL_EMAIL);
  }

  const subject = `Nuevo lead editorial — ${lead.full_name} (${lead.lead_code})`;

  try {
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Reino Editorial <noreply@hebeling.io>",
      to: recipients,
      subject,
      html: buildInternalNotificationHtml(lead),
    });
    if (error) {
      console.error("[editorial] Resend notification error:", error);
      return false;
    }
    console.log(
      `[editorial] Lead notification sent to ${recipients.join(", ")} for ${lead.lead_code}`
    );
    return true;
  } catch (err) {
    console.error("[editorial] Failed to send notification:", err);
    return false;
  }
}

/* ────────────────────────────────────────────────────────────
   2. Confirmation email — sent to the lead immediately.
   ──────────────────────────────────────────────────────────── */

function buildConfirmationHtml(lead: Lead): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0dad0;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1B40C0 0%,#132e90 100%);padding:40px 32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">¡Hemos recibido tu solicitud!</h1>
  <p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:16px;">Gracias por confiar en Reino Editorial</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;color:#1a1814;font-size:16px;line-height:1.6;">
    Hola <strong>${lead.full_name}</strong>,
  </p>
  <p style="margin:0 0 16px;color:#6b6458;font-size:15px;line-height:1.7;">
    Hemos recibido tu solicitud de evaluación editorial. Nuestro equipo revisará tu información
    y te contactaremos en un plazo máximo de <strong>48 horas</strong> con una evaluación
    personalizada y sin compromiso.
  </p>

  <div style="background:#EEF2FC;border-radius:8px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 8px;color:#1B40C0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tu código de referencia</p>
    <p style="margin:0;color:#1B40C0;font-size:24px;font-weight:700;font-family:'SF Mono',Monaco,monospace;">${lead.lead_code}</p>
  </div>

  <p style="margin:0 0 16px;color:#6b6458;font-size:15px;line-height:1.7;">
    Mientras tanto, puedes preparar tu manuscrito en formato Word (.docx) o PDF para
    agilizar el proceso de evaluación.
  </p>

  <h3 style="margin:24px 0 12px;color:#1a1814;font-size:16px;font-weight:600;">¿Qué sigue?</h3>
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:8px 0;vertical-align:top;width:30px;color:#1B40C0;font-weight:700;">1.</td>
    <td style="padding:8px 0;color:#6b6458;font-size:14px;">Revisamos tu solicitud y datos del proyecto</td></tr>
    <tr><td style="padding:8px 0;vertical-align:top;width:30px;color:#1B40C0;font-weight:700;">2.</td>
    <td style="padding:8px 0;color:#6b6458;font-size:14px;">Te enviamos una evaluación editorial personalizada</td></tr>
    <tr><td style="padding:8px 0;vertical-align:top;width:30px;color:#1B40C0;font-weight:700;">3.</td>
    <td style="padding:8px 0;color:#6b6458;font-size:14px;">Diseñamos una propuesta ajustada a tu manuscrito</td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 32px;" align="center">
  <a href="https://editorialreino.com" style="display:inline-block;background:#1B40C0;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Visitar Reino Editorial</a>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f7f5f0;padding:20px 32px;text-align:center;">
  <p style="margin:0;color:#6b6458;font-size:12px;">Reino Editorial — Acompañamiento editorial profesional</p>
  <p style="margin:6px 0 0;color:#a09588;font-size:11px;">Este email fue enviado a ${lead.email} porque solicitaste una evaluación editorial.</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`.trim();
}

export async function sendEditorialLeadConfirmation(
  lead: Lead
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend || !lead.email) return false;

  const subject =
    "¡Solicitud recibida! — Reino Editorial";

  try {
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Reino Editorial <noreply@hebeling.io>",
      to: lead.email,
      subject,
      html: buildConfirmationHtml(lead),
    });
    if (error) {
      console.error("[editorial] Resend confirmation error:", error);
      return false;
    }
    console.log(
      `[editorial] Confirmation email sent to ${lead.email} for ${lead.lead_code}`
    );
    return true;
  } catch (err) {
    console.error("[editorial] Failed to send confirmation:", err);
    return false;
  }
}

/* ────────────────────────────────────────────────────────────
   3. Welcome / manuscript invitation email — sent after
      confirmation, inviting the author to submit their
      manuscript.
   ──────────────────────────────────────────────────────────── */

function buildWelcomeHtml(lead: Lead): string {
  const submitUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://editorialreino.com"}/submit-manuscript`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0dad0;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1B40C0 0%,#132e90 100%);padding:40px 32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Bienvenido a Reino Editorial</h1>
  <p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:16px;">Tu camino hacia la publicación comienza aquí</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;color:#1a1814;font-size:16px;line-height:1.6;">
    Hola <strong>${lead.full_name}</strong>,
  </p>
  <p style="margin:0 0 16px;color:#6b6458;font-size:15px;line-height:1.7;">
    Queremos darte la bienvenida oficial a la familia de autores de Reino Editorial.
    Estamos emocionados de acompañarte en el proceso de convertir tu manuscrito en un libro profesional.
  </p>

  <div style="background:#FEF9EC;border-left:4px solid #C48B0A;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
    <p style="margin:0;color:#1a1814;font-size:15px;line-height:1.6;">
      <strong>¿Ya tienes tu manuscrito listo?</strong><br/>
      Si tu manuscrito está en formato Word (.docx) o PDF, puedes enviárnoslo directamente
      para acelerar tu evaluación editorial.
    </p>
  </div>

  <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
    <tr><td align="center">
      <a href="${submitUrl}" style="display:inline-block;background:#1B40C0;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Enviar mi manuscrito</a>
    </td></tr>
  </table>

  <h3 style="margin:24px 0 12px;color:#1a1814;font-size:16px;font-weight:600;">Nuestros servicios editoriales</h3>
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:10px 0;border-bottom:1px solid #e0dad0;">
      <strong style="color:#1B40C0;">Corrección</strong>
      <span style="color:#6b6458;font-size:14px;"> — Ortográfica, gramatical y de estilo</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #e0dad0;">
      <strong style="color:#1B40C0;">Edición</strong>
      <span style="color:#6b6458;font-size:14px;"> — Estructural y de contenido</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #e0dad0;">
      <strong style="color:#1B40C0;">Diseño</strong>
      <span style="color:#6b6458;font-size:14px;"> — Portada profesional y maquetación interior</span>
    </td></tr>
    <tr><td style="padding:10px 0;">
      <strong style="color:#1B40C0;">Publicación</strong>
      <span style="color:#6b6458;font-size:14px;"> — Impresión y distribución digital</span>
    </td></tr>
  </table>

  <p style="margin:24px 0 0;color:#6b6458;font-size:14px;line-height:1.6;">
    Si tienes alguna pregunta, no dudes en responder a este correo o contactarnos
    directamente. Estamos aquí para ayudarte.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f7f5f0;padding:20px 32px;text-align:center;">
  <p style="margin:0;color:#6b6458;font-size:12px;">Reino Editorial — Acompañamiento editorial profesional</p>
  <p style="margin:6px 0 0;color:#a09588;font-size:11px;">
    <a href="https://editorialreino.com" style="color:#1B40C0;text-decoration:none;">editorialreino.com</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>`.trim();
}

export async function sendEditorialWelcomeEmail(
  lead: Lead
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend || !lead.email) return false;

  const subject =
    "Bienvenido a Reino Editorial — Tu camino hacia la publicación";

  try {
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Reino Editorial <noreply@hebeling.io>",
      to: lead.email,
      subject,
      html: buildWelcomeHtml(lead),
    });
    if (error) {
      console.error("[editorial] Resend welcome error:", error);
      return false;
    }
    console.log(
      `[editorial] Welcome email sent to ${lead.email} for ${lead.lead_code}`
    );
    return true;
  } catch (err) {
    console.error("[editorial] Failed to send welcome email:", err);
    return false;
  }
}
