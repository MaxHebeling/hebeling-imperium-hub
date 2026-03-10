import { ORG_ID } from "@/lib/leads/helpers";
import { getEditorialProject, getProjectFiles, getProjectStaffAssignments } from "@/lib/editorial/db/queries";
import type { EditorialFile, EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { BlockedProjectViewRow } from "./types";
import { listProjectAlerts, resolveAlertByDedupeKey, upsertOperationalAlert } from "./service";
import { getAdminClient } from "@/lib/leads/helpers";
import { evaluateStageCanComplete } from "@/lib/editorial/workflow";

function lastActivityAt(project: { updated_at: string | null; created_at: string }) {
  return project.updated_at ?? project.created_at;
}

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function hasFileType(files: EditorialFile[], fileType: string) {
  return files.some((f) => f.file_type === fileType);
}

/**
 * Recalculate a minimal set of operational alerts for a project.
 * No cron: can be called on-demand from server-side fetch or explicit endpoint.
 */
export async function recalculateProjectAlerts(projectId: string): Promise<void> {
  const project = await getEditorialProject(projectId);
  if (!project) return;

  const [files, staffAssignments] = await Promise.all([
    getProjectFiles(projectId),
    getProjectStaffAssignments(projectId),
  ]);

  // ------------------------------------------------------------
  // missing_assignment (blocking): require at least manager + editor assigned
  // ------------------------------------------------------------
  const roles = new Set(staffAssignments.map((a) => a.role));
  const missing: string[] = [];
  if (!roles.has("manager")) missing.push("manager");
  if (!roles.has("editor")) missing.push("editor");

  const missingAssignmentKey = "missing_assignment:manager_editor";
  if (missing.length > 0) {
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: project.current_stage,
      alertType: "missing_assignment",
      severity: "critical",
      isBlocking: true,
      title: "Asignaciones incompletas",
      message: `Faltan roles asignados: ${missing.join(", ")}.`,
      dedupeKey: missingAssignmentKey,
      details: { missingRoles: missing },
    });
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: missingAssignmentKey });
  }

  // ------------------------------------------------------------
  // missing_required_file (blocking): ingesta requires manuscript_original
  // ------------------------------------------------------------
  const requiredFileKey = `missing_required_file:ingesta:manuscript_original`;
  const manuscriptOk = hasFileType(files, "manuscript_original");
  if (!manuscriptOk) {
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: "ingesta",
      alertType: "missing_required_file",
      severity: "critical",
      isBlocking: true,
      title: "Falta manuscrito original",
      message: "No se encontró un archivo `manuscript_original` para la etapa de ingesta.",
      dedupeKey: requiredFileKey,
      details: { requiredFileType: "manuscript_original", stageKey: "ingesta" },
    });
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: requiredFileKey });
  }

  // ------------------------------------------------------------
  // inactivity_risk (non-blocking): based on last activity timestamp
  // ------------------------------------------------------------
  const now = new Date();
  const last = new Date(lastActivityAt(project));
  const days = daysBetween(now, last);
  const inactivityKey = "inactivity_risk:last_activity";
  if (days >= 30) {
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: project.current_stage,
      alertType: "inactivity_risk",
      severity: "critical",
      isBlocking: false,
      title: "Riesgo por inactividad",
      message: `Sin actividad registrada hace ${days} días.`,
      dedupeKey: inactivityKey,
      details: { daysSinceActivity: days },
    });
  } else if (days >= 14) {
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: project.current_stage,
      alertType: "inactivity_risk",
      severity: "warning",
      isBlocking: false,
      title: "Inactividad prolongada",
      message: `Sin actividad registrada hace ${days} días.`,
      dedupeKey: inactivityKey,
      details: { daysSinceActivity: days },
    });
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: inactivityKey });
  }

  // ------------------------------------------------------------
  // sla_risk (non-blocking): based on due_date
  // ------------------------------------------------------------
  const slaKey = "sla_risk:due_date";
  if (project.due_date) {
    const due = new Date(project.due_date);
    // If due < now => overdue
    if (due.getTime() < now.getTime()) {
      await upsertOperationalAlert({
        orgId: project.org_id,
        projectId,
        stageKey: project.current_stage,
        alertType: "sla_risk",
        severity: "critical",
        isBlocking: false,
        title: "SLA vencido",
        message: "La fecha de entrega está vencida.",
        dedupeKey: slaKey,
        details: { dueDate: project.due_date, overdue: true },
      });
    } else {
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        await upsertOperationalAlert({
          orgId: project.org_id,
          projectId,
          stageKey: project.current_stage,
          alertType: "sla_risk",
          severity: "warning",
          isBlocking: false,
          title: "SLA en riesgo",
          message: `Entrega en ${daysUntilDue} días.`,
          dedupeKey: slaKey,
          details: { dueDate: project.due_date, daysUntilDue },
        });
      } else {
        await resolveAlertByDedupeKey({ projectId, dedupeKey: slaKey });
      }
    }
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: slaKey });
  }

  // ------------------------------------------------------------
  // Gate-driven alerts (checklist_incomplete / critical_rule_failed)
  // ------------------------------------------------------------
  const currentStage = project.current_stage as EditorialStageKey;
  const evaluation = await evaluateStageCanComplete({
    orgId: project.org_id,
    projectId,
    stageKey: currentStage,
  });

  const checklistReasons = evaluation.reasons.filter(
    (r) => r.code === "checklist_incomplete" || r.code === "no_checklist_instance"
  );
  const checklistDedupeKey = `checklist_incomplete:${currentStage}`;
  if (checklistReasons.length > 0) {
    const hasBlockingChecklist = checklistReasons.some((r) => r.blocking);
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: currentStage,
      alertType: "checklist_incomplete",
      severity: hasBlockingChecklist ? "critical" : "warning",
      isBlocking: hasBlockingChecklist,
      title: "Checklist incompleta",
      message: "La checklist requerida para esta etapa no está completa.",
      dedupeKey: checklistDedupeKey,
      details: { reasons: checklistReasons },
    });
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: checklistDedupeKey });
  }

  const ruleFailureReasons = evaluation.reasons.filter(
    (r) =>
      r.blocking &&
      (r.code === "rule_failed" ||
        (r.code === "missing_required_file" && typeof r.rule_key === "string" && !!r.required_file_types))
  );
  const ruleFailureDedupeKey = `critical_rule_failed:${currentStage}`;
  if (ruleFailureReasons.length > 0) {
    await upsertOperationalAlert({
      orgId: project.org_id,
      projectId,
      stageKey: currentStage,
      alertType: "critical_rule_failed",
      severity: "critical",
      isBlocking: true,
      title: "Reglas críticas incumplidas",
      message: "Existen reglas críticas de la etapa que no se cumplen.",
      dedupeKey: ruleFailureDedupeKey,
      details: { reasons: ruleFailureReasons },
    });
  } else {
    await resolveAlertByDedupeKey({ projectId, dedupeKey: ruleFailureDedupeKey });
  }
}

export async function listBlockedProjects(orgId = ORG_ID): Promise<BlockedProjectViewRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_blocked_projects_view")
    .select("*")
    .eq("org_id", orgId)
    .order("last_alert_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BlockedProjectViewRow[];
}

export async function getProjectAlertsWithRecalc(projectId: string) {
  await recalculateProjectAlerts(projectId);
  return await listProjectAlerts(projectId);
}

