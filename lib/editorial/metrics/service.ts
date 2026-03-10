import { getAdminClient } from "@/lib/leads/helpers";
import type {
  ProjectCurrentStageRow,
  ProjectSlaRow,
  StageMetricsRow,
  StaffWorkloadRow,
} from "./types";

export async function listProjectCurrentStageRows(orgId: string): Promise<ProjectCurrentStageRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_current_stage_view")
    .select("*")
    .eq("org_id", orgId)
    .order("project_last_activity_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ProjectCurrentStageRow[];
}

export async function listStageMetrics(orgId: string): Promise<StageMetricsRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stage_metrics_view")
    .select("*")
    .eq("org_id", orgId);
  if (error) return [];
  return (data ?? []) as StageMetricsRow[];
}

export async function listProjectSlaRows(orgId: string): Promise<ProjectSlaRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_sla_view")
    .select("*")
    .eq("org_id", orgId)
    .order("sla_state", { ascending: false })
    .order("days_to_due", { ascending: true });
  if (error) return [];
  return (data ?? []) as ProjectSlaRow[];
}

export async function listStaffWorkload(orgId: string): Promise<StaffWorkloadRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_staff_workload_view")
    .select("*")
    .eq("org_id", orgId)
    .order("assigned_projects_count", { ascending: false });
  if (error) return [];
  return (data ?? []) as StaffWorkloadRow[];
}

