/**
 * AI Publishing Engine — Core Service
 *
 * Orchestrates the 9-phase editorial pipeline.
 * Connects to existing editorial_stages + editorial_jobs tables.
 */

import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import { PUBLISHING_PHASES, getPhaseDefinition, getNextPhase } from "./constants";
import type {
  PublishingPhaseKey,
  PhaseStatus,
  PipelineRun,
  PhaseResult,
  PhasePromptEdit,
  AmazonFormatConfig,
} from "./types";

// ─── Get pipeline status for a project ───────────────────────────────

export async function getPipelineStatus(projectId: string): Promise<PipelineRun> {
  const supabase = getAdminClient();

  const { data: project } = await supabase
    .from("editorial_projects")
    .select("id, current_stage, status, progress_percent, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return {
      id: projectId,
      projectId,
      status: "idle",
      currentPhaseKey: null,
      currentPhaseIndex: 0,
      totalPhases: PUBLISHING_PHASES.length,
      completedPhases: 0,
      startedAt: null,
      completedAt: null,
      error: null,
    };
  }

  // Map legacy stage to publishing phase
  const currentPhase = PUBLISHING_PHASES.find((p) => p.legacyStageKey === project.current_stage);
  const currentPhaseKey = currentPhase?.key ?? "manuscript_intake";
  const currentPhaseIndex = currentPhase?.order ?? 1;

  // Count completed phases based on progress
  const completedPhases = PUBLISHING_PHASES.filter(
    (p) => p.order < currentPhaseIndex
  ).length;

  const isCompleted = project.status === "completed";
  const isRunning = project.status === "processing" || project.status === "active";

  return {
    id: projectId,
    projectId,
    status: isCompleted ? "completed" : isRunning ? "running" : "idle",
    currentPhaseKey: currentPhaseKey as PublishingPhaseKey,
    currentPhaseIndex,
    totalPhases: PUBLISHING_PHASES.length,
    completedPhases: isCompleted ? PUBLISHING_PHASES.length : completedPhases,
    startedAt: project.created_at,
    completedAt: isCompleted ? project.updated_at : null,
    error: null,
  };
}

// ─── Get all phase results for a project ─────────────────────────────

export async function getPhaseResults(projectId: string): Promise<PhaseResult[]> {
  const supabase = getAdminClient();

  // Get all jobs for this project
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

  const results: PhaseResult[] = [];

  for (const phase of PUBLISHING_PHASES) {
    // Find the matching stage
    const stage = (stages ?? []).find((s) => s.stage_key === phase.legacyStageKey);
    // Find completed jobs for this stage
    const stageJobs = (jobs ?? []).filter(
      (j) => j.stage_key === phase.legacyStageKey && j.status === "succeeded"
    );

    if (!stage && stageJobs.length === 0) continue;

    // Parse the latest job output
    let summary = "";
    let score: number | null = null;
    const findings: PhaseResult["findings"] = [];

    if (stageJobs.length > 0) {
      const latestJob = stageJobs[stageJobs.length - 1];
      try {
        const output = JSON.parse(latestJob.output_ref ?? "{}");
        summary = output.summary ?? "";
        score = output.score ?? null;
        if (output.issues) {
          for (const issue of output.issues) {
            findings.push({
              type: issue.type ?? "suggestion",
              description: issue.description ?? "",
              location: issue.location ?? null,
              correction: issue.suggestion ?? null,
              confidence: null,
            });
          }
        }
      } catch {
        summary = "Resultado procesado.";
      }
    }

    const stageStatus = stage?.status ?? "pending";
    let phaseStatus: PhaseStatus = "pending";
    if (stageStatus === "completed" || stageStatus === "approved") phaseStatus = "completed";
    else if (stageStatus === "processing" || stageStatus === "queued") phaseStatus = "processing";
    else if (stageStatus === "review_required") phaseStatus = "needs_review";
    else if (stageStatus === "failed") phaseStatus = "failed";

    results.push({
      phaseKey: phase.key,
      status: phaseStatus,
      summary: summary || phase.completionMessageTemplate,
      score,
      findings,
      outputFiles: [],
      aiProvider: phase.aiProvider,
      processingTimeMs: 0,
      startedAt: stage?.started_at ?? "",
      completedAt: stage?.completed_at ?? null,
    });
  }

  return results;
}

// ─── Advance to next phase ───────────────────────────────────────────

export async function advanceToPhase(
  projectId: string,
  targetPhaseKey: PublishingPhaseKey
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  const phase = getPhaseDefinition(targetPhaseKey);
  if (!phase) return { success: false, error: "Fase no encontrada" };

  // Calculate progress
  const progress = Math.round((phase.order / PUBLISHING_PHASES.length) * 100);

  // Update project stage and progress
  const { error } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: phase.legacyStageKey,
      progress_percent: progress,
      status: phase.order === PUBLISHING_PHASES.length ? "completed" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };

  // Update editorial_stages statuses
  for (const p of PUBLISHING_PHASES) {
    const status =
      p.order < phase.order
        ? "completed"
        : p.order === phase.order
        ? "processing"
        : "pending";

    await supabase
      .from("editorial_stages")
      .update({
        status,
        ...(status === "processing" ? { started_at: new Date().toISOString() } : {}),
        ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq("project_id", projectId)
      .eq("stage_key", p.legacyStageKey);
  }

  return { success: true };
}

// ─── Save prompt edit for a phase ────────────────────────────────────

export async function savePhasePrompt(
  projectId: string,
  phaseKey: PublishingPhaseKey,
  prompt: string,
  userId: string | null
): Promise<PhasePromptEdit> {
  const edit: PhasePromptEdit = {
    id: crypto.randomUUID(),
    projectId,
    phaseKey,
    prompt,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };

  // Store in activity log for now (no dedicated table needed)
  const supabase = getAdminClient();
  await supabase.from("editorial_activity_log").insert({
    project_id: projectId,
    stage_key: getPhaseDefinition(phaseKey)?.legacyStageKey ?? null,
    event_type: "prompt_edit",
    actor_id: userId,
    actor_type: "staff",
    payload: { phaseKey, prompt },
  });

  return edit;
}

// ─── Get prompt history for a phase ──────────────────────────────────

export async function getPhasePromptHistory(
  projectId: string,
  phaseKey: PublishingPhaseKey
): Promise<PhasePromptEdit[]> {
  const supabase = getAdminClient();
  const phase = getPhaseDefinition(phaseKey);

  const { data } = await supabase
    .from("editorial_activity_log")
    .select("*")
    .eq("project_id", projectId)
    .eq("event_type", "prompt_edit")
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((d) => {
      const payload = d.payload as Record<string, unknown> | null;
      return payload?.phaseKey === phaseKey;
    })
    .map((d) => {
      const payload = d.payload as Record<string, unknown>;
      return {
        id: d.id,
        projectId: d.project_id,
        phaseKey: (payload.phaseKey as PublishingPhaseKey) ?? phaseKey,
        prompt: (payload.prompt as string) ?? "",
        createdAt: d.created_at,
        createdBy: d.actor_id,
      };
    });
}

// ─── Save Amazon format config ───────────────────────────────────────

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

// ─── Get Author Timeline (12 days) ──────────────────────────────────

export async function getAuthorTimeline(projectId: string) {
  const pipeline = await getPipelineStatus(projectId);
  const { AUTHOR_TIMELINE_12_DAYS } = await import("./constants");

  // Calculate which day the project is on based on creation date
  const { data: project } = getAdminClient()
    .from("editorial_projects")
    .select("created_at")
    .eq("id", projectId)
    .maybeSingle();

  const createdAt = (await project)?.data?.created_at;
  const daysSinceCreation = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  return AUTHOR_TIMELINE_12_DAYS.map((day) => {
    // Determine status based on pipeline progress and day number
    let status: "completed" | "in_progress" | "upcoming" | "pending";

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
