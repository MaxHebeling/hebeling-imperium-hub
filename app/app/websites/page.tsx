"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Globe,
  ExternalLink,
  Server,
  Activity,
  Pause,
  Archive,
  FileEdit,
  Eye,
  RefreshCw,
  Link2,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  MoreHorizontal,
  Settings,
  Trash2,
  Copy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type WebsiteStatus = "draft" | "in_progress" | "live" | "paused" | "archived";

interface Website {
  id: string;
  name: string;
  primary_domain: string | null;
  environment: string;
  status: WebsiteStatus;
  notes: string | null;
  created_at: string;
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

interface VercelProject {
  id: string;
  vercel_project_id: string;
  name: string;
  framework: string | null;
  repo_name: string | null;
  production_domain: string | null;
  vercel_url: string | null;
  preview_url: string | null;
  deployment_status: string | null;
  last_synced_at: string | null;
}

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

export default function WebsitesPage() {
  const { t } = useLanguage();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Vercel Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
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
      setOrgId(profile.org_id);

      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name")
        .eq("org_id", profile.org_id)
        .order("name");
      setBrands(brandsData || []);

      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("org_id", profile.org_id)
        .order("name");
      setTenants(tenantsData || []);

      const { data: websitesData } = await supabase
        .from("websites")
        .select(`
          id, name, primary_domain, environment, status, notes, created_at,
          tenant:tenants(id, name),
          brand:brands(id, name)
        `)
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });

      setWebsites(websitesData as Website[] || []);

      // Fetch Vercel projects
      const { data: vercelData } = await supabase
        .from("vercel_projects")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("last_synced_at", { ascending: false });

      setVercelProjects(vercelData || []);
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const filteredWebsites = websites.filter((website) => {
    const matchesSearch =
      website.name.toLowerCase().includes(search.toLowerCase()) ||
      website.primary_domain?.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = brandFilter === "all" || website.brand?.id === brandFilter;
    const matchesTenant = tenantFilter === "all" || website.tenant?.id === tenantFilter;
    const matchesStatus = statusFilter === "all" || website.status === statusFilter;
    return matchesSearch && matchesBrand && matchesTenant && matchesStatus;
  });

  const stats = {
    total: websites.length,
    live: websites.filter((w) => w.status === "live").length,
    inProgress: websites.filter((w) => w.status === "in_progress").length,
    draft: websites.filter((w) => w.status === "draft").length,
  };

  const handleSyncVercel = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/vercel/import-projects", { method: "POST" });
      const data = await response.json();
      
      if (response.ok) {
        setSyncMessage(data.message);
        // Refresh vercel projects list
        if (orgId) {
          const { data: vercelData } = await supabase
            .from("vercel_projects")
            .select("*")
            .eq("org_id", orgId)
            .order("last_synced_at", { ascending: false });
          
          setVercelProjects(vercelData || []);
        }
      } else {
        setSyncMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setSyncMessage("Error connecting to Vercel");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateWebsite = async () => {
    if (!orgId || !newWebsite.name) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("websites")
        .insert({
          org_id: orgId,
          name: newWebsite.name,
          primary_domain: newWebsite.primary_domain || null,
          environment: newWebsite.environment,
          status: newWebsite.status,
          tenant_id: newWebsite.tenant_id || null,
          brand_id: newWebsite.brand_id || null,
          notes: newWebsite.notes || null,
        })
        .select(`
          id, name, primary_domain, environment, status, notes, created_at,
          tenant:tenants(id, name),
          brand:brands(id, name)
        `)
        .single();

      if (!error && data) {
        setWebsites([data as Website, ...websites]);
        setIsModalOpen(false);
        setNewWebsite({
          name: "",
          primary_domain: "",
          environment: "production",
          status: "draft",
          tenant_id: "",
          brand_id: "",
          notes: "",
        });
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

  return (
    <div className="space-y-6">
      {/* Premium Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              System Online
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Websites Command Center
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage brands, client sites, domains, deployments, integrations, and digital operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncVercel} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Vercel"}</span>
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Website
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Website</DialogTitle>
              <DialogDescription>
                Register a new web property to track
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Website Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Main Corporate Site"
                  value={newWebsite.name}
                  onChange={(e) =>
                    setNewWebsite({ ...newWebsite, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Primary Domain</Label>
                <Input
                  id="domain"
                  placeholder="e.g. example.com"
                  value={newWebsite.primary_domain}
                  onChange={(e) =>
                    setNewWebsite({ ...newWebsite, primary_domain: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={newWebsite.environment}
                    onValueChange={(value) =>
                      setNewWebsite({ ...newWebsite, environment: value })
                    }
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newWebsite.status}
                    onValueChange={(value) =>
                      setNewWebsite({ ...newWebsite, status: value as WebsiteStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select
                    value={newWebsite.brand_id}
                    onValueChange={(value) =>
                      setNewWebsite({ ...newWebsite, brand_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant">Client</Label>
                  <Select
                    value={newWebsite.tenant_id}
                    onValueChange={(value) =>
                      setNewWebsite({ ...newWebsite, tenant_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this website..."
                  value={newWebsite.notes}
                  onChange={(e) =>
                    setNewWebsite({ ...newWebsite, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebsite} disabled={isPending || !newWebsite.name}>
                {isPending ? "Creating..." : "Create Website"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-3 rounded-md text-sm ${syncMessage.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
          {syncMessage}
        </div>
      )}

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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">New Website</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-200 cursor-pointer">
              <GitBranch className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Connect Repo</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200 cursor-pointer">
              <Link2 className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Add Domain</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer">
              <Rocket className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">View Deployments</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Sites</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.live}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Live</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Building</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Drafts</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Link2 className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{vercelProjects.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Vercel Projects</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {websites.filter(w => w.status === "paused" || w.status === "archived").length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Needs Attention</p>
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
                placeholder="Search websites, domains..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
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

      {/* Premium Data Table */}
      {filteredWebsites.length === 0 ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">No websites found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {websites.length === 0
                ? "Get started by adding your first website to the command center"
                : "Try adjusting your filters to find what you're looking for"}
            </p>
            {websites.length === 0 && (
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Website
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-muted-foreground font-medium">Website</TableHead>
                <TableHead className="text-muted-foreground font-medium">Domain</TableHead>
                <TableHead className="text-muted-foreground font-medium">Brand</TableHead>
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Environment</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWebsites.map((website) => {
                const statusConfig = STATUS_CONFIG[website.status];
                return (
                  <TableRow 
                    key={website.id} 
                    className="hover:bg-muted/20 border-border/30 transition-colors group"
                  >
                    <TableCell className="font-medium text-foreground">
                      <Link 
                        href={`/app/websites/${website.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {website.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {website.primary_domain ? (
                        <a
                          href={`https://${website.primary_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors group/link"
                        >
                          <span className="truncate max-w-[180px]">{website.primary_domain}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {website.brand ? (
                        <Badge variant="outline" className="border-border/50 bg-background/30">
                          {website.brand.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {website.tenant ? (
                        <Link
                          href={`/app/crm/${website.tenant.id}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {website.tenant.name}
                        </Link>
                      ) : (
                        <Badge variant="secondary" className="bg-muted/30 text-muted-foreground text-xs">
                          Internal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="capitalize border-border/50 bg-background/30 text-xs"
                      >
                        {website.environment}
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/app/websites/${website.id}`}>
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
                              <Link href={`/app/websites/${website.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Rocket className="h-4 w-4 mr-2" />
                              Deployments
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Link2 className="h-4 w-4 mr-2" />
                              Manage Domains
                            </DropdownMenuItem>
                            {website.primary_domain && (
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(`https://${website.primary_domain}`)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`Delete website "${website.name}"? This cannot be undone.`)) {
                                  fetch(`/api/websites/${website.id}`, { method: "DELETE" })
                                    .then(res => res.json())
                                    .then(data => { if (data.success) window.location.reload(); });
                                }
                              }}
                            >
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

      {/* Vercel Projects Section */}
      {vercelProjects.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white to-gray-300 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-black">
                  <path d="M24 22.525H0l12-21.05 12 21.05z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Vercel Projects</h2>
                <p className="text-xs text-muted-foreground">Synced from your Vercel account</p>
              </div>
            </div>
            <Badge variant="outline" className="border-border/50">{vercelProjects.length} projects</Badge>
          </div>
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Production Domain</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Framework</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Repository</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Last Synced</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                    <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                    <TableCell>
                      {project.production_domain ? (
                        <a
                          href={`https://${project.production_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors group/link"
                        >
                          <span className="truncate max-w-[180px]">{project.production_domain}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.framework ? (
                        <Badge variant="outline" className="capitalize border-border/50 bg-background/30 text-xs">
                          {project.framework}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.repo_name ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          {project.repo_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.deployment_status ? (
                        <Badge 
                          variant="outline"
                          className={
                            project.deployment_status === "READY" 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : project.deployment_status === "ERROR"
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }
                        >
                          {project.deployment_status === "READY" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {project.deployment_status === "ERROR" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {project.deployment_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project.last_synced_at 
                        ? new Date(project.last_synced_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {project.vercel_url && (
                        <a
                          href={project.vercel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
