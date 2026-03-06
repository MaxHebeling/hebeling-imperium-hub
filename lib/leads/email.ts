import { Resend } from "resend";
import { 
  Lead, 
  formatBudgetRange, 
  formatTimeline, 
  formatMainService, 
  formatMainGoal,
  formatContactMethod 
} from "./helpers";

// Internal notification email recipient
const INTERNAL_EMAIL = process.env.INTERNAL_NOTIFICATION_EMAIL || "max@hebeling.io";

// Initialize Resend client (if API key is set)
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - email notifications disabled");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Generate HTML email body for internal lead notification
 */
function generateEmailBody(lead: Lead): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Lead iKingdom</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #182433; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Nuevo Lead iKingdom
              </h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </td>
          </tr>
          
          <!-- Lead Code Badge -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table cellpadding="0" cellspacing="0" style="background-color: #182433; border-radius: 6px; padding: 16px 24px;">
                <tr>
                  <td>
                    <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Codigo de Lead</span>
                    <p style="margin: 4px 0 0; color: #ffffff; font-size: 20px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">
                      ${lead.lead_code}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Contact Info Section -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; color: #182433; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Informacion de Contacto
              </h2>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Nombre</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${lead.full_name}
                    </p>
                  </td>
                </tr>
                ${lead.company_name ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Empresa</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${lead.company_name}
                    </p>
                  </td>
                </tr>
                ` : ''}
                ${lead.email ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Email</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      <a href="mailto:${lead.email}" style="color: #2563eb; text-decoration: none;">${lead.email}</a>
                    </p>
                  </td>
                </tr>
                ` : ''}
                ${lead.whatsapp ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">WhatsApp</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}" style="color: #22c55e; text-decoration: none;">${lead.whatsapp}</a>
                    </p>
                  </td>
                </tr>
                ` : ''}
                ${lead.country || lead.city ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Ubicacion</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${[lead.city, lead.country].filter(Boolean).join(', ')}
                    </p>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
          <!-- Project Info Section -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; color: #182433; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Detalles del Proyecto
              </h2>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Objetivo Principal</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${formatMainGoal(lead.main_goal)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Servicio de Interes</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${formatMainService(lead.main_service)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Presupuesto</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${formatBudgetRange(lead.budget_range)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 13px;">Timeline</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${formatTimeline(lead.timeline)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #71717a; font-size: 13px;">Contacto Preferido</span>
                    <p style="margin: 4px 0 0; color: #182433; font-size: 15px; font-weight: 500;">
                      ${formatContactMethod(lead.preferred_contact_method)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${lead.project_description ? `
          <!-- Description Section -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 12px; color: #182433; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Descripcion del Proyecto
              </h2>
              <p style="margin: 0; color: #3f3f46; font-size: 14px; line-height: 1.6; background-color: #f4f4f5; padding: 16px; border-radius: 6px;">
                ${lead.project_description}
              </p>
            </td>
          </tr>
          ` : ''}
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hub.hebeling.io'}/app/crm" 
                       style="display: inline-block; background-color: #182433; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                      Ver en CRM
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                Este email fue generado automaticamente por el sistema iKingdom.
              </p>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 11px;">
                Hebeling Imperium Group
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email body for fallback
 */
function generatePlainTextBody(lead: Lead): string {
  return `
NUEVO LEAD IKINGDOM
${'='.repeat(50)}

Codigo de Lead: ${lead.lead_code}
Fecha: ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

INFORMACION DE CONTACTO
${'─'.repeat(30)}
Nombre: ${lead.full_name}
${lead.company_name ? `Empresa: ${lead.company_name}` : ''}
${lead.email ? `Email: ${lead.email}` : ''}
${lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : ''}
${lead.country || lead.city ? `Ubicacion: ${[lead.city, lead.country].filter(Boolean).join(', ')}` : ''}

DETALLES DEL PROYECTO
${'─'.repeat(30)}
Objetivo Principal: ${formatMainGoal(lead.main_goal)}
Servicio de Interes: ${formatMainService(lead.main_service)}
Presupuesto: ${formatBudgetRange(lead.budget_range)}
Timeline: ${formatTimeline(lead.timeline)}
Contacto Preferido: ${formatContactMethod(lead.preferred_contact_method)}

${lead.project_description ? `DESCRIPCION\n${'─'.repeat(30)}\n${lead.project_description}` : ''}

${'─'.repeat(50)}
Ver en CRM: ${process.env.NEXT_PUBLIC_APP_URL || 'https://hub.hebeling.io'}/app/crm

Este email fue generado automaticamente por el sistema iKingdom.
Hebeling Imperium Group
  `.trim();
}

/**
 * Send internal notification email for new lead
 */
export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  const resend = getResendClient();
  
  if (!resend) {
    console.log("Email notification skipped - Resend not configured");
    return false;
  }

  const subject = `Nuevo lead iKingdom — ${lead.full_name} — ${lead.lead_code}`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "iKingdom <noreply@hebeling.io>",
      to: INTERNAL_EMAIL,
      subject,
      html: generateEmailBody(lead),
      text: generatePlainTextBody(lead),
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log(`Lead notification email sent to ${INTERNAL_EMAIL} for ${lead.lead_code}`);
    return true;
  } catch (err) {
    console.error("Failed to send notification email:", err);
    return false;
  }
}
