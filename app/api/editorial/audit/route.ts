import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listAuditEvents } from "@/lib/editorial/audit";

// GET /api/editorial/audit — retrieve audit events for the org
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

    // Audit log is restricted to admins only
    if (!profile || !["superadmin", "admin"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type") ?? undefined;
    const entityId = searchParams.get("entity_id") ?? undefined;
    const actorId = searchParams.get("actor_id") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    const events = await listAuditEvents(profile.org_id, {
      entityType,
      entityId,
      actorId,
      limit,
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("[api/editorial/audit] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
