import { ORG_ID } from "@/lib/leads/helpers";
import { getProfilesByIds } from "@/lib/editorial/db/queries";
import {
  listProjectCurrentStageRows,
  listProjectSlaRows,
  listStaffWorkload,
  listStageMetrics,
} from "@/lib/editorial/metrics";

export type OperationsKpis = {
  projectsTotal: number;
  inReview: number;
  slaBreached: number;
  slaAtRisk: number;
  inactivityCritical: number;
};

export type OperationsData = {
  kpis: OperationsKpis;
  pipelineBoard: Awaited<ReturnType<typeof listStageMetrics>>;
  needsAttention: Awaited<ReturnType<typeof listProjectSlaRows>>;
  staffWorkload: Array<
    (Awaited<ReturnType<typeof listStaffWorkload>>[number] & {
      user_name: string | null;
      user_email: string | null;
    })
  >;
  alertsSummary: { available: boolean; message: string };
};

export async function getOperationsDashboard(): Promise<OperationsData> {
  const [current, stageMetrics, slaRows, workload] = await Promise.all([
    listProjectCurrentStageRows(ORG_ID),
    listStageMetrics(ORG_ID),
    listProjectSlaRows(ORG_ID),
    listStaffWorkload(ORG_ID),
  ]);

  const kpis: OperationsKpis = {
    projectsTotal: current.length,
    inReview: current.filter((p) => p.project_status === "review" || p.project_status === "review_required").length,
    slaBreached: slaRows.filter((r) => r.sla_state === "breached").length,
    slaAtRisk: slaRows.filter((r) => r.sla_state === "at_risk").length,
    inactivityCritical: slaRows.filter((r) => r.inactivity_state === "critical").length,
  };

  const userIds = [...new Set(workload.map((w) => w.user_id))];
  const profiles = await getProfilesByIds(userIds);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const staffWorkload = workload.map((w) => {
    const p = profileMap.get(w.user_id);
    return {
      ...w,
      user_name: p?.full_name ?? null,
      user_email: p?.email ?? null,
    };
  });

  // 4A.4 only: we don't require 4A.3 to exist.
  // If/when 4A.3 lands, this panel can be upgraded to query alerts views/tables.
  const alertsSummary = {
    available: false,
    message: "Alertas operativas: pendiente de 4A.3 (alerts + blocked detection).",
  };

  return {
    kpis,
    pipelineBoard: stageMetrics,
    needsAttention: slaRows,
    staffWorkload,
    alertsSummary,
  };
}

