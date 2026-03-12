import type { EditorialStageKey, EditorialStageRuleDefinition, StageGateEvaluation, StageGateReason } from "@/lib/editorial/types/editorial";

export type { EditorialStageRuleDefinition, StageGateEvaluation, StageGateReason, EditorialStageKey };

export interface EvaluateStageContext {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
}

