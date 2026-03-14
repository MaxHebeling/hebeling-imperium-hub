import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { processAiJob, fetchManuscriptContent } from "@/lib/editorial/ai/processor";
import { requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
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

/** How many AI calls to run concurrently (avoid rate-limit bursts). */
const PARALLEL_BATCH_SIZE = 4;

/**
 * POST /api/editorial/projects/[projectId]/process-all
 *
 * Optimised pipeline: downloads the manuscript ONCE, then processes all 8
 * stages in parallel batches.  Each stage runs independently — no more
 * sequential recursive chain that times out on Vercel.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  try {
    // ── 1. Validate project ──────────────────────────────────────────
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

    // ── 2. Get latest manuscript file ────────────────────────────────
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

    // ── 3. Check for already-running jobs ────────────────────────────
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

    // ── 4. Pre-fetch manuscript content ONCE ─────────────────────────
    const manuscriptText = await fetchManuscriptContent(projectId, latestFile.id);

    // ── 5. Create jobs for ALL stages up-front ───────────────────────
    const jobEntries: {
      stageKey: EditorialStageKey;
      taskKey: EditorialAiTaskKey;
      jobId: string;
    }[] = [];

    for (const stageKey of AI_STAGES) {
      const taskKey = STAGE_PRIMARY_TASK[stageKey];
      if (!taskKey) continue;

      try {
        // Mark stage as processing
        await supabase
          .from("editorial_stages")
          .update({ status: "processing", started_at: new Date().toISOString() })
          .eq("project_id", projectId)
          .eq("stage_key", stageKey);

        const result = await requestStageAiAssist({
          orgId: project.org_id,
          projectId,
          stageKey,
          taskKey,
          requestedBy: "staff",
          sourceFileId: latestFile.id,
          sourceFileVersion: latestFile.version,
        });

        jobEntries.push({ stageKey, taskKey, jobId: result.jobId });
      } catch (err) {
        console.error(`[process-all] Failed to create job for ${stageKey}:`, err);
      }
    }

    if (jobEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se pudieron crear trabajos de IA." },
        { status: 500 }
      );
    }

    // ── 6. Process all jobs in parallel batches (fire-and-forget) ────
    // We don't await this — the response returns immediately while
    // processing continues in the background.
    const processAllInBatches = async () => {
      let completedCount = 0;

      for (let i = 0; i < jobEntries.length; i += PARALLEL_BATCH_SIZE) {
        const batch = jobEntries.slice(i, i + PARALLEL_BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (entry) => {
            // Get the job details
            const { data: job } = await supabase
              .from("editorial_jobs")
              .select("id, project_id, stage_key, job_type, input_ref")
              .eq("id", entry.jobId)
              .single();

            if (!job) return;

            const context: EditorialAiJobContext =
              typeof job.input_ref === "string"
                ? JSON.parse(job.input_ref)
                : job.input_ref;

            await processAiJob({
              jobId: job.id,
              projectId: job.project_id,
              stageKey: job.stage_key as EditorialStageKey,
              taskKey: job.job_type as EditorialAiTaskKey,
              context,
              manuscriptText,
              skipAutoAdvance: true,
            });
          })
        );

        // Count successes
        for (const r of results) {
          if (r.status === "fulfilled") completedCount++;
          else console.error("[process-all] Stage failed:", r.reason);
        }
      }

      // ── 7. After all stages complete, finalize project ─────────────
      if (completedCount === jobEntries.length) {
        // All stages succeeded — mark project as completed
        await supabase
          .from("editorial_projects")
          .update({
            status: "completed",
            current_stage: "distribution",
          })
          .eq("id", projectId);

        await logWorkflowEvent({
          orgId: project.org_id,
          projectId,
          stageKey: "distribution",
          eventType: "stage_completed",
          actorId: null,
          actorRole: "system",
          payload: { autoAdvanced: true, pipelineCompleted: true, parallelMode: true },
        });

        console.log(`[process-all] Pipeline completed (parallel) for project ${projectId}: ${completedCount}/${jobEntries.length}`);
      } else {
        // Some stages failed — advance to last completed stage
        const lastCompleted = jobEntries[completedCount - 1]?.stageKey ?? "ingesta";
        await supabase
          .from("editorial_projects")
          .update({ current_stage: lastCompleted })
          .eq("id", projectId);

        console.log(`[process-all] Pipeline partial: ${completedCount}/${jobEntries.length} for project ${projectId}`);
      }
    };

    // Fire and forget — don't block the HTTP response
    processAllInBatches().catch((err) => {
      console.error("[process-all] Pipeline error:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Procesamiento paralelo iniciado: ${jobEntries.length} etapas en lotes de ${PARALLEL_BATCH_SIZE}. ~4x mas rapido.`,
      totalStages: jobEntries.length,
      batchSize: PARALLEL_BATCH_SIZE,
      jobIds: jobEntries.map((e) => e.jobId),
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
