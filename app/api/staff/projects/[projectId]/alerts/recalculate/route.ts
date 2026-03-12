import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { listProjectAlerts } from "@/lib/editorial/alerts/service";
import { recalculateProjectAlerts } from "@/lib/editorial/alerts/detection";

/**
 * POST /api/staff/projects/[projectId]/alerts/recalculate
 * Recomputes operational alerts for the project (no cron).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireStaff();
    const { projectId } = await params;
    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    await recalculateProjectAlerts(projectId);
    const alerts = await listProjectAlerts(projectId);
    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

