// =============================================================================
// Quality Pipeline — Orchestrator
// Reino Editorial AI Engine · Phase 5C
// =============================================================================
// runQualityPipeline() is the single entry-point for the entire quality and
// governance layer. It coordinates the 5-step flow in strict order and emits
// a 'quality_pipeline_completed' audit event on completion.
//
// Flow:
//   1. Run quality checks  (→ editorial_ai_quality_checks)
//   2. Calculate scores    (→ editorial_ai_quality_scores)
//   3. Evaluate policies   (→ editorial_ai_queue_items when policies fire)
//   4. (Queue routing is handled transparently inside step 3)
//   5. Record audit event  (→ editorial_ai_audit_events)
//
// Integration with Phase 5B (ai-runner.ts):
//   Call runQualityPipeline() immediately after runEditorialAiAnalysis() returns
//   its RunAnalysisResult, passing the same findings array produced by parsing
//   the raw_content of the AI response.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { EditorialAiFinding, EditorialAiJobRun } from "@/types/editorial";
import { runQualityChecks, type RunQualityChecksOutput } from "./quality-checks";
import { calculateQualityScores, type CalculateQualityScoresOutput } from "./quality-scoring";
import {
  evaluatePolicies,
  type EvaluatePoliciesOutput,
} from "@/lib/editorial/ai/governance/policy-engine";
import { createAiAuditEvent } from "@/lib/editorial/ai/audit/audit-service";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RunQualityPipelineOutput {
  job_run_id: string;
  project_id: string;
  /** Aggregated results from the 6 automated checks. */
  quality_checks: RunQualityChecksOutput;
  /** The 4 computed quality scores. */
  quality_scores: CalculateQualityScoresOutput;
  /** Policy evaluation results and queue routing outcomes. */
  policy_evaluation: EvaluatePoliciesOutput;
  /** ID of the audit event emitted on pipeline completion. */
  audit_event_id: string | null;
  /** Whether all checks passed at the 'high' band threshold (score ≥ 70). */
  passed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes the complete quality and governance pipeline for a job run.
 *
 * Safe to call after `runEditorialAiAnalysis()` — pass the findings parsed
 * from the AI response. The pipeline is non-blocking with respect to the AI
 * runner: failures in individual steps are logged but do not prevent the
 * remaining steps from executing.
 *
 * @param jobRunId  - UUID of the editorial_ai_job_runs row.
 * @param findings  - AI findings to validate and route.
 */
export async function runQualityPipeline(
  jobRunId: string,
  findings: EditorialAiFinding[]
): Promise<RunQualityPipelineOutput> {
  // ── Resolve run context for the audit event ───────────────────────────────
  const { project_id, org_id } = await fetchRunContext(jobRunId);

  const pipelineStart = Date.now();

  // ── Step 1: Quality Checks ────────────────────────────────────────────────
  let checksOutput: RunQualityChecksOutput;
  try {
    checksOutput = await runQualityChecks(jobRunId, findings);
  } catch (err) {
    console.error("[quality-pipeline] runQualityChecks failed:", err);
    // Provide a minimal stub so the pipeline can continue
    checksOutput = buildEmptyChecksOutput(jobRunId, project_id, findings);
  }

  // ── Step 2: Quality Scoring ───────────────────────────────────────────────
  let scoresOutput: CalculateQualityScoresOutput;
  try {
    scoresOutput = await calculateQualityScores(jobRunId);
  } catch (err) {
    console.error("[quality-pipeline] calculateQualityScores failed:", err);
    scoresOutput = buildEmptyScoresOutput(jobRunId, project_id, checksOutput);
  }

  // ── Step 3 & 4: Policy Evaluation + Queue Routing ────────────────────────
  let policyOutput: EvaluatePoliciesOutput;
  try {
    policyOutput = await evaluatePolicies(jobRunId, findings);
  } catch (err) {
    console.error("[quality-pipeline] evaluatePolicies failed:", err);
    policyOutput = buildEmptyPolicyOutput(jobRunId, org_id, findings);
  }

  // ── Step 5: Audit Event ───────────────────────────────────────────────────
  const overallScore =
    scoresOutput.scores.find((s) => s.score_type === "overall")?.score ?? null;
  const passed = overallScore !== null && overallScore >= 70;
  const durationMs = Date.now() - pipelineStart;

  let auditEventId: string | null = null;
  try {
    const event = await createAiAuditEvent({
      org_id,
      project_id,
      stage_key: checksOutput.stage,
      entity_type: "job_run",
      entity_id: jobRunId,
      event_type: "quality_pipeline_completed",
      actor_type: "system",
      event_payload: {
        duration_ms: durationMs,
        findings_count: findings.length,
        overall_score: overallScore,
        passed,
        checks_summary: checksOutput.summary,
        policy_summary: policyOutput.summary,
      },
    });
    auditEventId = event.id;
  } catch (err) {
    console.error("[quality-pipeline] Failed to emit audit event:", err);
  }

  return {
    job_run_id: jobRunId,
    project_id,
    quality_checks: checksOutput,
    quality_scores: scoresOutput,
    policy_evaluation: policyOutput,
    audit_event_id: auditEventId,
    passed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback stubs — used when a step fails so the pipeline can complete
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyChecksOutput(
  jobRunId: string,
  projectId: string,
  findings: EditorialAiFinding[]
): RunQualityChecksOutput {
  const stage = findings[0]?.stage ?? "ingesta";
  return {
    job_run_id: jobRunId,
    project_id: projectId,
    stage,
    check_ids: [],
    results: [],
    summary: {
      total_checks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      skipped: 0,
    },
  };
}

function buildEmptyScoresOutput(
  jobRunId: string,
  projectId: string,
  checks: RunQualityChecksOutput
): CalculateQualityScoresOutput {
  return {
    job_run_id: jobRunId,
    project_id: projectId,
    stage: checks.stage,
    scores: [],
  };
}

function buildEmptyPolicyOutput(
  jobRunId: string,
  orgId: string,
  findings: EditorialAiFinding[]
): EvaluatePoliciesOutput {
  return {
    job_run_id: jobRunId,
    org_id: orgId,
    matches: [],
    summary: {
      findings_evaluated: findings.length,
      policies_evaluated: 0,
      total_matches: 0,
      blocked: 0,
      require_approval: 0,
      flagged: 0,
      warned: 0,
      auto_accepted: 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DB lookup
// ─────────────────────────────────────────────────────────────────────────────

async function fetchRunContext(
  jobRunId: string
): Promise<{ project_id: string; org_id: string }> {
  const db = getAdminClient();

  const { data: run, error: runErr } = await db
    .from("editorial_ai_job_runs")
    .select("project_id")
    .eq("id", jobRunId)
    .single();

  if (runErr || !run) {
    throw new Error(
      `[quality-pipeline] Job run ${jobRunId} not found: ${runErr?.message ?? "no data"}`
    );
  }

  const { data: project, error: projErr } = await db
    .from("editorial_projects")
    .select("org_id")
    .eq("id", (run as EditorialAiJobRun).project_id)
    .single();

  if (projErr || !project) {
    throw new Error(
      `[quality-pipeline] Could not resolve org_id for project ${(run as EditorialAiJobRun).project_id}`
    );
  }

  return {
    project_id: (run as EditorialAiJobRun).project_id,
    org_id: (project as { org_id: string }).org_id,
  };
}
