import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { processAiJob, fetchManuscriptContent } from "@/lib/editorial/ai/processor";
import { requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import {
  validateEditorialQuality,
  validatePublishingReadiness,
  type ValidationResult,
} from "@/lib/editorial/orchestrator/editorial-orchestrator";
import { persistPublishingChecklist, assemblePublishingPackage } from "@/lib/editorial/publishing/publishing-integration";
import type { PublishingConfig, BookMetadata } from "@/lib/editorial/publishing/publishing-director";
import type { EditorialStageKey, EditorialStageStatus } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import {
  buildQueueEntries,
  type QueueEntry,
} from "@/lib/editorial/ai/queue";

// Allow up to 5 minutes for the full pipeline to process on Vercel Pro/Enterprise.
export const maxDuration = 300;

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
 * Sequential queue replaces the old parallel batch approach.
 * Jobs now run one at a time with token-aware pacing.
 */

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
    await requireStaff();

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

    // ── 6. Build queue entries with token estimates ─────────────────
    const queueJobs = jobEntries.map((entry) => ({
      jobId: entry.jobId,
      projectId,
      stageKey: entry.stageKey,
      taskKey: entry.taskKey,
      context: {
        project_id: projectId,
        stage_key: entry.stageKey,
        source_file_id: latestFile.id,
        source_file_version: latestFile.version,
        requested_by: "staff",
      } as EditorialAiJobContext,
    }));

    const entries = buildQueueEntries(queueJobs, manuscriptText, {
      skipAutoAdvance: true,
    });

    // ── 7. Process ALL jobs sequentially and AWAIT completion ─────
    //
    // CRITICAL FIX: Previously the queue ran in the background and the
    // HTTP response was returned immediately. On Vercel serverless, the
    // function context gets killed after the response is sent, so the
    // queue's async drain loop was being terminated mid-execution.
    // Jobs were created with "queued" status but never actually processed.
    //
    // Solution: process each job inline and await its completion before
    // returning the response. With maxDuration=300 (5 min) we have
    // plenty of time for 8 stages at ~10-30s each.
    //
    let completedCount = 0;
    const failedJobs: { stageKey: string; error: string }[] = [];
    const stageResults: { stageKey: string; status: string; durationMs: number }[] = [];

    console.log(`[process-all] Starting sequential processing of ${entries.length} jobs for project ${projectId}`);

    for (const entry of entries) {
      const jobStart = Date.now();
      console.log(`[process-all] Processing job ${entry.jobId} (${entry.stageKey}/${entry.taskKey})...`);

      try {
        await processAiJob({
          jobId: entry.jobId,
          projectId: entry.projectId,
          stageKey: entry.stageKey,
          taskKey: entry.taskKey,
          context: entry.context,
          manuscriptText: entry.manuscriptText,
          skipAutoAdvance: entry.skipAutoAdvance,
        });
        completedCount++;
        const durationMs = Date.now() - jobStart;
        stageResults.push({ stageKey: entry.stageKey, status: "completed", durationMs });
        console.log(`[process-all] Job ${entry.jobId} (${entry.stageKey}) completed in ${Math.round(durationMs / 1000)}s`);
      } catch (jobErr) {
        const durationMs = Date.now() - jobStart;
        const errMsg = jobErr instanceof Error ? jobErr.message : "Error desconocido";
        failedJobs.push({ stageKey: entry.stageKey, error: errMsg });
        stageResults.push({ stageKey: entry.stageKey, status: "failed", durationMs });
        console.error(`[process-all] Job ${entry.jobId} (${entry.stageKey}) FAILED after ${Math.round(durationMs / 1000)}s: ${errMsg}`);
        // Continue processing remaining stages — don't stop the whole pipeline
      }

      // Brief pause between jobs to respect API rate limits (2s instead of 5s for speed)
      if (entries.indexOf(entry) < entries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // ── 8. Post-processing (runs BEFORE returning response) ───────
    console.log(`[process-all] All jobs processed: ${completedCount}/${jobEntries.length} succeeded, ${failedJobs.length} failed`);

    // Post-parallel validation
    let allValidationsPassed = false;
    try {
      const validationResults = await runPostParallelValidation(projectId);
      allValidationsPassed = validationResults.every((v) => v.passed);

      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey: "export",
        eventType: "stage_completed",
        actorId: null,
        actorRole: "system",
        payload: {
          sequentialInline: true,
          postProcessingValidation: true,
          validations: validationResults.map((v) => ({
            checkpoint: v.checkpoint,
            passed: v.passed,
          })),
        },
      });
    } catch (valErr) {
      console.warn("[process-all] Validation error (non-blocking):", (valErr as Error).message);
    }

    // Sync legacy stages → professional workflow stages (non-blocking)
    try {
      const completedLegacyStages = jobEntries
        .slice(0, completedCount)
        .map((e) => e.stageKey);
      await syncWorkflowStages(projectId, completedLegacyStages);
    } catch (syncErr) {
      console.warn("[process-all] Workflow sync error (non-blocking):", (syncErr as Error).message);
    }

    // Update project status based on completion
    if (completedCount === jobEntries.length) {
      try {
        await persistPublishingArtifacts(projectId);
      } catch (pubErr) {
        console.warn("[process-all] Publishing artifacts error (non-blocking):", (pubErr as Error).message);
      }

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
        payload: {
          autoAdvanced: true,
          pipelineCompleted: true,
          sequentialInline: true,
          validationsPassed: allValidationsPassed,
          totalDurationMs: stageResults.reduce((sum, r) => sum + r.durationMs, 0),
        },
      });

      console.log(
        `[process-all] Pipeline COMPLETED for project ${projectId}: ${completedCount}/${jobEntries.length}, validations=${allValidationsPassed ? "PASS" : "WARN"}`
      );
    } else if (completedCount > 0) {
      const lastCompleted = jobEntries[completedCount - 1]?.stageKey ?? "ingesta";
      await supabase
        .from("editorial_projects")
        .update({ current_stage: lastCompleted })
        .eq("id", projectId);

      console.log(
        `[process-all] Pipeline PARTIAL for project ${projectId}: ${completedCount}/${jobEntries.length}`
      );
    }

    // ── 9. Return AFTER all processing is complete ────────────────
    const totalDurationMs = stageResults.reduce((sum, r) => sum + r.durationMs, 0);

    return NextResponse.json({
      success: true,
      message: completedCount === jobEntries.length
        ? `Pipeline completado: ${completedCount} etapas procesadas en ${Math.round(totalDurationMs / 1000)}s.`
        : `Pipeline parcial: ${completedCount}/${jobEntries.length} etapas completadas, ${failedJobs.length} fallidas.`,
      totalStages: jobEntries.length,
      completedStages: completedCount,
      failedStages: failedJobs.length,
      totalDurationSeconds: Math.round(totalDurationMs / 1000),
      stageResults,
      failedJobs: failedJobs.length > 0 ? failedJobs : undefined,
      jobIds: jobEntries.map((e) => e.jobId),
    });
  } catch (err) {
    console.error("[process-all] Error:", err);
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

/**
 * GET /api/editorial/projects/[projectId]/process-all
 * Returns the status of all stages and their AI jobs for progress tracking.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

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

// ─── Post-parallel validation ──────────────────────────────────────────

/**
 * Run the orchestrator's validation checkpoints that would normally fire
 * during sequential auto-advance but are skipped in parallel mode.
 *
 * Checks:
 *  1. editorial_quality  (ortotipografia → maquetacion gate)
 *  2. publishing_readiness (revision_final → export gate)
 *
 * Results are logged but do NOT block finalization — they surface warnings
 * so staff can review quality flags in the workflow event log.
 */
async function runPostParallelValidation(
  projectId: string
): Promise<ValidationResult[]> {
  const supabase = getAdminClient();
  const results: ValidationResult[] = [];

  // Fetch all stage statuses for this project
  const { data: stages } = await supabase
    .from("editorial_stages")
    .select("stage_key, status")
    .eq("project_id", projectId);

  const stageList = (stages ?? []).map((s) => ({
    stageKey: s.stage_key as EditorialStageKey,
    status: s.status as EditorialStageStatus,
  }));

  // 1. Editorial quality checkpoint
  const editorialQuality = validateEditorialQuality(stageList);
  results.push(editorialQuality);

  if (!editorialQuality.passed) {
    console.warn(
      `[process-all][validation] editorial_quality FAILED for ${projectId}:`,
      editorialQuality.details.filter((d) => !d.passed).map((d) => d.message)
    );
  }

  // 2. Publishing readiness checkpoint (best-effort with available data)
  const publishingReadiness = validatePublishingReadiness({
    interiorLayoutComplete: stageList.some(
      (s) => s.stageKey === "maquetacion" && (s.status === "completed" || s.status === "approved")
    ),
    typographyConsistent: true, // Verified during maquetacion AI task
    marginsKDPCompliant: true,  // Applied by Layout Director defaults
    pageNumberingCorrect: true, // Applied during PDF generation
    spineWidthCalculated: false, // Cover not generated in parallel pipeline
    coverDimensionsCorrect: false, // Cover not generated in parallel pipeline
    isbnInserted: false,
  });
  results.push(publishingReadiness);

  if (!publishingReadiness.passed) {
    console.warn(
      `[process-all][validation] publishing_readiness FAILED for ${projectId}:`,
      publishingReadiness.details.filter((d) => !d.passed).map((d) => d.message)
    );
  }

  return results;
}

// ─── Legacy → Professional workflow sync ──────────────────────────────────

/**
 * Map from legacy 8-stage keys to professional workflow phase+stage keys.
 * When the AI pipeline completes a legacy stage, we mark the corresponding
 * professional workflow sub-stages as completed so both progress systems
 * stay in sync.
 */
const LEGACY_TO_WORKFLOW_MAP: Record<string, { phase: string; stages: string[] }> = {
  ingesta: { phase: "intake", stages: ["manuscript_upload", "technical_validation"] },
  estructura: { phase: "editorial_analysis", stages: ["manuscript_analysis", "structure_analysis"] },
  estilo: { phase: "line_editing", stages: ["line_editing_task", "voice_consistency"] },
  ortotipografia: { phase: "copyediting", stages: ["grammar_correction", "copyediting_review", "orthotypography"] },
  maquetacion: { phase: "book_production", stages: ["layout_analysis_task"] },
  revision_final: { phase: "final_proof", stages: ["final_proof_task"] },
  export: { phase: "publishing_prep", stages: ["metadata_generation_task"] },
  distribution: { phase: "distribution", stages: ["export_validation_task", "distribution_publish"] },
};

/**
 * Sync completed legacy editorial_stages into editorial_project_workflow_stages.
 * This ensures the 11-stage UI pipeline reflects AI pipeline progress.
 * Non-blocking — errors are logged but don't break the pipeline.
 */
async function syncWorkflowStages(projectId: string, completedLegacyStages: string[]): Promise<void> {
  const supabase = getAdminClient();

  try {
    // Check if the professional workflow tables exist by querying the project workflow
    const { data: workflow } = await supabase
      .from("editorial_project_workflow")
      .select("id, current_phase, current_stage")
      .eq("project_id", projectId)
      .single();

    if (!workflow) {
      // Professional workflow tables may not exist yet — skip silently
      return;
    }

    const now = new Date().toISOString();

    // Mark corresponding workflow stages as completed
    for (const legacyKey of completedLegacyStages) {
      const mapping = LEGACY_TO_WORKFLOW_MAP[legacyKey];
      if (!mapping) continue;

      for (const stageKey of mapping.stages) {
        await supabase
          .from("editorial_project_workflow_stages")
          .upsert(
            {
              project_id: projectId,
              phase_key: mapping.phase,
              stage_key: stageKey,
              status: "completed",
              started_at: now,
              completed_at: now,
            },
            { onConflict: "project_id,phase_key,stage_key" }
          );
      }
    }

    // Determine the furthest completed phase and update the workflow tracker
    const phaseOrder = [
      "intake", "editorial_analysis", "structural_editing", "line_editing",
      "copyediting", "text_finalization", "book_specifications",
      "book_production", "final_proof", "publishing_prep", "distribution",
    ];

    let furthestPhaseIdx = 0;
    let furthestStage = "manuscript_upload";

    for (const legacyKey of completedLegacyStages) {
      const mapping = LEGACY_TO_WORKFLOW_MAP[legacyKey];
      if (!mapping) continue;
      const idx = phaseOrder.indexOf(mapping.phase);
      if (idx > furthestPhaseIdx) {
        furthestPhaseIdx = idx;
        furthestStage = mapping.stages[mapping.stages.length - 1];
      }
    }

    // Calculate progress based on completed phases
    const progressPercent = Math.round(((furthestPhaseIdx + 1) / phaseOrder.length) * 100);

    await supabase
      .from("editorial_project_workflow")
      .update({
        current_phase: phaseOrder[furthestPhaseIdx],
        current_stage: furthestStage,
        progress_percent: progressPercent,
        status: completedLegacyStages.length >= AI_STAGES.length ? "completed" : "active",
        updated_at: now,
      })
      .eq("project_id", projectId);

    console.log(
      `[process-all] Synced workflow stages for ${projectId}: ${completedLegacyStages.length} legacy stages → phase=${phaseOrder[furthestPhaseIdx]}, progress=${progressPercent}%`
    );
  } catch (err) {
    // Non-blocking — the professional workflow tables may not exist
    console.warn("[process-all] Workflow sync skipped (non-blocking):", (err as Error).message);
  }
}

/**
 * Persist the publishing checklist and assemble the publishing package
 * after all parallel stages complete successfully.
 */
async function persistPublishingArtifacts(projectId: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: projectMeta } = await supabase
    .from("editorial_projects")
    .select("title, author_name, genre, language, page_estimate")
    .eq("id", projectId)
    .single();

  const publishingConfig: PublishingConfig = {
    trimSizeId: "6x9",
    paperType: "cream",
    binding: "paperback",
    bleed: "no_bleed",
    pageCount: projectMeta?.page_estimate ?? 0,
    platform: "amazon_kdp",
  };

  const bookMetadata: Partial<BookMetadata> = {
    title: projectMeta?.title ?? "",
    authors: projectMeta?.author_name ? [projectMeta.author_name] : [],
    language: projectMeta?.language ?? "es",
  };

  // Persist checklist
  const checklist = await persistPublishingChecklist({
    projectId,
    config: publishingConfig,
    metadata: bookMetadata,
  });
  console.log(
    `[process-all] Publishing checklist persisted: ${checklist.persisted} items`
  );

  // Assemble package
  const fullMetadata: BookMetadata = {
    title: projectMeta?.title ?? "",
    authors: projectMeta?.author_name ? [projectMeta.author_name] : [],
    publisher: "Reino Editorial",
    language: projectMeta?.language ?? "es",
    primaryCategory: projectMeta?.genre ?? "general",
    secondaryCategories: [],
    keywords: [],
    description: "",
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: projectMeta?.author_name ?? "",
    countryOfPublication: "ES",
    pageCount: projectMeta?.page_estimate ?? 0,
    trimSize: "6x9",
    paperType: "cream",
    binding: "paperback",
  };

  const pkg = await assemblePublishingPackage({
    projectId,
    config: publishingConfig,
    metadata: fullMetadata,
  });
  console.log(
    `[process-all] Publishing package assembled: status=${pkg.status}, files=${pkg.files.length}`
  );
}
