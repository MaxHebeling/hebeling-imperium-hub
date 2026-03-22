"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Pencil,
  Activity,
  Pause,
  Archive,
  FileEdit,
  Server,
  Calendar,
  Building2,
  User,
  Save,
  Rocket,
  Link2,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Copy,
  Eye,
  Settings,
  Trash2,
  FileText,
  Puzzle,
  History,
  Shield,
  Zap,
  Plus,
  X,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import Link from "next/link";

type WebsiteStatus = "draft" | "in_progress" | "live" | "paused" | "archived";

interface Website {
  id: string;
  name: string;
  primary_domain: string | null;
  environment: string;
  status: WebsiteStatus;
  notes: string | null;
  created_at: string;
  tenant_id: string | null;
  brand_id: string | null;
  tenant: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
}

type WebsiteRelation = { id: string; name: string } | Array<{ id: string; name: string }> | null;
type WebsiteRow = Omit<Website, "tenant" | "brand"> & {
  tenant: WebsiteRelation;
  brand: WebsiteRelation;
};

function normalizeWebsiteRelation(value: WebsiteRelation) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapWebsite(row: WebsiteRow): Website {
  return {
    ...row,
    tenant: normalizeWebsiteRelation(row.tenant),
    brand: normalizeWebsiteRelation(row.brand),
  };
}

// Mock data for demonstration
const mockDeployments = [
  { id: "dpl_abc123", env: "production", commit: "feat: update hero section", branch: "main", status: "ready", triggeredBy: "Max H.", deployTime: "45s", createdAt: "2 hours ago" },
  { id: "dpl_def456", env: "preview", commit: "fix: mobile responsive issues", branch: "feature/mobile", status: "building", triggeredBy: "System", deployTime: "—", createdAt: "10 minutes ago" },
  { id: "dpl_ghi789", env: "production", commit: "chore: dependency updates", branch: "main", status: "ready", triggeredBy: "Max H.", deployTime: "38s", createdAt: "1 day ago" },
  { id: "dpl_jkl012", env: "preview", commit: "feat: add contact form", branch: "feature/contact", status: "failed", triggeredBy: "Max H.", deployTime: "—", createdAt: "2 days ago" },
];

const mockDomains = [
  { domain: "example.com", type: "primary", status: "connected", ssl: "active", lastChecked: "5 min ago" },
  { domain: "www.example.com", type: "redirect", status: "connected", ssl: "active", lastChecked: "5 min ago" },
  { domain: "staging.example.com", type: "staging", status: "connected", ssl: "active", lastChecked: "5 min ago" },
];

const mockForms = [
  { name: "Contact Form", type: "Contact", endpoint: "/api/contact", destination: "CRM + Email", status: "active", lastSubmission: "2 hours ago" },
  { name: "Newsletter Signup", type: "Lead", endpoint: "/api/newsletter", destination: "Resend", status: "active", lastSubmission: "5 hours ago" },
];

const mockIntegrations = [
  { name: "Supabase", status: "connected", lastSynced: "Just now" },
  { name: "Stripe", status: "connected", lastSynced: "1 hour ago" },
  { name: "Resend", status: "connected", lastSynced: "2 hours ago" },
  { name: "Google Analytics", status: "disconnected", lastSynced: "—" },
];

const mockActivity = [
  { type: "deployment", description: "Deployment completed successfully", user: "Max H.", time: "2 hours ago" },
  { type: "domain", description: "SSL certificate renewed for example.com", user: "System", time: "1 day ago" },
  { type: "settings", description: "Website status changed to Live", user: "Max H.", time: "3 days ago" },
  { type: "form", description: "New form submission received", user: "Visitor", time: "5 days ago" },
  { type: "integration", description: "Stripe integration connected", user: "Max H.", time: "1 week ago" },
];

const STATUS_CONFIG: Record<WebsiteStatus, { label: string; color: string; icon: React.ReactNode; bgClass: string }> = {
  draft: { 
    label: "Draft", 
    color: "text-muted-foreground", 
    icon: <FileEdit className="h-3 w-3" />,
    bgClass: "bg-muted/50 border-muted-foreground/20"
  },
  in_progress: { 
    label: "Building", 
    color: "text-blue-400", 
    icon: <Activity className="h-3 w-3 animate-pulse" />,
    bgClass: "bg-blue-500/10 border-blue-500/30"
  },
  live: { 
    label: "Live", 
    color: "text-emerald-400", 
    icon: <CheckCircle2 className="h-3 w-3" />,
    bgClass: "bg-emerald-500/10 border-emerald-500/30"
  },
  paused: { 
    label: "Paused", 
    color: "text-amber-400", 
    icon: <Pause className="h-3 w-3" />,
    bgClass: "bg-amber-500/10 border-amber-500/30"
  },
  archived: { 
    label: "Archived", 
    color: "text-red-400", 
    icon: <Archive className="h-3 w-3" />,
    bgClass: "bg-red-500/10 border-red-500/30"
  },
};

const DEPLOYMENT_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  ready: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  building: { color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: <Activity className="h-3 w-3 animate-pulse" /> },
  failed: { color: "text-red-400 bg-red-500/10 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  queued: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: <Clock className="h-3 w-3" /> },
  canceled: { color: "text-muted-foreground bg-muted/50 border-muted-foreground/20", icon: <X className="h-3 w-3" /> },
};

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    primary_domain: "",
    environment: "production",
    status: "draft" as WebsiteStatus,
    tenant_id: "",
    brand_id: "",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      // Fetch brands and tenants
      const [brandsRes, tenantsRes] = await Promise.all([
        supabase.from("brands").select("id, name").eq("org_id", profile.org_id).order("name"),
        supabase.from("tenants").select("id, name").eq("org_id", profile.org_id).order("name"),
      ]);
      setBrands(brandsRes.data || []);
      setTenants(tenantsRes.data || []);

      // Fetch website
      const { data: websiteData } = await supabase
        .from("websites")
        .select(`
          id, name, primary_domain, environment, status, notes, created_at, tenant_id, brand_id,
          tenant:tenants(id, name),
          brand:brands(id, name)
        `)
        .eq("id", params.id)
        .single();

      if (websiteData) {
        setWebsite(mapWebsite(websiteData as WebsiteRow));
        setEditForm({
          name: websiteData.name,
          primary_domain: websiteData.primary_domain || "",
          environment: websiteData.environment,
          status: websiteData.status as WebsiteStatus,
          tenant_id: websiteData.tenant_id || "",
          brand_id: websiteData.brand_id || "",
          notes: websiteData.notes || "",
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, params.id]);

  const handleSaveEdit = async () => {
    if (!website) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("websites")
        .update({
          name: editForm.name,
          primary_domain: editForm.primary_domain || null,
          environment: editForm.environment,
          status: editForm.status,
          tenant_id: editForm.tenant_id || null,
          brand_id: editForm.brand_id || null,
          notes: editForm.notes || null,
        })
        .eq("id", website.id)
        .select(`
          id, name, primary_domain, environment, status, notes, created_at, tenant_id, brand_id,
          tenant:tenants(id, name),
          brand:brands(id, name)
        `)
        .single();

      if (!error && data) {
        setWebsite(mapWebsite(data as WebsiteRow));
        setIsEditOpen(false);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Website not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This website may have been deleted or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/app/websites">Back to Websites</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[website.status];

  return (
    <div className="space-y-6">
      {/* Premium Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/app/websites">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-2">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/app/websites" className="hover:text-foreground transition-colors">Websites</Link>
              <span>/</span>
              {website.brand && (
                <>
                  <span>{website.brand.name}</span>
                  <span>/</span>
                </>
              )}
              {website.tenant && (
                <>
                  <Link href={`/app/crm/${website.tenant.id}`} className="hover:text-foreground transition-colors">
                    {website.tenant.name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-foreground">{website.name}</span>
            </div>
            
            {/* Title Row */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{website.name}</h1>
              <Badge variant="outline" className={`gap-1.5 ${statusConfig.bgClass} ${statusConfig.color} border`}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              {website.brand && (
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
                  {website.brand.name}
                </Badge>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {website.primary_domain && (
                <a
                  href={`https://${website.primary_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {website.primary_domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                <span className="capitalize">{website.environment}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {new Date(website.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <Archive className="h-4 w-4 mr-2" />
                Archive Website
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Website
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 7-Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/30 border border-border/40 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deployments" className="gap-2 data-[state=active]:bg-background">
            <Rocket className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="domains" className="gap-2 data-[state=active]:bg-background">
            <Link2 className="h-4 w-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="repository" className="gap-2 data-[state=active]:bg-background">
            <GitBranch className="h-4 w-4" />
            Repository
          </TabsTrigger>
          <TabsTrigger value="forms" className="gap-2 data-[state=active]:bg-background">
            <Puzzle className="h-4 w-4" />
            Forms & Integrations
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Status Checklist */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Quick Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Domain Connected</p>
                        <p className="text-xs text-muted-foreground">SSL Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Repository</p>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Production</p>
                        <p className="text-xs text-muted-foreground">Live</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Forms</p>
                        <p className="text-xs text-muted-foreground">2 Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Integrations</p>
                        <p className="text-xs text-muted-foreground">3 Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Analytics</p>
                        <p className="text-xs text-muted-foreground">Not Connected</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Notes</CardTitle>
                  <CardDescription>Internal notes and documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add notes about this website..."
                    rows={4}
                    className="bg-background/50 border-border/50"
                  />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("activity")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockActivity.slice(0, 3).map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                          {activity.type === "deployment" && <Rocket className="h-4 w-4 text-blue-400" />}
                          {activity.type === "domain" && <Shield className="h-4 w-4 text-emerald-400" />}
                          {activity.type === "settings" && <Settings className="h-4 w-4 text-purple-400" />}
                          {activity.type === "form" && <FileText className="h-4 w-4 text-amber-400" />}
                          {activity.type === "integration" && <Puzzle className="h-4 w-4 text-cyan-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Resources */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Related Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {website.brand && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">{website.brand.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Brand</Badge>
                    </div>
                  )}
                  {website.tenant && (
                    <Link href={`/app/crm/${website.tenant.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium">{website.tenant.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Client</Badge>
                    </Link>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium capitalize">{website.environment}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Environment</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Tech Stack */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background/30">Next.js</Badge>
                    <Badge variant="outline" className="bg-background/30">React</Badge>
                    <Badge variant="outline" className="bg-background/30">Tailwind CSS</Badge>
                    <Badge variant="outline" className="bg-background/30">Supabase</Badge>
                    <Badge variant="outline" className="bg-background/30">Vercel</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Team */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">MH</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Max Hebeling</p>
                      <p className="text-xs text-muted-foreground">Owner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* DEPLOYMENTS TAB */}
        <TabsContent value="deployments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Deployment History</h2>
              <p className="text-sm text-muted-foreground">View and manage all deployments for this website</p>
            </div>
            <Button size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Trigger Deploy
            </Button>
          </div>

          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-muted-foreground font-medium">Deployment</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Environment</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Commit</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Branch</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Triggered By</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Deploy Time</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDeployments.map((deployment) => {
                  const statusCfg = DEPLOYMENT_STATUS_CONFIG[deployment.status];
                  return (
                    <TableRow key={deployment.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                      <TableCell className="font-mono text-sm text-cyan-400">{deployment.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-border/50 bg-background/30 text-xs">
                          {deployment.env}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                        {deployment.commit}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          {deployment.branch}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${statusCfg.color}`}>
                          {statusCfg.icon}
                          <span className="capitalize">{deployment.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{deployment.triggeredBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{deployment.deployTime}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retry
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Terminal className="h-4 w-4 mr-2" />
                                Logs
                              </DropdownMenuItem>
                              {deployment.status === "building" && (
                                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
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
        </TabsContent>

        {/* DOMAINS TAB */}
        <TabsContent value="domains" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Domain Management</h2>
              <p className="text-sm text-muted-foreground">Manage domains, SSL certificates, and DNS configuration</p>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Domain
            </Button>
          </div>

          {/* Primary Domain Highlight */}
          {website.primary_domain && (
            <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">Primary Domain</p>
                      <p className="text-xl font-bold text-foreground">{website.primary_domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      SSL Active
                    </Badge>
                    <a href={`https://${website.primary_domain}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Visit
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Domains Table */}
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-muted-foreground font-medium">Domain</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">SSL</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Last Checked</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDomains.map((domain, i) => (
                  <TableRow key={i} className="hover:bg-muted/20 border-border/30 transition-colors group">
                    <TableCell className="font-medium text-foreground">{domain.domain}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize text-xs ${domain.type === "primary" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-border/50 bg-background/30"}`}>
                        {domain.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                        <Shield className="h-3 w-3" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{domain.lastChecked}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(domain.domain)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="cursor-pointer">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify Domain
                            </DropdownMenuItem>
                            {domain.type !== "primary" && (
                              <DropdownMenuItem className="cursor-pointer">
                                <Globe className="h-4 w-4 mr-2" />
                                Set as Primary
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* REPOSITORY TAB */}
        <TabsContent value="repository" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Repository Connection</h2>
              <p className="text-sm text-muted-foreground">Git integration and deployment source configuration</p>
            </div>
          </div>

          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-foreground">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">MaxHebeling/hebeling-imperium-hub</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Provider</p>
                      <p className="text-sm font-medium text-foreground">GitHub</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Branch</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        main
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Commit</p>
                      <p className="text-sm font-medium text-foreground truncate">feat: update hero</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Deploy Mode</p>
                      <p className="text-sm font-medium text-foreground">Automatic</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <GitBranch className="h-4 w-4" />
                      Change Branch
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <History className="h-4 w-4" />
                      View Commits
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open in GitHub
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMS & INTEGRATIONS TAB */}
        <TabsContent value="forms" className="space-y-6">
          {/* Forms Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Forms</h2>
                <p className="text-sm text-muted-foreground">Form endpoints and submission handlers</p>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Form
              </Button>
            </div>

            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Form Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Endpoint</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Destination</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Last Submission</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockForms.map((form, i) => (
                    <TableRow key={i} className="hover:bg-muted/20 border-border/30 transition-colors group">
                      <TableCell className="font-medium text-foreground">{form.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-border/50 bg-background/30">{form.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{form.endpoint}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{form.destination}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1.5 text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{form.lastSubmission}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Integrations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground">Connected third-party services</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Integration
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockIntegrations.map((integration, i) => (
                <Card key={i} className={`bg-card/40 border-border/40 ${integration.status === "connected" ? "" : "opacity-60"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center">
                        <Puzzle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${integration.status === "connected" 
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" 
                          : "text-muted-foreground bg-muted/50 border-muted-foreground/20"
                        }`}
                      >
                        {integration.status === "connected" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        {integration.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-foreground">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {integration.status === "connected" ? `Last synced ${integration.lastSynced}` : "Not connected"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
            <p className="text-sm text-muted-foreground">Complete history of changes and events</p>
          </div>

          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6">
              <div className="space-y-6">
                {mockActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === "deployment" ? "bg-blue-500/10" :
                      activity.type === "domain" ? "bg-emerald-500/10" :
                      activity.type === "settings" ? "bg-purple-500/10" :
                      activity.type === "form" ? "bg-amber-500/10" :
                      "bg-cyan-500/10"
                    }`}>
                      {activity.type === "deployment" && <Rocket className="h-5 w-5 text-blue-400" />}
                      {activity.type === "domain" && <Shield className="h-5 w-5 text-emerald-400" />}
                      {activity.type === "settings" && <Settings className="h-5 w-5 text-purple-400" />}
                      {activity.type === "form" && <FileText className="h-5 w-5 text-amber-400" />}
                      {activity.type === "integration" && <Puzzle className="h-5 w-5 text-cyan-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                        <span className="text-xs text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Website Settings</h2>
            <p className="text-sm text-muted-foreground">Configure website metadata, visibility, and ownership</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Info */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-medium">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Website Name</Label>
                  <Input
                    id="settings-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-domain">Primary Domain</Label>
                  <Input
                    id="settings-domain"
                    value={editForm.primary_domain}
                    onChange={(e) => setEditForm({ ...editForm, primary_domain: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select
                      value={editForm.environment}
                      onValueChange={(value) => setEditForm({ ...editForm, environment: value })}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value as WebsiteStatus })}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_progress">Building</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ownership */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-medium">Ownership & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={editForm.brand_id}
                    onValueChange={(value) => setEditForm({ ...editForm, brand_id: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={editForm.tenant_id}
                    onValueChange={(value) => setEditForm({ ...editForm, tenant_id: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveEdit} disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="bg-red-500/5 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base font-medium text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect this website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div>
                  <p className="font-medium text-foreground">Archive Website</p>
                  <p className="text-sm text-muted-foreground">Hide this website from active views</p>
                </div>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Archive
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div>
                  <p className="font-medium text-foreground">Delete Website</p>
                  <p className="text-sm text-muted-foreground">Permanently remove this website and all data</p>
                </div>
                <Button variant="destructive">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Website</DialogTitle>
            <DialogDescription>Update the website details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Website Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-domain">Primary Domain</Label>
              <Input
                id="edit-domain"
                value={editForm.primary_domain}
                onChange={(e) => setEditForm({ ...editForm, primary_domain: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Environment</Label>
                <Select
                  value={editForm.environment}
                  onValueChange={(value) => setEditForm({ ...editForm, environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as WebsiteStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">Building</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <Select
                  value={editForm.brand_id}
                  onValueChange={(value) => setEditForm({ ...editForm, brand_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select
                  value={editForm.tenant_id}
                  onValueChange={(value) => setEditForm({ ...editForm, tenant_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isPending || !editForm.name}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
