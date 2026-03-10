import type {
  EditorialProjectStageChecklist,
  EditorialProjectStageChecklistItem,
  EditorialStageKey,
  EditorialStageRuleDefinition,
  StageGateEvaluation,
  StageGateReason,
} from "@/lib/editorial/types/editorial";
import {
  getStageRuleDefinitions,
  getChecklistTemplateForStage,
  getProjectStageChecklist,
  getProjectStageChecklistItems,
} from "./queries";
import { materializeProjectStageChecklist } from "./mutations";
import { getProjectFiles } from "@/lib/editorial/db/queries";

function ruleBlockingFlag(rule: EditorialStageRuleDefinition): boolean {
  return rule.severity === "blocking" || rule.severity === "critical" || rule.rule_type === "blocking";
}

function baseReasonForRule(
  rule: EditorialStageRuleDefinition,
  stageKey: EditorialStageKey,
  message: string,
  code: StageGateReason["code"]
): StageGateReason {
  return {
    code,
    message,
    blocking: ruleBlockingFlag(rule),
    stage_key: stageKey,
    rule_key: rule.rule_key,
  };
}

async function evaluateRequiredFileRule(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  rule: EditorialStageRuleDefinition;
}): Promise<StageGateReason[]> {
  const reasons: StageGateReason[] = [];
  const config = options.rule.config as { required_file_types?: string[] } | Record<string, unknown>;
  const requiredFileTypes = Array.isArray((config as any).required_file_types)
    ? ((config as any).required_file_types as string[])
    : [];
  if (requiredFileTypes.length === 0) return reasons;

  const files = await getProjectFiles(options.projectId);
  const missing = requiredFileTypes.filter((t) => !files.some((f) => f.file_type === t));
  if (missing.length > 0) {
    reasons.push({
      ...baseReasonForRule(
        options.rule,
        options.stageKey,
        `Missing required file types: ${missing.join(", ")}.`,
        "missing_required_file"
      ),
      required_file_types: missing,
    });
  }
  return reasons;
}

function summarizeChecklist(
  checklist: EditorialProjectStageChecklist | null,
  items: EditorialProjectStageChecklistItem[]
): StageGateEvaluation["checklist"] {
  if (!checklist) {
    return null;
  }
  const requiredItems = items.filter((i) => i.is_required);
  const totalRequired = requiredItems.length;
  const completedRequired = requiredItems.filter((i) => i.is_completed).length;
  const progressPercent =
    typeof checklist.progress_percent === "number" ? checklist.progress_percent : 0;

  return {
    checklist_id: checklist.id,
    progress_percent: progressPercent,
    completed_required: totalRequired === 0 ? null : completedRequired,
    total_required: totalRequired === 0 ? null : totalRequired,
  };
}

async function evaluateChecklistForStage(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  files: Awaited<ReturnType<typeof getProjectFiles>>;
}): Promise<{
  reasons: StageGateReason[];
  checklist: EditorialProjectStageChecklist | null;
  items: EditorialProjectStageChecklistItem[];
}> {
  const template = await getChecklistTemplateForStage(options.orgId, options.stageKey);
  if (!template) {
    return { reasons: [], checklist: null, items: [] };
  }

  const materialized = await materializeProjectStageChecklist({
    orgId: options.orgId,
    projectId: options.projectId,
    stageKey: options.stageKey,
  });

  const checklist = materialized.checklist;
  const items = materialized.items;
  const reasons: StageGateReason[] = [];

  if (!checklist) {
    reasons.push({
      code: "no_checklist_instance",
      message: "Checklist instance for this etapa is missing.",
      blocking: template.is_required,
      stage_key: options.stageKey,
      checklist_id: null,
    });
    return { reasons, checklist: null, items: [] };
  }

  const requiredItems = items.filter((i) => i.is_required);
  const missingRequired = requiredItems.filter((i) => !i.is_completed);
  if (missingRequired.length > 0) {
    reasons.push({
      code: "checklist_incomplete",
      message: "Required checklist items are incomplete.",
      blocking: template.is_required,
      stage_key: options.stageKey,
      checklist_id: checklist.id,
    });
  }

  // Validate required files for items that require them.
  const fileReasons: StageGateReason[] = [];
  for (const item of items) {
    if (!item.requires_file || !item.required_file_types || item.required_file_types.length === 0) {
      continue;
    }
    const missing = item.required_file_types.filter(
      (t) => !options.files.some((f) => f.file_type === t)
    );
    if (missing.length > 0) {
      fileReasons.push({
        code: "missing_required_file",
        message: `Checklist item "${item.label}" is missing required file types: ${missing.join(
          ", "
        )}.`,
        blocking: true,
        stage_key: options.stageKey,
        checklist_id: checklist.id,
        item_key: item.item_key,
        required_file_types: missing,
      });
    }
  }

  reasons.push(...fileReasons);
  return { reasons, checklist, items };
}

async function evaluateSingleRule(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  rule: EditorialStageRuleDefinition;
}): Promise<StageGateReason[]> {
  const { rule } = options;
  if (rule.rule_key === "required_file_present") {
    return evaluateRequiredFileRule(options);
  }
  // For now, unknown rule keys are treated as no-op to avoid breaking behavior.
  return [];
}

export async function evaluateStageCanComplete(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
}): Promise<StageGateEvaluation> {
  const rules = await getStageRuleDefinitions(options.orgId, options.stageKey);
  const files = await getProjectFiles(options.projectId);
  const reasons: StageGateReason[] = [];

  for (const rule of rules) {
    if (rule.rule_type === "exit" || rule.rule_type === "blocking") {
      const ruleReasons = await evaluateSingleRule({
        ...options,
        rule,
      });
      reasons.push(...ruleReasons);
    }
  }

  const checklistEval = await evaluateChecklistForStage({
    orgId: options.orgId,
    projectId: options.projectId,
    stageKey: options.stageKey,
    files,
  });
  reasons.push(...checklistEval.reasons);

  const hasBlocking = reasons.some((r) => r.blocking);
  return {
    canComplete: !hasBlocking,
    reasons,
    checklist: summarizeChecklist(checklistEval.checklist, checklistEval.items),
  };
}

