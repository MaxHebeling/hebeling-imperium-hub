import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Sparkles,
  Plus,
  FileText,
  Upload,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Zap,
  Terminal,
  Send,
  BarChart3,
  Target,
  Calendar,
  CreditCard,
  Layers,
} from "lucide-react";
import Link from "next/link";

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
  ikingdom: "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50",
  "editorial-reino": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50",
  imperiug: "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50",
  "max-hebeling": "from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50",
};

const brandStatusColors: Record<string, string> = {
  ikingdom: "bg-amber-500",
  "editorial-reino": "bg-emerald-500",
  imperiug: "bg-blue-500",
  "max-hebeling": "bg-purple-500",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { metrics, brands, activities, deals } = await getDashboardData(supabase);

  // Calculate deal stages for pipeline
  const dealStages = {
    lead: deals.filter((d) => d.stage === "lead").length,
    qualified: deals.filter((d) => d.stage === "qualified").length,
    proposal: deals.filter((d) => d.stage === "proposal").length,
    negotiation: deals.filter((d) => d.stage === "negotiation").length,
    closed: deals.filter((d) => d.stage === "closed_won").length,
  };

  const stats = [
    { label: "Brands", value: metrics.totalBrands, icon: Building2, href: "/app/settings", color: "text-amber-400" },
    { label: "Leads", value: metrics.totalLeads, icon: Target, href: "/app/crm", color: "text-blue-400" },
    { label: "Clients", value: metrics.totalTenants, icon: Users, href: "/app/crm", color: "text-emerald-400" },
    { label: "Projects", value: metrics.totalProjects, icon: FolderKanban, href: "/app/projects", color: "text-purple-400" },
    { label: "Websites", value: metrics.totalWebsites, icon: Globe, href: "/app/websites", color: "text-cyan-400" },
    { label: "Documents", value: metrics.totalDocuments, icon: FileText, href: "/app/documents", color: "text-orange-400" },
    { label: "Deals", value: metrics.totalDeals, icon: Handshake, href: "/app/deals", color: "text-pink-400" },
    { label: "Tickets", value: metrics.totalTickets, icon: Ticket, href: "/app/crm", color: "text-indigo-400" },
  ];

  const quickActions = [
    { label: "New Lead", icon: Plus, href: "/app/crm", color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
    { label: "New Deal", icon: Handshake, href: "/app/deals", color: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" },
    { label: "New Client", icon: Users, href: "/app/crm", color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20" },
    { label: "New Project", icon: FolderKanban, href: "/app/projects", color: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20" },
    { label: "New Website", icon: Globe, href: "/app/websites", color: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20" },
    { label: "Upload Document", icon: Upload, href: "/app/documents", color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Premium Header Section */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                System Online
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Hebeling Business Operating System
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Executive control center for brands, clients, projects, websites,
              documents, payments, and operational intelligence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Today</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${action.color}`}
                >
                  <action.icon className="h-5 w-5 text-foreground/80" />
                  <span className="text-xs font-medium text-foreground/90">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="bg-card/40 border-border/40 hover:bg-card/60 hover:border-border/60 transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Brands & Pipeline */}
        <div className="xl:col-span-2 space-y-6">
          {/* Brands Portfolio */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Brands Portfolio
                  </CardTitle>
                  <CardDescription>Your managed brands and business units</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
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
                      className={`relative p-4 rounded-xl bg-gradient-to-br border transition-all duration-200 cursor-pointer group ${
                        brandColors[brand.slug] ||
                        "from-muted/50 to-muted/30 border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-foreground/90 transition-colors">
                            {brand.name}
                          </h3>
                          {brand.primary_domain && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {brand.primary_domain}
                            </p>
                          )}
                        </div>
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            brandStatusColors[brand.slug] || "bg-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline / Operational Snapshot */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Deal Pipeline
              </CardTitle>
              <CardDescription>Current deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PipelineStage label="Lead" count={dealStages.lead} total={deals.length} color="bg-slate-500" />
                <PipelineStage label="Qualified" count={dealStages.qualified} total={deals.length} color="bg-blue-500" />
                <PipelineStage label="Proposal" count={dealStages.proposal} total={deals.length} color="bg-amber-500" />
                <PipelineStage label="Negotiation" count={dealStages.negotiation} total={deals.length} color="bg-purple-500" />
                <PipelineStage label="Closed Won" count={dealStages.closed} total={deals.length} color="bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Priority */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest actions in the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="Activity logs will appear here as actions are performed."
                />
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <ActivityIcon action={activity.action} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize leading-tight">
                          {activity.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.entity}
                          {activity.profiles?.full_name &&
                            ` by ${activity.profiles.full_name}`}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Panel */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Priority Items
              </CardTitle>
              <CardDescription>Urgent items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PriorityItem
                  label="Pending approvals"
                  count={2}
                  priority="high"
                />
                <PriorityItem
                  label="Documents awaiting review"
                  count={5}
                  priority="medium"
                />
                <PriorityItem
                  label="Overdue tasks"
                  count={0}
                  priority="low"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Command Center Block */}
      <Card className="bg-gradient-to-br from-card/60 to-card/40 border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left - Info */}
            <div className="p-6 lg:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Command Center</h3>
                  <p className="text-xs text-muted-foreground">
                    AI-powered operational intelligence
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/30 text-amber-400">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Execute natural language commands to manage your business operations.
                Summarize priorities, create proposals, generate reports, and automate
                workflows with AI assistance.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Summarize today</Badge>
                <Badge variant="secondary" className="text-xs">Create proposal</Badge>
                <Badge variant="secondary" className="text-xs">Generate report</Badge>
              </div>
            </div>

            {/* Right - Input Mockup */}
            <div className="p-6 lg:p-8 bg-muted/20 border-t lg:border-t-0 lg:border-l border-border/30">
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="Ask anything about your business operations..."
                    className="w-full h-24 px-4 py-3 text-sm bg-background/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/50"
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Powered by AI
                  </span>
                  <Button size="sm" disabled className="gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
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
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        {description}
      </p>
    </div>
  );
}

function PipelineStage({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{count}</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function PriorityItem({
  label,
  count,
  priority,
}: {
  label: string;
  count: number;
  priority: "high" | "medium" | "low";
}) {
  const priorityStyles = {
    high: "bg-red-500/10 border-red-500/20 text-red-400",
    medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    low: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  const icons = {
    high: AlertTriangle,
    medium: Circle,
    low: CheckCircle2,
  };

  const Icon = icons[priority];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${priorityStyles[priority].split(" ")[2]}`} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <Badge variant="outline" className={`text-xs ${priorityStyles[priority]}`}>
        {count}
      </Badge>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const iconMap: Record<string, React.ElementType> = {
    create: Plus,
    update: Activity,
    delete: AlertTriangle,
    upload: Upload,
    login: Users,
    default: Activity,
  };

  const Icon = iconMap[action.split("_")[0]] || iconMap.default;

  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}
