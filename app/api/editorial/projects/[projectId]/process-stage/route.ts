import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { processAiJob, fetchManuscriptContent } from "@/lib/editorial/ai/processor";
import { requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { mapPipelineStageToProjectStage } from "@/lib/editorial/pipeline/stage-compat";

// Each stage call should complete well within Vercel's timeout (10-60s)
export const maxDuration = 60;

const STAGE_PRIMARY_TASK: Partial<Record<EditorialPipelineStageKey, EditorialAiTaskKey>> = {
  ingesta: "manuscript_analysis",
  estructura: "structure_analysis",
  estilo: "style_suggestions",
  ortotipografia: "orthotypography_review",
  maquetacion: "layout_analysis",
  revision_final: "redline_diff",
  export: "export_validation",
  distribution: "metadata_generation",
};

const STAGE_ORDER: EditorialPipelineStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

/**
 * POST /api/editorial/projects/[projectId]/process-stage
 *
 * Processes a SINGLE editorial stage with AI. Designed to complete within
 * Vercel's serverless timeout (~10-30s per stage).
 *
 * The frontend calls this endpoint sequentially for each stage, updating
 * the UI after each response. This avoids the Vercel timeout that killed
 * the old "process all 8 stages in one request" approach.
 *
 * Body: { stageKey: string }
 *
 * After processing, the endpoint updates:
 * - editorial_stages status → "completed"
 * - editorial_projects.current_stage → the processed stage
 * - editorial_projects.progress_percent → based on stage position
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  try {
    await requireStaff();

    // Parse request body
    const body = await req.json();
    const stageKey = body.stageKey as EditorialPipelineStageKey;
    const projectStageKey = mapPipelineStageToProjectStage(stageKey);

    if (!stageKey || !STAGE_ORDER.includes(stageKey)) {
      return NextResponse.json(
        { success: false, error: `Etapa inválida: ${stageKey}` },
        { status: 400 }
      );
    }

    const taskKey = STAGE_PRIMARY_TASK[stageKey];
    if (!taskKey) {
      return NextResponse.json(
        { success: false, error: `No hay tarea IA definida para la etapa: ${stageKey}` },
        { status: 400 }
      );
    }

    // Validate project exists
    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select("id, org_id, current_stage, status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const latestFile = await getLatestManuscriptForProject(projectId);
    if (!latestFile?.file) {
      return NextResponse.json(
        { success: false, error: "No hay manuscrito subido. Sube un archivo primero." },
        { status: 400 }
      );
    }

    // Check if this specific stage already has a running job
    const { data: activeJobs } = await supabase
      .from("editorial_jobs")
      .select("id")
      .eq("project_id", projectId)
      .eq("stage_key", stageKey)
      .in("status", ["queued", "processing"]);

    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json(
        { success: false, error: `La etapa ${stageKey} ya tiene un trabajo IA en proceso.` },
        { status: 409 }
      );
    }

    // Mark stage as processing
    await supabase
      .from("editorial_stages")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("stage_key", projectStageKey);

    // Create the AI job
    const jobResult = await requestStageAiAssist({
      orgId: project.org_id,
      projectId,
      stageKey,
      taskKey,
      requestedBy: "staff",
      sourceFileId: latestFile.file.id,
      sourceFileVersion: latestFile.file.version,
    });

    // Fetch manuscript content
    const manuscriptText = await fetchManuscriptContent(projectId, latestFile.file.id);

    // Process the job — this is the actual AI call (~10-30s)
    const jobStart = Date.now();
    let analysisResult = null;

    try {
      analysisResult = await processAiJob({
        jobId: jobResult.jobId,
        projectId,
        stageKey,
        taskKey,
        context: {
          project_id: projectId,
          stage_key: stageKey,
          source_file_id: latestFile.file.id,
          source_file_version: latestFile.file.version,
          requested_by: "staff",
        },
        manuscriptText,
        skipAutoAdvance: true, // We handle advancement ourselves below
      });
    } catch (jobErr) {
      const errMsg = jobErr instanceof Error ? jobErr.message : "Error desconocido";
      console.error(`[process-stage] Job failed for ${stageKey}: ${errMsg}`);

      // Mark stage as failed
      await supabase
        .from("editorial_stages")
        .update({ status: "failed" })
        .eq("project_id", projectId)
        .eq("stage_key", stageKey);

      return NextResponse.json({
        success: false,
        error: `Error procesando ${stageKey}: ${errMsg}`,
        stageKey,
        jobId: jobResult.jobId,
      }, { status: 500 });
    }

    const durationMs = Date.now() - jobStart;

    // Mark this stage as completed in editorial_stages
    await supabase
      .from("editorial_stages")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("stage_key", projectStageKey);

    // Also mark all previous stages as completed (in case they were skipped)
    const stageIndex = STAGE_ORDER.indexOf(stageKey);
    if (stageIndex > 0) {
      const previousStages = STAGE_ORDER
        .slice(0, stageIndex)
        .map((value) => mapPipelineStageToProjectStage(value));
      await supabase
        .from("editorial_stages")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .in("stage_key", previousStages)
        .neq("status", "completed");
    }

    // Update current_stage and progress_percent on the project
    const progressPercent = Math.round(((stageIndex + 1) / STAGE_ORDER.length) * 100);

    await supabase
      .from("editorial_projects")
      .update({
        current_stage: projectStageKey,
        progress_percent: progressPercent,
        status: stageKey === "distribution" ? "completed" : "processing",
      })
      .eq("id", projectId);

    // Log the stage completion
    try {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey,
        eventType: "stage_completed",
        actorId: null,
        actorRole: "system",
        payload: {
          stageByStage: true,
          durationMs,
          jobId: jobResult.jobId,
          hasResult: analysisResult !== null,
        },
      });
    } catch {
      // Non-blocking
    }

    console.log(
      `[process-stage] ${stageKey} completed in ${Math.round(durationMs / 1000)}s for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      stageKey,
      jobId: jobResult.jobId,
      durationMs,
      progressPercent,
      result: analysisResult ? {
        summary: analysisResult.summary,
        score: analysisResult.score,
        issueCount: analysisResult.issues?.length ?? 0,
      } : null,
    });
  } catch (err) {
    console.error("[process-stage] Error:", err);
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
