import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type {
  EditorialAiFindingDecision,
  EditorialAiFindingDecisionStatus,
} from "@/lib/editorial/types/ai-review";

export async function recordAiFindingDecision(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  findingId: string;
  decisionStatus: EditorialAiFindingDecisionStatus;
  decisionComment?: string | null;
  decidedBy: string;
}): Promise<EditorialAiFindingDecision> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_finding_decisions")
    .insert({
      org_id: options.orgId,
      project_id: options.projectId,
      stage_key: options.stageKey,
      finding_id: options.findingId,
      decision_status: options.decisionStatus,
      decision_comment: options.decisionComment ?? null,
      decided_by: options.decidedBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to record AI finding decision: ${error?.message}`);
  }

  return data as EditorialAiFindingDecision;
}

