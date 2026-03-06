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
  Card,
  CardContent,
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

const STATUS_CONFIG: Record<WebsiteStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: <FileEdit className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Activity className="h-3 w-3" /> },
  live: { label: "Live", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <Globe className="h-3 w-3" /> },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Pause className="h-3 w-3" /> },
  archived: { label: "Archived", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <Archive className="h-3 w-3" /> },
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Websites</h1>
          <p className="text-sm text-muted-foreground">
            Manage all web properties across your organization
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Website
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.live}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredWebsites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No websites found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {websites.length === 0
                ? "Get started by adding your first website"
                : "Try adjusting your filters"}
            </p>
            {websites.length === 0 && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWebsites.map((website) => {
                const statusConfig = STATUS_CONFIG[website.status];
                return (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">{website.name}</TableCell>
                    <TableCell>
                      {website.primary_domain ? (
                        <a
                          href={`https://${website.primary_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {website.primary_domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {website.brand ? (
                        <Badge variant="outline">{website.brand.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {website.tenant ? (
                        <Link
                          href={`/app/crm/${website.tenant.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {website.tenant.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Internal</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {website.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.color} gap-1`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/app/websites/${website.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
