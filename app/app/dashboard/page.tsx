import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  FolderKanban, 
  Globe,
  Ticket,
  Handshake,
  Clock,
  ArrowUpRight,
  Activity,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface DashboardMetrics {
  totalBrands: number;
  totalTenants: number;
  totalProjects: number;
  totalWebsites: number;
  totalTickets: number;
  totalDeals: number;
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

async function getDashboardData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    brandsResult,
    tenantsResult,
    projectsResult,
    websitesResult,
    ticketsResult,
    dealsResult,
    brandsListResult,
    activityResult
  ] = await Promise.all([
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("websites").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id, name, slug, primary_domain").order("name"),
    supabase.from("activity_logs")
      .select("id, action, entity, entity_id, created_at, user_id, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const metrics: DashboardMetrics = {
    totalBrands: brandsResult.count || 0,
    totalTenants: tenantsResult.count || 0,
    totalProjects: projectsResult.count || 0,
    totalWebsites: websitesResult.count || 0,
    totalTickets: ticketsResult.count || 0,
    totalDeals: dealsResult.count || 0,
  };

  return {
    metrics,
    brands: (brandsListResult.data || []) as Brand[],
    activities: (activityResult.data || []) as ActivityLog[],
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const brandColors: Record<string, string> = {
  "ikingdom": "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  "editorial-reino": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  "imperiug": "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "max-hebeling": "from-purple-500/20 to-purple-600/10 border-purple-500/30",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { metrics, brands, activities } = await getDashboardData(supabase);

  const stats = [
    { label: "Brands", value: metrics.totalBrands, icon: Building2, href: "/app/settings" },
    { label: "Clients", value: metrics.totalTenants, icon: Users, href: "/app/crm" },
    { label: "Projects", value: metrics.totalProjects, icon: FolderKanban, href: "/app/projects" },
    { label: "Websites", value: metrics.totalWebsites, icon: Globe, href: "/app/websites" },
    { label: "Tickets", value: metrics.totalTickets, icon: Ticket, href: "/app/crm" },
    { label: "Deals", value: metrics.totalDeals, icon: Handshake, href: "/app/deals" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Business Operating System (BOS)</h1>
        <h2 className="text-2xl font-semibold tracking-tight text-muted-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s an overview of your operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brands Section */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Brands Portfolio
            </CardTitle>
            <CardDescription>Your managed brands and properties</CardDescription>
          </CardHeader>
          <CardContent>
            {brands.length === 0 ? (
              <EmptyState 
                icon={Building2} 
                title="No brands yet"
                description="Brands will appear here once they are configured in the system."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className={`p-4 rounded-xl bg-gradient-to-br border ${brandColors[brand.slug] || "from-muted/50 to-muted/30 border-border/50"}`}
                  >
                    <h3 className="font-medium text-foreground">{brand.name}</h3>
                    {brand.primary_domain && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {brand.primary_domain}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState 
                icon={Clock} 
                title="No recent activity"
                description="Activity logs will appear here as actions are performed."
              />
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.entity} {activity.profiles?.full_name && `by ${activity.profiles.full_name}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton label="Add Client" href="/app/crm" />
            <QuickActionButton label="New Project" href="/app/projects" />
            <QuickActionButton label="Create Deal" href="/app/deals" />
            <QuickActionButton label="View Websites" href="/app/websites" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{description}</p>
    </div>
  );
}

function QuickActionButton({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
