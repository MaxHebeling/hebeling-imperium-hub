import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Hardcoded org_id for Hebeling Imperium Group
const ORG_ID = "4059832a-ff39-43e6-984f-d9e866dfb8a4";

// Use service role key for API access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadPayload {
  full_name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
}

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

    const source = body.source || "landing_page";

    // 1. Create contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .insert({
        org_id: ORG_ID,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.message || null,
        source: source,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Contact creation error:", contactError);
      return NextResponse.json(
        { success: false, error: "Failed to create contact" },
        { status: 500 }
      );
    }

    // 2. Get the Lead stage from the default pipeline
    const { data: stages } = await supabaseAdmin
      .from("stages")
      .select("id")
      .eq("name", "Lead")
      .limit(1);

    const leadStageId = stages?.[0]?.id || null;

    // 3. Create deal related to the contact with contact_id link
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .insert({
        org_id: ORG_ID,
        stage_id: leadStageId,
        contact_id: contact.id,
        title: `${body.full_name} — Landing Lead`,
        value: 0,
        currency: "USD",
        source: source,
      })
      .select()
      .single();

    if (dealError) {
      console.error("Deal creation error:", dealError);
      // Don't fail - contact was created
    }

    // 4. Log activity
    await supabaseAdmin.from("activity_logs").insert({
      org_id: ORG_ID,
      action: "lead_created",
      entity: "contact",
      entity_id: contact.id,
    });

    return NextResponse.json({
      success: true,
      contact: contact,
      deal: deal || null,
    });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
    optional_fields: ["email", "phone", "message", "source"],
  });
}
