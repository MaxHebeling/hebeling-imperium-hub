import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { assertBrandAccess, requireStaffScope } from "@/lib/auth/staff-scope";

function sanitizeLeadPatch(input: Record<string, unknown>) {
  const allowedFields = [
    "full_name",
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
    "visual_style",
    "available_content",
    "reference_websites",
    "project_type",
    "budget_range",
    "timeline",
    "preferred_contact_method",
    "additional_notes",
    "status",
  ] as const;

  const patch: Record<string, string | boolean | null> = {};

  for (const field of allowedFields) {
    if (field in input) {
      const value = input[field];
      patch[field] =
        typeof value === "string"
          ? value.trim() || null
          : value == null
            ? null
            : String(value);
    }
  }

  const allowedBooleanFields = [
    "has_logo",
    "has_brand_colors",
    "has_current_landing",
  ] as const;

  for (const field of allowedBooleanFields) {
    if (field in input) {
      const value = input[field];
      patch[field] =
        typeof value === "boolean"
          ? value
          : value == null
            ? null
            : String(value).toLowerCase() === "true";
    }
  }

  return patch;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireStaffScope();
    const supabase = await createClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, brand, org_id")
      .eq("id", id)
      .single();

    if (leadError || !lead || lead.org_id !== session.orgId || !assertBrandAccess(session, lead.brand)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch = sanitizeLeadPatch(body);

    const { data, error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[leads] patch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireStaffScope();
    const supabase = await createClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, brand, org_id")
      .eq("id", id)
      .single();

    if (leadError || !lead || lead.org_id !== session.orgId || !assertBrandAccess(session, lead.brand)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[leads] delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
