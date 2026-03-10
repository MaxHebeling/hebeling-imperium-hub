// =============================================================================
// Policy Engine
// Reino Editorial AI Engine · Phase 5C
// =============================================================================
// Reads active editorial_ai_policies for an organisation and evaluates each
// finding against them. When a policy matches, a queue item is created via the
// queue-routing service.
//
// policy_type → action taken:
//   block            → route to policy_blocked queue  (priority: urgent)
//   require_approval → route to general/high_risk     (priority: high)
//   flag_review      → route to general/high_risk     (priority: normal)
//   warn             → route to general_review        (priority: low)
//   auto_accept      → no queue item; finding logged as auto-accepted
//
// DB column mapping:
//   rule_type (problem-statement) → policy_type (DB column)
//   finding_id / job_run_id       → context JSONB inside queue item
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiFinding,
  EditorialAiPolicy,
  EditorialAiJobRun,
  EditorialStage,
} from "@/types/editorial";
import { routeToQueue, type RouteToQueueResult } from "@/lib/editorial/ai/governance/queue-routing";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single finding–policy match, with the routing outcome. */
export interface PolicyMatch {
  policy: EditorialAiPolicy;
  finding: EditorialAiFinding;
  /** Resulting queue item ID, null if no queue was found or policy = auto_accept. */
  queue_item_id: string | null;
  /** Name of the queue that received the item, null when no item was created. */
  queue_name: string | null;
}

export interface EvaluatePoliciesOutput {
  job_run_id: string;
  org_id: string;
  matches: PolicyMatch[];
  summary: {
    findings_evaluated: number;
    policies_evaluated: number;
    total_matches: number;
    blocked: number;
    require_approval: number;
    flagged: number;
    warned: number;
    auto_accepted: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates all active policies for the organisation against the given findings
 * and routes matching findings to the appropriate review queue.
 *
 * Policies are sorted by priority (ascending = highest priority first) so that
 * a finding is matched against the most specific/urgent policy first.
 * After the first `block` policy matches a finding, evaluation stops for that
 * finding (short-circuit semantics).
 *
 * @param jobRunId  - UUID of the editorial_ai_job_runs row.
 * @param findings  - AI findings to evaluate.
 */
export async function evaluatePolicies(
  jobRunId: string,
  findings: EditorialAiFinding[]
): Promise<EvaluatePoliciesOutput> {
  // ── Resolve run context ───────────────────────────────────────────────────
  const jobRun = await fetchJobRun(jobRunId);
  const orgId = await fetchOrgId(jobRun.project_id);

  // ── Load active policies ──────────────────────────────────────────────────
  const policies = await fetchActivePolicies(orgId, jobRun.stage as EditorialStage);

  // ── Evaluate each finding against every policy ────────────────────────────
  const matches: PolicyMatch[] = [];
  const summary = {
    findings_evaluated: findings.length,
    policies_evaluated: policies.length,
    total_matches: 0,
    blocked: 0,
    require_approval: 0,
    flagged: 0,
    warned: 0,
    auto_accepted: 0,
  };

  for (const finding of findings) {
    let blocked = false;

    for (const policy of policies) {
      if (blocked) break; // short-circuit after first block

      if (!policyMatchesFinding(policy, finding)) continue;

      summary.total_matches++;

      if (policy.policy_type === "auto_accept") {
        summary.auto_accepted++;
        matches.push({ policy, finding, queue_item_id: null, queue_name: null });
        continue;
      }

      // Route to queue for all other policy types
      const routeResult: RouteToQueueResult = await routeToQueue(
        finding,
        policy,
        orgId,
        jobRunId
      );

      matches.push({
        policy,
        finding,
        queue_item_id: routeResult.queue_item_id,
        queue_name: routeResult.queue?.name ?? null,
      });

      // Update counters
      switch (policy.policy_type) {
        case "block":
          summary.blocked++;
          blocked = true;
          break;
        case "require_approval":
          summary.require_approval++;
          break;
        case "flag_review":
          summary.flagged++;
          break;
        case "warn":
          summary.warned++;
          break;
      }
    }
  }

  return { job_run_id: jobRunId, org_id: orgId, matches, summary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy matching logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when a finding falls within the policy's scope selectors and
 * satisfies all structured conditions stored in conditions JSONB.
 *
 * Scope selectors (null = match any):
 *   applies_to_stage        – must equal finding.stage
 *   applies_to_finding_type – must equal finding.finding_type
 *   applies_to_severity     – must equal finding.severity
 *
 * Structured conditions (from conditions JSONB):
 *   confidence_lt  – finding.confidence must be < value
 *   confidence_gt  – finding.confidence must be > value
 *   require_citation – finding must have a non-empty location_ref
 */
function policyMatchesFinding(policy: EditorialAiPolicy, finding: EditorialAiFinding): boolean {
  if (policy.applies_to_stage && policy.applies_to_stage !== finding.stage) return false;
  if (policy.applies_to_finding_type && policy.applies_to_finding_type !== finding.finding_type)
    return false;
  if (policy.applies_to_severity && policy.applies_to_severity !== finding.severity) return false;

  return matchesConditions(policy.conditions, finding);
}

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
    .select("id, project_id, stage")
    .eq("id", jobRunId)
    .single();

  if (error || !data) {
    throw new Error(
      `[policy-engine] Job run ${jobRunId} not found: ${error?.message ?? "no data"}`
    );
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
    throw new Error(`[policy-engine] Could not resolve org_id for project ${projectId}`);
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
    console.error(`[policy-engine] Failed to fetch active policies: ${error.message}`);
    return [];
  }
  return (data ?? []) as EditorialAiPolicy[];
}
