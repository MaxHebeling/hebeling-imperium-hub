"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight,
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
  Lock,
  ExternalLink,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Database,
  Link2,
  Shield,
  Info,
  Layers,
  BarChart,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

// Types
type AppCategory = "core" | "client-management" | "operations" | "finance" | "intelligence";
type AppStatus = "core" | "enabled" | "disabled" | "beta" | "coming-soon";

interface AppModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  iconBgColor: string;
  category: AppCategory;
  status: AppStatus;
  version: string;
  owner: string;
  lastUpdated: string;
  installedDate: string;
  enabled: boolean;
  capabilities: { name: string; description: string; enabled: boolean }[];
  integrations: string[];
  dependencies: string[];
  permissions: {
    role: string;
    view: boolean;
    edit: boolean;
    create: boolean;
    delete: boolean;
    admin: boolean;
  }[];
  metrics: {
    total_entities: number;
    active_usage: number;
    recent_activity: string;
    connected_modules: number;
  };
  usageHistory: { date: string; count: number }[];
  recentActivity: { action: string; user: string; timestamp: string }[];
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
    label: "Core Module", 
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

// Mock app data
const getAppById = (id: string): AppModule | null => {
  const apps: Record<string, AppModule> = {
    "crm": {
      id: "crm",
      name: "CRM",
      slug: "crm",
      description: "Contact and lead management for tracking relationships and sales pipeline.",
      longDescription: "The CRM module provides comprehensive contact and lead management capabilities. Track relationships, manage sales pipelines, and maintain detailed records of all interactions with prospects and customers. Integrates seamlessly with Deals, Clients, and Automations modules for a complete sales workflow.",
      icon: <Contact className="h-8 w-8" />,
      iconBgColor: "bg-blue-500/20",
      category: "client-management",
      status: "enabled",
      version: "1.2.0",
      owner: "Platform Team",
      lastUpdated: "2024-01-15",
      installedDate: "2023-06-01",
      enabled: true,
      capabilities: [
        { name: "Contact Management", description: "Store and manage contact information", enabled: true },
        { name: "Lead Tracking", description: "Track leads through the sales funnel", enabled: true },
        { name: "Activity Timeline", description: "Log and view all contact interactions", enabled: true },
        { name: "Custom Fields", description: "Add custom fields to contacts", enabled: true },
        { name: "Import/Export", description: "Bulk import and export contacts", enabled: true },
      ],
      integrations: ["Deals", "Clients", "Automations", "Documents", "AI Command Center"],
      dependencies: [],
      permissions: [
        { role: "Admin", view: true, edit: true, create: true, delete: true, admin: true },
        { role: "Manager", view: true, edit: true, create: true, delete: false, admin: false },
        { role: "User", view: true, edit: true, create: true, delete: false, admin: false },
        { role: "Viewer", view: true, edit: false, create: false, delete: false, admin: false },
      ],
      metrics: {
        total_entities: 2450,
        active_usage: 88,
        recent_activity: "2 hours ago",
        connected_modules: 5,
      },
      usageHistory: [
        { date: "Jan 1", count: 120 },
        { date: "Jan 8", count: 145 },
        { date: "Jan 15", count: 132 },
        { date: "Jan 22", count: 178 },
        { date: "Jan 29", count: 156 },
        { date: "Feb 5", count: 189 },
      ],
      recentActivity: [
        { action: "Contact created", user: "John Smith", timestamp: "2 hours ago" },
        { action: "Lead converted", user: "Sarah Johnson", timestamp: "4 hours ago" },
        { action: "Contact updated", user: "Michael Chen", timestamp: "6 hours ago" },
        { action: "Bulk import completed", user: "Emma Wilson", timestamp: "Yesterday" },
        { action: "Custom field added", user: "Admin", timestamp: "2 days ago" },
      ],
    },
    "deals": {
      id: "deals",
      name: "Deals",
      slug: "deals",
      description: "Sales pipeline management with stages, forecasting, and deal tracking.",
      longDescription: "The Deals module offers comprehensive sales pipeline management. Create and track deals through customizable stages, forecast revenue, and manage the entire sales cycle from lead to close. Integrates with CRM for contact data and Automations for workflow triggers.",
      icon: <TrendingUp className="h-8 w-8" />,
      iconBgColor: "bg-emerald-500/20",
      category: "client-management",
      status: "enabled",
      version: "1.1.0",
      owner: "Platform Team",
      lastUpdated: "2024-01-10",
      installedDate: "2023-06-01",
      enabled: true,
      capabilities: [
        { name: "Pipeline Stages", description: "Customizable deal stages", enabled: true },
        { name: "Deal Forecasting", description: "Revenue forecasting and projections", enabled: true },
        { name: "Activity Tracking", description: "Log deal activities and updates", enabled: true },
        { name: "Win/Loss Analysis", description: "Analyze deal outcomes", enabled: true },
      ],
      integrations: ["CRM", "Clients", "Automations", "Payments"],
      dependencies: ["CRM"],
      permissions: [
        { role: "Admin", view: true, edit: true, create: true, delete: true, admin: true },
        { role: "Manager", view: true, edit: true, create: true, delete: true, admin: false },
        { role: "User", view: true, edit: true, create: true, delete: false, admin: false },
        { role: "Viewer", view: true, edit: false, create: false, delete: false, admin: false },
      ],
      metrics: {
        total_entities: 189,
        active_usage: 91,
        recent_activity: "30 min ago",
        connected_modules: 4,
      },
      usageHistory: [
        { date: "Jan 1", count: 45 },
        { date: "Jan 8", count: 52 },
        { date: "Jan 15", count: 48 },
        { date: "Jan 22", count: 61 },
        { date: "Jan 29", count: 58 },
        { date: "Feb 5", count: 67 },
      ],
      recentActivity: [
        { action: "Deal won", user: "Sarah Johnson", timestamp: "30 min ago" },
        { action: "Stage updated", user: "John Smith", timestamp: "2 hours ago" },
        { action: "New deal created", user: "Michael Chen", timestamp: "4 hours ago" },
        { action: "Deal value updated", user: "Emma Wilson", timestamp: "Yesterday" },
      ],
    },
    "ai-command-center": {
      id: "ai-command-center",
      name: "AI Command Center",
      slug: "ai",
      description: "Executive AI co-pilot for business operations, insights, and strategic decision-making.",
      longDescription: "The AI Command Center serves as your executive AI co-pilot, providing intelligent insights, operational recommendations, and strategic decision support across all platform modules. Analyze data, generate reports, and receive proactive suggestions to optimize business operations.",
      icon: <Zap className="h-8 w-8" />,
      iconBgColor: "bg-gradient-to-br from-cyan-500/20 to-purple-500/20",
      category: "intelligence",
      status: "core",
      version: "1.0.0",
      owner: "Platform Team",
      lastUpdated: "2024-01-20",
      installedDate: "2023-06-01",
      enabled: true,
      capabilities: [
        { name: "Natural Language Queries", description: "Ask questions in plain English", enabled: true },
        { name: "Business Insights", description: "Automated insights and recommendations", enabled: true },
        { name: "Report Generation", description: "Generate executive reports", enabled: true },
        { name: "Cross-Module Analysis", description: "Analyze data across all modules", enabled: true },
        { name: "Predictive Analytics", description: "Forecast trends and outcomes", enabled: true },
      ],
      integrations: ["CRM", "Deals", "Clients", "Projects", "Websites", "Documents", "Payments", "Automations"],
      dependencies: [],
      permissions: [
        { role: "Admin", view: true, edit: true, create: true, delete: true, admin: true },
        { role: "Manager", view: true, edit: true, create: true, delete: false, admin: false },
        { role: "User", view: true, edit: false, create: false, delete: false, admin: false },
        { role: "Viewer", view: true, edit: false, create: false, delete: false, admin: false },
      ],
      metrics: {
        total_entities: 1250,
        active_usage: 89,
        recent_activity: "Just now",
        connected_modules: 8,
      },
      usageHistory: [
        { date: "Jan 1", count: 234 },
        { date: "Jan 8", count: 289 },
        { date: "Jan 15", count: 312 },
        { date: "Jan 22", count: 345 },
        { date: "Jan 29", count: 378 },
        { date: "Feb 5", count: 402 },
      ],
      recentActivity: [
        { action: "Query executed", user: "John Smith", timestamp: "Just now" },
        { action: "Report generated", user: "Sarah Johnson", timestamp: "1 hour ago" },
        { action: "Insight viewed", user: "Michael Chen", timestamp: "2 hours ago" },
        { action: "Analysis completed", user: "Admin", timestamp: "3 hours ago" },
      ],
    },
  };

  // Return specific app or CRM as default
  return apps[id] || apps["crm"];
};

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  
  const app = getAppById(appId);
  
  if (!app) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">App not found</h2>
          <p className="text-muted-foreground mb-4">The requested app could not be found.</p>
          <Link href="/app/apps">
            <Button>Back to Apps</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[app.category];
  const statusConfig = STATUS_CONFIG[app.status];

  const tabs = [
    { id: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },
    { id: "capabilities", label: "Capabilities", icon: <Layers className="h-4 w-4" /> },
    { id: "permissions", label: "Permissions", icon: <Shield className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { id: "usage", label: "Usage", icon: <BarChart className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/apps" className="hover:text-foreground transition-colors">
          Apps
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{app.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* App Info */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-2xl ${app.iconBgColor} flex items-center justify-center text-foreground shrink-0`}>
              {app.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  {app.name}
                </h1>
                <Badge 
                  variant="outline"
                  className={`${statusConfig.bgClass} ${statusConfig.color} border gap-1`}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${categoryConfig.bgClass} ${categoryConfig.color} border`}
                >
                  {categoryConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {app.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>v{app.version}</span>
                <span>Updated {app.lastUpdated}</span>
                <span>by {app.owner}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <Link href={`/app/${app.slug}`}>
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open App
              </Button>
            </Link>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            {app.status !== "core" && app.status !== "coming-soon" && (
              <Button variant="outline" className="gap-2">
                {app.enabled ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Disable
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Enable
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-card/40 rounded-lg border border-border/40 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Description */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {app.longDescription}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Features */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">Key Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {app.capabilities.slice(0, 5).map((cap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{cap.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">Integrations</CardTitle>
                  <CardDescription>Modules this app connects with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {app.integrations.map((integration, i) => (
                      <Badge key={i} variant="outline" className="border-border/50">
                        <Link2 className="h-3 w-3 mr-1" />
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dependencies */}
              {app.dependencies.length > 0 && (
                <Card className="bg-card/40 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-base">Dependencies</CardTitle>
                    <CardDescription>Required modules for this app</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {app.dependencies.map((dep, i) => (
                        <Badge key={i} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "capabilities" && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Capabilities</CardTitle>
                <CardDescription>Features and functionality provided by this app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {app.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start justify-between p-4 rounded-lg border border-border/30 bg-background/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{cap.name}</h4>
                          {cap.enabled ? (
                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10 border-gray-500/30 text-gray-400 text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{cap.description}</p>
                      </div>
                      <Switch checked={cap.enabled} disabled={app.status === "core"} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "permissions" && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Permissions</CardTitle>
                <CardDescription>Access levels for each role</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-center text-muted-foreground">View</TableHead>
                      <TableHead className="text-center text-muted-foreground">Edit</TableHead>
                      <TableHead className="text-center text-muted-foreground">Create</TableHead>
                      <TableHead className="text-center text-muted-foreground">Delete</TableHead>
                      <TableHead className="text-center text-muted-foreground">Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {app.permissions.map((perm, i) => (
                      <TableRow key={i} className="hover:bg-muted/20 border-border/30">
                        <TableCell className="font-medium">{perm.role}</TableCell>
                        <TableCell className="text-center">
                          {perm.view ? (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.edit ? (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.create ? (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.delete ? (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.admin ? (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                  <CardDescription>App-specific settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications for app events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-sync Data</Label>
                      <p className="text-sm text-muted-foreground">Automatically sync data with integrations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activity Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all user activity within this app</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">API Access</CardTitle>
                  <CardDescription>Developer configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>API Endpoint</Label>
                    <Input 
                      value={`https://api.hebeling.io/v1/${app.slug}`} 
                      readOnly 
                      className="mt-1.5 bg-background/50 border-border/50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Documentation</Label>
                    <Button variant="outline" className="w-full mt-1.5 gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View API Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              {app.status !== "core" && (
                <Card className="bg-card/40 border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div>
                        <p className="font-medium text-foreground">Disable App</p>
                        <p className="text-sm text-muted-foreground">This will hide the app from navigation</p>
                      </div>
                      <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        Disable
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div>
                        <p className="font-medium text-foreground">Reset App Data</p>
                        <p className="text-sm text-muted-foreground">Delete all data associated with this app</p>
                      </div>
                      <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <div className="space-y-6">
              {/* Usage Chart Placeholder */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">Usage Over Time</CardTitle>
                  <CardDescription>Activity in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-2 pt-4">
                    {app.usageHistory.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-cyan-500/20 rounded-t hover:bg-cyan-500/30 transition-colors"
                          style={{ height: `${(item.count / 450) * 100}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {app.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            by {activity.user} · {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Metrics Summary */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Entities</span>
                <span className="text-lg font-semibold text-foreground">
                  {app.metrics.total_entities.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Usage</span>
                <span className="text-lg font-semibold text-emerald-400">
                  {app.metrics.active_usage}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm text-foreground">
                  {app.metrics.recent_activity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Modules</span>
                <span className="text-lg font-semibold text-cyan-400">
                  {app.metrics.connected_modules}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Module Info */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Module Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground">v{app.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span className="text-foreground">{app.owner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Installed</span>
                <span className="text-foreground">{app.installedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground">{app.lastUpdated}</span>
              </div>
              <div className="pt-2 border-t border-border/30">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="h-3 w-3" />
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          {app.dependencies.length > 0 && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {app.dependencies.map((dep, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                      <span className="text-sm text-foreground">{dep}</span>
                      <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
