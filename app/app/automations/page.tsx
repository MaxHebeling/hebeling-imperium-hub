"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Zap,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Copy,
  Settings,
  Trash2,
  FileText,
  Users,
  Briefcase,
  Globe,
  FileCheck,
  CreditCard,
  TrendingUp,
  Timer,
  BarChart3,
  Workflow,
} from "lucide-react";

// Types
type AutomationStatus = "active" | "draft" | "paused" | "failed" | "archived";
type ModuleType = "crm" | "deals" | "clients" | "projects" | "websites" | "documents" | "payments" | "investors";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    module: ModuleType;
    label: string;
  };
  actions_count: number;
  status: AutomationStatus;
  last_run: string | null;
  success_rate: number;
  total_runs: number;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
  };
  updated_at: string;
}

// Status configuration
const STATUS_CONFIG: Record<AutomationStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  draft: {
    label: "Draft",
    color: "text-muted-foreground",
    bgClass: "bg-muted/50 border-muted-foreground/20",
    icon: <FileText className="h-3 w-3" />,
  },
  paused: {
    label: "Paused",
    color: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    icon: <Pause className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bgClass: "bg-red-500/10 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  archived: {
    label: "Archived",
    color: "text-slate-400",
    bgClass: "bg-slate-500/10 border-slate-500/30",
    icon: <FileCheck className="h-3 w-3" />,
  },
};

// Module configuration
const MODULE_CONFIG: Record<ModuleType, { label: string; color: string; icon: React.ReactNode }> = {
  crm: { label: "CRM", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: <Users className="h-3 w-3" /> },
  deals: { label: "Deals", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: <Briefcase className="h-3 w-3" /> },
  clients: { label: "Clients", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", icon: <Users className="h-3 w-3" /> },
  projects: { label: "Projects", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", icon: <Activity className="h-3 w-3" /> },
  websites: { label: "Websites", color: "text-pink-400 bg-pink-500/10 border-pink-500/30", icon: <Globe className="h-3 w-3" /> },
  documents: { label: "Documents", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: <FileText className="h-3 w-3" /> },
  payments: { label: "Payments", color: "text-green-400 bg-green-500/10 border-green-500/30", icon: <CreditCard className="h-3 w-3" /> },
  investors: { label: "Investors", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", icon: <TrendingUp className="h-3 w-3" /> },
};

// Mock data
const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "New Lead Intake Workflow",
    description: "Process incoming leads and route to appropriate sales team",
    trigger: { type: "lead.created", module: "crm", label: "New Lead Created" },
    actions_count: 4,
    status: "active",
    last_run: "2024-01-15T10:30:00Z",
    success_rate: 98,
    total_runs: 156,
    owner: { id: "1", name: "Max Hebeling", avatar: null },
    updated_at: "2024-01-15T09:00:00Z",
  },
  {
    id: "2",
    name: "Deal Won to Project Creation",
    description: "Automatically create project when deal is won",
    trigger: { type: "deal.won", module: "deals", label: "Deal Won" },
    actions_count: 5,
    status: "active",
    last_run: "2024-01-14T16:45:00Z",
    success_rate: 100,
    total_runs: 43,
    owner: { id: "2", name: "Sarah Johnson", avatar: null },
    updated_at: "2024-01-14T14:00:00Z",
  },
  {
    id: "3",
    name: "Payment Received Confirmation",
    description: "Send confirmation and update records on payment",
    trigger: { type: "payment.received", module: "payments", label: "Payment Received" },
    actions_count: 3,
    status: "active",
    last_run: "2024-01-15T08:20:00Z",
    success_rate: 95,
    total_runs: 89,
    owner: { id: "1", name: "Max Hebeling", avatar: null },
    updated_at: "2024-01-12T11:00:00Z",
  },
  {
    id: "4",
    name: "Website Deployment Notification",
    description: "Notify team and client when website is deployed",
    trigger: { type: "website.deployed", module: "websites", label: "Deployment Completed" },
    actions_count: 4,
    status: "paused",
    last_run: "2024-01-10T12:00:00Z",
    success_rate: 92,
    total_runs: 28,
    owner: { id: "3", name: "Mike Chen", avatar: null },
    updated_at: "2024-01-10T10:00:00Z",
  },
  {
    id: "5",
    name: "Contract Signature Workflow",
    description: "Process signed contracts and trigger onboarding",
    trigger: { type: "document.signed", module: "documents", label: "Contract Signed" },
    actions_count: 6,
    status: "active",
    last_run: "2024-01-13T15:30:00Z",
    success_rate: 100,
    total_runs: 17,
    owner: { id: "2", name: "Sarah Johnson", avatar: null },
    updated_at: "2024-01-13T14:00:00Z",
  },
  {
    id: "6",
    name: "Client Status Change Alert",
    description: "Alert account managers when client status changes",
    trigger: { type: "client.status_changed", module: "clients", label: "Client Status Changed" },
    actions_count: 2,
    status: "draft",
    last_run: null,
    success_rate: 0,
    total_runs: 0,
    owner: { id: "1", name: "Max Hebeling", avatar: null },
    updated_at: "2024-01-08T09:00:00Z",
  },
  {
    id: "7",
    name: "Project Task Overdue Escalation",
    description: "Escalate overdue tasks to project managers",
    trigger: { type: "task.overdue", module: "projects", label: "Task Overdue" },
    actions_count: 3,
    status: "failed",
    last_run: "2024-01-11T08:00:00Z",
    success_rate: 45,
    total_runs: 11,
    owner: { id: "3", name: "Mike Chen", avatar: null },
    updated_at: "2024-01-11T08:30:00Z",
  },
  {
    id: "8",
    name: "Investor Welcome Sequence",
    description: "Welcome sequence for new investors",
    trigger: { type: "investor.registered", module: "investors", label: "Investor Registered" },
    actions_count: 5,
    status: "active",
    last_run: "2024-01-14T11:00:00Z",
    success_rate: 100,
    total_runs: 8,
    owner: { id: "1", name: "Max Hebeling", avatar: null },
    updated_at: "2024-01-14T10:00:00Z",
  },
];

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AutomationsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Calculate stats
  const stats = useMemo(() => {
    const active = mockAutomations.filter(a => a.status === "active").length;
    const runsToday = mockAutomations.reduce((acc, a) => {
      if (a.last_run && new Date(a.last_run).toDateString() === new Date().toDateString()) {
        return acc + 1;
      }
      return acc;
    }, 0);
    const successfulRuns = mockAutomations.reduce((acc, a) => acc + Math.round(a.total_runs * (a.success_rate / 100)), 0);
    const failedRuns = mockAutomations.reduce((acc, a) => acc + Math.round(a.total_runs * ((100 - a.success_rate) / 100)), 0);
    const pending = mockAutomations.filter(a => a.status === "draft").length;
    
    return { active, runsToday, successfulRuns, failedRuns, pending, avgTime: "245ms" };
  }, []);

  // Filter automations
  const filteredAutomations = useMemo(() => {
    return mockAutomations.filter(automation => {
      const matchesSearch = automation.name.toLowerCase().includes(search.toLowerCase()) ||
                           automation.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || automation.status === statusFilter;
      const matchesModule = moduleFilter === "all" || automation.trigger.module === moduleFilter;
      const matchesOwner = ownerFilter === "all" || automation.owner.id === ownerFilter;
      
      return matchesSearch && matchesStatus && matchesModule && matchesOwner;
    });
  }, [search, statusFilter, moduleFilter, ownerFilter]);

  // Get unique owners for filter
  const owners = useMemo(() => {
    const uniqueOwners = new Map<string, { id: string; name: string }>();
    mockAutomations.forEach(a => uniqueOwners.set(a.owner.id, a.owner));
    return Array.from(uniqueOwners.values());
  }, []);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              {t.automations.engineOnline}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            {t.automations.title}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t.automations.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">View Logs</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Failed Runs</span>
          </Button>
          <Link href="/app/automations/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Automation
            </Button>
          </Link>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/app/automations/new">
              <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer">
                <Plus className="h-5 w-5 text-foreground/80" />
                <span className="text-xs font-medium text-foreground/90">New Automation</span>
              </button>
            </Link>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-200 cursor-pointer">
              <Workflow className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Templates</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200 cursor-pointer">
              <BarChart3 className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Analytics</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer">
              <Settings className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Settings</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Play className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.runsToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Runs Today</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.successfulRuns}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Successful</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.failedRuns}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Failed</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Drafts</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.avgTime}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-card/30 border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {filteredAutomations.length === 0 ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">No automations found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {mockAutomations.length === 0
                ? "Create your first automation to start orchestrating workflows"
                : "Try adjusting your filters to find what you're looking for"}
            </p>
            {mockAutomations.length === 0 && (
              <Link href="/app/automations/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Automation
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-muted-foreground font-medium">Automation</TableHead>
                <TableHead className="text-muted-foreground font-medium">Module</TableHead>
                <TableHead className="text-muted-foreground font-medium">Trigger</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Last Run</TableHead>
                <TableHead className="text-muted-foreground font-medium">Success Rate</TableHead>
                <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => {
                const statusConfig = STATUS_CONFIG[automation.status];
                const moduleConfig = MODULE_CONFIG[automation.trigger.module];
                
                return (
                  <TableRow 
                    key={automation.id}
                    className="hover:bg-muted/20 border-border/30 transition-colors group"
                  >
                    <TableCell className="font-medium">
                      <Link 
                        href={`/app/automations/${automation.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <div>
                          <p className="text-foreground">{automation.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{automation.description}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${moduleConfig.color}`}>
                        {moduleConfig.icon}
                        {moduleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {automation.trigger.label}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-muted/30">
                        {automation.actions_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`gap-1.5 ${statusConfig.bgClass} ${statusConfig.color} border`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(automation.last_run)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={automation.success_rate} 
                          className="h-1.5 w-16"
                        />
                        <span className={`text-xs font-medium ${
                          automation.success_rate >= 90 ? "text-emerald-400" :
                          automation.success_rate >= 70 ? "text-amber-400" :
                          "text-red-400"
                        }`}>
                          {automation.success_rate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={automation.owner.avatar || undefined} />
                          <AvatarFallback className="text-[10px] bg-muted/50">
                            {automation.owner.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                          {automation.owner.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/app/automations/${automation.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/automations/${automation.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {automation.status === "active" ? (
                              <DropdownMenuItem className="cursor-pointer text-amber-400">
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            ) : automation.status === "paused" ? (
                              <DropdownMenuItem className="cursor-pointer text-emerald-400">
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem className="cursor-pointer">
                              <FileText className="h-4 w-4 mr-2" />
                              View Logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Prebuilt Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Prebuilt Templates</h2>
              <p className="text-xs text-muted-foreground">Get started quickly with common workflows</p>
            </div>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "New Lead Intake",
              description: "Process incoming leads and route to sales",
              trigger: "New Lead Created",
              actions: 4,
              module: "crm" as ModuleType,
            },
            {
              name: "Deal Won to Project",
              description: "Automatically create project when deal closes",
              trigger: "Deal Won",
              actions: 5,
              module: "deals" as ModuleType,
            },
            {
              name: "Payment Confirmation",
              description: "Send receipt and update records on payment",
              trigger: "Payment Received",
              actions: 3,
              module: "payments" as ModuleType,
            },
          ].map((template, index) => {
            const moduleConfig = MODULE_CONFIG[template.module];
            return (
              <Card key={index} className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={`gap-1 ${moduleConfig.color}`}>
                      {moduleConfig.icon}
                      {moduleConfig.label}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted/30 text-xs">
                      {template.actions} actions
                    </Badge>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Trigger: {template.trigger}
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
