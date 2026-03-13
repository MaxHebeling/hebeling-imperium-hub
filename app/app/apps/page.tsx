"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Contact,
  TrendingUp,
  Users,
  FolderKanban,
  Globe,
  FileText,
  CreditCard,
  Briefcase,
  Zap,
  BarChart3,
  Sparkles,
  Lock,
  ExternalLink,
  Settings,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";

// Types
type AppCategory = "core" | "client-management" | "operations" | "finance" | "intelligence";
type AppStatus = "core" | "enabled" | "disabled" | "beta" | "coming-soon";

interface AppModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  category: AppCategory;
  status: AppStatus;
  version: string;
  enabled: boolean;
  metrics: {
    total_entities: number;
    active_usage: number;
  };
}

// Category config
const CATEGORY_CONFIG: Record<AppCategory, { label: string; color: string; bgClass: string }> = {
  core: { 
    label: "Core Platform", 
    color: "text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/30"
  },
  "client-management": { 
    label: "Client Management", 
    color: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/30"
  },
  operations: { 
    label: "Operations", 
    color: "text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/30"
  },
  finance: { 
    label: "Finance", 
    color: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30"
  },
  intelligence: { 
    label: "Intelligence", 
    color: "text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/30"
  },
};

// Status config
const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  core: { 
    label: "Core", 
    color: "text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/30",
    icon: <Lock className="h-3 w-3" />
  },
  enabled: { 
    label: "Enabled", 
    color: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  disabled: { 
    label: "Disabled", 
    color: "text-gray-400",
    bgClass: "bg-gray-500/10 border-gray-500/30",
    icon: <XCircle className="h-3 w-3" />
  },
  beta: { 
    label: "Beta", 
    color: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    icon: <Clock className="h-3 w-3" />
  },
  "coming-soon": { 
    label: "Coming Soon", 
    color: "text-gray-500",
    bgClass: "bg-gray-500/10 border-gray-500/20",
    icon: <Clock className="h-3 w-3" />
  },
};

// Apps registry — metrics are zeroed until connected to real data
const APPS: AppModule[] = [
  {
    id: "ai-command-center",
    name: "AI Command Center",
    slug: "ai",
    description: "Executive AI co-pilot for business operations, insights, and strategic decision-making.",
    icon: <Sparkles className="h-6 w-6" />,
    iconBgColor: "bg-gradient-to-br from-cyan-500/20 to-purple-500/20",
    category: "intelligence",
    status: "core",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "automations",
    name: "Automations",
    slug: "automations",
    description: "Workflow orchestration engine for automated business processes and triggers.",
    icon: <Zap className="h-6 w-6" />,
    iconBgColor: "bg-amber-500/20",
    category: "core",
    status: "core",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "analytics",
    name: "Analytics",
    slug: "analytics",
    description: "Business intelligence dashboards, reports, and performance metrics.",
    icon: <BarChart3 className="h-6 w-6" />,
    iconBgColor: "bg-purple-500/20",
    category: "core",
    status: "beta",
    version: "0.9.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "crm",
    name: "CRM",
    slug: "crm",
    description: "Contact and lead management for tracking relationships and sales pipeline.",
    icon: <Contact className="h-6 w-6" />,
    iconBgColor: "bg-blue-500/20",
    category: "client-management",
    status: "enabled",
    version: "1.2.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "deals",
    name: "Deals",
    slug: "deals",
    description: "Sales pipeline management with stages, forecasting, and deal tracking.",
    icon: <TrendingUp className="h-6 w-6" />,
    iconBgColor: "bg-emerald-500/20",
    category: "client-management",
    status: "enabled",
    version: "1.1.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "clients",
    name: "Clients",
    slug: "clients",
    description: "Client operating system for managing relationships, projects, and deliverables.",
    icon: <Users className="h-6 w-6" />,
    iconBgColor: "bg-cyan-500/20",
    category: "client-management",
    status: "enabled",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "projects",
    name: "Projects",
    slug: "projects",
    description: "Project management with tasks, milestones, and team collaboration.",
    icon: <FolderKanban className="h-6 w-6" />,
    iconBgColor: "bg-teal-500/20",
    category: "operations",
    status: "enabled",
    version: "1.3.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "websites",
    name: "Websites",
    slug: "websites",
    description: "Website command center for domains, deployments, and digital properties.",
    icon: <Globe className="h-6 w-6" />,
    iconBgColor: "bg-green-500/20",
    category: "operations",
    status: "enabled",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "documents",
    name: "Documents",
    slug: "documents",
    description: "Document management, file storage, templates, and version control.",
    icon: <FileText className="h-6 w-6" />,
    iconBgColor: "bg-orange-500/20",
    category: "operations",
    status: "enabled",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "payments",
    name: "Payments",
    slug: "payments",
    description: "Invoice management, payment tracking, and financial operations.",
    icon: <CreditCard className="h-6 w-6" />,
    iconBgColor: "bg-amber-500/20",
    category: "finance",
    status: "enabled",
    version: "1.0.0",
    enabled: true,
    metrics: { total_entities: 0, active_usage: 0 },
  },
  {
    id: "investors",
    name: "Investors",
    slug: "investors",
    description: "Investor relations portal for updates, reports, and stakeholder management.",
    icon: <Briefcase className="h-6 w-6" />,
    iconBgColor: "bg-rose-500/20",
    category: "finance",
    status: "coming-soon",
    version: "0.1.0",
    enabled: false,
    metrics: { total_entities: 0, active_usage: 0 },
  },
];

export default function AppsRegistryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [apps, setApps] = useState(APPS);

  // Filter apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || app.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle app enabled state
  const toggleAppEnabled = (appId: string) => {
    setApps(prev => prev.map(app => {
      if (app.id === appId && app.status !== "core" && app.status !== "coming-soon") {
        return { 
          ...app, 
          enabled: !app.enabled,
          status: app.enabled ? "disabled" : "enabled"
        };
      }
      return app;
    }));
  };

  // Stats
  const stats = {
    total: apps.length,
    enabled: apps.filter(a => a.enabled).length,
    core: apps.filter(a => a.status === "core").length,
    beta: apps.filter(a => a.status === "beta").length,
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              System Online
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Apps
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage the applications and operational modules that power your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            Install App
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Apps</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.enabled}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Enabled</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Lock className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.core}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Core Modules</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.beta}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">In Beta</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/30 border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search apps by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="core">Core Platform</SelectItem>
                  <SelectItem value="client-management">Client Management</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="intelligence">Intelligence</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="coming-soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center border border-border/50 rounded-md bg-background/50">
                <Button 
                  variant={viewMode === "grid" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {filteredApps.length} {filteredApps.length === 1 ? "app" : "apps"} available
          </div>
        </CardContent>
      </Card>

      {/* Apps Grid */}
      {filteredApps.length === 0 ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">No apps found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Try adjusting your filters to find the apps you're looking for.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const categoryConfig = CATEGORY_CONFIG[app.category];
            const statusConfig = STATUS_CONFIG[app.status];
            const isDisabled = app.status === "coming-soon";
            
            return (
              <Card 
                key={app.id} 
                className={`bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200 group ${
                  isDisabled ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl ${app.iconBgColor} flex items-center justify-center text-foreground`}>
                        {app.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          {app.name}
                          {app.status === "core" && (
                            <Lock className="h-3 w-3 text-purple-400" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${categoryConfig.bgClass} ${categoryConfig.color} border`}
                          >
                            {categoryConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${statusConfig.bgClass} ${statusConfig.color} border gap-1`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {app.description}
                  </CardDescription>
                  
                  {/* Metrics */}
                  {!isDisabled && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{app.metrics.total_entities.toLocaleString()} entities</span>
                      <span>{app.metrics.active_usage}% usage</span>
                      <span className="text-muted-foreground/50">v{app.version}</span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Link href={`/app/${app.slug}`}>
                        <Button 
                          size="sm" 
                          disabled={isDisabled}
                          className="gap-1.5"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/app/apps/${app.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status !== "core" && app.status !== "coming-soon" && (
                        <Switch 
                          checked={app.enabled}
                          onCheckedChange={() => toggleAppEnabled(app.id)}
                        />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/apps/${app.id}`} className="cursor-pointer">
                              <Settings className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Documentation
                          </DropdownMenuItem>
                          {app.status !== "core" && app.status !== "coming-soon" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => toggleAppEnabled(app.id)}
                              >
                                {app.enabled ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Disable App
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Enable App
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // List View
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <div className="divide-y divide-border/30">
            {filteredApps.map((app) => {
              const categoryConfig = CATEGORY_CONFIG[app.category];
              const statusConfig = STATUS_CONFIG[app.status];
              const isDisabled = app.status === "coming-soon";
              
              return (
                <div 
                  key={app.id} 
                  className={`p-4 hover:bg-muted/20 transition-colors group ${
                    isDisabled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg ${app.iconBgColor} flex items-center justify-center text-foreground shrink-0`}>
                        {app.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{app.name}</h3>
                          {app.status === "core" && (
                            <Lock className="h-3 w-3 text-purple-400" />
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${categoryConfig.bgClass} ${categoryConfig.color} border`}
                          >
                            {categoryConfig.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-[10px] ${statusConfig.bgClass} ${statusConfig.color} border gap-1`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {app.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {!isDisabled && (
                        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{app.metrics.total_entities.toLocaleString()} entities</span>
                          <span>{app.metrics.active_usage}% usage</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Link href={`/app/${app.slug}`}>
                          <Button size="sm" disabled={isDisabled}>
                            Open
                          </Button>
                        </Link>
                        {app.status !== "core" && app.status !== "coming-soon" && (
                          <Switch 
                            checked={app.enabled}
                            onCheckedChange={() => toggleAppEnabled(app.id)}
                          />
                        )}
                        <Link href={`/app/apps/${app.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
