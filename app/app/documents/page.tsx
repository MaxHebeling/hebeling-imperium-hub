"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  FileSignature,
  Receipt,
  FileCheck,
  File,
  ExternalLink,
  Trash2,
  FolderOpen,
} from "lucide-react";

interface Document {
  id: string;
  type: string;
  status: string | null;
  file_url: string | null;
  created_at: string;
  tenant: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

interface Tenant {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

type LinkedEntity = { id: string; name: string };

function normalizeLinkedEntity(value: LinkedEntity | LinkedEntity[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function mapDocumentRow(row: Omit<Document, "tenant" | "brand"> & {
  tenant: LinkedEntity | LinkedEntity[] | null;
  brand: LinkedEntity | LinkedEntity[] | null;
}): Document {
  return {
    ...row,
    tenant: normalizeLinkedEntity(row.tenant),
    brand: normalizeLinkedEntity(row.brand),
  };
}

const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract", icon: FileSignature },
  { value: "proposal", label: "Proposal", icon: FileText },
  { value: "invoice", label: "Invoice", icon: Receipt },
  { value: "brief", label: "Brief", icon: FileCheck },
  { value: "other", label: "Other", icon: File },
];

const DOCUMENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "signed", label: "Signed" },
  { value: "paid", label: "Paid" },
  { value: "archived", label: "Archived" },
];

function getTypeIcon(type: string) {
  const docType = DOCUMENT_TYPES.find((t) => t.value === type);
  return docType?.icon || File;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground";
    case "pending":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "signed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "paid":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "archived":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [profile, setProfile] = useState<{ org_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [formType, setFormType] = useState("contract");
  const [formStatus, setFormStatus] = useState("draft");
  const [formTenant, setFormTenant] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");

  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setProfile(null);
        setDocuments([]);
        setTenants([]);
        setBrands([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (!profileData) {
        setProfile(null);
        setDocuments([]);
        setTenants([]);
        setBrands([]);
        setLoading(false);
        return;
      }

      const [docsRes, tenantsRes, brandsRes] = await Promise.all([
        supabase
          .from("documents")
          .select("*, tenant:tenants(id, name), brand:brands(id, name)")
          .eq("org_id", profileData.org_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tenants")
          .select("id, name")
          .eq("org_id", profileData.org_id)
          .order("name"),
        supabase
          .from("brands")
          .select("id, name")
          .eq("org_id", profileData.org_id)
          .order("name"),
      ]);

      if (!active) return;

      setProfile(profileData);
      setDocuments(
        ((docsRes.data ?? []) as Array<
          Omit<Document, "tenant" | "brand"> & {
            tenant: LinkedEntity | LinkedEntity[] | null;
            brand: LinkedEntity | LinkedEntity[] | null;
          }
        >).map(mapDocumentRow)
      );
      setTenants(tenantsRes.data || []);
      setBrands(brandsRes.data || []);
      setLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [refreshKey, supabase]);

  const handleCreate = async () => {
    if (!profile) return;
    setCreating(true);

    const { error } = await supabase.from("documents").insert({
      org_id: profile.org_id,
      type: formType,
      status: formStatus,
      tenant_id: formTenant || null,
      brand_id: formBrand || null,
      file_url: formFileUrl || null,
    });

    if (!error) {
      setIsCreateOpen(false);
      setFormType("contract");
      setFormStatus("draft");
      setFormTenant("");
      setFormBrand("");
      setFormFileUrl("");
      setRefreshKey((value) => value + 1);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await supabase.from("documents").delete().eq("id", id);
    setRefreshKey((value) => value + 1);
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      search === "" ||
      doc.type.toLowerCase().includes(search.toLowerCase()) ||
      doc.tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.brand?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || doc.status === statusFilter;
    const matchesTenant =
      tenantFilter === "all" || doc.tenant?.id === tenantFilter;
    const matchesTab = activeTab === "all" || doc.type === activeTab;
    return matchesSearch && matchesStatus && matchesTenant && matchesTab;
  });

  // Group documents by type for stats
  const docsByType = DOCUMENT_TYPES.map((type) => ({
    ...type,
    count: documents.filter((d) => d.type === type.value).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.documents.title}</h1>
          <p className="text-muted-foreground">
            {t.documents.subtitle}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.documents.newDocument}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.documents.createDocument}</DialogTitle>
              <DialogDescription>
                {t.documents.addNewDocument}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t.documents.type}</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t.documents.status}</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t.crm.clients} ({t.common.optional})</Label>
                <Select
                  value={formTenant || "none"}
                  onValueChange={(nextValue) =>
                    setFormTenant(nextValue === "none" ? "" : nextValue)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.documents.selectClient} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.common.none}</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t.projects.brand} ({t.common.optional})</Label>
                <Select
                  value={formBrand || "none"}
                  onValueChange={(nextValue) =>
                    setFormBrand(nextValue === "none" ? "" : nextValue)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.documents.selectBrand} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.common.none}</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t.documents.fileUrl} ({t.common.optional})</Label>
                <Input
                  placeholder="https://..."
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? t.documents.creating : t.documents.createDocument}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {docsByType.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.value}
              className={`cursor-pointer transition-colors ${
                activeTab === type.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                setActiveTab(activeTab === type.value ? "all" : type.value)
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {type.label}s
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{type.count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.documents.searchDocuments}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder={t.documents.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.documents.allStatuses}</SelectItem>
            {DOCUMENT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.crm.clients} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.crm.allClients}</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          {DOCUMENT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}s
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t.documents.noDocumentsFound}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === "all"
                    ? t.documents.createFirst
                    : t.documents.noneOfType}
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.documents.newDocument}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.documents.type}</TableHead>
                    <TableHead>{t.crm.clients}</TableHead>
                    <TableHead>{t.projects.brand}</TableHead>
                    <TableHead>{t.documents.status}</TableHead>
                    <TableHead>{t.common.created}</TableHead>
                    <TableHead className="text-right">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const Icon = getTypeIcon(doc.type);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">
                              {doc.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.tenant?.name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.brand?.name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(doc.status)}
                          >
                            {doc.status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {doc.file_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
