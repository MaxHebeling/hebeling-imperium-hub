import { NextRequest, NextResponse } from "next/server";
import {
  createLead,
  createDealFromLead,
  logActivity,
  LeadPayload,
} from "@/lib/leads/helpers";
import {
  sendEditorialLeadNotification,
  sendEditorialLeadConfirmation,
  sendEditorialWelcomeEmail,
} from "@/lib/leads/editorial-email";

export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    if (!body.full_name) {
      return NextResponse.json(
        { success: false, error: "full_name is required" },
        { status: 400 }
      );
    }
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    // Force brand to editorial-reino
    body.brand = body.brand || "editorial-reino";
    body.source = body.source || "website";

    // 1. Create lead
    const lead = await createLead(body);

    // 2. Create associated deal (pipeline: editorial-reino)
    const deal = await createDealFromLead(lead);

    // 3. Log activity
    await logActivity("editorial_lead_created", "lead", lead.id, {
      lead_code: lead.lead_code,
      source: lead.source,
      brand: lead.brand,
      form_type: lead.form_type,
      origin_page: lead.origin_page,
    });

    // 4. Send notification emails (non-blocking)
    Promise.all([
      sendEditorialLeadNotification(lead).catch((err) => {
        console.error("[editorial] Internal notification error:", err);
      }),
      sendEditorialLeadConfirmation(lead).catch((err) => {
        console.error("[editorial] Confirmation email error:", err);
      }),
    ]).then(() => {
      // 5. Send welcome email with delay (scheduled or immediate)
      sendEditorialWelcomeEmail(lead).catch((err) => {
        console.error("[editorial] Welcome email error:", err);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      leadId: lead.id,
      leadCode: lead.lead_code,
      dealCreated: !!deal,
    });
  } catch (error) {
    console.error("Editorial Lead API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const isConfigError =
      !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      /required|createClient|SUPABASE|service.role/i.test(message);
    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? "Server configuration error. Check SUPABASE_SERVICE_ROLE_KEY."
          : message,
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/editorial/leads",
    method: "POST",
    required_fields: ["full_name", "email"],
    optional_fields: [
      "whatsapp",
      "country",
      "city",
      "project_description",
      "main_service",
      "source",
      "brand",
      "origin_page",
      "form_type",
    ],
  });
}
