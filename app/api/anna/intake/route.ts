import { NextRequest, NextResponse } from "next/server";
import {
  AnnaIntakePayload,
  buildLeadPayloadFromAnna,
  buildLeadUpdateFromAnna,
  inferLeadBrandFromAnna,
} from "@/lib/leads/anna-intake";
import {
  createDealFromLead,
  createLead,
  findLeadByContact,
  logActivity,
  updateLead,
} from "@/lib/leads/helpers";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnnaIntakePayload;

    if (!body.message && !body.conversation_summary) {
      return NextResponse.json(
        {
          success: false,
          error: "message or conversation_summary is required",
        },
        { status: 400 }
      );
    }

    if (!body.contact?.full_name && !body.contact?.email && !body.contact?.whatsapp) {
      return NextResponse.json(
        {
          success: false,
          error: "contact.full_name, contact.email, or contact.whatsapp is required",
        },
        { status: 400 }
      );
    }

    const detectedBrand = inferLeadBrandFromAnna(body);
    const leadPayload = buildLeadPayloadFromAnna(body);
    const existingLead = await findLeadByContact({
      brand: detectedBrand,
      email: body.contact?.email,
      whatsapp: body.contact?.whatsapp,
    });

    if (existingLead) {
      const updatedLead = await updateLead(
        existingLead.id,
        buildLeadUpdateFromAnna(existingLead, leadPayload)
      );

      await logActivity("anna_intake_updated", "lead", updatedLead.id, {
        lead_code: updatedLead.lead_code,
        channel: body.channel || "web_chat",
        language: body.language || null,
        brand: detectedBrand,
      });

      return NextResponse.json({
        success: true,
        action: "updated",
        brand: detectedBrand,
        leadId: updatedLead.id,
        leadCode: updatedLead.lead_code,
        dealCreated: false,
      });
    }

    const lead = await createLead(leadPayload);
    const deal = await createDealFromLead(lead);

    await logActivity("anna_intake_created", "lead", lead.id, {
      lead_code: lead.lead_code,
      channel: body.channel || "web_chat",
      language: body.language || null,
      brand: detectedBrand,
    });

    return NextResponse.json({
      success: true,
      action: "created",
      brand: detectedBrand,
      leadId: lead.id,
      leadCode: lead.lead_code,
      dealCreated: !!deal,
    });
  } catch (error) {
    console.error("[anna-intake] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/anna/intake",
    method: "POST",
    purpose: "ANNA lead intake and routing",
    required_fields: [
      "message or conversation_summary",
      "contact.full_name or contact.email or contact.whatsapp",
    ],
    optional_fields: [
      "channel",
      "language",
      "brand",
      "source",
      "origin_page",
      "form_type",
      "contact.company_name",
      "contact.city",
      "contact.country",
      "qualification.project_type",
      "qualification.main_service",
      "qualification.main_goal",
      "qualification.budget_range",
      "qualification.timeline",
      "qualification.priority",
      "metadata",
    ],
  });
}
