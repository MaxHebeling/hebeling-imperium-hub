import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_STAGE_KEYS, EDITORIAL_STAGE_PROGRESS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

/**
 * PATCH /api/editorial/projects/[projectId]/stage
 * Staff can move a project to any stage (forward or backward).
 * Body: { stage: EditorialStageKey }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;
    const body = await request.json();
    const { stage } = body as { stage: string };

    if (!stage || !EDITORIAL_STAGE_KEYS.includes(stage as EditorialStageKey)) {
      return NextResponse.json(
        { success: false, error: `Etapa inválida: ${stage}` },
        { status: 400 }
      );
    }

    const targetStage = stage as EditorialStageKey;
    const supabase = getAdminClient();

    // Get current project
    const { data: project, error: fetchError } = await supabase
      .from("editorial_projects")
      .select("id, current_stage, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const newProgress = EDITORIAL_STAGE_PROGRESS[targetStage];

    // Update the project's current stage and progress
    const { error: updateError } = await supabase
      .from("editorial_projects")
      .update({
        current_stage: targetStage,
        progress_percent: newProgress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Error actualizando etapa: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update stage statuses:
    // - Stages before targetStage → completed
    // - targetStage → processing
    // - Stages after targetStage → pending
    const targetIndex = EDITORIAL_STAGE_KEYS.indexOf(targetStage);

    for (let i = 0; i < EDITORIAL_STAGE_KEYS.length; i++) {
      const stageKey = EDITORIAL_STAGE_KEYS[i];
      let newStatus: string;
      let completedAt: string | null = null;
      let startedAt: string | null = null;

      if (i < targetIndex) {
        newStatus = "completed";
        completedAt = new Date().toISOString();
        startedAt = new Date().toISOString();
      } else if (i === targetIndex) {
        newStatus = "processing";
        startedAt = new Date().toISOString();
      } else {
        newStatus = "pending";
      }

      // Upsert stage record
      await supabase
        .from("editorial_stages")
        .upsert(
          {
            project_id: projectId,
            stage_key: stageKey,
            status: newStatus,
            started_at: startedAt,
            completed_at: completedAt,
          },
          { onConflict: "project_id,stage_key" }
        );
    }

    // Log the activity
    await supabase.from("editorial_activity_log").insert({
      project_id: projectId,
      stage_key: targetStage,
      event_type: "stage_changed_by_staff",
      actor_id: staff.userId,
      actor_type: "staff",
      payload: {
        from_stage: project.current_stage,
        to_stage: targetStage,
        staff_email: staff.email,
      },
    });

    return NextResponse.json({
      success: true,
      stage: targetStage,
      progress_percent: newProgress,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
