import { Resend } from "resend";

type OperatorAccessDelivery = "invite" | "magiclink" | "recovery";
type OperatorRole = "sales" | "ops";

type BuildOperatorAccessShareMessageParams = {
  accessUrl: string;
  brandLabel: string;
  delivery: OperatorAccessDelivery;
  email: string;
  fullName?: string | null;
  role: OperatorRole;
};

type SendOperatorAccessEmailParams = BuildOperatorAccessShareMessageParams & {
  invitedBy?: string | null;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[operator-access] RESEND_API_KEY not configured");
    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  const explicitFrom = process.env.RESEND_OPERATOR_ACCESS_FROM_EMAIL;

  if (explicitFrom) {
    return explicitFrom;
  }

  const sharedFrom =
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    process.env.RESEND_EDITORIAL_FROM;
  if (!sharedFrom) {
    return "HEBELING OS <onboarding@resend.dev>";
  }

  const emailMatch = sharedFrom.match(/<([^>]+)>/);
  const rawEmail = emailMatch?.[1] || sharedFrom;
  return `HEBELING OS <${rawEmail.trim()}>`;
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function roleLabel(role: OperatorRole) {
  return role === "ops" ? "Operations" : "Sales";
}

function activationCopy(delivery: OperatorAccessDelivery) {
  if (delivery === "invite") {
    return {
      en: "Use the private link below to activate your account and create your secure access credentials.",
      es: "Usa el enlace privado a continuacion para activar tu cuenta y crear tus credenciales de acceso seguro.",
      cta: "Activate Secure Access",
    };
  }

  if (delivery === "recovery") {
    return {
      en: "Use the private link below to define or reset your password and finalize your secure access.",
      es: "Usa el enlace privado a continuacion para definir o restablecer tu contrasena y finalizar tu acceso seguro.",
      cta: "Create Your Password",
    };
  }

  return {
    en: "Use the private link below to enter Lead Hunter through your secure access session.",
    es: "Usa el enlace privado a continuacion para ingresar a Lead Hunter a traves de tu sesion de acceso seguro.",
    cta: "Open Secure Access",
  };
}

export function buildOperatorAccessShareMessage({
  accessUrl,
  brandLabel,
  delivery,
  email,
  fullName,
  role,
}: BuildOperatorAccessShareMessageParams) {
  const action = activationCopy(delivery);
  const nameLine = fullName?.trim() ? `${fullName.trim()},` : "Hello,";
  const roleName = roleLabel(role);
  const subject =
    delivery === "invite"
      ? `Secure access invitation — ${brandLabel} | HEBELING OS`
      : delivery === "recovery"
        ? `Password setup link — ${brandLabel} | HEBELING OS`
        : `Secure access link — ${brandLabel} | HEBELING OS`;

  const message = [
    `${nameLine}`,
    "",
    `You have been granted secure access to ${brandLabel} inside HEBELING OS as ${roleName}.`,
    action.en,
    "",
    accessUrl,
    "",
    "This access is private, intended only for your account, and restricted to the operations of this business unit.",
    "",
    "Si prefieres leerlo en espanol:",
    `Se te ha otorgado acceso seguro a ${brandLabel} dentro de HEBELING OS como ${role === "ops" ? "Operaciones" : "Ventas"}.`,
    action.es,
    "",
    accessUrl,
    "",
    `Access email: ${email}`,
  ].join("\n");

  return {
    subject,
    message,
    ctaLabel: action.cta,
  };
}

export function buildOperatorAccessEmailPreviewHtml({
  accessUrl,
  brandLabel,
  delivery,
  email,
  fullName,
  invitedBy,
  role,
}: SendOperatorAccessEmailParams) {
  const action = activationCopy(delivery);
  const siteUrl = getSiteUrl();
  const dashboardUrl = `${siteUrl}/app/companies/lead-hunter`;
  const roleName = roleLabel(role);
  const invitedByLabel = invitedBy?.trim() || "HEBELING OS Administration";
  const greeting = fullName?.trim() ? fullName.trim() : "Operator";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandLabel} Secure Access</title>
</head>
<body style="margin:0;padding:0;background-color:#07111F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#07111F 0%,#0B1728 100%);padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;background-color:#0D1B2D;border:1px solid rgba(225,162,74,0.22);border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.35);">
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-image:linear-gradient(rgba(8,14,22,0.62),rgba(8,14,22,0.9)),url('${siteUrl}/lead-hunter-cinematic-luxury-v1.jpg');background-size:cover;background-position:center;">
                <tr>
                  <td style="padding:40px 32px 36px;">
                    <p style="margin:0 0 14px;color:#E1A24A;font-size:12px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;">
                      HEBELING OS
                    </p>
                    <h1 style="margin:0;color:#F8FAFC;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:0.02em;">
                      ${brandLabel} Secure Access
                    </h1>
                    <p style="margin:16px 0 0;color:#D8E1ED;font-size:16px;line-height:1.7;max-width:460px;">
                      ${greeting}, you have been granted private operational access to ${brandLabel} inside HEBELING OS.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 12px;">
                <tr>
                  <td style="padding:16px 18px;background-color:#0B1524;border:1px solid rgba(159,178,204,0.14);border-radius:18px;">
                    <p style="margin:0;color:#8FA2BC;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Assigned Business Unit</p>
                    <p style="margin:8px 0 0;color:#F8FAFC;font-size:18px;font-weight:600;">${brandLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;background-color:#0B1524;border:1px solid rgba(159,178,204,0.14);border-radius:18px;">
                    <p style="margin:0;color:#8FA2BC;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Access Profile</p>
                    <p style="margin:8px 0 0;color:#F8FAFC;font-size:18px;font-weight:600;">${roleName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;background-color:#0B1524;border:1px solid rgba(159,178,204,0.14);border-radius:18px;">
                    <p style="margin:0;color:#8FA2BC;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Issued For</p>
                    <p style="margin:8px 0 0;color:#F8FAFC;font-size:18px;font-weight:600;">${email}</p>
                  </td>
                </tr>
              </table>

              <div style="margin:28px 0 0;padding:22px 22px 20px;background:linear-gradient(135deg,rgba(201,111,45,0.12),rgba(225,162,74,0.08));border:1px solid rgba(225,162,74,0.18);border-radius:20px;">
                <p style="margin:0;color:#F4D8B2;font-size:15px;line-height:1.8;">
                  ${action.en}
                </p>
                <p style="margin:16px 0 0;color:#AFC0D8;font-size:13px;line-height:1.7;">
                  ${action.es}
                </p>
              </div>

              <div style="padding:32px 0 22px;text-align:center;">
                <a href="${accessUrl}" style="display:inline-block;padding:15px 32px;border-radius:999px;background:linear-gradient(135deg,#C96F2D,#E1A24A);color:#08111E;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                  ${action.cta}
                </a>
              </div>

              <div style="padding:0 0 20px;">
                <p style="margin:0;color:#8FA2BC;font-size:12px;line-height:1.8;">
                  If the button does not open, use this secure access URL:
                </p>
                <p style="margin:10px 0 0;word-break:break-all;color:#E1A24A;font-size:12px;line-height:1.8;">
                  ${accessUrl}
                </p>
              </div>

              <div style="padding-top:20px;border-top:1px solid rgba(159,178,204,0.14);">
                <p style="margin:0;color:#D8E1ED;font-size:14px;line-height:1.8;">
                  This access was provisioned by <strong>${invitedByLabel}</strong>. Once active, your navigation remains restricted to ${brandLabel} and its operational workspace.
                </p>
                <p style="margin:16px 0 0;color:#8FA2BC;font-size:13px;line-height:1.8;">
                  HEBELING OS protects this access as a private operational credential. Do not forward this message outside the intended recipient.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px;background-color:#09111E;border-top:1px solid rgba(159,178,204,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#E1A24A;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">HEBELING OS</p>
                    <p style="margin:8px 0 0;color:#8FA2BC;font-size:12px;">Enterprise operations, AI routing, CRM intelligence.</p>
                  </td>
                  <td align="right">
                    <a href="${dashboardUrl}" style="color:#D8E1ED;font-size:12px;text-decoration:none;">Preview Lead Hunter</a>
                  </td>
                </tr>
              </table>
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

function buildOperatorAccessEmailText(params: SendOperatorAccessEmailParams) {
  const { subject, message } = buildOperatorAccessShareMessage(params);

  return `${subject}\n\n${message}\n\nHEBELING OS`;
}

export async function sendOperatorAccessEmail(
  params: SendOperatorAccessEmailParams
) {
  const resend = getResendClient();

  if (!resend) {
    return false;
  }

  const { subject } = buildOperatorAccessShareMessage(params);

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.email],
      subject,
      html: buildOperatorAccessEmailPreviewHtml(params),
      text: buildOperatorAccessEmailText(params),
    });

    if (error) {
      console.error("[operator-access] Resend send failed", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[operator-access] Failed to send access email", error);
    return false;
  }
}
