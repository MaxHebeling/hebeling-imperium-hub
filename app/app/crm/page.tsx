"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Contact,
  ClipboardList,
  Phone,
  Mail,
  X,
  Globe,
  Target,
  Palette,
  Calendar,
  MessageSquare,
  ExternalLink,
  Check,
} from "lucide-react";
import Link from "next/link";

type TenantStatus = "lead" | "active" | "paused" | "archived";

interface ContactRecord {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  status: TenantStatus;
  created_at: string;
  org_id: string;
}

type LeadStatus = "new_lead" | "contacted" | "qualified" | "converted" | "lost";

interface Lead {
  id: string;
  lead_code: string;
  full_name: string;
  company_name: string | null;
  email: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  project_description: string | null;
  organization_type: string | null;
  website_url: string | null;
  social_links: string | null;
  main_goal: string | null;
  expected_result: string | null;
  main_service: string | null;
  ideal_client: string | null;
  has_logo: boolean | null;
  has_brand_colors: boolean | null;
  visual_style: string | null;
  available_content: string | null;
  reference_websites: string | null;
  has_current_landing: boolean | null;
  project_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  preferred_contact_method: string | null;
  additional_notes: string | null;
  brand: string | null;
  origin_page: string | null;
  status: LeadStatus;
  created_at: string;
}

const statusColors: Record<TenantStatus, string> = {
  lead: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const leadStatusColors: Record<LeadStatus, string> = {
  new_lead: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  converted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const ITEMS_PER_PAGE = 10;

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [sortField, setSortField] = useState<"name" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    primary_contact_name: "",
    primary_contact_email: "",
    status: "lead" as TenantStatus,
  });
  const [saving, setSaving] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Get user's org_id first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (profile?.org_id) {
      setUserOrgId(profile.org_id);
    }

    let query = supabase
      .from("tenants")
      .select("*", { count: "exact" });

    // Apply search
    if (search) {
      query = query.or(`name.ilike.%${search}%,primary_contact_name.ilike.%${search}%,primary_contact_email.ilike.%${search}%`);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching tenants:", error);
    } else {
      setTenants(data || []);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }, [search, statusFilter, sortField, sortOrder, currentPage]);

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("contacts")
      .select("id, full_name, email, phone, source, created_at")
      .order("created_at", { ascending: false });

    if (contactSearch) {
      query = query.or(`full_name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%,phone.ilike.%${contactSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contacts:", error);
    } else {
      setContacts(data || []);
    }

    setContactsLoading(false);
  }, [contactSearch]);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (leadSearch) {
      query = query.or(`full_name.ilike.%${leadSearch}%,email.ilike.%${leadSearch}%,lead_code.ilike.%${leadSearch}%,company_name.ilike.%${leadSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      setLeads(data || []);
    }

    setLeadsLoading(false);
  }, [leadSearch]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSort = (field: "name" | "created_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleOpenModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        primary_contact_name: tenant.primary_contact_name || "",
        primary_contact_email: tenant.primary_contact_email || "",
        status: tenant.status,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: "",
        primary_contact_name: "",
        primary_contact_email: "",
        status: "lead",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !userOrgId) return;

    setSaving(true);
    const supabase = createClient();

    if (editingTenant) {
      // Update existing tenant
      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          primary_contact_name: formData.primary_contact_name || null,
          primary_contact_email: formData.primary_contact_email || null,
          status: formData.status,
        })
        .eq("id", editingTenant.id);

      if (error) {
        console.error("Error updating tenant:", error);
      }
    } else {
      // Create new tenant
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase.from("tenants").insert({
        org_id: userOrgId,
        name: formData.name,
        slug,
        primary_contact_name: formData.primary_contact_name || null,
        primary_contact_email: formData.primary_contact_email || null,
        status: formData.status,
      });

      if (error) {
        console.error("Error creating tenant:", error);
      }
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchTenants();
  };

  const handleArchive = async (tenant: Tenant) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ status: "archived" })
      .eq("id", tenant.id);

    if (error) {
      console.error("Error archiving tenant:", error);
    } else {
      fetchTenants();
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">CRM</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients, contacts, and relationships.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Contact className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          {/* Brand Links */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Links de Formularios por Marca
              </CardTitle>
              <CardDescription className="text-xs">
                Copia y comparte estos links con tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { name: "iKingdom Leads Link", fullUrl: "https://hub.hebelingimperium.com/apply/ikingdom-diagnosis" },
                ].map((item) => (
                  <div key={item.fullUrl} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                    <span className="text-xs font-medium min-w-fit">{item.name}:</span>
                    <a
                      href={item.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-background/50 px-2 py-1 rounded flex-1 truncate text-primary hover:underline"
                    >
                      {item.fullUrl}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(item.fullUrl);
                      }}
                    >
                      <ClipboardList className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leads Search */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads por nombre, email o codigo..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads.length === 0 ? (
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No hay leads aun</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                    {leadSearch
                      ? "Intenta ajustar tu busqueda."
                      : "Los leads del formulario de aplicacion apareceran aqui."}
                  </p>
                  <Link href="/apply" className="mt-4">
                    <Button variant="outline" className="gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Ver Formulario
                    </Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>Codigo</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicacion</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => handleViewLead(lead)}
                    >
                      <TableCell className="font-mono text-xs text-primary">
                        {lead.lead_code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {lead.brand || "ikingdom"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.full_name}</p>
                          {lead.company_name && (
                            <p className="text-xs text-muted-foreground">{lead.company_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </a>
                          )}
                          {lead.whatsapp && (
                            <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.whatsapp}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {[lead.city, lead.country].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.project_type || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs ${leadStatusColors[lead.status]}`}
                        >
                          {lead.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          {/* Contacts Search */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacts Table */}
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            {contactsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Contact className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No contacts yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                    {contactSearch
                      ? "Try adjusting your search."
                      : "Contacts captured from landing pages will appear here."}
                  </p>
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="border-border/50 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{contact.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {contact.source ? (
                          <Badge variant="outline" className="capitalize">
                            {contact.source}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(contact.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as TenantStatus | "all");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] bg-background/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">No clients found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Add your first client to start managing relationships."}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => handleOpenModal()} className="mt-6 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Your First Client
                </Button>
              )}
            </div>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Client Name
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="border-border/50 hover:bg-muted/30"
                  >
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.primary_contact_name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.primary_contact_email || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusColors[tenant.status]}`}
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/crm/${tenant.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenModal(tenant)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {tenant.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} clients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? "Edit Client" : "New Client"}
            </DialogTitle>
            <DialogDescription>
              {editingTenant
                ? "Update the client information below."
                : "Fill in the details to create a new client."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Primary Contact Name</Label>
              <Input
                id="contact_name"
                placeholder="John Doe"
                value={formData.primary_contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, primary_contact_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Primary Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="john@acme.com"
                value={formData.primary_contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, primary_contact_email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as TenantStatus })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTenant ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedLead?.full_name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-primary">{selectedLead?.lead_code}</span>
                  {selectedLead && (
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${leadStatusColors[selectedLead.status]}`}
                    >
                      {selectedLead.status.replace("_", " ")}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Informacion Basica */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Contact className="h-4 w-4" />
                  Informacion Basica
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedLead.full_name}</p>
                  </div>
                  {selectedLead.company_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="font-medium">{selectedLead.company_name}</p>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${selectedLead.email}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                  {selectedLead.whatsapp && (
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedLead.whatsapp}
                      </a>
                    </div>
                  )}
                  {(selectedLead.city || selectedLead.country) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ubicacion</p>
                      <p className="font-medium">{[selectedLead.city, selectedLead.country].filter(Boolean).join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del Proyecto */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Detalles del Proyecto
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  {selectedLead.project_description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Descripcion del Proyecto</p>
                      <p className="mt-1">{selectedLead.project_description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.organization_type && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de Organizacion</p>
                        <p className="font-medium">{selectedLead.organization_type}</p>
                      </div>
                    )}
                    {selectedLead.main_goal && (
                      <div>
                        <p className="text-xs text-muted-foreground">Objetivo Principal</p>
                        <p className="font-medium">{selectedLead.main_goal}</p>
                      </div>
                    )}
                    {selectedLead.expected_result && (
                      <div>
                        <p className="text-xs text-muted-foreground">Resultado Esperado</p>
                        <p className="font-medium">{selectedLead.expected_result}</p>
                      </div>
                    )}
                    {selectedLead.main_service && (
                      <div>
                        <p className="text-xs text-muted-foreground">Servicio Principal</p>
                        <p className="font-medium">{selectedLead.main_service}</p>
                      </div>
                    )}
                    {selectedLead.ideal_client && (
                      <div>
                        <p className="text-xs text-muted-foreground">Cliente Ideal</p>
                        <p className="font-medium">{selectedLead.ideal_client}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.website_url && (
                    <div>
                      <p className="text-xs text-muted-foreground">Sitio Web Actual</p>
                      <a href={selectedLead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {selectedLead.website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {selectedLead.social_links && (
                    <div>
                      <p className="text-xs text-muted-foreground">Redes Sociales</p>
                      <p className="font-medium">{selectedLead.social_links}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tiene Logo</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_logo ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_logo ? "Si" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tiene Colores de Marca</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_brand_colors ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_brand_colors ? "Si" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tiene Landing Actual</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_current_landing ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_current_landing ? "Si" : "No"}
                      </p>
                    </div>
                    {selectedLead.visual_style && (
                      <div>
                        <p className="text-xs text-muted-foreground">Estilo Visual</p>
                        <p className="font-medium">{selectedLead.visual_style}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.available_content && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Contenido Disponible</p>
                      <p className="font-medium">{selectedLead.available_content}</p>
                    </div>
                  )}
                  {selectedLead.reference_websites && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Sitios de Referencia</p>
                      <p className="font-medium">{selectedLead.reference_websites}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alcance */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Alcance del Proyecto
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.project_type && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de Proyecto</p>
                        <p className="font-medium">{selectedLead.project_type}</p>
                      </div>
                    )}
                    {selectedLead.budget_range && (
                      <div>
                        <p className="text-xs text-muted-foreground">Rango de Presupuesto</p>
                        <p className="font-medium">{selectedLead.budget_range}</p>
                      </div>
                    )}
                    {selectedLead.timeline && (
                      <div>
                        <p className="text-xs text-muted-foreground">Timeline</p>
                        <p className="font-medium">{selectedLead.timeline}</p>
                      </div>
                    )}
                    {selectedLead.preferred_contact_method && (
                      <div>
                        <p className="text-xs text-muted-foreground">Metodo de Contacto Preferido</p>
                        <p className="font-medium">{selectedLead.preferred_contact_method}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notas Adicionales */}
              {selectedLead.additional_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notas Adicionales
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p>{selectedLead.additional_notes}</p>
                  </div>
                </div>
              )}

              {/* Fecha de Creacion */}
              <div className="text-xs text-muted-foreground text-right">
                Recibido el {formatDate(selectedLead.created_at)}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            {selectedLead?.whatsapp && (
              <Button asChild variant="outline" className="gap-2">
                <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4" />
                  Contactar por WhatsApp
                </a>
              </Button>
            )}
            <Button onClick={() => setIsLeadModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
