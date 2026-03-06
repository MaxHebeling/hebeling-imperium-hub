import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role key for API access (bypasses RLS for reading)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LeadSource = "landing_page" | "linkedin" | "whatsapp" | "referral" | "manual";

interface LeadPayload {
  brand_slug: string;
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  source?: LeadSource;
  deal_title?: string;
  deal_value?: number;
  deal_currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    // Validate required fields
    if (!body.brand_slug || !body.full_name) {
      return NextResponse.json(
        { error: "brand_slug and full_name are required" },
        { status: 400 }
      );
    }

    // Look up brand by slug
    const { data: brand, error: brandError } = await supabaseAdmin
      .from("brands")
      .select("id, org_id, name")
      .eq("slug", body.brand_slug)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: `Brand not found: ${body.brand_slug}` },
        { status: 404 }
      );
    }

    const orgId = brand.org_id;
    const brandId = brand.id;
    const source = body.source || "landing_page";

    // Generate slug from full_name for tenant
    const tenantSlug = body.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36);

    // 1. Create tenant (lead status)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        org_id: orgId,
        brand_id: brandId,
        name: body.full_name,
        slug: tenantSlug,
        status: "lead",
        primary_contact_name: body.full_name,
        primary_contact_email: body.email || null,
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant creation error:", tenantError);
      return NextResponse.json(
        { error: "Failed to create lead tenant" },
        { status: 500 }
      );
    }

    // 2. Create contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .insert({
        org_id: orgId,
        brand_id: brandId,
        tenant_id: tenant.id,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
        source: source,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Contact creation error:", contactError);
      // Don't fail - tenant was created
    }

    // 3. Create deal if deal info provided or create default lead deal
    let deal = null;
    
    // Get the Lead stage from the default pipeline
    const { data: stages } = await supabaseAdmin
      .from("stages")
      .select("id, pipeline_id")
      .eq("name", "Lead")
      .limit(1);

    const leadStageId = stages?.[0]?.id || null;

    const dealTitle = body.deal_title || `Lead: ${body.full_name}`;
    const dealValue = body.deal_value || 0;
    const dealCurrency = body.deal_currency || "USD";

    const { data: dealData, error: dealError } = await supabaseAdmin
      .from("deals")
      .insert({
        org_id: orgId,
        brand_id: brandId,
        tenant_id: tenant.id,
        stage_id: leadStageId,
        title: dealTitle,
        value: dealValue,
        currency: dealCurrency,
        source: source,
      })
      .select()
      .single();

    if (dealError) {
      console.error("Deal creation error:", dealError);
      // Don't fail - tenant and contact were created
    } else {
      deal = dealData;
    }

    // 4. Log activity
    await supabaseAdmin.from("activity_logs").insert({
      org_id: orgId,
      brand_id: brandId,
      action: "lead_created",
      entity: "tenant",
      entity_id: tenant.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        tenant_id: tenant.id,
        contact_id: contact?.id || null,
        deal_id: deal?.id || null,
        brand: brand.name,
        source: source,
      },
    });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    required_fields: ["brand_slug", "full_name"],
    optional_fields: ["email", "phone", "notes", "source", "deal_title", "deal_value", "deal_currency"],
    valid_sources: ["landing_page", "linkedin", "whatsapp", "referral", "manual"],
  });
}
