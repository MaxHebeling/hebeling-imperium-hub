import { NextRequest, NextResponse } from "next/server";
import { 
  createLead, 
  createDealFromLead, 
  logActivity,
  LeadPayload 
} from "@/lib/leads/helpers";
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from "@/lib/leads/email";

export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    // Validate required fields
    if (!body.full_name) {
      return NextResponse.json(
        { success: false, error: "full_name is required" },
        { status: 400 }
      );
    }

    // 1. Create lead with auto-generated lead code
    const lead = await createLead(body);

    // 2. Create associated deal
    const deal = await createDealFromLead(lead);

    // 3. Log activity
    await logActivity("lead_created", "lead", lead.id, {
      lead_code: lead.lead_code,
      source: lead.source,
      brand: lead.brand,
      form_type: lead.form_type,
    });

    // 4. Send notification emails
    console.log("[v0] Sending emails for lead:", lead.lead_code);
    
    const [internalResult, confirmationResult] = await Promise.all([
      sendLeadNotificationEmail(lead).catch((err) => {
        console.error("[v0] Internal notification email error:", err);
        return false;
      }),
      sendLeadConfirmationEmail(lead).catch((err) => {
        console.error("[v0] Confirmation email error:", err);
        return false;
      })
    ]);
    
    console.log("[v0] Email results - Internal:", internalResult, "Confirmation:", confirmationResult);

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      leadId: lead.id,
      leadCode: lead.lead_code,
      dealCreated: !!deal,
    });
  } catch (error) {
    console.error("Lead API error:", error);
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
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/leads",
    method: "POST",
    required_fields: ["full_name"],
    optional_fields: [
      "company_name",
      "email",
      "whatsapp",
      "country",
      "city",
      "project_description",
      "organization_type",
      "website_url",
      "social_links",
      "main_goal",
      "expected_result",
      "main_service",
      "ideal_client",
      "has_logo",
      "has_brand_colors",
      "visual_style",
      "available_content",
      "reference_websites",
      "has_current_landing",
      "project_type",
      "budget_range",
      "timeline",
      "preferred_contact_method",
      "additional_notes",
      "source",
      "brand",
      "origin_page",
      "form_type",
    ],
  });
}
