// ============================================================
// Editorial Rules Engine
// Validates stage transitions against configured rule definitions
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  EditorialStage,
  EditorialStageRuleDefinition,
  RuleViolation,
  StageValidationResult,
  EditorialAlertSeverity,
} from "@/types/editorial";

/** Map a blocking flag to an alert severity level. */
function severityFor(isBlocking: boolean): EditorialAlertSeverity {
  return isBlocking ? "critical" : "warning";
}

/**
 * Evaluate all active rules for a given stage on a given book.
 * Returns a StageValidationResult describing violations and warnings.
 */
export async function validateStageAdvance(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage
): Promise<StageValidationResult> {
  // Fetch active rules for this stage
  const { data: rulesData } = await supabase
    .from("editorial_stage_rule_definitions")
    .select("*")
    .eq("stage", stage)
    .eq("is_active", true)
    .order("rule_key");

  const rules: EditorialStageRuleDefinition[] = rulesData ?? [];

  const violations: RuleViolation[] = [];
  const warnings: RuleViolation[] = [];

  for (const rule of rules) {
    const violation = await evaluateRule(supabase, bookId, stage, rule);
    if (violation) {
      if (rule.is_blocking) {
        violations.push(violation);
      } else {
        warnings.push(violation);
      }
    }
  }

  return {
    can_advance: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Evaluate a single rule. Returns a RuleViolation if the rule fails, null otherwise.
 */
async function evaluateRule(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  rule: EditorialStageRuleDefinition
): Promise<RuleViolation | null> {
  switch (rule.rule_key) {
    case "require_assignee":
      return evaluateRequireAssignee(supabase, bookId, stage, rule);
    case "require_checklist_complete":
      return evaluateRequireChecklistComplete(supabase, bookId, stage, rule);
    case "require_supervisor_approval":
      return evaluateRequireSupervisorApproval(supabase, bookId, stage, rule);
    default:
      return null;
  }
}

async function evaluateRequireAssignee(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  rule: EditorialStageRuleDefinition
): Promise<RuleViolation | null> {
  const { data: checklist } = await supabase
    .from("editorial_book_stage_checklists")
    .select("assignee_id")
    .eq("book_id", bookId)
    .eq("stage", stage)
    .maybeSingle();

  if (!checklist?.assignee_id) {
    return {
      rule_key: rule.rule_key,
      rule_label: rule.rule_label,
      message: `La etapa "${stage}" no tiene responsable asignado. Asigna un responsable antes de avanzar.`,
      is_blocking: rule.is_blocking,
      severity: severityFor(rule.is_blocking),
    };
  }
  return null;
}

async function evaluateRequireChecklistComplete(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  rule: EditorialStageRuleDefinition
): Promise<RuleViolation | null> {
  const { data: checklist } = await supabase
    .from("editorial_book_stage_checklists")
    .select("id")
    .eq("book_id", bookId)
    .eq("stage", stage)
    .maybeSingle();

  if (!checklist) {
    return {
      rule_key: rule.rule_key,
      rule_label: rule.rule_label,
      message: `No existe checklist para la etapa "${stage}". Crea el checklist antes de avanzar.`,
      is_blocking: rule.is_blocking,
      severity: severityFor(rule.is_blocking),
    };
  }

  const { data: items } = await supabase
    .from("editorial_book_stage_checklist_items")
    .select("id, is_required, is_checked")
    .eq("checklist_id", checklist.id);

  const requiredItems = (items ?? []).filter((i) => i.is_required);
  const incomplete = requiredItems.filter((i) => !i.is_checked);

  if (incomplete.length > 0) {
    return {
      rule_key: rule.rule_key,
      rule_label: rule.rule_label,
      message: `Quedan ${incomplete.length} ítem(s) requerido(s) sin completar en la etapa "${stage}".`,
      is_blocking: rule.is_blocking,
      severity: severityFor(rule.is_blocking),
    };
  }

  return null;
}

async function evaluateRequireSupervisorApproval(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  rule: EditorialStageRuleDefinition
): Promise<RuleViolation | null> {
  // Check if there's a supervisor approval event recorded
  const { data: approvalEvent } = await supabase
    .from("editorial_workflow_events")
    .select("id")
    .eq("book_id", bookId)
    .eq("stage", stage)
    .eq("event_type", "override_applied")
    .maybeSingle();

  if (!approvalEvent) {
    // Check if any book member with editor_jefe role has approved
    const { data: approverMember } = await supabase
      .from("editorial_book_members")
      .select("id")
      .eq("book_id", bookId)
      .eq("editorial_role", "editor_jefe")
      .eq("can_advance_stage", true)
      .maybeSingle();

    if (!approverMember) {
      return {
        rule_key: rule.rule_key,
        rule_label: rule.rule_label,
        message: `La etapa "${stage}" requiere aprobación del editor jefe antes de completarse.`,
        is_blocking: rule.is_blocking,
        severity: severityFor(rule.is_blocking),
      };
    }
  }

  return null;
}
