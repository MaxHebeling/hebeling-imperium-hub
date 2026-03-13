import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { WEB_STAGE_KEYS, WEB_STAGE_PROGRESS } from "@/lib/ikingdom/pipeline/constants";
import type { WebStageKey } from "@/lib/ikingdom/types/web-project";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;
    const body = await request.json();
    const { stage } = body as { stage: string };

    if (!stage || !WEB_STAGE_KEYS.includes(stage as WebStageKey)) {
      return NextResponse.json(
        { success: false, error: `Etapa inválida: ${stage}` },
        { status: 400 }
      );
    }

    const targetStage = stage as WebStageKey;
    const supabase = getAdminClient();

    // Get current project
    const { data: project, error: fetchError } = await supabase
      .from("ikingdom_web_projects")
      .select("id, current_stage, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const newProgress = WEB_STAGE_PROGRESS[targetStage];

    // Update the project's current stage and progress
    const { error: updateError } = await supabase
      .from("ikingdom_web_projects")
      .update({
        current_stage: targetStage,
        progress_percent: newProgress,
        status: targetStage === "soporte" ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Error actualizando etapa: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update stage statuses
    const targetIndex = WEB_STAGE_KEYS.indexOf(targetStage);

    for (let i = 0; i < WEB_STAGE_KEYS.length; i++) {
      const stageKey = WEB_STAGE_KEYS[i];
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
        .from("ikingdom_web_stages")
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
