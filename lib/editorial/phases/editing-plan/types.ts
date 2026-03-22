import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export type EditingStrategyKey = "light_edit" | "deep_edit" | "restructure";
export type EditingPriority = "high" | "medium" | "low";

export interface EditorialEditingPlanInput {
  projectId: string;
}

export interface EditorialEditingInstruction {
  id: string;
  category: "structure" | "clarity" | "language" | "voice" | "market_fit";
  priority: EditingPriority;
  instruction: string;
  rationale: string;
}

export interface EditorialChapterPlan {
  id: string;
  chapter_id: string;
  chapter_title: string;
  priority: EditingPriority;
  objective: string;
  focus_areas: string[];
  instructions: string[];
}

export interface EditorialEditingPlan {
  schema_version: 1;
  project_id: string;
  normalized_asset_id: string;
  analysis_asset_id: string;
  strategy: EditingStrategyKey;
  strategy_reasoning: string[];
  global_objective: string;
  instructions: EditorialEditingInstruction[];
  chapter_plan: EditorialChapterPlan[];
  generated_at: string;
  rules_version: 1;
}

export interface EditorialEditingPlanResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  normalizedAssetId: string;
  analysisAssetId: string;
  planAssetId: string;
  planAssetUri: string;
  strategy: EditingStrategyKey;
  chapterCount: number;
  transitioned: boolean;
}
