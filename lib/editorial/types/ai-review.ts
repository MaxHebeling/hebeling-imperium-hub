import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiFinding } from "@/lib/editorial/types/ai-findings";

export type EditorialAiFindingDecisionStatus =
  | "pending_review"
  | "accepted"
  | "rejected"
  | "resolved"
  | "applied_manually"
  | string;

export interface EditorialAiFindingDecision {
  id: string;
  org_id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  finding_id: string;
  decision_status: EditorialAiFindingDecisionStatus | string;
  decision_comment: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialAiFindingWithDecision extends EditorialAiFinding {
  latest_decision_status?: EditorialAiFindingDecisionStatus | null;
  latest_decision_at?: string | null;
  latest_decided_by?: string | null;
  latest_decision_comment?: string | null;
}

