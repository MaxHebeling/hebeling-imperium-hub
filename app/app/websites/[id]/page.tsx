"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const STATUS_CONFIG: Record<WebsiteStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: <FileEdit className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Activity className="h-3 w-3" /> },
  live: { label: "Live", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <Globe className="h-3 w-3" /> },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Pause className="h-3 w-3" /> },
  archived: { label: "Archived", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <Archive className="h-3 w-3" /> },
};

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    primary_domain: "",
    environment: "production",
    status: "draft" as WebsiteStatus,
    tenant_id: "",
    brand_id: "",
  });

  // Notes editing
  const [notes, setNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);

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
        setWebsite(websiteData as Website);
        setNotes(websiteData.notes || "");
        setEditForm({
          name: websiteData.name,
          primary_domain: websiteData.primary_domain || "",
          environment: websiteData.environment,
          status: websiteData.status as WebsiteStatus,
          tenant_id: websiteData.tenant_id || "",
          brand_id: websiteData.brand_id || "",
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
        })
        .eq("id", website.id)
        .select(`
          id, name, primary_domain, environment, status, notes, created_at, tenant_id, brand_id,
          tenant:tenants(id, name),
          brand:brands(id, name)
        `)
        .single();

      if (!error && data) {
        setWebsite(data as Website);
        setIsEditOpen(false);
      }
    });
  };

  const handleSaveNotes = async () => {
    if (!website) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("websites")
        .update({ notes })
        .eq("id", website.id);

      if (!error) {
        setWebsite({ ...website, notes });
        setNotesChanged(false);
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
        <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-medium">Website not found</h2>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/websites">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{website.name}</h1>
            <Badge className={`${statusConfig.color} gap-1`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          {website.primary_domain && (
            <a
              href={`https://${website.primary_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
            >
              {website.primary_domain}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {website.brand?.name || "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {website.tenant ? (
              <Link
                href={`/app/crm/${website.tenant.id}`}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {website.tenant.name}
              </Link>
            ) : (
              <div className="text-lg font-semibold text-muted-foreground">Internal</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize text-base">
              {website.environment}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {new Date(website.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
          <CardDescription>
            Internal notes and documentation for this website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesChanged(e.target.value !== (website.notes || ""));
            }}
            placeholder="Add notes about this website... (e.g., hosting details, DNS configuration, deployment notes)"
            rows={6}
          />
          {notesChanged && (
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Website</DialogTitle>
            <DialogDescription>
              Update the website details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Website Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-domain">Primary Domain</Label>
              <Input
                id="edit-domain"
                value={editForm.primary_domain}
                onChange={(e) =>
                  setEditForm({ ...editForm, primary_domain: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-environment">Environment</Label>
                <Select
                  value={editForm.environment}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, environment: value })
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
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value as WebsiteStatus })
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
                <Label htmlFor="edit-brand">Brand</Label>
                <Select
                  value={editForm.brand_id}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, brand_id: value })
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
                <Label htmlFor="edit-tenant">Client</Label>
                <Select
                  value={editForm.tenant_id}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, tenant_id: value })
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending || !editForm.name}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
