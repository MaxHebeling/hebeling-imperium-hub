// =============================================================================
// Quality Scoring Engine
// Reino Editorial AI Engine · Phase 5C
// =============================================================================
// Reads the quality check results for a job run from editorial_ai_quality_checks
// and computes 4 aggregate scores that are persisted to editorial_ai_quality_scores.
//
// Score types:
//   overall          – weighted average of all check scores
//   trust            – reliability of the AI output (schema + severity + citation)
//   actionability    – how actionable the findings are (citation + scope + schema)
//   precision_proxy  – proxy for precision (dedup + scope + severity)
//
// Score bands: 0–40 = low | 40–70 = medium | 70–100 = high
//
// DB column mapping (problem-statement name → actual DB column):
//   job_run_id         → metadata.job_run_id (no dedicated column in scores table)
//   score_value        → score
//   score_band         → metadata.score_band
//   scoring_breakdown  → metadata.scoring_breakdown
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiJobRun,
  EditorialAiQualityCheck,
  EditorialStage,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ScoreBand = "low" | "medium" | "high";
export type ScoreType = "overall" | "trust" | "actionability" | "precision_proxy";

export interface QualityScoreResult {
  score_type: ScoreType;
  /** Normalised score in [0, 100]. */
  score: number;
  score_band: ScoreBand;
  scoring_breakdown: Record<string, number>;
}

export interface CalculateQualityScoresOutput {
  job_run_id: string;
  project_id: string;
  stage: EditorialStage;
  scores: QualityScoreResult[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads all quality check records for a job run, computes 4 aggregate scores,
 * and inserts each as a row in editorial_ai_quality_scores.
 *
 * Safe to call multiple times — each call appends new snapshot rows so that
 * the score history is preserved for trend analysis.
 *
 * @param jobRunId - UUID of the editorial_ai_job_runs row.
 */
export async function calculateQualityScores(
  jobRunId: string
): Promise<CalculateQualityScoresOutput> {
  const db = getAdminClient();

  // ── Resolve run context ───────────────────────────────────────────────────
  const jobRun = await fetchJobRun(jobRunId);

  // ── Fetch quality checks for this run ────────────────────────────────────
  const { data: checks, error: checksErr } = await db
    .from("editorial_ai_quality_checks")
    .select("check_type, score, status")
    .eq("job_run_id", jobRunId);

  if (checksErr) {
    throw new Error(
      `[quality-scoring] Failed to fetch quality checks for run ${jobRunId}: ${checksErr.message}`
    );
  }

  const checkRows = (checks ?? []) as Pick<EditorialAiQualityCheck, "check_type" | "score" | "status">[];

  // Build a score map: check_type → score (default to 0 when check is absent or failed)
  const scoreByType = buildScoreMap(checkRows);

  // ── Compute 4 score types ─────────────────────────────────────────────────
  const scores: QualityScoreResult[] = [
    computeOverall(scoreByType),
    computeTrust(scoreByType),
    computeActionability(scoreByType),
    computePrecisionProxy(scoreByType),
  ];

  // ── Persist to editorial_ai_quality_scores ────────────────────────────────
  for (const s of scores) {
    const { error } = await db.from("editorial_ai_quality_scores").insert({
      project_id: jobRun.project_id,
      stage: jobRun.stage,
      score_type: s.score_type,
      score: s.score,
      weight: SCORE_WEIGHTS[s.score_type],
      computed_at: new Date().toISOString(),
      metadata: {
        job_run_id: jobRunId,
        score_band: s.score_band,
        scoring_breakdown: s.scoring_breakdown,
      },
    });

    if (error) {
      console.error(
        `[quality-scoring] Failed to persist score "${s.score_type}": ${error.message}`
      );
    }
  }

  return {
    job_run_id: jobRunId,
    project_id: jobRun.project_id,
    stage: jobRun.stage as EditorialStage,
    scores,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score computation — each function is a pure weighted-average
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Weight of each score type when computing a cross-type parent aggregate.
 * Higher weight = more influence on composite scores.
 */
const SCORE_WEIGHTS: Record<ScoreType, number> = {
  overall: 1.0,
  trust: 0.9,
  actionability: 0.8,
  precision_proxy: 0.8,
};

/**
 * overall — equally-weighted average of all individual check scores.
 */
function computeOverall(sm: Map<string, number>): QualityScoreResult {
  const checks = [
    "schema_valid",
    "duplicate_detection",
    "scope_alignment",
    "severity_consistency",
    "policy_compliance",
    "citation_present",
  ];
  const breakdown: Record<string, number> = {};
  let sum = 0;
  let count = 0;

  for (const key of checks) {
    const v = sm.get(key);
    if (v !== undefined) {
      breakdown[key] = v;
      sum += v;
      count++;
    }
  }

  const score = count === 0 ? 0 : Math.round(sum / count);
  return { score_type: "overall", score, score_band: toBand(score), scoring_breakdown: breakdown };
}

/**
 * trust — how reliable the AI output is.
 * Components: schema_valid (40%), severity_consistency (30%), citation_present (30%).
 */
function computeTrust(sm: Map<string, number>): QualityScoreResult {
  const breakdown = {
    schema_valid: sm.get("schema_valid") ?? 0,
    severity_consistency: sm.get("severity_consistency") ?? 0,
    citation_present: sm.get("citation_present") ?? 0,
  };
  const score = Math.round(
    breakdown.schema_valid * 0.4 +
      breakdown.severity_consistency * 0.3 +
      breakdown.citation_present * 0.3
  );
  return { score_type: "trust", score, score_band: toBand(score), scoring_breakdown: breakdown };
}

/**
 * actionability — how actionable are the findings.
 * Components: citation_present (50%), scope_alignment (30%), schema_valid (20%).
 */
function computeActionability(sm: Map<string, number>): QualityScoreResult {
  const breakdown = {
    citation_present: sm.get("citation_present") ?? 0,
    scope_alignment: sm.get("scope_alignment") ?? 0,
    schema_valid: sm.get("schema_valid") ?? 0,
  };
  const score = Math.round(
    breakdown.citation_present * 0.5 +
      breakdown.scope_alignment * 0.3 +
      breakdown.schema_valid * 0.2
  );
  return {
    score_type: "actionability",
    score,
    score_band: toBand(score),
    scoring_breakdown: breakdown,
  };
}

/**
 * precision_proxy — proxy for model precision (low duplicates + aligned scope).
 * Components: duplicate_detection (50%), scope_alignment (30%), severity_consistency (20%).
 */
function computePrecisionProxy(sm: Map<string, number>): QualityScoreResult {
  const breakdown = {
    duplicate_detection: sm.get("duplicate_detection") ?? 0,
    scope_alignment: sm.get("scope_alignment") ?? 0,
    severity_consistency: sm.get("severity_consistency") ?? 0,
  };
  const score = Math.round(
    breakdown.duplicate_detection * 0.5 +
      breakdown.scope_alignment * 0.3 +
      breakdown.severity_consistency * 0.2
  );
  return {
    score_type: "precision_proxy",
    score,
    score_band: toBand(score),
    scoring_breakdown: breakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Maps a normalised score to the appropriate band label. */
function toBand(score: number): ScoreBand {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

/**
 * Converts DB rows to a Map of check_type → score.
 * Skipped checks retain their score (100 by convention — not applicable ≠ failed).
 * Rows with null scores (still pending) are excluded.
 */
function buildScoreMap(
  rows: Pick<EditorialAiQualityCheck, "check_type" | "score" | "status">[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.score !== null && row.score !== undefined) {
      map.set(row.check_type, Number(row.score));
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB lookup
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJobRun(jobRunId: string): Promise<EditorialAiJobRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .select("id, project_id, stage")
    .eq("id", jobRunId)
    .single();

  if (error || !data) {
    throw new Error(
      `[quality-scoring] Job run ${jobRunId} not found: ${error?.message ?? "no data"}`
    );
  }
  return data as EditorialAiJobRun;
}
