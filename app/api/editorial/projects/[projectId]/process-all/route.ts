import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { processAiJob } from "@/lib/editorial/ai/processor";
import { requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";

const AI_STAGES: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

const STAGE_PRIMARY_TASK: Partial<Record<EditorialStageKey, EditorialAiTaskKey>> = {
  ingesta: "manuscript_analysis",
  estructura: "structure_analysis",
  estilo: "style_suggestions",
  ortotipografia: "orthotypography_review",
  maquetacion: "layout_analysis",
  revision_final: "redline_diff",
  export: "export_validation",
  distribution: "metadata_generation",
};

/**
 * POST /api/editorial/projects/[projectId]/process-all
 * Triggers processing for the current stage. The auto-advance chain
 * in processor.ts handles moving to subsequent stages automatically.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  try {
    // Get project info
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

    const currentStage = project.current_stage as EditorialStageKey;

    // Get the latest file
    const { data: latestFile } = await supabase
      .from("editorial_files")
      .select("id, version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (!latestFile) {
      return NextResponse.json(
        { success: false, error: "No hay manuscrito subido. Sube un archivo primero." },
        { status: 400 }
      );
    }

    // Check if there are already running/queued jobs for this project
    const { data: activeJobs } = await supabase
      .from("editorial_jobs")
      .select("id, status, stage_key")
      .eq("project_id", projectId)
      .in("status", ["queued", "processing"]);

    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json(
        { success: false, error: "Ya hay trabajos de IA en proceso. Espera a que terminen." },
        { status: 409 }
      );
    }

    // Determine the primary AI task for the current stage
    const taskKey = STAGE_PRIMARY_TASK[currentStage];
    if (!taskKey) {
      return NextResponse.json(
        { success: false, error: `La etapa '${currentStage}' no tiene tarea AI configurada.` },
        { status: 400 }
      );
    }

    // Request the AI assist for the current stage - the auto-advance chain
    // in processor.ts will handle advancing to subsequent stages
    const result = await requestStageAiAssist({
      orgId: project.org_id,
      projectId,
      stageKey: currentStage,
      taskKey,
      requestedBy: "staff",
      sourceFileId: latestFile.id,
      sourceFileVersion: latestFile.version,
    });

    // Now process the job immediately (synchronous processing triggers the chain)
    // We process in background - the client will poll for status
    const jobId = result.jobId;

    // Get the job details to process
    const { data: job } = await supabase
      .from("editorial_jobs")
      .select("id, project_id, stage_key, job_type, input_ref")
      .eq("id", jobId)
      .single();

    if (job) {
      // Process asynchronously - don't await, let it run in background
      const context: EditorialAiJobContext = typeof job.input_ref === "string"
        ? JSON.parse(job.input_ref)
        : job.input_ref;

      // Fire and forget - the chain will auto-advance
      processAiJob({
        jobId: job.id,
        projectId: job.project_id,
        stageKey: job.stage_key as EditorialStageKey,
        taskKey: job.job_type as EditorialAiTaskKey,
        context,
      }).catch((err) => {
        console.error("[process-all] Error processing job:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Procesamiento completo iniciado. La IA procesara todas las etapas automaticamente.",
      startedAt: currentStage,
      jobId: result.jobId,
    });
  } catch (err) {
    console.error("[process-all] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editorial/projects/[projectId]/process-all
 * Returns the status of all stages and their AI jobs for progress tracking.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  // Get project current stage
  const { data: project } = await supabase
    .from("editorial_projects")
    .select("current_stage, status")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json(
      { success: false, error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  // Get all stages
  const { data: stages } = await supabase
    .from("editorial_stages")
    .select("stage_key, status, started_at, completed_at, ai_summary")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Get all AI jobs for this project (latest per stage+task)
  const { data: jobs } = await supabase
    .from("editorial_jobs")
    .select("id, stage_key, job_type, status, output_ref, error_log, finished_at, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Build a map of stage -> latest jobs
  const stageJobs: Record<string, { jobType: string; status: string; result: unknown; error: string | null }[]> = {};
  const seenStageTask = new Set<string>();

  for (const job of (jobs ?? [])) {
    const key = `${job.stage_key}:${job.job_type}`;
    if (seenStageTask.has(key)) continue;
    seenStageTask.add(key);

    const sk = job.stage_key as string;
    if (!stageJobs[sk]) stageJobs[sk] = [];

    let parsedResult = null;
    if (job.output_ref) {
      try {
        parsedResult = typeof job.output_ref === "string" ? JSON.parse(job.output_ref) : job.output_ref;
      } catch { /* ignore */ }
    }

    stageJobs[sk].push({
      jobType: job.job_type,
      status: job.status,
      result: parsedResult,
      error: job.error_log,
    });
  }

  // Check if pipeline is currently processing
  const isProcessing = (jobs ?? []).some(
    (j) => j.status === "queued" || j.status === "processing"
  );

  // Build stage summaries
  const stageSummaries = AI_STAGES.map((stageKey) => {
    const stageData = (stages ?? []).find((s) => s.stage_key === stageKey);
    const stageJobList = stageJobs[stageKey] ?? [];

    return {
      stageKey,
      status: stageData?.status ?? "pending",
      aiSummary: stageData?.ai_summary ?? null,
      startedAt: stageData?.started_at ?? null,
      completedAt: stageData?.completed_at ?? null,
      jobs: stageJobList,
    };
  });

  return NextResponse.json({
    success: true,
    currentStage: project.current_stage,
    projectStatus: project.status,
    isProcessing,
    stages: stageSummaries,
  });
}
