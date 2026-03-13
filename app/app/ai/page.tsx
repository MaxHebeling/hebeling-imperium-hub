"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Send,
  BarChart3,
  FileText,
  Users,
  FolderKanban,
  Globe,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  Settings,
  Target,
  Search,
  RefreshCw,
  ExternalLink,
  Bot,
  Lightbulb,
  Calendar,
  Mail,
  Bell,
  FileEdit,
  UserPlus,
  Play,
  Download,
  Building2,
  Briefcase,
  CreditCard,
  Workflow,
} from "lucide-react";
import Link from "next/link";

// Module configuration with colors
const MODULE_CONFIG = {
  crm: { label: "CRM", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Users },
  deals: { label: "Deals", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Target },
  clients: { label: "Clients", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Building2 },
  projects: { label: "Projects", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: FolderKanban },
  websites: { label: "Websites", color: "bg-pink-500/10 text-pink-400 border-pink-500/30", icon: Globe },
  documents: { label: "Documents", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: FileText },
  payments: { label: "Payments", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CreditCard },
  investors: { label: "Investors", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", icon: Briefcase },
  automations: { label: "Automations", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: Workflow },
};

// Quick action presets
const QUICK_ACTIONS = [
  {
    id: "priorities",
    title: "Summarize Priorities",
    description: "Get today's top priorities and action items",
    icon: Target,
    query: "Summarize today's priorities across all modules",
    category: "Analysis",
  },
  {
    id: "deals",
    title: "Analyze Deals",
    description: "Review deal pipeline and identify opportunities",
    icon: TrendingUp,
    query: "Analyze active deals and identify opportunities at risk",
    category: "Analysis",
  },
  {
    id: "proposal",
    title: "Generate Proposal",
    description: "Create a client proposal from templates",
    icon: FileText,
    query: "Generate a proposal for the most recent lead",
    category: "Generation",
  },
  {
    id: "projects",
    title: "Review Projects",
    description: "Check project health and blockers",
    icon: FolderKanban,
    query: "Review all active projects and identify blockers",
    category: "Review",
  },
  {
    id: "websites",
    title: "Audit Websites",
    description: "Check website status and deployment issues",
    icon: Globe,
    query: "Audit all websites for issues or needed updates",
    category: "Review",
  },
  {
    id: "report",
    title: "Generate Report",
    description: "Create executive performance report",
    icon: BarChart3,
    query: "Generate an executive report for this month",
    category: "Generation",
  },
  {
    id: "blocked",
    title: "Find Blockers",
    description: "Identify blocked or stalled items",
    icon: AlertTriangle,
    query: "Find all blocked projects, stuck deals, and overdue tasks",
    category: "Optimization",
  },
  {
    id: "followups",
    title: "Client Follow-ups",
    description: "List clients needing attention",
    icon: Users,
    query: "Show clients that need follow-up this week",
    category: "Optimization",
  },
];

// Mock AI insights
const MOCK_INSIGHTS = [
  {
    id: "1",
    type: "warning",
    module: "clients",
    title: "Clients Without Activity",
    description: "3 clients have no activity in 30+ days",
    metric: 3,
    severity: "amber",
  },
  {
    id: "2",
    type: "alert",
    module: "deals",
    title: "Deals Stuck in Pipeline",
    description: "2 deals have been in negotiation for 14+ days",
    metric: 2,
    severity: "red",
  },
  {
    id: "3",
    type: "info",
    module: "projects",
    title: "Projects Near Deadline",
    description: "4 projects due within 7 days",
    metric: 4,
    severity: "amber",
  },
  {
    id: "4",
    type: "warning",
    module: "websites",
    title: "Websites Need Attention",
    description: "2 sites have deployment issues",
    metric: 2,
    severity: "red",
  },
  {
    id: "5",
    type: "info",
    module: "payments",
    title: "Pending Invoices",
    description: "$12,500 in unpaid invoices",
    metric: "$12.5k",
    severity: "amber",
  },
  {
    id: "6",
    type: "success",
    module: "automations",
    title: "Automations Running",
    description: "12 automations active with 98% success",
    metric: 12,
    severity: "emerald",
  },
];

// Mock AI history
const MOCK_HISTORY = [
  {
    id: "1",
    query: "Summarize today's priorities",
    module: "all",
    user: "Max Hebeling",
    date: "2024-01-15T09:30:00Z",
    status: "completed",
  },
  {
    id: "2",
    query: "Show clients needing follow-up",
    module: "clients",
    user: "Max Hebeling",
    date: "2024-01-15T08:15:00Z",
    status: "completed",
  },
  {
    id: "3",
    query: "Analyze deal pipeline",
    module: "deals",
    user: "Max Hebeling",
    date: "2024-01-14T16:45:00Z",
    status: "completed",
  },
  {
    id: "4",
    query: "Generate monthly report",
    module: "all",
    user: "Max Hebeling",
    date: "2024-01-14T14:20:00Z",
    status: "completed",
  },
];

// Mock executive summary
const EXECUTIVE_SUMMARY = {
  generatedAt: new Date().toISOString(),
  priorities: [
    { text: "Follow up with Acme Corp on pending deal ($45,000)", module: "deals" },
    { text: "Review TechStart Inc project milestone delivery", module: "projects" },
    { text: "Deploy GlobalMedia website updates", module: "websites" },
  ],
  revenue: {
    ytd: 284500,
    mtd: 42300,
    thisWeek: 12800,
  },
  metrics: {
    activeProjects: 8,
    openDeals: 12,
    activeClients: 24,
  },
  alerts: [
    { text: "2 deals at risk of closing late", severity: "warning" },
    { text: "1 website deployment failed", severity: "error" },
  ],
};

// Mock AI response
const MOCK_AI_RESPONSE = {
  content: `## Today's Priorities Summary

Based on analysis of your current operations, here are the key priorities requiring attention:

### High Priority

1. **Acme Corp Deal Follow-up** — Deal worth $45,000 has been in negotiation for 12 days. Recommend scheduling a call to close.

2. **TechStart Inc Milestone Review** — Project milestone due in 3 days. 2 tasks pending completion.

3. **GlobalMedia Website Deployment** — Updates ready for production. Last deployment: 5 days ago.

### Medium Priority

4. **Invoice Collection** — 3 invoices totaling $12,500 are overdue by 7+ days.

5. **Lead Qualification** — 5 new leads from last week need initial contact.

### Insights

- **Revenue Trend**: +12% vs last month
- **Project Health**: 87.5% on track
- **Client Satisfaction**: No escalations this week

### Suggested Actions`,
  actions: [
    { label: "Schedule Acme Corp call", icon: "calendar", module: "deals" },
    { label: "Review TechStart tasks", icon: "folder", module: "projects" },
    { label: "Deploy GlobalMedia site", icon: "globe", module: "websites" },
    { label: "Send invoice reminders", icon: "mail", module: "payments" },
  ],
  modules: ["deals", "projects", "websites", "payments"],
};

export default function AICommandCenterPage() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResponse, setShowResponse] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const handleSubmit = (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;
    
    setIsProcessing(true);
    setShowResponse(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
    
    if (!customQuery) setQuery("");
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setQuery(action.query);
    handleSubmit(action.query);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "red":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "amber":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "emerald":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      default:
        return "text-muted-foreground bg-muted/50 border-muted";
    }
  };

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case "calendar":
        return Calendar;
      case "folder":
        return FolderKanban;
      case "globe":
        return Globe;
      case "mail":
        return Mail;
      default:
        return ArrowRight;
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
              AI System Active
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Zap className="h-8 w-8 text-cyan-400" />
            AI Command Center
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Executive AI co-pilot for business operations, clients, projects, websites, and performance insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? "bg-muted" : ""}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? "bg-muted" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* AI Command Input */}
      <Card className="bg-gradient-to-br from-cyan-500/5 via-background to-purple-500/5 border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Bot className="absolute left-4 top-4 h-5 w-5 text-cyan-400" />
                <Textarea
                  placeholder="Ask the system anything about your business operations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px] pl-12 bg-background/50 border-border/50 resize-none text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={!query.trim() || isProcessing}
                className="h-[100px] px-6 bg-cyan-600 hover:bg-cyan-700"
              >
                {isProcessing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {/* Example Commands */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                "Summarize today's priorities",
                "Show clients needing follow-up",
                "Analyze deal pipeline",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example);
                    handleSubmit(example);
                  }}
                  className="text-xs px-2 py-1 rounded-md bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Context Badges */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedModule(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selectedModule === null
              ? "bg-foreground text-background border-foreground"
              : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
          }`}
        >
          All Modules
        </button>
        {Object.entries(MODULE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedModule(key === selectedModule ? null : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                selectedModule === key
                  ? config.color
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* AI Response Panel */}
          {showResponse && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    AI Response
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {MOCK_AI_RESPONSE.modules.map((mod) => {
                      const config = MODULE_CONFIG[mod as keyof typeof MODULE_CONFIG];
                      return config ? (
                        <Badge
                          key={mod}
                          variant="outline"
                          className={`text-[10px] ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Analyzing your request...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Response Content */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                        {MOCK_AI_RESPONSE.content.split("\n").map((line, i) => {
                          if (line.startsWith("## ")) {
                            return (
                              <h2 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">
                                {line.replace("## ", "")}
                              </h2>
                            );
                          }
                          if (line.startsWith("### ")) {
                            return (
                              <h3 key={i} className="text-base font-medium text-foreground mt-4 mb-2 flex items-center gap-2">
                                {line.includes("High") && <AlertTriangle className="h-4 w-4 text-red-400" />}
                                {line.includes("Medium") && <Clock className="h-4 w-4 text-amber-400" />}
                                {line.includes("Insights") && <Lightbulb className="h-4 w-4 text-cyan-400" />}
                                {line.includes("Suggested") && <Zap className="h-4 w-4 text-emerald-400" />}
                                {line.replace("### ", "")}
                              </h3>
                            );
                          }
                          if (line.startsWith("- **")) {
                            const parts = line.replace("- **", "").split("**");
                            return (
                              <div key={i} className="flex items-start gap-2 ml-4 my-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                <p>
                                  <strong className="text-foreground">{parts[0]}</strong>
                                  {parts[1]}
                                </p>
                              </div>
                            );
                          }
                          if (line.match(/^\d+\./)) {
                            const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s+—\s+(.+)$/);
                            if (match) {
                              return (
                                <div key={i} className="flex items-start gap-3 my-2 p-3 rounded-lg bg-muted/20 border border-border/30">
                                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-medium shrink-0">
                                    {match[1]}
                                  </span>
                                  <div>
                                    <p className="font-medium text-foreground">{match[2]}</p>
                                    <p className="text-sm text-muted-foreground">{match[3]}</p>
                                  </div>
                                </div>
                              );
                            }
                          }
                          if (line.trim()) {
                            return <p key={i} className="my-1">{line}</p>;
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Action Suggestions */}
                    <div className="grid grid-cols-2 gap-2">
                      {MOCK_AI_RESPONSE.actions.map((action, i) => {
                        const Icon = getActionIcon(action.icon);
                        const moduleConfig = MODULE_CONFIG[action.module as keyof typeof MODULE_CONFIG];
                        return (
                          <Button
                            key={i}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-3 bg-background/30 hover:bg-background/50"
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${moduleConfig?.color || "bg-muted"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm">{action.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Grid */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Quick AI Actions
              </CardTitle>
              <CardDescription>Pre-configured analysis and generation shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border/40 bg-background/30 hover:bg-background/50 hover:border-border/60 transition-all duration-200 text-left group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <Icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Panel */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                AI Insights
              </CardTitle>
              <CardDescription>Intelligent suggestions requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {MOCK_INSIGHTS.filter(
                  (insight) => !selectedModule || insight.module === selectedModule
                ).map((insight) => {
                  const moduleConfig = MODULE_CONFIG[insight.module as keyof typeof MODULE_CONFIG];
                  const Icon = moduleConfig?.icon || AlertTriangle;
                  return (
                    <button
                      key={insight.id}
                      onClick={() => {
                        setQuery(`Tell me more about: ${insight.title}`);
                        handleSubmit(`Tell me more about: ${insight.title}`);
                      }}
                      className={`flex flex-col p-4 rounded-xl border transition-all duration-200 text-left hover:scale-[1.02] ${getSeverityColor(insight.severity)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-lg font-bold">{insight.metric}</span>
                      </div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs opacity-80 mt-1">{insight.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="bg-gradient-to-br from-emerald-500/5 via-background to-cyan-500/5 border-emerald-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Executive Briefing
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                Generated {new Date(EXECUTIVE_SUMMARY.generatedAt).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Priorities */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Today's Priorities
                </h4>
                <div className="space-y-2">
                  {EXECUTIVE_SUMMARY.priorities.map((priority, i) => {
                    const moduleConfig = MODULE_CONFIG[priority.module as keyof typeof MODULE_CONFIG];
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground/90">{priority.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Revenue */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Revenue Overview
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-emerald-400">
                      {formatCurrency(EXECUTIVE_SUMMARY.revenue.ytd)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">YTD</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(EXECUTIVE_SUMMARY.revenue.mtd)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">MTD</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(EXECUTIVE_SUMMARY.revenue.thisWeek)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Week</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Metrics */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Active Operations
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-cyan-400">
                      {EXECUTIVE_SUMMARY.metrics.activeProjects}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Projects</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-foreground">
                      {EXECUTIVE_SUMMARY.metrics.openDeals}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Deals</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-foreground">
                      {EXECUTIVE_SUMMARY.metrics.activeClients}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Clients</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Alerts */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Critical Alerts
                </h4>
                <div className="space-y-2">
                  {EXECUTIVE_SUMMARY.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-lg ${
                        alert.severity === "error"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="text-xs">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Panel (Collapsible) */}
          {showHistory && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Query History
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {MOCK_HISTORY.map((item) => {
                      const moduleConfig = item.module !== "all" 
                        ? MODULE_CONFIG[item.module as keyof typeof MODULE_CONFIG]
                        : null;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setQuery(item.query);
                            handleSubmit(item.query);
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{item.query}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {moduleConfig && (
                                <Badge variant="outline" className={`text-[10px] ${moduleConfig.color}`}>
                                  {moduleConfig.label}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Settings Panel (Collapsible) */}
          {showSettings && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    AI Settings
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(false)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">AI Model</Label>
                  <Select defaultValue="gpt4">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt4">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt35">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Response Style</Label>
                  <Select defaultValue="detailed">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Brief</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-border/30" />

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Module Access</Label>
                  {Object.entries(MODULE_CONFIG).slice(0, 5).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm text-foreground">{config.label}</Label>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>

                <Separator className="bg-border/30" />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Reset
                  </Button>
                  <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
