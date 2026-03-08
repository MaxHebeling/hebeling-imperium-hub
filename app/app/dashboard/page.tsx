import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard-content";

interface DashboardMetrics {
  totalBrands: number;
  totalTenants: number;
  totalProjects: number;
  totalWebsites: number;
  totalTickets: number;
  totalDeals: number;
  totalLeads: number;
  totalDocuments: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  primary_domain: string | null;
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
  profiles: { full_name: string | null } | null;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number | null;
}

async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const [
    brandsResult,
    tenantsResult,
    projectsResult,
    websitesResult,
    ticketsResult,
    dealsResult,
    leadsResult,
    documentsResult,
    brandsListResult,
    activityResult,
    dealsListResult,
  ] = await Promise.all([
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("websites").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id, name, slug, primary_domain").order("name"),
    supabase
      .from("activity_logs")
      .select(
        "id, action, entity, entity_id, created_at, user_id, profiles(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("deals")
      .select("id, title, stage, value")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const metrics: DashboardMetrics = {
    totalBrands: brandsResult.count || 0,
    totalTenants: tenantsResult.count || 0,
    totalProjects: projectsResult.count || 0,
    totalWebsites: websitesResult.count || 0,
    totalTickets: ticketsResult.count || 0,
    totalDeals: dealsResult.count || 0,
    totalLeads: leadsResult.count || 0,
    totalDocuments: documentsResult.count || 0,
  };

  return {
    metrics,
    brands: (brandsListResult.data || []) as Brand[],
    activities: (activityResult.data || []) as ActivityLog[],
    deals: (dealsListResult.data || []) as Deal[],
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { metrics, brands, activities, deals } = await getDashboardData(supabase);

  return (
    <DashboardContent
      metrics={metrics}
      brands={brands}
      activities={activities}
      deals={deals}
    />
  );
}
