import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import { getActivePromptTemplate } from "@/lib/editorial/ai/prompts";
import { requestAiTask } from "@/lib/editorial/ai/jobs";

export const STAGE_AI_TASKS: Record<EditorialStageKey, EditorialAiTaskKey[]> = {
  ingesta: ["manuscript_analysis", "issue_detection", "quality_scoring"],
  estructura: ["structure_analysis", "issue_detection"],
  estilo: ["style_suggestions", "line_editing", "issue_detection"],
  ortotipografia: ["orthotypography_review", "copyediting", "issue_detection"],
  maquetacion: ["layout_analysis", "typography_check", "page_flow_review", "issue_detection"],
  revision_final: ["issue_detection", "quality_scoring", "redline_diff"],
  export: ["export_validation", "metadata_generation", "quality_scoring"],
  distribution: ["metadata_generation"],
};

export function isTaskAllowedForStage(stageKey: EditorialStageKey, taskKey: EditorialAiTaskKey): boolean {
  return STAGE_AI_TASKS[stageKey]?.includes(taskKey) ?? false;
}

export async function requestStageAiAssist(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  taskKey: EditorialAiTaskKey;
  requestedBy: string;
  sourceFileId?: string;
  sourceFileVersion?: number;
}): Promise<{ jobId: string; promptTemplateId: string | null; promptTemplateVersion: number | null }> {
  if (!isTaskAllowedForStage(options.stageKey, options.taskKey)) {
    throw new Error("INVALID_AI_TASK_FOR_STAGE");
  }

  const template = await getActivePromptTemplate({
    orgId: options.orgId,
    stageKey: options.stageKey,
    taskKey: options.taskKey,
  });

  const { jobId } = await requestAiTask({
    orgId: options.orgId,
    projectId: options.projectId,
    stageKey: options.stageKey,
    taskKey: options.taskKey,
    requestedBy: options.requestedBy,
    sourceFileId: options.sourceFileId,
    sourceFileVersion: options.sourceFileVersion,
    promptTemplateId: template?.id ?? null,
    promptTemplateVersion: template?.version ?? null,
  });

  return { jobId, promptTemplateId: template?.id ?? null, promptTemplateVersion: template?.version ?? null };
}

