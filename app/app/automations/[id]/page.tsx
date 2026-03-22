"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Zap,
  FileText,
  Users,
  Briefcase,
  Globe,
  CreditCard,
  TrendingUp,
  Timer,
  BarChart3,
  Workflow,
  ArrowRight,
  Plus,
  GripVertical,
  Edit,
  Copy,
  MoreHorizontal,
  Mail,
  Bell,
  Webhook,
  RefreshCw,
  Calendar,
  User,
  Building,
  Filter,
  Target,
  GitBranch,
  Terminal,
  Archive,
} from "lucide-react";

// Types
type AutomationStatus = "active" | "draft" | "paused" | "failed" | "archived";
type ModuleType = "crm" | "deals" | "clients" | "projects" | "websites" | "documents" | "payments" | "investors";
type RunStatus = "success" | "failed" | "running" | "queued" | "canceled";
type LogLevel = "info" | "success" | "warning" | "error";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    module: ModuleType;
    label: string;
    description: string;
  };
  conditions: Condition[];
  actions: Action[];
  status: AutomationStatus;
  last_run: string | null;
  success_rate: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_ms: number;
  owner: { id: string; name: string; avatar: string | null };
  organization: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: "and" | "or";
}

interface Action {
  id: string;
  type: string;
  label: string;
  target: string;
  config: Record<string, unknown>;
  order: number;
}

interface RunHistory {
  id: string;
  triggered_entity: { type: string; id: string; name: string };
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number;
  initiated_by: { type: "system" | "user"; name: string };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  event: string;
  module: string;
  message: string;
}

// Status configuration
const STATUS_CONFIG: Record<AutomationStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  draft: { label: "Draft", color: "text-muted-foreground", bgClass: "bg-muted/50 border-muted-foreground/20", icon: <FileText className="h-3 w-3" /> },
  paused: { label: "Paused", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30", icon: <Pause className="h-3 w-3" /> },
  failed: { label: "Failed", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  archived: { label: "Archived", color: "text-slate-400", bgClass: "bg-slate-500/10 border-slate-500/30", icon: <Archive className="h-3 w-3" /> },
};

const RUN_STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bgClass: string }> = {
  success: { label: "Success", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  failed: { label: "Failed", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30" },
  running: { label: "Running", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  queued: { label: "Queued", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  canceled: { label: "Canceled", color: "text-muted-foreground", bgClass: "bg-muted/50 border-muted-foreground/20" },
};

const LOG_LEVEL_CONFIG: Record<LogLevel, { color: string; bgClass: string }> = {
  info: { color: "text-blue-400", bgClass: "bg-blue-500/10" },
  success: { color: "text-emerald-400", bgClass: "bg-emerald-500/10" },
  warning: { color: "text-amber-400", bgClass: "bg-amber-500/10" },
  error: { color: "text-red-400", bgClass: "bg-red-500/10" },
};

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

// Trigger Options
const TRIGGER_OPTIONS = {
  crm: [
    { type: "lead.created", label: "New Lead Created", description: "Triggers when a new lead is added to the CRM" },
    { type: "lead.updated", label: "Lead Updated", description: "Triggers when lead information is modified" },
    { type: "lead.qualified", label: "Lead Qualified", description: "Triggers when a lead is marked as qualified" },
  ],
  deals: [
    { type: "deal.created", label: "Deal Created", description: "Triggers when a new deal is created" },
    { type: "deal.stage_changed", label: "Deal Stage Changed", description: "Triggers when a deal moves to a different stage" },
    { type: "deal.won", label: "Deal Won", description: "Triggers when a deal is marked as won" },
    { type: "deal.lost", label: "Deal Lost", description: "Triggers when a deal is marked as lost" },
  ],
  clients: [
    { type: "client.created", label: "Client Created", description: "Triggers when a new client is added" },
    { type: "client.status_changed", label: "Client Status Changed", description: "Triggers when client status changes" },
    { type: "client.archived", label: "Client Archived", description: "Triggers when a client is archived" },
  ],
  projects: [
    { type: "project.created", label: "Project Created", description: "Triggers when a new project is created" },
    { type: "project.status_changed", label: "Project Status Changed", description: "Triggers when project status changes" },
    { type: "task.overdue", label: "Task Overdue", description: "Triggers when a task passes its due date" },
    { type: "task.completed", label: "Task Completed", description: "Triggers when a task is marked complete" },
  ],
  websites: [
    { type: "website.created", label: "Website Created", description: "Triggers when a new website is added" },
    { type: "website.deployed", label: "Deployment Completed", description: "Triggers when a deployment finishes" },
    { type: "website.domain_added", label: "Domain Added", description: "Triggers when a domain is connected" },
    { type: "website.form_submitted", label: "Form Submission", description: "Triggers on website form submission" },
  ],
  documents: [
    { type: "document.generated", label: "Document Generated", description: "Triggers when a document is created" },
    { type: "document.signed", label: "Contract Signed", description: "Triggers when a contract is signed" },
    { type: "document.exported", label: "PDF Exported", description: "Triggers when a PDF is exported" },
  ],
  payments: [
    { type: "payment.received", label: "Payment Received", description: "Triggers when payment is received" },
    { type: "subscription.created", label: "Subscription Created", description: "Triggers on new subscription" },
    { type: "invoice.overdue", label: "Invoice Overdue", description: "Triggers when invoice is past due" },
  ],
  investors: [
    { type: "investor.registered", label: "Investor Registered", description: "Triggers when new investor signs up" },
    { type: "investor.membership_assigned", label: "Membership Assigned", description: "Triggers when membership is assigned" },
  ],
};

// Action Options
const ACTION_OPTIONS = [
  { type: "create_contact", label: "Create Contact", icon: <User className="h-4 w-4" /> },
  { type: "create_client", label: "Create Client", icon: <Building className="h-4 w-4" /> },
  { type: "create_project", label: "Create Project", icon: <Activity className="h-4 w-4" /> },
  { type: "create_task", label: "Create Task", icon: <CheckCircle2 className="h-4 w-4" /> },
  { type: "update_record", label: "Update Record", icon: <Edit className="h-4 w-4" /> },
  { type: "assign_owner", label: "Assign Owner", icon: <User className="h-4 w-4" /> },
  { type: "add_tag", label: "Add Tag", icon: <Target className="h-4 w-4" /> },
  { type: "send_email", label: "Send Email", icon: <Mail className="h-4 w-4" /> },
  { type: "send_notification", label: "Send Notification", icon: <Bell className="h-4 w-4" /> },
  { type: "trigger_webhook", label: "Trigger Webhook", icon: <Webhook className="h-4 w-4" /> },
  { type: "generate_document", label: "Generate Document", icon: <FileText className="h-4 w-4" /> },
  { type: "create_activity", label: "Create Activity Entry", icon: <Activity className="h-4 w-4" /> },
];

// Mock Data
const mockAutomation: Automation = {
  id: "1",
  name: "New Lead Intake Workflow",
  description: "Automatically processes incoming leads, creates contacts, assigns to the appropriate sales representative, and sends welcome notifications.",
  trigger: {
    type: "lead.created",
    module: "crm",
    label: "New Lead Created",
    description: "Triggers when a new lead is added to the CRM",
  },
  conditions: [
    { id: "c1", field: "lead_source", operator: "equals", value: "website", logic: "and" },
    { id: "c2", field: "business_unit", operator: "equals", value: "Enterprise", logic: "and" },
  ],
  actions: [
    { id: "a1", type: "create_contact", label: "Create Contact", target: "CRM Contacts", config: {}, order: 1 },
    { id: "a2", type: "assign_owner", label: "Assign Sales Rep", target: "Sales Team", config: { method: "round_robin" }, order: 2 },
    { id: "a3", type: "send_notification", label: "Notify Sales Manager", target: "Internal", config: { channel: "slack" }, order: 3 },
    { id: "a4", type: "send_email", label: "Send Welcome Email", target: "Lead Email", config: { template: "welcome_lead" }, order: 4 },
  ],
  status: "active",
  last_run: "2024-01-15T10:30:00Z",
  success_rate: 98,
  total_runs: 156,
  successful_runs: 153,
  failed_runs: 3,
  avg_duration_ms: 245,
  owner: { id: "1", name: "Max Hebeling", avatar: null },
  organization: { id: "1", name: "Hebeling Enterprises" },
  created_at: "2024-01-01T09:00:00Z",
  updated_at: "2024-01-15T09:00:00Z",
};

const mockRunHistory: RunHistory[] = [
  { id: "r1", triggered_entity: { type: "lead", id: "l1", name: "John Smith" }, status: "success", started_at: "2024-01-15T10:30:00Z", finished_at: "2024-01-15T10:30:00Z", duration_ms: 234, initiated_by: { type: "system", name: "System" } },
  { id: "r2", triggered_entity: { type: "lead", id: "l2", name: "Sarah Johnson" }, status: "success", started_at: "2024-01-15T09:15:00Z", finished_at: "2024-01-15T09:15:00Z", duration_ms: 189, initiated_by: { type: "system", name: "System" } },
  { id: "r3", triggered_entity: { type: "lead", id: "l3", name: "Mike Chen" }, status: "failed", started_at: "2024-01-14T16:45:00Z", finished_at: "2024-01-14T16:45:01Z", duration_ms: 1023, initiated_by: { type: "system", name: "System" } },
  { id: "r4", triggered_entity: { type: "lead", id: "l4", name: "Emily Davis" }, status: "success", started_at: "2024-01-14T14:20:00Z", finished_at: "2024-01-14T14:20:00Z", duration_ms: 198, initiated_by: { type: "system", name: "System" } },
  { id: "r5", triggered_entity: { type: "lead", id: "l5", name: "Alex Wilson" }, status: "success", started_at: "2024-01-14T11:00:00Z", finished_at: "2024-01-14T11:00:00Z", duration_ms: 267, initiated_by: { type: "user", name: "Max Hebeling" } },
];

const mockLogs: LogEntry[] = [
  { id: "log1", timestamp: "2024-01-15T10:30:00.234Z", level: "info", event: "trigger_received", module: "crm", message: "Trigger received: New Lead Created (John Smith)" },
  { id: "log2", timestamp: "2024-01-15T10:30:00.245Z", level: "success", event: "condition_passed", module: "engine", message: "All conditions evaluated: PASS (2/2)" },
  { id: "log3", timestamp: "2024-01-15T10:30:00.267Z", level: "success", event: "action_executed", module: "crm", message: "Action 1: Contact created successfully" },
  { id: "log4", timestamp: "2024-01-15T10:30:00.289Z", level: "success", event: "action_executed", module: "assignments", message: "Action 2: Owner assigned (Round Robin)" },
  { id: "log5", timestamp: "2024-01-15T10:30:00.312Z", level: "success", event: "action_executed", module: "notifications", message: "Action 3: Slack notification sent" },
  { id: "log6", timestamp: "2024-01-15T10:30:00.334Z", level: "success", event: "action_executed", module: "email", message: "Action 4: Welcome email queued" },
  { id: "log7", timestamp: "2024-01-15T10:30:00.345Z", level: "info", event: "run_completed", module: "engine", message: "Automation run completed successfully (234ms)" },
  { id: "log8", timestamp: "2024-01-14T16:45:01.023Z", level: "error", event: "action_failed", module: "email", message: "Action 4 failed: SMTP connection timeout" },
  { id: "log9", timestamp: "2024-01-14T16:45:01.025Z", level: "warning", event: "run_failed", module: "engine", message: "Automation run failed after 3 successful actions" },
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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function AutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  use(params);
  const [activeTab, setActiveTab] = useState("overview");
  const [automation] = useState<Automation>(mockAutomation);
  const [selectedTriggerModule, setSelectedTriggerModule] = useState<ModuleType>(automation.trigger.module);

  const statusConfig = STATUS_CONFIG[automation.status];
  const moduleConfig = MODULE_CONFIG[automation.trigger.module];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/automations" className="hover:text-foreground transition-colors">
          Automations
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{automation.name}</span>
      </div>

      {/* Premium Header */}
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{automation.name}</h1>
                <Badge variant="outline" className={`gap-1.5 ${statusConfig.bgClass} ${statusConfig.color} border`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">{automation.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Badge variant="outline" className={`gap-1 ${moduleConfig.color}`}>
                  {moduleConfig.icon}
                  {moduleConfig.label}
                </Badge>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last run: {formatRelativeTime(automation.last_run)}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  {automation.success_rate}% success rate
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-muted/50">
                      {automation.owner.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {automation.owner.name}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {automation.status === "active" ? (
                <Button variant="outline" size="sm" className="gap-2 text-amber-400 border-amber-500/30 hover:border-amber-500/50">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50">
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              <Button size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Run Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/40 border border-border/40 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trigger" className="gap-2 data-[state=active]:bg-background">
            <Zap className="h-4 w-4" />
            Trigger
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-2 data-[state=active]:bg-background">
            <Filter className="h-4 w-4" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2 data-[state=active]:bg-background">
            <GitBranch className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-background">
            <Clock className="h-4 w-4" />
            Run History
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-background">
            <Terminal className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{automation.total_runs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Runs</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{automation.successful_runs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Successful</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">{automation.failed_runs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Failed</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-cyan-400">{automation.success_rate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Success Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Timer className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-400">{automation.avg_duration_ms}ms</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Duration</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{formatRelativeTime(automation.last_run)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Last Run</p>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Visualizer */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-4 w-4 text-purple-400" />
                Workflow Overview
              </CardTitle>
              <CardDescription>Visual representation of the automation flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 py-6 overflow-x-auto">
                {/* Trigger */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="h-16 w-16 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Trigger</span>
                  <span className="text-[10px] text-muted-foreground text-center">{automation.trigger.label}</span>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                {/* Conditions */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="h-16 w-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Filter className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Conditions</span>
                  <span className="text-[10px] text-muted-foreground">{automation.conditions.length} rules</span>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                {/* Actions */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="h-16 w-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <GitBranch className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Actions</span>
                  <span className="text-[10px] text-muted-foreground">{automation.actions.length} steps</span>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                {/* Notifications */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="h-16 w-16 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Notify</span>
                  <span className="text-[10px] text-muted-foreground">Email + Slack</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Summary */}
            <Card className="bg-card/40 border-border/40 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Automation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm text-foreground mt-1">{automation.description}</p>
                </div>
                <Separator className="bg-border/40" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Module</Label>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-2">
                      <Badge variant="outline" className={`gap-1 ${moduleConfig.color}`}>
                        {moduleConfig.icon}
                        {moduleConfig.label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Trigger Type</Label>
                    <p className="text-sm text-foreground mt-1">{automation.trigger.label}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Created</Label>
                    <p className="text-sm text-foreground mt-1">{new Date(automation.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Last Updated</Label>
                    <p className="text-sm text-foreground mt-1">{new Date(automation.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Recent Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRunHistory.slice(0, 5).map((run) => {
                    const runStatusConfig = RUN_STATUS_CONFIG[run.status];
                    return (
                      <div key={run.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${runStatusConfig.bgClass} ${runStatusConfig.color} text-[10px] px-1.5 py-0`}>
                            {runStatusConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {run.triggered_entity.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(run.started_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trigger Tab */}
        <TabsContent value="trigger" className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                Configure Trigger
              </CardTitle>
              <CardDescription>Select when this automation should run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Trigger Display */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{automation.trigger.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{automation.trigger.description}</p>
                    <Badge variant="outline" className={`gap-1 ${moduleConfig.color} mt-2`}>
                      {moduleConfig.icon}
                      {moduleConfig.label} Module
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Module Selector */}
              <div className="space-y-3">
                <Label>Select Module</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(MODULE_CONFIG) as [ModuleType, typeof MODULE_CONFIG.crm][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTriggerModule(key)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedTriggerModule === key
                          ? "border-primary bg-primary/10"
                          : "border-border/40 bg-card/30 hover:bg-card/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {config.icon}
                        <span className="text-xs font-medium">{config.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Options */}
              <div className="space-y-3">
                <Label>Available Triggers</Label>
                <div className="grid gap-2">
                  {TRIGGER_OPTIONS[selectedTriggerModule]?.map((trigger) => (
                    <div
                      key={trigger.type}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        automation.trigger.type === trigger.type
                          ? "border-primary bg-primary/10"
                          : "border-border/40 bg-card/30 hover:bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">{trigger.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
                        </div>
                        {automation.trigger.type === trigger.type && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-400" />
                Conditions (Optional)
              </CardTitle>
              <CardDescription>Refine when this automation runs with conditional logic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {automation.conditions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center mb-3">
                    <Filter className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">No conditions configured. This automation will run on every trigger.</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {automation.conditions.map((condition, index) => (
                    <div key={condition.id} className="flex items-center gap-3">
                      {index > 0 && (
                        <Badge variant="outline" className="bg-muted/30 text-xs uppercase">
                          {condition.logic}
                        </Badge>
                      )}
                      <div className="flex-1 p-3 rounded-lg border border-border/40 bg-card/30 flex items-center gap-3">
                        <Select defaultValue={condition.field}>
                          <SelectTrigger className="w-[140px] bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead_source">Lead Source</SelectItem>
                            <SelectItem value="business_unit">Business Unit</SelectItem>
                            <SelectItem value="deal_value">Deal Value</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue={condition.operator}>
                          <SelectTrigger className="w-[120px] bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          defaultValue={condition.value} 
                          className="flex-1 bg-background/50"
                          placeholder="Value"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="gap-2 mt-4">
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-emerald-400" />
                Actions Sequence
              </CardTitle>
              <CardDescription>Define what happens when the trigger and conditions are met</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {automation.actions.map((action, index) => {
                  const actionOption = ACTION_OPTIONS.find(a => a.type === action.type);
                  return (
                    <div 
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30 group"
                    >
                      <div className="cursor-grab opacity-50 group-hover:opacity-100">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        {index + 1}
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        {actionOption?.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">Target: {action.target}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator className="bg-border/40" />
              
              <div className="space-y-3">
                <Label>Add Action</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ACTION_OPTIONS.slice(0, 8).map((action) => (
                    <button
                      key={action.type}
                      className="p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-all flex items-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Show All Actions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Run History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Run History
              </CardTitle>
              <CardDescription>View past automation executions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Run ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Triggered Entity</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Started</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Duration</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Initiated By</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRunHistory.map((run) => {
                    const runStatusConfig = RUN_STATUS_CONFIG[run.status];
                    return (
                      <TableRow key={run.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {run.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-foreground">{run.triggered_entity.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{run.triggered_entity.type}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${runStatusConfig.bgClass} ${runStatusConfig.color}`}>
                            {runStatusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(run.started_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(run.duration_ms)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {run.initiated_by.type === "system" ? (
                              <Badge variant="secondary" className="bg-muted/30 text-xs">System</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">{run.initiated_by.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                            {run.status === "failed" && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-400">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-400" />
                    Technical Logs
                  </CardTitle>
                  <CardDescription>Detailed execution logs for debugging</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[100px] bg-background/50 h-8">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-1 bg-black/20 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                {mockLogs.map((log) => {
                  const levelConfig = LOG_LEVEL_CONFIG[log.level];
                  return (
                    <div key={log.id} className="flex items-start gap-3 py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className={`${levelConfig.bgClass} ${levelConfig.color} text-[10px] px-1.5 py-0 uppercase shrink-0`}>
                        {log.level}
                      </Badge>
                      <span className="text-muted-foreground shrink-0">[{log.module}]</span>
                      <span className="text-foreground">{log.message}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Automation Name</Label>
                  <Input defaultValue={automation.name} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea defaultValue={automation.description} className="bg-background/50 min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Select defaultValue={automation.owner.id}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Max Hebeling</SelectItem>
                      <SelectItem value="2">Sarah Johnson</SelectItem>
                      <SelectItem value="3">Mike Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enabled</Label>
                    <p className="text-xs text-muted-foreground">Automation will run when enabled</p>
                  </div>
                  <Switch defaultChecked={automation.status === "active"} />
                </div>
                <Separator className="bg-border/40" />
                <div className="space-y-2">
                  <Label>Retry Policy</Label>
                  <Select defaultValue="exponential">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Retry</SelectItem>
                      <SelectItem value="immediate">Immediate Retry</SelectItem>
                      <SelectItem value="exponential">Exponential Backoff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notification Preferences</Label>
                  <Select defaultValue="on_failure">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always Notify</SelectItem>
                      <SelectItem value="on_failure">On Failure Only</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="bg-card/40 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-base text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that affect this automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div>
                  <p className="font-medium text-foreground">Archive Automation</p>
                  <p className="text-xs text-muted-foreground">Stop all runs and hide from main list</p>
                </div>
                <Button variant="outline" size="sm" className="text-amber-400 border-amber-500/30">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                <div>
                  <p className="font-medium text-foreground">Delete Automation</p>
                  <p className="text-xs text-muted-foreground">Permanently delete this automation and all history</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-400 border-red-500/30">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
