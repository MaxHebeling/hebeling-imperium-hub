import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }
  
  return createClient(url, key);
}

// Generate unique lead code
function generateLeadCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IK-${timestamp}-${random}`;
}

// Generate email HTML
function generateEmailHtml(data: Record<string, unknown>, leadCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New iKingdom Landing Page Request</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 8px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #111827 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 600;">
                New Landing Page Project Request
              </h1>
              <p style="margin: 12px 0 0; color: #9CA3AF; font-size: 16px;">
                via iKingdom Intake Form
              </p>
            </td>
          </tr>
          
          <!-- Lead Code Badge -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 12px; color: #9CA3AF; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                Reference Code
              </p>
              <div style="background-color: rgba(212, 175, 55, 0.1); border: 2px solid #D4AF37; border-radius: 8px; padding: 24px;">
                <p style="margin: 0; color: #D4AF37; font-size: 32px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 2px;">
                  ${leadCode}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #FFFFFF; font-size: 18px; font-weight: 600;">
                Contact Information
              </h2>
              <table width="100%">
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0; width: 140px;">Full Name:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.full_name || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Company:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.company_name || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Email:</td>
                  <td style="color: #D4AF37; font-size: 13px; padding: 8px 0; font-weight: 500;">
                    <a href="mailto:${data.email}" style="color: #D4AF37; text-decoration: none;">${data.email || "Not provided"}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">WhatsApp:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.whatsapp || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Location:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.city || ""}, ${data.country || ""}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project Details -->
          <tr>
            <td style="padding: 0 32px 32px; border-top: 1px solid rgba(212, 175, 55, 0.1); padding-top: 32px;">
              <h2 style="margin: 0 0 16px; color: #FFFFFF; font-size: 18px; font-weight: 600;">
                Project Details
              </h2>
              <table width="100%">
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0; width: 140px;">Project Type:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.project_type || "Not specified"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Timeline:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.timeline || "Not specified"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Budget Range:</td>
                  <td style="color: #D4AF37; font-size: 13px; padding: 8px 0; font-weight: 600;">${data.budget_range || "Not specified"}</td>
                </tr>
                <tr>
                  <td style="color: #9CA3AF; font-size: 13px; padding: 8px 0;">Preferred Contact:</td>
                  <td style="color: #E2E8F0; font-size: 13px; padding: 8px 0; font-weight: 500;">${data.preferred_contact_method || "Not specified"}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.project_description ? `
          <!-- Project Description -->
          <tr>
            <td style="padding: 0 32px 32px; border-top: 1px solid rgba(212, 175, 55, 0.1); padding-top: 32px;">
              <h2 style="margin: 0 0 16px; color: #FFFFFF; font-size: 18px; font-weight: 600;">
                Project Description
              </h2>
              <p style="margin: 0; color: #E2E8F0; font-size: 14px; line-height: 1.6; background-color: rgba(212, 175, 55, 0.05); padding: 16px; border-radius: 6px; border: 1px solid rgba(212, 175, 55, 0.1);">
                ${data.project_description}
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Action Button -->
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.1);">
              <a href="https://hub.hebelingimperium.com/app/crm" style="display: inline-block; background-color: #D4AF37; color: #0F172A; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View in CRM
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0E17; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.1);">
              <p style="margin: 0 0 8px; color: #D4AF37; font-size: 14px; font-weight: 600;">
                iKingdom
              </p>
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                Strategic Digital Architecture
              </p>
              <p style="margin: 8px 0 0; color: #52525b; font-size: 11px;">
                © ${new Date().getFullYear()} Hebeling Imperium Group. All rights reserved.
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.full_name) {
      return NextResponse.json(
        { success: false, error: "full_name is required" },
        { status: 400 }
      );
    }

    // Generate lead code
    const leadCode = generateLeadCode();

    // 1. Store in Supabase
    const supabase = getSupabaseClient();
    
    const leadData = {
      lead_code: leadCode,
      full_name: body.full_name,
      company_name: body.company_name || null,
      email: body.email || null,
      whatsapp: body.whatsapp || null,
      country: body.country || null,
      city: body.city || null,
      project_type: body.project_type || null,
      project_description: body.project_description || null,
      timeline: body.timeline || null,
      budget_range: body.budget_range || null,
      preferred_contact_method: body.preferred_contact_method || null,
      source: "ikingdom-intake",
      brand: "ikingdom",
      form_type: "landing_page_intake",
      origin_page: body.origin_page || "/external/ikingdom-intake",
      status: "new",
      created_at: new Date().toISOString(),
    };

    const { data: lead, error: supabaseError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (supabaseError) {
      console.error("Supabase insert error:", supabaseError);
      return NextResponse.json(
        { success: false, error: "Failed to save lead" },
        { status: 500 }
      );
    }

    console.log("Lead saved successfully:", leadCode);

    // 2. Send email notification (non-blocking)
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendTo = process.env.RESEND_IKINGDOM_TO;

    if (!resendApiKey || !resendTo) {
      console.warn("Resend email skipped: missing configuration", {
        hasApiKey: !!resendApiKey,
        hasTo: !!resendTo,
      });
    } else {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM || "iKingdom <noreply@ikingdom.org>";
        
        console.log("Sending Resend email to:", resendTo, "from:", fromEmail);

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: resendTo,
          subject: `New Landing Page Project Request — ${body.full_name} (${leadCode})`,
          html: generateEmailHtml(body, leadCode),
        });

        if (emailError) {
          console.error("Resend email error:", emailError);
        } else {
          console.log("Resend email sent successfully! ID:", emailData?.id);
        }
      } catch (emailErr) {
        console.error("Resend email exception:", emailErr);
        // Don't throw - email failure should not break the request
      }
    }

    // 3. Return success (Supabase insert succeeded)
    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      leadCode: leadCode,
      leadId: lead?.id,
    });

  } catch (error) {
    console.error("iKingdom intake API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  const hasResendConfig = !!(process.env.RESEND_API_KEY && process.env.RESEND_IKINGDOM_TO);
  
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/external/ikingdom-intake",
    method: "POST",
    email_configured: hasResendConfig,
    required_fields: ["full_name"],
    optional_fields: [
      "company_name",
      "email",
      "whatsapp",
      "country",
      "city",
      "project_type",
      "project_description",
      "timeline",
      "budget_range",
      "preferred_contact_method",
    ],
  });
}
