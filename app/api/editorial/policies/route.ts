import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { CreateEditorialAiPolicyInput } from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/editorial/policies — list active policies for the org
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const activeOnly = searchParams.get("active") !== "false";

    const db = getAdminClient();
    let query = db
      .from("editorial_ai_policies")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("priority", { ascending: true });

    if (activeOnly) query = query.eq("is_active", true);
    if (stage) query = query.or(`applies_to_stage.eq.${stage},applies_to_stage.is.null`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[api/editorial/policies] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/policies — create a new policy
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: CreateEditorialAiPolicyInput = await request.json();

    if (!body.name || !body.policy_type) {
      return NextResponse.json(
        { success: false, error: "name and policy_type are required" },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    const { data, error } = await db
      .from("editorial_ai_policies")
      .insert({
        ...body,
        org_id: profile.org_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/policies] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
