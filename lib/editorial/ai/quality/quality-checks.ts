// =============================================================================
// Quality Checks Engine
// Reino Editorial AI Engine · Phase 5C
// =============================================================================
// Runs the 6 automated quality checks against the AI findings produced by a
// job run. Each check writes exactly one row to editorial_ai_quality_checks
// (per check_type, for the whole batch). Per-finding detail is stored in the
// `details` JSONB since the table has no dedicated finding_id column.
//
// DB column mapping (problem-statement name → actual DB column):
//   finding_id   → details.finding_id   (no DB column)
//   check_source → details.check_source (no DB column)
//   score        → score                (numeric 0–100)
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiFinding,
  EditorialAiJobRun,
  EditorialAiPolicy,
  EditorialAiQualityCheck,
  EditorialStage,
  AiQualityCheckStatus,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_SOURCE = "system" as const;

/** Finding types considered "structural" — must have a location_ref. */
const STRUCTURAL_FINDING_TYPES = new Set([
  "grammar",
  "syntax",
  "structure",
  "ortography",
  "citation",
  "reference",
  "consistency",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PerFindingResult {
  finding_id: string;
  passed: boolean;
  reason?: string;
}

export interface CheckResult {
  check_type: string;
  check_name: string;
  status: AiQualityCheckStatus;
  /** Normalised score in [0, 100]. */
  score: number;
  details: {
    check_source: typeof CHECK_SOURCE;
    findings_total: number;
    findings_passed: number;
    findings_failed: number;
    per_finding: PerFindingResult[];
    [key: string]: unknown;
  };
}

export interface RunQualityChecksOutput {
  job_run_id: string;
  project_id: string;
  stage: EditorialStage;
  /** IDs of the editorial_ai_quality_checks rows inserted. */
  check_ids: string[];
  results: CheckResult[];
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes all 6 automated quality checks for the findings produced by a
 * given job run. Writes one `editorial_ai_quality_checks` row per check and
 * returns a structured summary.
 *
 * @param jobRunId  - UUID of the editorial_ai_job_runs row.
 * @param findings  - AI findings to validate (should all belong to the same
 *                    project / stage as the job run).
 */
export async function runQualityChecks(
  jobRunId: string,
  findings: EditorialAiFinding[]
): Promise<RunQualityChecksOutput> {
  const db = getAdminClient();
  const jobRun = await fetchJobRun(jobRunId);
  const orgId = await fetchOrgId(jobRun.project_id);

  // ── Fetch active policies for policy_compliance check ────────────────────
  const activePolicies = await fetchActivePolicies(orgId, jobRun.stage as EditorialStage);

  // ── Run each check ────────────────────────────────────────────────────────
  const checkResults: CheckResult[] = [
    runSchemaValidCheck(findings),
    runDuplicateDetectionCheck(findings),
    runScopeAlignmentCheck(findings, jobRun.stage as EditorialStage),
    runSeverityConsistencyCheck(findings),
    runPolicyComplianceCheck(findings, activePolicies),
    runCitationPresentCheck(findings),
  ];

  // ── Persist to DB ─────────────────────────────────────────────────────────
  const checkIds: string[] = [];
  for (const result of checkResults) {
    const { data, error } = await db
      .from("editorial_ai_quality_checks")
      .insert({
        project_id: jobRun.project_id,
        job_run_id: jobRunId,
        stage: jobRun.stage,
        check_type: result.check_type,
        check_name: result.check_name,
        status: result.status,
        score: result.score,
        details: result.details,
        auto_resolved: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        `[quality-checks] Failed to persist check ${result.check_type}: ${error.message}`
      );
    } else if (data) {
      checkIds.push((data as EditorialAiQualityCheck).id);
    }
  }

  // ── Build summary ─────────────────────────────────────────────────────────
  const summary = checkResults.reduce(
    (acc, r) => {
      acc.total_checks++;
      acc[r.status === "passed" ? "passed"
        : r.status === "failed" ? "failed"
        : r.status === "warning" ? "warnings"
        : "skipped"]++;
      return acc;
    },
    { total_checks: 0, passed: 0, failed: 0, warnings: 0, skipped: 0 }
  );

  return {
    job_run_id: jobRunId,
    project_id: jobRun.project_id,
    stage: jobRun.stage as EditorialStage,
    check_ids: checkIds,
    results: checkResults,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual check implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * schema_valid — every finding must have finding_type, severity, and title.
 */
function runSchemaValidCheck(findings: EditorialAiFinding[]): CheckResult {
  const perFinding: PerFindingResult[] = findings.map((f) => {
    const missing: string[] = [];
    if (!f.finding_type) missing.push("finding_type");
    if (!f.severity) missing.push("severity");
    if (!f.title || f.title.trim() === "") missing.push("title");
    const passed = missing.length === 0;
    return { finding_id: f.id, passed, reason: passed ? undefined : `Missing: ${missing.join(", ")}` };
  });

  return buildCheckResult("schema_valid", "Schema Validation", perFinding, findings.length, {});
}

/**
 * duplicate_detection — findings with the same (finding_type + location_ref)
 * are flagged as duplicates.
 */
function runDuplicateDetectionCheck(findings: EditorialAiFinding[]): CheckResult {
  const seen = new Map<string, string>(); // signature → first finding_id
  const perFinding: PerFindingResult[] = findings.map((f) => {
    const sig = `${f.finding_type}::${f.location_ref ?? "__no_loc__"}`;
    if (seen.has(sig)) {
      return {
        finding_id: f.id,
        passed: false,
        reason: `Duplicate of finding ${seen.get(sig)}`,
      };
    }
    seen.set(sig, f.id);
    return { finding_id: f.id, passed: true };
  });

  const duplicateCount = perFinding.filter((p) => !p.passed).length;
  return buildCheckResult("duplicate_detection", "Duplicate Detection", perFinding, findings.length, {
    duplicate_count: duplicateCount,
  });
}

/**
 * scope_alignment — every finding's stage must match the job run's stage.
 */
function runScopeAlignmentCheck(
  findings: EditorialAiFinding[],
  expectedStage: EditorialStage
): CheckResult {
  const perFinding: PerFindingResult[] = findings.map((f) => {
    const passed = f.stage === expectedStage;
    return {
      finding_id: f.id,
      passed,
      reason: passed ? undefined : `Stage mismatch: finding.stage="${f.stage}" expected="${expectedStage}"`,
    };
  });

  return buildCheckResult("scope_alignment", "Scope Alignment", perFinding, findings.length, {
    expected_stage: expectedStage,
  });
}

/**
 * severity_consistency — checks that findings of the same finding_type share a
 * consistent severity distribution (no single type spans all four severity levels).
 */
function runSeverityConsistencyCheck(findings: EditorialAiFinding[]): CheckResult {
  // Group severity values per finding_type
  const bySeverity = new Map<string, Set<string>>();
  for (const f of findings) {
    if (!bySeverity.has(f.finding_type)) bySeverity.set(f.finding_type, new Set());
    bySeverity.get(f.finding_type)!.add(f.severity);
  }

  const perFinding: PerFindingResult[] = findings.map((f) => {
    const severitySet = bySeverity.get(f.finding_type)!;
    // A type spanning all 4 severity levels is likely a bug in the model output
    const passed = severitySet.size < 4;
    return {
      finding_id: f.id,
      passed,
      reason: passed
        ? undefined
        : `finding_type "${f.finding_type}" has ${severitySet.size} distinct severity values`,
    };
  });

  return buildCheckResult(
    "severity_consistency",
    "Severity Consistency",
    perFinding,
    findings.length,
    {}
  );
}

/**
 * policy_compliance — findings that match an active `block` policy fail this
 * check. Warn/require_approval matches produce warnings.
 */
function runPolicyComplianceCheck(
  findings: EditorialAiFinding[],
  activePolicies: EditorialAiPolicy[]
): CheckResult {
  const blockPolicies = activePolicies.filter((p) => p.policy_type === "block");
  const warnPolicies = activePolicies.filter(
    (p) => p.policy_type === "warn" || p.policy_type === "require_approval"
  );

  const perFinding: PerFindingResult[] = findings.map((f) => {
    const blocking = blockPolicies.find((p) => policyMatchesFinding(p, f));
    if (blocking) {
      return { finding_id: f.id, passed: false, reason: `Blocked by policy "${blocking.name}"` };
    }
    const warning = warnPolicies.find((p) => policyMatchesFinding(p, f));
    if (warning) {
      return {
        finding_id: f.id,
        passed: true, // warning does not fail the check
        reason: `Warning from policy "${warning.name}"`,
      };
    }
    return { finding_id: f.id, passed: true };
  });

  const blockedCount = perFinding.filter((p) => !p.passed).length;
  return buildCheckResult(
    "policy_compliance",
    "Policy Compliance",
    perFinding,
    findings.length,
    { blocked_count: blockedCount, policies_evaluated: activePolicies.length }
  );
}

/**
 * citation_present — structural findings must have a location_ref.
 */
function runCitationPresentCheck(findings: EditorialAiFinding[]): CheckResult {
  const structural = findings.filter((f) =>
    STRUCTURAL_FINDING_TYPES.has(f.finding_type.toLowerCase())
  );

  if (structural.length === 0) {
    // No structural findings — check is not applicable
    return {
      check_type: "citation_present",
      check_name: "Citation Present",
      status: "skipped",
      score: 100,
      details: {
        check_source: CHECK_SOURCE,
        findings_total: findings.length,
        findings_passed: findings.length,
        findings_failed: 0,
        per_finding: [],
        reason: "No structural findings to validate",
      },
    };
  }

  const perFinding: PerFindingResult[] = structural.map((f) => {
    const passed = !!f.location_ref && f.location_ref.trim() !== "";
    return {
      finding_id: f.id,
      passed,
      reason: passed ? undefined : "Structural finding is missing location_ref (citation)",
    };
  });

  return buildCheckResult(
    "citation_present",
    "Citation Present",
    perFinding,
    findings.length,
    { structural_findings_checked: structural.length }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Builds a normalised CheckResult from per-finding pass/fail results. */
function buildCheckResult(
  checkType: string,
  checkName: string,
  perFinding: PerFindingResult[],
  totalFindings: number,
  extra: Record<string, unknown>
): CheckResult {
  const passed = perFinding.filter((p) => p.passed).length;
  const failed = perFinding.filter((p) => !p.passed).length;
  const score = totalFindings === 0 ? 100 : Math.round((passed / perFinding.length) * 100);
  const status: AiQualityCheckStatus =
    score >= 90 ? "passed" : score >= 60 ? "warning" : "failed";

  return {
    check_type: checkType,
    check_name: checkName,
    status,
    score,
    details: {
      check_source: CHECK_SOURCE,
      findings_total: totalFindings,
      findings_passed: passed,
      findings_failed: failed,
      per_finding: perFinding,
      ...extra,
    },
  };
}

/** Returns true when a finding falls within the policy's scope. */
function policyMatchesFinding(policy: EditorialAiPolicy, finding: EditorialAiFinding): boolean {
  if (policy.applies_to_stage && policy.applies_to_stage !== finding.stage) return false;
  if (policy.applies_to_finding_type && policy.applies_to_finding_type !== finding.finding_type)
    return false;
  if (policy.applies_to_severity && policy.applies_to_severity !== finding.severity) return false;

  // Evaluate structured conditions stored in the JSONB field
  return matchesConditions(policy.conditions, finding);
}

/** Evaluates common condition keys from the policy conditions JSONB. */
function matchesConditions(conditions: unknown, finding: EditorialAiFinding): boolean {
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) return true;
  const cond = conditions as Record<string, unknown>;

  if (typeof cond.confidence_lt === "number") {
    if ((finding.confidence ?? 1) >= cond.confidence_lt) return false;
  }
  if (typeof cond.confidence_gt === "number") {
    if ((finding.confidence ?? 0) <= cond.confidence_gt) return false;
  }
  if (cond.require_citation === true) {
    if (!finding.location_ref || finding.location_ref.trim() === "") return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB lookups
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJobRun(jobRunId: string): Promise<EditorialAiJobRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .select("*")
    .eq("id", jobRunId)
    .single();

  if (error || !data) {
    throw new Error(`[quality-checks] Job run ${jobRunId} not found: ${error?.message ?? "no data"}`);
  }
  return data as EditorialAiJobRun;
}

async function fetchOrgId(projectId: string): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_projects")
    .select("org_id")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw new Error(`[quality-checks] Could not resolve org_id for project ${projectId}`);
  }
  return (data as { org_id: string }).org_id;
}

async function fetchActivePolicies(
  orgId: string,
  stage: EditorialStage
): Promise<EditorialAiPolicy[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_ai_policies")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`applies_to_stage.eq.${stage},applies_to_stage.is.null`)
    .order("priority", { ascending: true });

  if (error) {
    console.error(`[quality-checks] Failed to fetch policies: ${error.message}`);
    return [];
  }
  return (data ?? []) as EditorialAiPolicy[];
}
