// =============================================================================
// Queue Routing Service
// Reino Editorial AI Engine · Phase 5C
// =============================================================================
// Resolves the correct editorial_ai_review_queues row for a finding + policy
// combination and creates an editorial_ai_queue_items record.
//
// Queue selection logic:
//   policy_type = 'block'              → queue_type = 'policy_exception'  (highest priority)
//   policy_type = 'require_approval'   → queue_type = 'finding_review'    (high priority)
//   policy_type = 'flag_review' | 'warn' → queue_type = 'finding_review'  (normal priority)
//
// DB column mapping:
//   finding_id  → entity_id  (entity_type = 'finding')
//   job_run_id  → context.job_run_id
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiFinding,
  EditorialAiPolicy,
  EditorialAiReviewQueue,
  EditorialAiQueueItem,
  AiQueueItemPriority,
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

/** Named queue slugs used to look up configured queues by name. */
export const QUEUE_NAMES = {
  GENERAL_REVIEW: "general_review",
  HIGH_RISK: "high_risk",
  POLICY_BLOCKED: "policy_blocked",
} as const;
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface RouteToQueueResult {
  finding: EditorialAiFinding;
  policy: EditorialAiPolicy;
  queue: EditorialAiReviewQueue | null;
  queue_item_id: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the correct review queue for a finding + policy pair and creates
 * an editorial_ai_queue_items row.
 *
 * Returns null for queue/item when no matching active queue is configured —
 * callers should log a warning rather than throw, because missing queues are a
 * governance-configuration issue, not a runtime error.
 *
 * @param finding   - The AI finding that triggered the policy.
 * @param policy    - The policy that matched.
 * @param orgId     - Organisation UUID (used to scope queue lookup).
 * @param jobRunId  - UUID of the job run that produced the finding.
 */
export async function routeToQueue(
  finding: EditorialAiFinding,
  policy: EditorialAiPolicy,
  orgId: string,
  jobRunId: string
): Promise<RouteToQueueResult> {
  const db = getAdminClient();

  const { targetQueueName, priority } = resolveTargetQueue(policy, finding);

  // ── Look up the queue ─────────────────────────────────────────────────────
  const queue = await findQueue(orgId, targetQueueName, finding.stage);

  if (!queue) {
    console.warn(
      `[queue-routing] No active queue found for name="${targetQueueName}", ` +
        `org=${orgId}, stage=${finding.stage}. Skipping queue item creation.`
    );
    return { finding, policy, queue: null, queue_item_id: null };
  }

  // ── Create the queue item ─────────────────────────────────────────────────
  const { data, error } = await db
    .from("editorial_ai_queue_items")
    .insert({
      queue_id: queue.id,
      entity_type: "finding",
      entity_id: finding.id,
      project_id: finding.project_id,
      priority,
      status: "pending",
      context: {
        job_run_id: jobRunId,
        policy_id: policy.id,
        policy_name: policy.name,
        policy_type: policy.policy_type,
        finding_type: finding.finding_type,
        severity: finding.severity,
        stage: finding.stage,
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[queue-routing] Failed to create queue item: ${error.message}`);
    return { finding, policy, queue, queue_item_id: null };
  }

  return {
    finding,
    policy,
    queue,
    queue_item_id: (data as EditorialAiQueueItem).id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

interface RoutingDecision {
  targetQueueName: QueueName;
  priority: AiQueueItemPriority;
}

/**
 * Decides which named queue and item priority to use based on the policy type
 * and the finding's severity.
 */
function resolveTargetQueue(
  policy: EditorialAiPolicy,
  finding: EditorialAiFinding
): RoutingDecision {
  const isHighSeverity = finding.severity === "critical" || finding.severity === "error";

  switch (policy.policy_type) {
    case "block":
      return { targetQueueName: QUEUE_NAMES.POLICY_BLOCKED, priority: "urgent" };

    case "require_approval":
      return {
        targetQueueName: isHighSeverity ? QUEUE_NAMES.HIGH_RISK : QUEUE_NAMES.GENERAL_REVIEW,
        priority: isHighSeverity ? "high" : "normal",
      };

    case "flag_review":
      return {
        targetQueueName: isHighSeverity ? QUEUE_NAMES.HIGH_RISK : QUEUE_NAMES.GENERAL_REVIEW,
        priority: isHighSeverity ? "high" : "normal",
      };

    case "warn":
      return { targetQueueName: QUEUE_NAMES.GENERAL_REVIEW, priority: "low" };

    // auto_accept never routes to a queue — callers must guard before calling
    default:
      return { targetQueueName: QUEUE_NAMES.GENERAL_REVIEW, priority: "low" };
  }
}

/**
 * Finds an active review queue by its name (case-insensitive prefix match) and
 * optionally narrowed to a specific stage.
 *
 * Resolution order:
 *   1. Exact name match scoped to the finding's stage
 *   2. Exact name match with no stage restriction (stage IS NULL)
 */
async function findQueue(
  orgId: string,
  queueName: QueueName,
  stage: string
): Promise<EditorialAiReviewQueue | null> {
  const db = getAdminClient();
  // Try stage-scoped queue first
  const { data: staged } = await db
    .from("editorial_ai_review_queues")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .ilike("name", queueName)
    .eq("stage", stage)
    .limit(1)
    .maybeSingle();

  if (staged) return staged as EditorialAiReviewQueue;

  // Fall back to non-stage-scoped queue
  const { data: global } = await db
    .from("editorial_ai_review_queues")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .ilike("name", queueName)
    .is("stage", null)
    .limit(1)
    .maybeSingle();

  return global ? (global as EditorialAiReviewQueue) : null;
}
