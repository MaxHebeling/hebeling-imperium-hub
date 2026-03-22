import { NextRequest, NextResponse } from "next/server";
import { 
  createLead, 
  createDealFromLead, 
  logActivity,
  LeadPayload 
} from "@/lib/leads/helpers";
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from "@/lib/leads/email";
import { createClient } from "@/lib/supabase/server";
import { LEAD_BRAND_OPTIONS } from "@/lib/leads/brand-config";
import { requireStaffScope } from "@/lib/auth/staff-scope";

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
    const message = error instanceof Error ? error.message : "Internal server error";
    const isConfigError =
      !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      /required|createClient|SUPABASE|service.role/i.test(message);
    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? "Server configuration error. Check SUPABASE_SERVICE_ROLE_KEY and database migrations (scripts 001, 006, 007)."
          : message,
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  try {
    const session = await requireStaffScope();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const requestedBrand = url.searchParams.get("brand");
    const requestedStatus = url.searchParams.get("status");

    let query = supabase
      .from("leads")
      .select("*")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false });

    if (session.brandScope) {
      query = query.eq("brand", session.brandScope.crmBrand);
    } else if (
      requestedBrand &&
      LEAD_BRAND_OPTIONS.some((option) => option.value === requestedBrand)
    ) {
      query = query.eq("brand", requestedBrand);
    }

    if (requestedStatus && ["new_lead", "contacted", "qualified", "converted", "lost"].includes(requestedStatus)) {
      query = query.eq("status", requestedStatus);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,lead_code.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leads: data ?? [],
      restricted_brand: session.brandScope?.crmBrand ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
