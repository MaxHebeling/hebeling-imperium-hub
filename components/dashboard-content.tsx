"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Zap,
  Terminal,
  Send,
  BarChart3,
  Target,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

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

interface DashboardContentProps {
  metrics: DashboardMetrics;
  brands: Brand[];
  activities: ActivityLog[];
  deals: Deal[];
}

function formatTimeAgo(dateString: string, t: ReturnType<typeof useLanguage>["t"]): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t.dashboard.justNow;
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

/* Hebeling OS Design System — Company accent colors */
const brandColors: Record<string, string> = {
  ikingdom: "from-[#C8A75B]/15 to-[#C8A75B]/5 border-[#C8A75B]/20 hover:border-[#C8A75B]/40",
  "editorial-reino": "from-[#2F6FA3]/15 to-[#2F6FA3]/5 border-[#2F6FA3]/20 hover:border-[#2F6FA3]/40",
  imperiug: "from-[#0B1C2E]/30 to-[#0B1C2E]/15 border-[#C8A75B]/20 hover:border-[#C8A75B]/40",
  "max-hebeling": "from-[#F0652A]/15 to-[#F0652A]/5 border-[#F0652A]/20 hover:border-[#F0652A]/40",
};

const brandStatusColors: Record<string, string> = {
  ikingdom: "bg-[#C8A75B]",
  "editorial-reino": "bg-[#2F6FA3]",
  imperiug: "bg-[#C8A75B]",
  "max-hebeling": "bg-[#F0652A]",
};

export function DashboardContent({ metrics, brands, activities, deals }: DashboardContentProps) {
  const { t } = useLanguage();

  // Calculate deal stages for pipeline
  const dealStages = {
    lead: deals.filter((d) => d.stage === "lead").length,
    qualified: deals.filter((d) => d.stage === "qualified").length,
    proposal: deals.filter((d) => d.stage === "proposal").length,
    negotiation: deals.filter((d) => d.stage === "negotiation").length,
    closed: deals.filter((d) => d.stage === "closed_won").length,
  };

  const stats = [
    { label: t.dashboard.brands, value: metrics.totalBrands, icon: Building2, href: "/app/settings", color: "text-[#C8A75B]" },
    { label: t.dashboard.leads, value: metrics.totalLeads, icon: Target, href: "/app/crm", color: "text-[#2F6FA3]" },
    { label: t.dashboard.clients, value: metrics.totalTenants, icon: Users, href: "/app/crm", color: "text-[#4F8DC4]" },
    { label: t.dashboard.projects, value: metrics.totalProjects, icon: FolderKanban, href: "/app/projects", color: "text-[#E4C98A]" },
    { label: t.dashboard.websites, value: metrics.totalWebsites, icon: Globe, href: "/app/websites", color: "text-[#9FB2CC]" },
    { label: t.dashboard.documents, value: metrics.totalDocuments, icon: FileText, href: "/app/documents", color: "text-[#F0652A]" },
    { label: t.dashboard.deals, value: metrics.totalDeals, icon: Handshake, href: "/app/deals", color: "text-[#D6C28A]" },
    { label: t.dashboard.tickets, value: metrics.totalTickets, icon: Ticket, href: "/app/crm", color: "text-[#6E1F2F]" },
  ];

  const quickActions = [
    { label: t.dashboard.newLead, icon: Plus, href: "/app/crm", color: "bg-[#2F6FA3]/10 hover:bg-[#2F6FA3]/20 border-[#2F6FA3]/20" },
    { label: t.dashboard.newDeal, icon: Handshake, href: "/app/deals", color: "bg-[#C8A75B]/10 hover:bg-[#C8A75B]/20 border-[#C8A75B]/20" },
    { label: t.dashboard.newClient, icon: Users, href: "/app/crm", color: "bg-[#4F8DC4]/10 hover:bg-[#4F8DC4]/20 border-[#4F8DC4]/20" },
    { label: t.dashboard.newProject, icon: FolderKanban, href: "/app/projects", color: "bg-[#E4C98A]/10 hover:bg-[#E4C98A]/20 border-[#E4C98A]/20" },
    { label: t.dashboard.newWebsite, icon: Globe, href: "/app/websites", color: "bg-[#9FB2CC]/10 hover:bg-[#9FB2CC]/20 border-[#9FB2CC]/20" },
    { label: t.dashboard.uploadDocument, icon: Upload, href: "/app/documents", color: "bg-[#F0652A]/10 hover:bg-[#F0652A]/20 border-[#F0652A]/20" },
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
                {t.dashboard.systemOnline}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {t.dashboard.pageTitle}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {t.dashboard.pageSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t.dashboard.today}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.dashboard.reports}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <Card className="bg-[#162235]/60 border-[#1E3048]/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-[#E7ECF5]">
            <Zap className="h-4 w-4 text-[#C8A75B]" />
            {t.dashboard.quickActions}
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
            <Card className="bg-[#162235]/50 border-[#1E3048]/50 hover:bg-[#1C2D44]/60 hover:border-[#C8A75B]/20 transition-all duration-200 cursor-pointer group h-full">
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
          <Card className="bg-[#162235]/50 border-[#1E3048]/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#C8A75B]" />
                    {t.dashboard.brandsPortfolio}
                  </CardTitle>
                  <CardDescription>{t.dashboard.brandsPortfolioDesc}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t.dashboard.viewAll}
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {brands.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title={t.dashboard.noBrandsYet}
                  description={t.dashboard.brandsWillAppear}
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
                        <span className="text-xs text-muted-foreground">{t.dashboard.active}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline / Operational Snapshot */}
          <Card className="bg-[#162235]/50 border-[#1E3048]/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-[#E7ECF5]">
                <Activity className="h-4 w-4 text-[#2F6FA3]" />
                {t.dashboard.dealPipeline}
              </CardTitle>
              <CardDescription>{t.dashboard.dealsByStage}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <PipelineStage label={t.dashboard.lead} count={dealStages.lead} total={deals.length} color="bg-[#9FB2CC]" />
                  <PipelineStage label={t.dashboard.qualified} count={dealStages.qualified} total={deals.length} color="bg-[#2F6FA3]" />
                  <PipelineStage label={t.dashboard.proposal} count={dealStages.proposal} total={deals.length} color="bg-[#C8A75B]" />
                  <PipelineStage label={t.dashboard.negotiation} count={dealStages.negotiation} total={deals.length} color="bg-[#6E1F2F]" />
                  <PipelineStage label={t.dashboard.closedWon} count={dealStages.closed} total={deals.length} color="bg-[#2A9D8F]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Priority */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="bg-[#162235]/50 border-[#1E3048]/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-[#E7ECF5]">
                    <Activity className="h-4 w-4 text-[#C8A75B]" />
                    {t.dashboard.recentActivity}
                  </CardTitle>
                  <CardDescription>{t.dashboard.recentActivityDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t.dashboard.noRecentActivity}
                  description={t.dashboard.activityWillAppear}
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
                        {formatTimeAgo(activity.created_at, t)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Panel */}
          <Card className="bg-[#162235]/50 border-[#1E3048]/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-[#E7ECF5]">
                <AlertTriangle className="h-4 w-4 text-[#C8A75B]" />
                {t.dashboard.priorityItems}
              </CardTitle>
              <CardDescription>{t.dashboard.priorityItemsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PriorityItem
                  label={t.dashboard.pendingApprovals}
                  count={0}
                  priority="high"
                />
                <PriorityItem
                  label={t.dashboard.documentsAwaiting}
                  count={0}
                  priority="medium"
                />
                <PriorityItem
                  label={t.dashboard.overdueTasks}
                  count={0}
                  priority="low"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Command Center Block */}
      <Card className="bg-gradient-to-br from-[#162235]/60 to-[#0F1B2D]/40 border-[#1E3048]/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left - Info */}
            <div className="p-6 lg:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t.dashboard.commandCenter}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.aiPowered}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/30 text-amber-400">
                  {t.dashboard.comingSoon}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.commandCenterDesc}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">{t.dashboard.summarizeToday}</Badge>
                <Badge variant="secondary" className="text-xs">{t.dashboard.createProposal}</Badge>
                <Badge variant="secondary" className="text-xs">{t.dashboard.generateReport}</Badge>
              </div>
            </div>

            {/* Right - Input Mockup */}
            <div className="p-6 lg:p-8 bg-muted/20 border-t lg:border-t-0 lg:border-l border-border/30">
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder={t.dashboard.askAnything}
                    className="w-full h-24 px-4 py-3 text-sm bg-background/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t.dashboard.poweredByAi}
                  </span>
                  <Button size="sm" disabled className="gap-2">
                    <Send className="h-3.5 w-3.5" />
                    {t.dashboard.send}
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
      <div className="h-2 bg-[#0F1B2D] rounded-full overflow-hidden">
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1B2D]/50 border border-[#1E3048]/30">
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
