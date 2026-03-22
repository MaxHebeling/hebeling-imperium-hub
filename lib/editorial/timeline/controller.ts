import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialPipelineStageKey } from "../types/editorial";
import type {
  ClientTimelineState,
  ClientTimelineStageView,
  ClientArtifactView,
  StageArtifact,
  TimelineOverrideType,
} from "./types";
import { JOURNEY_STAGES, JOURNEY_STAGE_MAP, JOURNEY_TOTAL_DAYS } from "./journey-config";

// ---------------------------------------------------------------------------
// Timeline initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the client timeline for a project.
 * Creates one row per stage with the correct visible_day schedule.
 * Called when a project first starts processing.
 */
export async function initializeTimeline(
  projectId: string,
  projectStartDate?: string
): Promise<boolean> {
  const supabase = getAdminClient();

  // Check if timeline already exists
  const { data: existing } = await supabase
    .from("client_editorial_timeline")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (existing && existing.length > 0) {
    return true; // Already initialized
  }

  const startDate = projectStartDate ? new Date(projectStartDate) : new Date();

  const rows = JOURNEY_STAGES.map((stage) => {
    const scheduledAt = new Date(startDate);
    scheduledAt.setDate(scheduledAt.getDate() + stage.day - 1);

    return {
      project_id: projectId,
      stage_key: stage.stageKey,
      visible_day: stage.day,
      status: stage.day === 1 ? "active" : "locked",
      title: stage.clientTitle,
      message: stage.day === 1 ? stage.activeMessage : null,
      scheduled_at: scheduledAt.toISOString(),
      revealed_at: stage.day === 1 ? new Date().toISOString() : null,
    };
  });

  const { error } = await supabase
    .from("client_editorial_timeline")
    .insert(rows);

  if (error) {
    console.error("[timeline] init error:", error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Timeline state computation
// ---------------------------------------------------------------------------

/**
 * Get the full client-visible timeline state for a project.
 * Computes which stages are visible based on elapsed days and overrides.
 */
export async function getClientTimeline(
  projectId: string
): Promise<ClientTimelineState | null> {
  const supabase = getAdminClient();

  // Fetch project info
  const { data: project } = await supabase
    .from("editorial_projects")
    .select("id, title, author_name, created_at, current_stage, status")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  // Fetch timeline entries
  const { data: entries } = await supabase
    .from("client_editorial_timeline")
    .select("*")
    .eq("project_id", projectId)
    .order("visible_day", { ascending: true });

  // Fetch visible artifacts
  const { data: artifacts } = await supabase
    .from("editorial_stage_artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_visible_to_client", true);

  // Fetch overrides
  const { data: overrides } = await supabase
    .from("editorial_timeline_overrides")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Check for pause override
  const isPaused = checkIfPaused(overrides ?? []);

  // If no timeline entries yet, compute from scratch
  const startDate = project.created_at;
  const now = new Date();
  const start = new Date(startDate);
  const currentDay = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Build stage views
  const stages: ClientTimelineStageView[] = JOURNEY_STAGES.map((config) => {
    const entry = entries?.find((e: Record<string, unknown>) => e.stage_key === config.stageKey);
    const stageArtifacts = (artifacts ?? [])
      .filter((a: Record<string, unknown>) => a.stage_key === config.stageKey)
      .map(mapArtifactToClientView);

    // Determine status based on current day and overrides
    let status: "locked" | "upcoming" | "active" | "completed" = "locked";
    let message = "";
    let progress = 0;

    if (entry) {
      status = entry.status as "locked" | "upcoming" | "active" | "completed";
      message = entry.message ?? "";
    } else {
      // Compute from day if no entry
      const hasEarlyReveal = (overrides ?? []).some(
        (o: Record<string, unknown>) => o.override_type === "reveal_early" && o.stage_key === config.stageKey
      );
      const hasCompleteOverride = (overrides ?? []).some(
        (o: Record<string, unknown>) => o.override_type === "complete_stage" && o.stage_key === config.stageKey
      );

      if (hasCompleteOverride) {
        status = "completed";
        message = config.completedMessage;
        progress = 100;
      } else if (currentDay >= config.day || hasEarlyReveal) {
        // Check if next stage is revealed
        const nextStage = JOURNEY_STAGES.find((s) => s.day > config.day);
        if (nextStage && (currentDay >= nextStage.day || hasCompleteOverride)) {
          status = "completed";
          message = config.completedMessage;
          progress = 100;
        } else {
          status = "active";
          message = config.activeMessage;
          progress = Math.min(95, Math.round(((currentDay - config.day) / 2) * 50));
        }
      } else if (currentDay >= config.day - 1) {
        status = "upcoming";
        message = config.description;
      }
    }

    return {
      stageKey: config.stageKey,
      day: config.day,
      title: config.clientTitle,
      message,
      status,
      progress,
      artifacts: stageArtifacts,
      icon: config.icon,
    };
  });

  // Calculate overall progress
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const activeStages = stages.filter((s) => s.status === "active").length;
  const overallProgress = Math.min(
    100,
    Math.round(((completedStages + activeStages * 0.5) / JOURNEY_STAGES.length) * 100)
  );

  return {
    projectId: project.id,
    projectTitle: project.title,
    authorName: project.author_name,
    startDate,
    currentDay: Math.min(currentDay, JOURNEY_TOTAL_DAYS),
    totalDays: JOURNEY_TOTAL_DAYS,
    overallProgress,
    isPaused,
    stages,
  };
}

// ---------------------------------------------------------------------------
// Timeline auto-advance (call from cron or on page load)
// ---------------------------------------------------------------------------

/**
 * Auto-advance the timeline based on elapsed days.
 * Updates status of entries that should be revealed.
 */
export async function advanceTimeline(projectId: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: project } = await supabase
    .from("editorial_projects")
    .select("id, created_at, current_stage")
    .eq("id", projectId)
    .single();

  if (!project) return;

  // Check if paused
  const { data: overrides } = await supabase
    .from("editorial_timeline_overrides")
    .select("*")
    .eq("project_id", projectId);

  if (checkIfPaused(overrides ?? [])) return;

  const now = new Date();
  const start = new Date(project.created_at);
  const currentDay = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const { data: entries } = await supabase
    .from("client_editorial_timeline")
    .select("*")
    .eq("project_id", projectId)
    .order("visible_day", { ascending: true });

  if (!entries) return;

  for (const entry of entries) {
    const config = JOURNEY_STAGE_MAP[entry.stage_key as EditorialPipelineStageKey];
    if (!config) continue;

    const entryDay = entry.visible_day as number;
    const entryStatus = entry.status as string;

    if (entryStatus === "completed") continue;

    if (currentDay >= entryDay && entryStatus === "locked") {
      // Reveal this stage
      await supabase
        .from("client_editorial_timeline")
        .update({
          status: "active",
          message: config.activeMessage,
          revealed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", entry.id);
    }

    // Check if the next stage has been revealed — if so, mark this one completed
    const nextConfig = JOURNEY_STAGES.find((s) => s.day > entryDay);
    if (nextConfig && currentDay >= nextConfig.day && entryStatus === "active") {
      await supabase
        .from("client_editorial_timeline")
        .update({
          status: "completed",
          message: config.completedMessage,
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", entry.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Staff overrides
// ---------------------------------------------------------------------------

/** Apply a staff override to the timeline. */
export async function applyTimelineOverride(
  projectId: string,
  overrideType: TimelineOverrideType,
  staffId: string,
  stageKey?: EditorialPipelineStageKey | null,
  payload?: Record<string, unknown> | null,
  reason?: string | null
): Promise<boolean> {
  const supabase = getAdminClient();

  // Insert override record
  const { error: insertError } = await supabase
    .from("editorial_timeline_overrides")
    .insert({
      project_id: projectId,
      override_type: overrideType,
      stage_key: stageKey ?? null,
      payload: payload ?? null,
      reason: reason ?? null,
      created_by: staffId,
    });

  if (insertError) {
    console.error("[timeline] override insert error:", insertError.message);
    return false;
  }

  // Apply the override
  const now = new Date().toISOString();

  switch (overrideType) {
    case "reveal_early": {
      if (!stageKey) break;
      await supabase
        .from("client_editorial_timeline")
        .update({
          status: "active",
          message: JOURNEY_STAGE_MAP[stageKey]?.activeMessage ?? "",
          revealed_at: now,
          updated_at: now,
        })
        .eq("project_id", projectId)
        .eq("stage_key", stageKey)
        .in("status", ["locked", "upcoming"]);
      break;
    }

    case "complete_stage": {
      if (!stageKey) break;
      await supabase
        .from("client_editorial_timeline")
        .update({
          status: "completed",
          message: JOURNEY_STAGE_MAP[stageKey]?.completedMessage ?? "",
          completed_at: now,
          updated_at: now,
        })
        .eq("project_id", projectId)
        .eq("stage_key", stageKey);
      break;
    }

    case "send_message": {
      if (!stageKey || !payload?.message) break;
      await supabase
        .from("client_editorial_timeline")
        .update({
          message: payload.message as string,
          updated_at: now,
        })
        .eq("project_id", projectId)
        .eq("stage_key", stageKey);
      break;
    }

    case "pause":
    case "resume":
    case "skip":
    case "set_day":
      // These are recorded but don't need immediate DB updates
      // The pause/resume logic is handled by checkIfPaused
      break;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Artifact management
// ---------------------------------------------------------------------------

/** Create or attach an artifact to a stage. */
export async function createArtifact(params: {
  projectId: string;
  stageKey: EditorialPipelineStageKey;
  artifactType: string;
  title: string;
  description?: string | null;
  storagePath?: string | null;
  thumbnailPath?: string | null;
  metadata?: Record<string, unknown> | null;
  isVisibleToClient?: boolean;
  createdBy?: string | null;
}): Promise<StageArtifact | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_stage_artifacts")
    .insert({
      project_id: params.projectId,
      stage_key: params.stageKey,
      artifact_type: params.artifactType,
      title: params.title,
      description: params.description ?? null,
      storage_path: params.storagePath ?? null,
      thumbnail_path: params.thumbnailPath ?? null,
      metadata: params.metadata ?? null,
      is_visible_to_client: params.isVisibleToClient ?? false,
      created_by: params.createdBy ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[timeline] artifact create error:", error.message);
    return null;
  }

  return mapArtifactRow(data);
}

/** Get all artifacts for a project (staff view includes all, client view only visible). */
export async function getArtifacts(
  projectId: string,
  clientOnly: boolean = false
): Promise<StageArtifact[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from("editorial_stage_artifacts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (clientOnly) {
    query = query.eq("is_visible_to_client", true);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map(mapArtifactRow);
}

/** Toggle artifact visibility for client. */
export async function toggleArtifactVisibility(
  artifactId: string,
  visible: boolean
): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("editorial_stage_artifacts")
    .update({ is_visible_to_client: visible })
    .eq("id", artifactId);
  return !error;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checkIfPaused(overrides: Array<Record<string, unknown>>): boolean {
  let paused = false;
  for (const o of overrides) {
    if (o.override_type === "pause") paused = true;
    if (o.override_type === "resume") paused = false;
  }
  return paused;
}

function mapArtifactRow(row: Record<string, unknown>): StageArtifact {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    stageKey: row.stage_key as EditorialPipelineStageKey,
    artifactType: row.artifact_type as StageArtifact["artifactType"],
    title: row.title as string,
    description: (row.description as string) ?? null,
    storagePath: (row.storage_path as string) ?? null,
    thumbnailPath: (row.thumbnail_path as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    isVisibleToClient: row.is_visible_to_client as boolean,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapArtifactToClientView(row: Record<string, unknown>): ClientArtifactView {
  return {
    id: row.id as string,
    type: row.artifact_type as ClientArtifactView["type"],
    title: row.title as string,
    description: (row.description as string) ?? null,
    thumbnailUrl: (row.thumbnail_path as string) ?? null,
    downloadUrl: (row.storage_path as string) ?? null,
  };
}
