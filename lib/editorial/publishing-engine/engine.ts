/**
 * Reino Editorial AI Publishing Engine — Core Service
 *
 * Orchestrates the 13-phase editorial pipeline.
 * Connects to existing editorial_stages + editorial_jobs tables.
 */

import { getAdminClient } from "@/lib/leads/helpers";
import {
  PUBLISHING_PHASES,
  getPhaseDefinition,
  getNextPhase,
  legacyStageToPhaseKey,
  calculateProgressPercent,
  AUTHOR_TIMELINE_12_DAYS,
} from "./constants";
import type {
  PublishingPhaseKey,
  PhaseStatus,
  PipelineState,
  PhaseState,
  PhaseFinding,
  PhasePromptOverride,
  AmazonFormatConfig,
  AuthorTimelineDay,
} from "./types";
import { processAiJob, fetchManuscriptContent } from "@/lib/editorial/ai/processor";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialAnyStageKey } from "@/lib/editorial/types/editorial";
import {
  mapPipelineStageToProjectStage,
  resolvePipelineStageKey,
} from "@/lib/editorial/pipeline/stage-compat";

// ─── Get full pipeline state for a project ──────────────────────────

export async function getPipelineState(
  projectId: string
): Promise<PipelineState> {
  const supabase = getAdminClient();

  const { data: project } = await supabase
    .from("editorial_projects")
    .select(
      "id, current_stage, status, progress_percent, created_at, updated_at"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return {
      projectId,
      status: "idle",
      currentPhaseKey: null,
      currentPhaseIndex: 0,
      totalPhases: PUBLISHING_PHASES.length,
      completedPhases: 0,
      progressPercent: 0,
      phases: buildEmptyPhases(),
      startedAt: null,
      completedAt: null,
      error: null,
    };
  }

  // Map legacy stage to 13-phase key
  const currentPhaseKey = legacyStageToPhaseKey(
    resolvePipelineStageKey(
      (project.current_stage ?? "recepcion") as EditorialAnyStageKey
    )
  );
  const currentPhaseDef = getPhaseDefinition(currentPhaseKey);
  const currentPhaseIndex = currentPhaseDef?.order ?? 1;

  // Get all jobs for this project to populate phase results
  const { data: jobs } = await supabase
    .from("editorial_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Get all stages for this project
  const { data: stages } = await supabase
    .from("editorial_stages")
    .select("*")
    .eq("project_id", projectId);

  const isCompleted = project.status === "completed";
  const isRunning =
    project.status === "processing" || project.status === "active";

  // Build phase states from jobs + stages
  const phases: PhaseState[] = PUBLISHING_PHASES.map((phaseDef) => {
    const projectStageKey = mapPipelineStageToProjectStage(phaseDef.legacyStageKey);
    const stage = (stages ?? []).find(
      (s: Record<string, unknown>) =>
        s.stage_key === projectStageKey
    );
    const phaseJobs = (jobs ?? []).filter(
      (j: Record<string, unknown>) =>
        j.stage_key === phaseDef.legacyStageKey &&
        j.status === "succeeded"
    );

    // Determine status
    let status: PhaseStatus = "pending";
    if (isCompleted) {
      status = "completed";
    } else if (phaseDef.order < currentPhaseIndex) {
      status = "completed";
    } else if (phaseDef.order === currentPhaseIndex) {
      const stageStatus = (
        stage as Record<string, unknown> | null
      )?.status as string | undefined;
      if (stageStatus === "completed" || stageStatus === "approved")
        status = "completed";
      else if (stageStatus === "processing" || stageStatus === "queued")
        status = "processing";
      else if (stageStatus === "review_required")
        status = "needs_review";
      else if (stageStatus === "failed") status = "failed";
      else status = "processing";
    }

    // Parse latest job output for summary/score/findings
    let summary: string | null = null;
    let score: number | null = null;
    const findings: PhaseFinding[] = [];
    let jobId: string | null = null;
    const processingTimeMs: number | null = null;

    if (phaseJobs.length > 0) {
      const latestJob = phaseJobs[phaseJobs.length - 1] as Record<
        string,
        unknown
      >;
      jobId = (latestJob.id as string) ?? null;
      try {
        const output = JSON.parse(
          (latestJob.output_ref as string) ?? "{}"
        );
        summary = output.summary ?? null;
        score = output.score ?? output.readiness_score ?? null;
        if (output.issues && Array.isArray(output.issues)) {
          for (const issue of output.issues) {
            findings.push({
              type: issue.type ?? "suggestion",
              description: issue.description ?? "",
              location: issue.location ?? null,
              correction:
                issue.suggestion ?? issue.correction ?? null,
              confidence: issue.confidence ?? null,
            });
          }
        }
      } catch {
        summary = "Resultado procesado.";
      }
    }

    const stageRecord = stage as Record<string, unknown> | null;

    return {
      key: phaseDef.key,
      status,
      order: phaseDef.order,
      label: phaseDef.label,
      summary,
      score,
      findings,
      aiProvider: phaseDef.aiProvider,
      processingTimeMs,
      startedAt: (stageRecord?.started_at as string) ?? null,
      completedAt: (stageRecord?.completed_at as string) ?? null,
      jobId,
    };
  });

  const completedPhases = phases.filter(
    (p) => p.status === "completed"
  ).length;
  const progressPercent = isCompleted
    ? 100
    : calculateProgressPercent(currentPhaseKey);

  return {
    projectId,
    status: isCompleted ? "completed" : isRunning ? "running" : "idle",
    currentPhaseKey,
    currentPhaseIndex,
    totalPhases: PUBLISHING_PHASES.length,
    completedPhases,
    progressPercent,
    phases,
    startedAt: project.created_at ?? null,
    completedAt: isCompleted ? (project.updated_at ?? null) : null,
    error: null,
  };
}

// ─── Build empty phase states ─────────────────────────────────────

function buildEmptyPhases(): PhaseState[] {
  return PUBLISHING_PHASES.map((p) => ({
    key: p.key,
    status: "pending" as PhaseStatus,
    order: p.order,
    label: p.label,
    summary: null,
    score: null,
    findings: [],
    aiProvider: p.aiProvider,
    processingTimeMs: null,
    startedAt: null,
    completedAt: null,
    jobId: null,
  }));
}

// ─── Advance to a specific phase ─────────────────────────────────

export async function advanceToPhase(
  projectId: string,
  targetPhaseKey: PublishingPhaseKey
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  const phase = getPhaseDefinition(targetPhaseKey);
  if (!phase) return { success: false, error: "Fase no encontrada" };

  const progress = calculateProgressPercent(targetPhaseKey);

  // Update project stage and progress
  const { error } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapPipelineStageToProjectStage(phase.legacyStageKey),
      progress_percent: progress,
      status:
        phase.order === PUBLISHING_PHASES.length
          ? "completed"
          : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };

  // Update editorial_stages statuses — deduplicate by legacy key
  const uniqueLegacyKeys = [
    ...new Set(PUBLISHING_PHASES.map((p) => p.legacyStageKey)),
  ];
  for (const legacyKey of uniqueLegacyKeys) {
    const phasesForKey = PUBLISHING_PHASES.filter(
      (p) => p.legacyStageKey === legacyKey
    );
    const maxOrder = Math.max(...phasesForKey.map((p) => p.order));
    const minOrder = Math.min(...phasesForKey.map((p) => p.order));

    let stageStatus: string;
    if (maxOrder < phase.order) {
      stageStatus = "completed";
    } else if (
      minOrder <= phase.order &&
      maxOrder >= phase.order
    ) {
      stageStatus = "processing";
    } else {
      stageStatus = "pending";
    }

    await supabase
      .from("editorial_stages")
      .update({
        status: stageStatus,
        ...(stageStatus === "processing"
          ? { started_at: new Date().toISOString() }
          : {}),
        ...(stageStatus === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("project_id", projectId)
      .eq("stage_key", mapPipelineStageToProjectStage(legacyKey));
  }

  // Log activity
  await supabase.from("editorial_activity_log").insert({
    project_id: projectId,
    event_type: "phase_advanced",
    actor_type: "staff",
    payload: { targetPhaseKey, progress },
  });

  return { success: true };
}

// ─── Execute AI for a single phase ───────────────────────────────

export async function executePhaseAi(
  projectId: string,
  phaseKey: PublishingPhaseKey,
  /** Pre-fetched manuscript text to avoid re-downloading per phase */
  manuscriptText?: string
): Promise<{
  success: boolean;
  result?: PhaseState;
  error?: string;
}> {
  const phase = getPhaseDefinition(phaseKey);
  if (!phase) return { success: false, error: "Fase no encontrada" };
  if (!phase.aiTaskKey)
    return {
      success: false,
      error: "Esta fase no tiene tarea IA configurada",
    };

  const supabase = getAdminClient();
  const startTime = Date.now();

  // Create a job row
  const { data: job, error: jobError } = await supabase
    .from("editorial_jobs")
    .insert({
      project_id: projectId,
      stage_key: phase.legacyStageKey,
      job_type: phase.aiTaskKey,
      status: "queued",
      provider:
        phase.aiProvider === "internal"
          ? "openai"
          : phase.aiProvider === "human"
            ? "openai"
            : phase.aiProvider,
    })
    .select()
    .single();

  if (jobError || !job) {
    return {
      success: false,
      error: jobError?.message ?? "Error creando job",
    };
  }

  // Mark stage as processing
  await supabase
    .from("editorial_stages")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("stage_key", mapPipelineStageToProjectStage(phase.legacyStageKey));

  // ── Actually execute the AI job inline ──
  try {
    const analysisResult = await processAiJob({
      jobId: job.id as string,
      projectId,
      stageKey: phase.legacyStageKey,
      taskKey: phase.aiTaskKey as EditorialAiTaskKey,
      context: {
        project_id: projectId,
        stage_key: phase.legacyStageKey,
        source_file_id: null,
        source_file_version: null,
        requested_by: "system",
      },
      manuscriptText,
      skipAutoAdvance: true, // We handle advancement ourselves
    });

    const elapsed = Date.now() - startTime;
    const findings: PhaseFinding[] = [];

    if (analysisResult?.issues) {
      for (const issue of analysisResult.issues) {
        findings.push({
          type: issue.type ?? "suggestion",
          description: issue.description ?? "",
          location: issue.location ?? null,
          correction: issue.suggestion ?? null,
          confidence: null,
        });
      }
    }

    return {
      success: true,
      result: {
        key: phase.key,
        status: "completed",
        order: phase.order,
        label: phase.label,
        summary: analysisResult?.summary ?? "Procesado correctamente.",
        score: analysisResult?.score ?? null,
        findings,
        aiProvider: phase.aiProvider,
        processingTimeMs: elapsed,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        jobId: job.id as string,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido al ejecutar IA";
    return {
      success: false,
      error: errorMsg,
      result: {
        key: phase.key,
        status: "failed",
        order: phase.order,
        label: phase.label,
        summary: null,
        score: null,
        findings: [],
        aiProvider: phase.aiProvider,
        processingTimeMs: Date.now() - startTime,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        jobId: job.id as string,
      },
    };
  }
}

// ─── Run full AI pipeline ────────────────────────────────────────

export async function runFullAiPipeline(
  projectId: string
): Promise<{
  success: boolean;
  results: Array<{
    phaseKey: PublishingPhaseKey;
    success: boolean;
    error?: string;
    durationMs?: number;
  }>;
}> {
  const aiPhases = PUBLISHING_PHASES.filter(
    (p) => p.isAiAutomated && p.aiTaskKey
  );
  const results: Array<{
    phaseKey: PublishingPhaseKey;
    success: boolean;
    error?: string;
    durationMs?: number;
  }> = [];

  // Pre-fetch manuscript once and share across all phases
  let manuscriptText: string | undefined;
  try {
    manuscriptText = await fetchManuscriptContent(projectId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "No se pudo obtener el manuscrito";
    return {
      success: false,
      results: [{ phaseKey: aiPhases[0]?.key ?? "manuscript_received", success: false, error: msg }],
    };
  }

  // Mark project as processing
  const supabase = getAdminClient();
  await supabase
    .from("editorial_projects")
    .update({ status: "processing" })
    .eq("id", projectId);

  // Execute each AI phase sequentially (with the pre-fetched manuscript)
  for (const phase of aiPhases) {
    const phaseStart = Date.now();
    const result = await executePhaseAi(projectId, phase.key, manuscriptText);
    results.push({
      phaseKey: phase.key,
      success: result.success,
      error: result.error,
      durationMs: Date.now() - phaseStart,
    });

    // Update progress after each phase
    const progress = calculateProgressPercent(phase.key);
    await supabase
      .from("editorial_projects")
      .update({
        current_stage: mapPipelineStageToProjectStage(phase.legacyStageKey),
        progress_percent: progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  }

  // Mark project as completed if all succeeded
  const allSucceeded = results.every((r) => r.success);
  await supabase
    .from("editorial_projects")
    .update({
      status: allSucceeded ? "completed" : "active",
      progress_percent: allSucceeded ? 100 : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  return { success: allSucceeded, results };
}

// ─── Save prompt override for a phase ────────────────────────────

export async function savePhasePrompt(
  projectId: string,
  phaseKey: PublishingPhaseKey,
  prompt: string,
  userId: string | null
): Promise<PhasePromptOverride> {
  const override: PhasePromptOverride = {
    id: crypto.randomUUID(),
    projectId,
    phaseKey,
    promptType: "override",
    prompt,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };

  const supabase = getAdminClient();

  // Try to save in editorial_custom_prompts first
  try {
    await supabase.from("editorial_custom_prompts").insert({
      project_id: projectId,
      stage_key: getPhaseDefinition(phaseKey)?.legacyStageKey ?? null,
      prompt_type: "override",
      prompt_content: prompt,
      is_active: true,
      created_by: userId,
    });
  } catch {
    // Fallback: save in activity log
    await supabase.from("editorial_activity_log").insert({
      project_id: projectId,
      stage_key:
        getPhaseDefinition(phaseKey)?.legacyStageKey ?? null,
      event_type: "prompt_edit",
      actor_id: userId,
      actor_type: "staff",
      payload: { phaseKey, prompt },
    });
  }

  return override;
}

// ─── Get prompt history for a phase ──────────────────────────────

export async function getPhasePromptHistory(
  projectId: string,
  phaseKey: PublishingPhaseKey
): Promise<PhasePromptOverride[]> {
  const supabase = getAdminClient();

  // Try editorial_custom_prompts first
  try {
    const { data: prompts } = await supabase
      .from("editorial_custom_prompts")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage_key", phaseKey)
      .order("created_at", { ascending: false });

    if (prompts && prompts.length > 0) {
      return prompts.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        projectId: p.project_id as string,
        phaseKey: p.stage_key as PublishingPhaseKey,
        promptType:
          (p.prompt_type as "system" | "user" | "override") ??
          "override",
        prompt: p.prompt_content as string,
        createdAt: p.created_at as string,
        createdBy: (p.created_by as string) ?? null,
      }));
    }
  } catch {
    // Table might not exist — fall through to activity log
  }

  // Fallback: read from activity log
  const { data } = await supabase
    .from("editorial_activity_log")
    .select("*")
    .eq("project_id", projectId)
    .eq("event_type", "prompt_edit")
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((d: Record<string, unknown>) => {
      const payload = d.payload as Record<string, unknown> | null;
      return payload?.phaseKey === phaseKey;
    })
    .map((d: Record<string, unknown>) => {
      const payload = d.payload as Record<string, unknown>;
      return {
        id: d.id as string,
        projectId: d.project_id as string,
        phaseKey:
          (payload.phaseKey as PublishingPhaseKey) ?? phaseKey,
        promptType: "override" as const,
        prompt: (payload.prompt as string) ?? "",
        createdAt: d.created_at as string,
        createdBy: (d.actor_id as string) ?? null,
      };
    });
}

// ─── Save Amazon format config ───────────────────────────────────

export async function saveAmazonConfig(
  projectId: string,
  config: AmazonFormatConfig
): Promise<{ success: boolean }> {
  const supabase = getAdminClient();
  await supabase.from("editorial_activity_log").insert({
    project_id: projectId,
    event_type: "amazon_config",
    actor_type: "staff",
    payload: config as unknown as Record<string, unknown>,
  });
  return { success: true };
}

// ─── Get Author Timeline (12 days) ──────────────────────────────

export async function getAuthorTimeline(
  projectId: string
): Promise<AuthorTimelineDay[]> {
  const pipeline = await getPipelineState(projectId);

  const supabase = getAdminClient();
  const { data: project } = await supabase
    .from("editorial_projects")
    .select("created_at")
    .eq("id", projectId)
    .maybeSingle();

  const createdAt = project?.created_at as string | undefined;
  const daysSinceCreation = createdAt
    ? Math.floor(
        (Date.now() - new Date(createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  return AUTHOR_TIMELINE_12_DAYS.map((day) => {
    let status: AuthorTimelineDay["status"];

    if (pipeline.status === "completed") {
      status = "completed";
    } else if (daysSinceCreation >= day.day + 1) {
      status = "completed";
    } else if (daysSinceCreation >= day.day) {
      status = "in_progress";
    } else if (daysSinceCreation >= day.day - 1) {
      status = "upcoming";
    } else {
      status = "pending";
    }

    return { ...day, status };
  });
}
