import type { PipelineLog, PipelineLogDraft } from "./log";
import type {
  EditorialMetadata,
  EditorialProject,
  EditorialProjectInitializationInput,
  ManuscriptAsset,
} from "./project";

export type EditorialWorkflowState =
  | "received"
  | "normalized"
  | "analyzed"
  | "editing_planned"
  | "content_edited"
  | "proofread"
  | "validated"
  | "metadata_ready"
  | "cover_ready"
  | "layout_ready"
  | "qa_passed"
  | "packaged"
  | "published"
  | "marketed";

export type EditorialWorkflowStageStatus =
  | "pending"
  | "ready"
  | "in_progress"
  | "completed"
  | "failed"
  | "blocked";

export type EditorialAgentProvider = "hebeling_ai" | "human" | "internal";

export interface EditorialAgentRef {
  provider: EditorialAgentProvider;
  model: string | null;
  version: string | null;
}

export interface PipelineCost {
  amount: number;
  currency: "USD";
  estimated: boolean;
}

export interface EditorialWorkflowStage {
  id: string;
  project_id: string;
  stage_key: EditorialWorkflowState;
  status: EditorialWorkflowStageStatus;
  started_at: string | null;
  finished_at: string | null;
  agent_used: EditorialAgentRef | null;
  cost: PipelineCost | null;
  output_file: ManuscriptAsset | null;
  logs: PipelineLog[];
}

export interface EditorialWorkflowTransition {
  id: string;
  project_id: string;
  from_state: EditorialWorkflowState | null;
  to_state: EditorialWorkflowState;
  transitioned_at: string;
  validated: boolean;
  reason: string | null;
}

export interface EditorialWorkflow {
  id: string;
  project_id: string;
  current_state: EditorialWorkflowState;
  stages: EditorialWorkflowStage[];
  transitions: EditorialWorkflowTransition[];
  created_at: string;
  updated_at: string;
}

export interface EditorialProjectAggregate {
  project: EditorialProject;
  workflow: EditorialWorkflow;
  logs: PipelineLog[];
}

export interface WorkflowTransitionOptions {
  reason?: string | null;
  agentUsed?: EditorialAgentRef | null;
  cost?: PipelineCost | null;
  outputFile?: ManuscriptAsset | null;
}

export interface EditorialPhaseExecutionContext {
  aggregate: EditorialProjectAggregate;
  stage: EditorialWorkflowStage;
}

export interface EditorialPhaseExecutionResult {
  nextState?: EditorialWorkflowState;
  outputFile?: ManuscriptAsset | null;
  agentUsed?: EditorialAgentRef | null;
  cost?: PipelineCost | null;
  logs?: PipelineLogDraft[];
}

export interface EditorialPhaseHandler {
  stageKey: EditorialWorkflowState;
  execute(
    context: EditorialPhaseExecutionContext
  ): Promise<EditorialPhaseExecutionResult>;
}

export interface EditorialPipelineService {
  initializeProject(
    input: EditorialProjectInitializationInput
  ): EditorialProjectAggregate;
  transition(
    aggregate: EditorialProjectAggregate,
    nextState: EditorialWorkflowState,
    options?: WorkflowTransitionOptions
  ): EditorialProjectAggregate;
  appendLog(
    aggregate: EditorialProjectAggregate,
    draft: PipelineLogDraft
  ): EditorialProjectAggregate;
  getNextState(
    currentState: EditorialWorkflowState
  ): EditorialWorkflowState | null;
  registerPhaseHandler(handler: EditorialPhaseHandler): void;
  getPhaseHandler(
    stageKey: EditorialWorkflowState
  ): EditorialPhaseHandler | undefined;
  executeCurrentPhase(
    aggregate: EditorialProjectAggregate
  ): Promise<EditorialProjectAggregate>;
}

export interface EditorialFoundationSnapshot {
  project: EditorialProject;
  metadata: EditorialMetadata;
  manuscript: ManuscriptAsset;
  workflow: EditorialWorkflow;
}
