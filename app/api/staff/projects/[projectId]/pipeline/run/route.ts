import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { advanceProjectStage, approveStage, updateStageStatus, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { getNextStage } from "@/lib/editorial/pipeline/stage-utils";
import { EDITORIAL_STAGE_KEYS } from "@/lib/editorial/pipeline/constants";
import { initializeNextStage } from "@/lib/editorial/pipeline/stage-transitions";
import { processAiJob } from "@/lib/editorial/ai/processor";
import { requestAiTask } from "@/lib/editorial/ai/jobs";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

/**
 * Primary AI task to run for each editorial stage.
 * ingesta uses OpenAI (processManuscriptNow), all others use Claude via processAiJob.
 */
const STAGE_PRIMARY_AI_TASK: Record<EditorialStageKey, EditorialAiTaskKey | null> = {
  ingesta: "manuscript_analysis",        // OpenAI gpt-4.1-mini
  estructura: "structure_analysis",       // Claude – análisis estructural
  estilo: "style_suggestions",            // Claude – sugerencias de estilo
  ortotipografia: "orthotypography_review", // Claude – corrección ortotipográfica
  maquetacion: "layout_analysis",         // Claude – análisis de maquetación
  revision_final: "redline_diff",         // Claude – revisión final exhaustiva
  export: "export_validation",            // Claude – validación para exportación
  distribution: "metadata_generation",    // Claude – metadatos para distribución
};

/**
 * POST /api/staff/projects/[projectId]/pipeline/run
 *
 * Runs the full editorial pipeline automatically:
 * 1. Starts at the project's current stage
 * 2. For each stage: runs AI analysis (OpenAI for ingesta, Claude for the rest), approves, advances
 * 3. Returns a summary of what was processed
 *
 * This is a long-running request that processes all stages sequentially.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Proyecto no encontrado" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Get the latest manuscript file for AI jobs
    const latestManuscript = await getLatestManuscriptForProject(projectId);
    const manuscriptFileId = latestManuscript?.file?.id ?? null;
    const manuscriptFileVersion = latestManuscript?.file?.version ?? null;

    const stagesProcessed: Array<{
      stage: string;
      status: "completed" | "skipped" | "failed";
      aiAnalysis?: boolean;
      aiTask?: string;
      error?: string;
    }> = [];

    let currentStage: EditorialStageKey = project.current_stage;
    const startIdx = EDITORIAL_STAGE_KEYS.indexOf(currentStage);

    // Process each stage from current to the end
    for (let i = startIdx; i < EDITORIAL_STAGE_KEYS.length; i++) {
      const stageKey = EDITORIAL_STAGE_KEYS[i];
      const stageResult: (typeof stagesProcessed)[number] = {
        stage: stageKey,
        status: "completed",
        aiAnalysis: false,
      };

      try {
        // Initialize stage if not already started
        if (i > startIdx) {
          await initializeNextStage({
            projectId,
            stageKey,
            actorId: staff.userId,
          });
        }

        // Mark stage as processing
        await updateStageStatus(projectId, stageKey, "processing");

        // Run AI analysis for this stage
        const primaryTask = STAGE_PRIMARY_AI_TASK[stageKey];

        if (primaryTask && manuscriptFileId) {
          // All other stages use Claude via processAiJob
          try {
            const { jobId } = await requestAiTask({
              orgId: project.org_id,
              projectId,
              stageKey,
              taskKey: primaryTask,
              requestedBy: staff.userId,
              sourceFileId: manuscriptFileId,
              sourceFileVersion: manuscriptFileVersion ?? undefined,
            });

            await processAiJob({
              jobId,
              projectId,
              stageKey,
              taskKey: primaryTask,
              context: {
                project_id: projectId,
                stage_key: stageKey,
                source_file_id: manuscriptFileId,
                source_file_version: manuscriptFileVersion,
                requested_by: staff.userId,
              },
            });

            stageResult.aiAnalysis = true;
            stageResult.aiTask = primaryTask;
          } catch (aiError) {
            console.warn(`[pipeline/run] AI analysis failed for ${stageKey}/${primaryTask}:`, aiError);
            // Continue pipeline even if AI fails for this stage
          }
        }

        // Approve the stage
        await approveStage({ projectId, stageKey, actorId: staff.userId });

        // Log workflow event
        await logWorkflowEvent({
          orgId: project.org_id,
          projectId,
          stageKey,
          eventType: "stage_completed",
          actorId: staff.userId,
          actorRole: staff.role,
          payload: { via: "automated_pipeline", aiTask: stageResult.aiTask ?? null },
        });

        // Advance to next stage
        const nextStage = getNextStage(stageKey);
        if (nextStage) {
          await advanceProjectStage(projectId, nextStage);
          currentStage = nextStage;
        } else {
          // Last stage — mark project as completed
          const { getAdminClient } = await import("@/lib/leads/helpers");
          const supabase = getAdminClient();
          await supabase
            .from("editorial_projects")
            .update({ status: "completed", progress_percent: 100 })
            .eq("id", projectId);
        }

        stagesProcessed.push(stageResult);
      } catch (stageError) {
        const errorMsg = stageError instanceof Error ? stageError.message : "Error desconocido";
        console.error(`[pipeline/run] Stage ${stageKey} failed:`, stageError);
        stagesProcessed.push({
          stage: stageKey,
          status: "failed",
          error: errorMsg,
        });
        // Stop pipeline on failure
        break;
      }
    }

    // Log the full pipeline run
    await logEditorialActivity(projectId, "automated_pipeline_completed", {
      actorId: staff.userId,
      actorType: "staff",
      payload: {
        stagesProcessed: stagesProcessed.length,
        startedAt: currentStage,
        completedAll: stagesProcessed.every((s) => s.status === "completed"),
      },
    });

    const allCompleted = stagesProcessed.every((s) => s.status === "completed");

    return NextResponse.json({
      success: true,
      completed: allCompleted,
      stagesProcessed,
      message: allCompleted
        ? "Pipeline editorial completado con AI en todas las etapas. El libro está listo para publicar."
        : `Pipeline procesó ${stagesProcessed.filter((s) => s.status === "completed").length} de ${EDITORIAL_STAGE_KEYS.length} etapas.`,
    });
  } catch (error) {
    console.error("[pipeline/run] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
