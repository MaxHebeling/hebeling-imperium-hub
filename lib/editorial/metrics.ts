// ============================================================
// Editorial Metrics Service
// Pipeline metrics for the operations dashboard
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  EditorialMetrics,
  EditorialStage,
  EditorialStageMetricsView,
  EditorialStaffWorkloadView,
} from "@/types/editorial";
import { EDITORIAL_STAGES as STAGES } from "@/types/editorial";

/**
 * Fetch aggregated pipeline metrics for an org.
 */
export async function getEditorialMetrics(
  supabase: SupabaseClient,
  orgId: string
): Promise<EditorialMetrics> {
  // Total books (non-completed)
  const { count: totalCount } = await supabase
    .from("editorial_books")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  // Books by stage (from stage metrics view)
  const { data: stageMetrics } = await supabase
    .from("editorial_stage_metrics_view")
    .select("*")
    .eq("org_id", orgId);

  const booksByStage: Record<EditorialStage, number> = {} as Record<
    EditorialStage,
    number
  >;
  const avgDaysPerStage: Record<EditorialStage, number | null> = {} as Record<
    EditorialStage,
    number | null
  >;

  for (const stage of STAGES) {
    booksByStage[stage] = 0;
    avgDaysPerStage[stage] = null;
  }

  for (const row of (stageMetrics ?? []) as EditorialStageMetricsView[]) {
    booksByStage[row.stage] = Number(row.books_in_stage);
    avgDaysPerStage[row.stage] = row.avg_days_in_stage
      ? Number(row.avg_days_in_stage.toFixed(1))
      : null;
  }

  // Blocked books
  const { count: blockedCount } = await supabase
    .from("editorial_book_alerts")
    .select("book_id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_resolved", false)
    .eq("severity", "critical");

  // Completed this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: completedMonthCount } = await supabase
    .from("editorial_books")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("overall_status", "completed")
    .gte("updated_at", startOfMonth.toISOString());

  // Staff workload
  const { data: workloadData } = await supabase
    .from("editorial_staff_workload_view")
    .select("*")
    .eq("org_id", orgId)
    .order("books_assigned", { ascending: false })
    .limit(10);

  return {
    total_books: totalCount ?? 0,
    books_by_stage: booksByStage,
    blocked_books: blockedCount ?? 0,
    completed_this_month: completedMonthCount ?? 0,
    avg_days_per_stage: avgDaysPerStage,
    staff_workload: (workloadData ?? []) as EditorialStaffWorkloadView[],
  };
}
