import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { updateStageStatus, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/reject
 *
 * Rejects a stage, requesting corrections. Sets status to "revision_required"
 * and logs the rejection reason.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; stageKey: string }> }
) {
  try {
    const staff = await requireStaff();
    const body = await request.json();
    const { reason, notes } = body as { reason?: string; notes?: string };

    const { projectId, stageKey } = await params;
    if (!isValidStageKey(stageKey)) {
      return NextResponse.json(
        { success: false, error: `Invalid stageKey: ${stageKey}` },
        { status: 400 }
      );
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "stage:approve", // Same permission as approve
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Update stage status to revision_required
    await updateStageStatus(projectId, stageKey, "revision_required");

    // Add rejection notes to stage if provided
    if (notes || reason) {
      const supabase = getAdminClient();
      const { data: stage } = await supabase
        .from("editorial_stages")
        .select("notes")
        .eq("project_id", projectId)
        .eq("stage_key", stageKey)
        .single();

      const existingNotes = stage?.notes || "";
      const rejectionNote = `[RECHAZO ${new Date().toLocaleDateString("es-ES")}]: ${reason || "Sin motivo especificado"}${notes ? `\nNotas: ${notes}` : ""}`;
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n\n${rejectionNote}` 
        : rejectionNote;

      await supabase
        .from("editorial_stages")
        .update({ notes: updatedNotes })
        .eq("project_id", projectId)
        .eq("stage_key", stageKey);
    }

    // Log the workflow event
    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      stageKey,
      eventType: "stage_rejected",
      actorId: staff.userId,
      actorRole: staff.role,
      payload: { reason, notes },
    });

    // Log activity
    await logEditorialActivity(projectId, "stage_rejected_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { reason, notes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[staff/stages/reject] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
