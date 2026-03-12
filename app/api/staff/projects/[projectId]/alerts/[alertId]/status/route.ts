import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { getAdminClient } from "@/lib/leads/helpers";
import { updateAlertStatus } from "@/lib/editorial/alerts/service";

const ALLOWED: Array<"open" | "acknowledged" | "resolved"> = ["open", "acknowledged", "resolved"];

/**
 * POST /api/staff/projects/[projectId]/alerts/[alertId]/status
 * Body: { status: open|acknowledged|resolved }
 *
 * Note: projectId is part of the route for scoping/URL semantics.
 * The update is by alertId; project ownership checks can be added later
 * once staff org membership is formalized.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; alertId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId, alertId } = await params;
    const body = await request.json();
    const status = String(body?.status ?? "");
    if (!ALLOWED.includes(status as (typeof ALLOWED)[number])) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Load alert and enforce project/org scoping.
    const supabase = getAdminClient();
    const { data: alert, error: alertError } = await supabase
      .from("editorial_project_alerts")
      .select("id, project_id, org_id")
      .eq("id", alertId)
      .maybeSingle();

    if (alertError) {
      return NextResponse.json({ success: false, error: "Alert lookup failed" }, { status: 500 });
    }
    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }
    if (alert.project_id !== projectId) {
      return NextResponse.json({ success: false, error: "Alert does not belong to project" }, { status: 403 });
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    if (project.org_id !== alert.org_id) {
      return NextResponse.json({ success: false, error: "Alert/org mismatch" }, { status: 403 });
    }

    await updateAlertStatus({ alertId, status: status as (typeof ALLOWED)[number], actorId: staff.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

