import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiQualityCheck,
  EditorialAiQualityScore,
  CreateQualityCheckInput,
  EditorialStage,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records a quality check result for a project stage.
 */
export async function createQualityCheck(
  input: CreateQualityCheckInput
): Promise<EditorialAiQualityCheck> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_quality_checks")
    .insert({
      project_id: input.project_id,
      stage: input.stage,
      check_type: input.check_type,
      check_name: input.check_name,
      job_run_id: input.job_run_id ?? null,
      score: input.score ?? null,
      details: input.details ?? {},
      auto_resolved: input.auto_resolved ?? false,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`[editorial/quality] createQualityCheck: ${error.message}`);
  return data as EditorialAiQualityCheck;
}

/**
 * Updates the status and score of an existing quality check.
 */
export async function resolveQualityCheck(
  checkId: string,
  status: EditorialAiQualityCheck["status"],
  score?: number,
  details?: Record<string, unknown>
): Promise<EditorialAiQualityCheck> {
  const db = getAdminClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (score !== undefined) updates.score = score;
  if (details !== undefined) updates.details = details;

  const { data, error } = await db
    .from("editorial_ai_quality_checks")
    .update(updates)
    .eq("id", checkId)
    .select()
    .single();

  if (error) throw new Error(`[editorial/quality] resolveQualityCheck: ${error.message}`);
  return data as EditorialAiQualityCheck;
}

/**
 * Lists quality checks for a project, optionally filtered by stage.
 */
export async function listQualityChecks(
  projectId: string,
  stage?: EditorialStage
): Promise<EditorialAiQualityCheck[]> {
  const db = getAdminClient();

  let query = db
    .from("editorial_ai_quality_checks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query;
  if (error) {
    console.error("[editorial/quality] listQualityChecks error:", error);
    return [];
  }
  return (data ?? []) as EditorialAiQualityCheck[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality scores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves a new quality score snapshot for a project (and optional stage).
 */
export async function saveQualityScore(
  projectId: string,
  scoreType: string,
  score: number,
  options: {
    stage?: EditorialStage;
    weight?: number;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<EditorialAiQualityScore> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_quality_scores")
    .insert({
      project_id: projectId,
      stage: options.stage ?? null,
      score_type: scoreType,
      score,
      weight: options.weight ?? 1.0,
      computed_at: new Date().toISOString(),
      metadata: options.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`[editorial/quality] saveQualityScore: ${error.message}`);
  return data as EditorialAiQualityScore;
}

// Multiplier used for rounding: dividing by 100 yields 2 decimal places (e.g. 87.43).
const SCORE_PRECISION = 100;

/**
 * Computes and saves a weighted overall quality score for a project
 * by aggregating existing stage-level score rows of the given type.
 *
 * Returns the persisted aggregate score row.
 */
export async function computeAndSaveOverallScore(
  projectId: string,
  scoreType: string
): Promise<EditorialAiQualityScore | null> {
  const db = getAdminClient();

  // Fetch all stage-level scores for this project and score type
  const { data: rows, error } = await db
    .from("editorial_ai_quality_scores")
    .select("score, weight, stage")
    .eq("project_id", projectId)
    .eq("score_type", scoreType)
    .not("stage", "is", null)
    .order("computed_at", { ascending: false });

  if (error || !rows || rows.length === 0) return null;

  // Weighted average: Σ(score × weight) / Σweight
  let weightedSum = 0;
  let totalWeight = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    // Take only the most recent row per stage (query is ordered desc by computed_at)
    if (seen.has(row.stage)) continue;
    seen.add(row.stage);
    weightedSum += row.score * row.weight;
    totalWeight += row.weight;
  }

  const overall =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * SCORE_PRECISION) / SCORE_PRECISION
      : 0;

  return saveQualityScore(projectId, scoreType, overall, {
    metadata: { component_count: seen.size, total_weight: totalWeight },
  });
}

/**
 * Returns the latest score for each score type for a project.
 */
export async function getLatestScores(
  projectId: string
): Promise<EditorialAiQualityScore[]> {
  const db = getAdminClient();

  // Use a subquery approach: get all scores, then keep the latest per type+stage combo
  const { data, error } = await db
    .from("editorial_ai_quality_scores")
    .select("*")
    .eq("project_id", projectId)
    .order("computed_at", { ascending: false });

  if (error) {
    console.error("[editorial/quality] getLatestScores error:", error);
    return [];
  }

  // De-duplicate: keep first (most recent) row per (score_type, stage) pair
  const seen = new Set<string>();
  const latest: EditorialAiQualityScore[] = [];
  for (const row of (data ?? []) as EditorialAiQualityScore[]) {
    const key = `${row.score_type}:${row.stage ?? "_"}`;
    if (!seen.has(key)) {
      seen.add(key);
      latest.push(row);
    }
  }
  return latest;
}
