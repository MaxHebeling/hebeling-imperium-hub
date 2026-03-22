"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  Trash2,
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
import { useLanguage } from "@/lib/i18n";
import { LEAD_BRAND_OPTIONS, getLeadBrandProfile } from "@/lib/leads/brand-config";
import { getStaffBrandScope, isRestrictedStaffRole, type StaffBrandScope } from "@/lib/staff-brand-access";

const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

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

interface LeadEditDraft {
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  project_description: string;
  organization_type: string;
  website_url: string;
  social_links: string;
  main_goal: string;
  expected_result: string;
  main_service: string;
  ideal_client: string;
  project_type: string;
  budget_range: string;
  timeline: string;
  preferred_contact_method: string;
  additional_notes: string;
  status: LeadStatus;
}

function createLeadDraft(lead: Lead): LeadEditDraft {
  return {
    full_name: lead.full_name || "",
    company_name: lead.company_name || "",
    email: lead.email || "",
    whatsapp: lead.whatsapp || "",
    country: lead.country || "",
    city: lead.city || "",
    project_description: lead.project_description || "",
    organization_type: lead.organization_type || "",
    website_url: lead.website_url || "",
    social_links: lead.social_links || "",
    main_goal: lead.main_goal || "",
    expected_result: lead.expected_result || "",
    main_service: lead.main_service || "",
    ideal_client: lead.ideal_client || "",
    project_type: lead.project_type || "",
    budget_range: lead.budget_range || "",
    timeline: lead.timeline || "",
    preferred_contact_method: lead.preferred_contact_method || "",
    additional_notes: lead.additional_notes || "",
    status: lead.status,
  };
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

const leadStatusLabels: Record<LeadStatus, Record<"es" | "en", string>> = {
  new_lead: { es: "Nuevo lead", en: "New lead" },
  contacted: { es: "Contactado", en: "Contacted" },
  qualified: { es: "Calificado", en: "Qualified" },
  converted: { es: "Convertido", en: "Converted" },
  lost: { es: "Perdido", en: "Lost" },
};

const tenantStatusLabels: Record<TenantStatus, Record<"es" | "en", string>> = {
  lead: { es: "Lead", en: "Lead" },
  active: { es: "Activo", en: "Active" },
  paused: { es: "Pausado", en: "Paused" },
  archived: { es: "Archivado", en: "Archived" },
};

const leadValueLabels: Record<string, Record<string, Record<"es" | "en", string>>> = {
  project_type: {
    residential_build: { es: "Construcción residencial", en: "Residential construction" },
    commercial_build: { es: "Construcción comercial", en: "Commercial construction" },
    remodeling: { es: "Remodelación", en: "Remodeling" },
    renovation: { es: "Renovación", en: "Renovation" },
    general_contracting: { es: "Contratación general", en: "General contracting" },
    other: { es: "Otro", en: "Other" },
  },
  main_service: {
    residential_construction: { es: "Construcción residencial", en: "Residential construction" },
    commercial_construction: { es: "Construcción comercial", en: "Commercial construction" },
    remodeling_renovation: { es: "Remodelación y renovación", en: "Remodeling and renovation" },
    general_contracting: { es: "Contratación general", en: "General contracting" },
    specialty_trade: { es: "Especialidad o subcontratación", en: "Specialty trade or subcontracting" },
  },
  main_goal: {
    fill_pipeline: { es: "Llenar pipeline de oportunidades", en: "Fill the opportunity pipeline" },
    book_estimates: { es: "Agendar estimaciones o visitas", en: "Book estimates or visits" },
    find_high_value_projects: { es: "Captar proyectos de mayor valor", en: "Capture higher-value projects" },
    expand_new_market: { es: "Expandirse a una nueva zona o mercado", en: "Expand into a new area or market" },
  },
  timeline: {
    urgente: { es: "Urgente", en: "Urgent" },
    pronto: { es: "Pronto", en: "Soon" },
    normal: { es: "Normal", en: "Normal" },
    flexible: { es: "Flexible", en: "Flexible" },
  },
  budget_range: {
    menos_500: { es: "Menos de $500 USD", en: "Less than $500 USD" },
    "500_1000": { es: "$500 - $1,000 USD", en: "$500 - $1,000 USD" },
    "1000_2500": { es: "$1,000 - $2,500 USD", en: "$1,000 - $2,500 USD" },
    "2500_5000": { es: "$2,500 - $5,000 USD", en: "$2,500 - $5,000 USD" },
    "5000_10000": { es: "$5,000 - $10,000 USD", en: "$5,000 - $10,000 USD" },
    mas_10000: { es: "Más de $10,000 USD", en: "More than $10,000 USD" },
    por_definir: { es: "Por definir", en: "To be defined" },
  },
  preferred_contact_method: {
    whatsapp: { es: "WhatsApp", en: "WhatsApp" },
    email: { es: "Email", en: "Email" },
    llamada: { es: "Llamada", en: "Call" },
    videollamada: { es: "Videollamada", en: "Video call" },
  },
};

const ITEMS_PER_PAGE = 10;

export default function CRMPage() {
  const { t, locale } = useLanguage();
  const isES = locale === "es";
  const searchParams = useSearchParams();
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
  const [leadBrandFilter, setLeadBrandFilter] = useState<string>("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatus | "all">("all");
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
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);
  const [restrictedBrandScope, setRestrictedBrandScope] = useState<StaffBrandScope | null>(null);
  const [accessResolved, setAccessResolved] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [leadDraft, setLeadDraft] = useState<LeadEditDraft | null>(null);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaveError, setLeadSaveError] = useState("");
  const [leadSaveNotice, setLeadSaveNotice] = useState("");

  const projectTypeOptions = [
    { value: "residential_build", label: isES ? "Construcción residencial" : "Residential construction" },
    { value: "commercial_build", label: isES ? "Construcción comercial" : "Commercial construction" },
    { value: "remodeling", label: isES ? "Remodelación" : "Remodeling" },
    { value: "renovation", label: isES ? "Renovación" : "Renovation" },
    { value: "general_contracting", label: isES ? "Contratación general" : "General contracting" },
    { value: "other", label: isES ? "Otro" : "Other" },
  ];

  const mainServiceOptions = [
    { value: "residential_construction", label: isES ? "Construcción residencial" : "Residential construction" },
    { value: "commercial_construction", label: isES ? "Construcción comercial" : "Commercial construction" },
    { value: "remodeling_renovation", label: isES ? "Remodelación y renovación" : "Remodeling and renovation" },
    { value: "general_contracting", label: isES ? "Contratación general" : "General contracting" },
    { value: "specialty_trade", label: isES ? "Especialidad o subcontratación" : "Specialty trade or subcontracting" },
  ];

  const mainGoalOptions = [
    { value: "fill_pipeline", label: isES ? "Llenar pipeline de oportunidades" : "Fill the opportunity pipeline" },
    { value: "book_estimates", label: isES ? "Agendar estimaciones o visitas" : "Book estimates or visits" },
    { value: "find_high_value_projects", label: isES ? "Captar proyectos de mayor valor" : "Capture higher-value projects" },
    { value: "expand_new_market", label: isES ? "Expandirse a una nueva zona o mercado" : "Expand into a new area or market" },
  ];

  const timelineOptions = [
    { value: "urgente", label: isES ? "Urgente" : "Urgent" },
    { value: "pronto", label: isES ? "Pronto" : "Soon" },
    { value: "normal", label: isES ? "Normal" : "Normal" },
    { value: "flexible", label: isES ? "Flexible" : "Flexible" },
  ];

  const budgetOptions = [
    { value: "menos_500", label: isES ? "Menos de $500 USD" : "Less than $500 USD" },
    { value: "500_1000", label: "$500 - $1,000 USD" },
    { value: "1000_2500", label: "$1,000 - $2,500 USD" },
    { value: "2500_5000", label: "$2,500 - $5,000 USD" },
    { value: "5000_10000", label: "$5,000 - $10,000 USD" },
    { value: "mas_10000", label: isES ? "Más de $10,000 USD" : "More than $10,000 USD" },
    { value: "por_definir", label: isES ? "Por definir" : "To be defined" },
  ];

  const contactMethodOptions = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "Email" },
    { value: "llamada", label: isES ? "Llamada" : "Call" },
    { value: "videollamada", label: isES ? "Videollamada" : "Video call" },
  ];

  useEffect(() => {
    const resolveAccessScope = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAccessResolved(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, brand_id")
        .eq("id", user.id)
        .single();

      if (profile?.brand_id && isRestrictedStaffRole(profile.role)) {
        const { data: brand } = await supabase
          .from("brands")
          .select("slug")
          .eq("id", profile.brand_id)
          .maybeSingle();

        const scope = getStaffBrandScope(brand?.slug);
        if (scope) {
          setRestrictedBrandScope(scope);
        }
      }

      setAccessResolved(true);
    };

    resolveAccessScope();
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const brand = searchParams.get("brand");
    const status = searchParams.get("status");
    const leadQuery = searchParams.get("leadSearch");

    if (restrictedBrandScope) {
      setActiveTab("leads");
      setLeadBrandFilter(restrictedBrandScope.crmBrand);
    } else if (tab === "leads" || tab === "contacts" || tab === "clients") {
      setActiveTab(tab);
    }

    if (restrictedBrandScope) {
      setLeadBrandFilter(restrictedBrandScope.crmBrand);
    } else if (brand === "all") {
      setLeadBrandFilter("all");
    } else if (brand && LEAD_BRAND_OPTIONS.some((option) => option.value === brand)) {
      setLeadBrandFilter(brand);
    }

    if (status === "all") {
      setLeadStatusFilter("all");
    } else if (
      status &&
      ["new_lead", "contacted", "qualified", "converted", "lost"].includes(status)
    ) {
      setLeadStatusFilter(status as LeadStatus);
    }

    if (leadQuery !== null) {
      setLeadSearch(leadQuery);
    }
  }, [restrictedBrandScope, searchParams]);

  const fetchTenants = useCallback(async () => {
    if (!accessResolved) return;

    if (restrictedBrandScope) {
      setTenants([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

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
  }, [accessResolved, currentPage, restrictedBrandScope, search, sortField, sortOrder, statusFilter]);

  const fetchContacts = useCallback(async () => {
    if (!accessResolved) return;

    if (restrictedBrandScope) {
      setContacts([]);
      setContactsLoading(false);
      return;
    }

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
  }, [accessResolved, contactSearch, restrictedBrandScope]);

  const fetchLeads = useCallback(async () => {
    if (!accessResolved) return;

    setLeadsLoading(true);
    try {
      const params = new URLSearchParams();

      if (leadSearch.trim()) {
        params.set("search", leadSearch.trim());
      }

      if (restrictedBrandScope) {
        params.set("brand", restrictedBrandScope.crmBrand);
      } else if (leadBrandFilter !== "all") {
        params.set("brand", leadBrandFilter);
      }

      if (leadStatusFilter !== "all") {
        params.set("status", leadStatusFilter);
      }

      const response = await fetch(`/api/leads?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Failed to fetch leads");
      }

      setLeads(payload.leads || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [accessResolved, leadBrandFilter, leadSearch, leadStatusFilter, restrictedBrandScope]);

  useEffect(() => {
    if (!accessResolved) return;
    fetchTenants();
  }, [accessResolved, fetchTenants]);

  useEffect(() => {
    if (!accessResolved) return;
    fetchContacts();
  }, [accessResolved, fetchContacts]);

  useEffect(() => {
    if (!accessResolved) return;
    fetchLeads();
  }, [accessResolved, fetchLeads]);

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
    setLeadDraft(createLeadDraft(lead));
    setIsEditingLead(false);
    setLeadSaveError("");
    setLeadSaveNotice("");
    setIsLeadModalOpen(true);
  };

  useEffect(() => {
    if (!selectedLead) {
      setLeadDraft(null);
      setIsEditingLead(false);
      return;
    }

    setLeadDraft(createLeadDraft(selectedLead));
  }, [selectedLead]);

  const handleLeadDraftChange = <K extends keyof LeadEditDraft>(field: K, value: LeadEditDraft[K]) => {
    setLeadDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleStartLeadEdit = () => {
    if (!selectedLead) return;
    setLeadDraft(createLeadDraft(selectedLead));
    setLeadSaveError("");
    setLeadSaveNotice("");
    setIsEditingLead(true);
  };

  const handleCancelLeadEdit = () => {
    if (selectedLead) {
      setLeadDraft(createLeadDraft(selectedLead));
    }
    setLeadSaveError("");
    setLeadSaveNotice("");
    setIsEditingLead(false);
  };

  const handleSaveLead = async () => {
    if (!selectedLead || !leadDraft || !leadDraft.full_name.trim()) {
      return;
    }

    setLeadSaving(true);
    setLeadSaveError("");
    setLeadSaveNotice("");

    try {
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadDraft),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || (isES ? "No se pudo guardar el lead." : "The lead could not be saved."));
      }

      const updatedLead = payload.lead as Lead;

      setSelectedLead(updatedLead);
      setLeadDraft(createLeadDraft(updatedLead));
      setLeads((prev) => prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
      setIsEditingLead(false);
      setLeadSaveNotice(isES ? "Cambios guardados." : "Changes saved.");
      fetchLeads();
    } catch (error) {
      setLeadSaveError(
        error instanceof Error
          ? error.message
          : isES
            ? "Ocurrió un error al guardar."
            : "An error occurred while saving."
      );
    } finally {
      setLeadSaving(false);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    setDeletingLeadId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        console.error("Error deleting lead:", json.error);
        return;
      }
      setIsLeadModalOpen(false);
      setSelectedLead(null);
      setDeleteConfirmLead(null);
      fetchLeads();
    } catch (err) {
      console.error("Delete lead error:", err);
    } finally {
      setDeletingLeadId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(isES ? "es-MX" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const formatLeadValue = (value: string | null | undefined, field?: string) => {
    if (!value) return "-";
    const localizedValue = field ? leadValueLabels[field]?.[value]?.[locale] : undefined;
    if (localizedValue) {
      return localizedValue;
    }

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesBrand =
      leadBrandFilter === "all" || (lead.brand || "ikingdom") === leadBrandFilter;
    const matchesStatus =
      leadStatusFilter === "all" || lead.status === leadStatusFilter;

    return matchesBrand && matchesStatus;
  });

  const leadMetrics = {
    total: filteredLeads.length,
    new: filteredLeads.filter((lead) => lead.status === "new_lead").length,
    qualified: filteredLeads.filter((lead) => lead.status === "qualified").length,
    followUpReady: filteredLeads.filter(
      (lead) => lead.status !== "lost" && (!!lead.email || !!lead.whatsapp)
    ).length,
  };

  const leadFormLinks = [
    {
      name: isES ? "Leads de iKingdom" : "iKingdom Leads",
      fullUrl: "https://hub.hebelingimperium.com/apply/ikingdom-diagnosis",
    },
    {
      name: isES ? "Intake de Lead Hunter" : "Lead Hunter Intake",
      fullUrl: "https://hub.hebelingimperium.com/apply/lead-hunter",
    },
  ];
  const visibleLeadFormLinks = restrictedBrandScope
    ? leadFormLinks.filter((item) => item.fullUrl.includes("/apply/lead-hunter"))
    : leadFormLinks;

  const selectedBrandProfile =
    leadBrandFilter !== "all" ? getLeadBrandProfile(leadBrandFilter) : null;
  const isLeadHunterVisualMode =
    leadBrandFilter === "lead_hunter" || restrictedBrandScope?.crmBrand === "lead_hunter";

  if (!accessResolved) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {isLeadHunterVisualMode && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-center bg-cover opacity-[0.16]"
            style={{
              backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,20,32,0.88) 0%, rgba(11,20,32,0.78) 22%, rgba(11,20,32,0.84) 52%, rgba(11,20,32,0.92) 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              background:
                "radial-gradient(circle at 18% 18%, rgba(201,111,45,0.22), transparent 26%), radial-gradient(circle at 84% 16%, rgba(225,162,74,0.18), transparent 24%)",
            }}
          />
        </div>
      )}

      <div className="relative p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.crm.title}</h1>
          <p className="text-muted-foreground mt-1">
            {restrictedBrandScope
              ? isES
                ? `Vista operativa restringida para ${restrictedBrandScope.label}.`
                : `Restricted operating view for ${restrictedBrandScope.label}.`
              : t.crm.subtitle}
          </p>
        </div>
        {!restrictedBrandScope && (
          <Button onClick={() => handleOpenModal()} className="gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            {t.crm.newClient}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t.crm.leads}
          </TabsTrigger>
          {!restrictedBrandScope && (
            <TabsTrigger value="contacts" className="gap-2">
              <Contact className="h-4 w-4" />
              {t.crm.contacts}
            </TabsTrigger>
          )}
          {!restrictedBrandScope && (
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              {t.crm.clients}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          {selectedBrandProfile && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isES ? "Vista CRM enfocada" : "Focused CRM View"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedBrandProfile.label}
                    </Badge>
                    <p className="text-sm text-foreground">
                      {isES
                        ? "Estás viendo el pipeline filtrado de esta unidad de negocio dentro del CRM."
                        : "You are viewing the filtered pipeline for this business unit inside the CRM."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!restrictedBrandScope && (
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={selectedBrandProfile.companyPath}>
                        {isES ? "Ver unidad" : "View unit"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="gap-2">
                    <Link href={selectedBrandProfile.formPath}>
                      {isES ? "Abrir intake" : "Open intake"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t.crm.visibleLeads, value: leadMetrics.total, icon: ClipboardList },
              { label: t.crm.newLeads, value: leadMetrics.new, icon: Target },
              { label: t.crm.qualifiedLeads, value: leadMetrics.qualified, icon: Check },
              { label: t.crm.followUpReady, value: leadMetrics.followUpReady, icon: Phone },
            ].map((metric) => (
              <Card key={metric.label} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {metric.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
                      <metric.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Brand Links */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {t.crm.formLinks}
              </CardTitle>
              <CardDescription className="text-xs">
                {t.crm.formLinksDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visibleLeadFormLinks.map((item) => (
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
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t.crm.leadFilters}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.crm.searchLeads}
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                  {!restrictedBrandScope && (
                    <Select value={leadBrandFilter} onValueChange={setLeadBrandFilter}>
                      <SelectTrigger className="w-full sm:w-[220px] bg-background/50">
                        <SelectValue placeholder={t.crm.filterBrand} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.crm.allBrands}</SelectItem>
                        {LEAD_BRAND_OPTIONS.map((brand) => (
                          <SelectItem key={brand.value} value={brand.value}>
                            {brand.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={leadStatusFilter}
                    onValueChange={(value) => setLeadStatusFilter(value as LeadStatus | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
                      <SelectValue placeholder={t.crm.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.crm.allStatuses}</SelectItem>
                      <SelectItem value="new_lead">{leadStatusLabels.new_lead[locale]}</SelectItem>
                      <SelectItem value="contacted">{leadStatusLabels.contacted[locale]}</SelectItem>
                      <SelectItem value="qualified">{leadStatusLabels.qualified[locale]}</SelectItem>
                      <SelectItem value="converted">{leadStatusLabels.converted[locale]}</SelectItem>
                      <SelectItem value="lost">{leadStatusLabels.lost[locale]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {leadBrandFilter === "lead_hunter" && (
                  <div
                    className="relative overflow-hidden rounded-xl border border-[#C96F2D]/20 px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(15,27,45,0.92) 0%, rgba(22,34,53,0.82) 56%, rgba(201,111,45,0.12) 100%)",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-[0.22]"
                      style={{
                        backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(11,20,32,0.92) 0%, rgba(11,20,32,0.8) 36%, rgba(11,20,32,0.56) 100%)",
                      }}
                    />
                    <div className="relative">
                      <p className="text-sm font-medium text-foreground">
                        {isES ? "Pipeline de construcción de Lead Hunter" : "Lead Hunter construction pipeline"}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {isES
                          ? "Estás viendo el slice de construcción. Aquí ANNA y el equipo deben capturar, calificar y preparar seguimiento humano para oportunidades de obra, remodelación o contracting."
                          : "You are viewing the construction slice. Here, ANNA and the team should capture, qualify, and prepare human follow-up for construction, remodeling, or contracting opportunities."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground">{t.crm.noLeadsYet}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                    {leadSearch || leadBrandFilter !== "all" || leadStatusFilter !== "all"
                      ? t.crm.adjustSearch
                      : t.crm.leadsWillAppear}
                  </p>
                  <Link
                    href={leadBrandFilter === "lead_hunter" ? "/apply/lead-hunter" : "/apply/ikingdom-diagnosis"}
                    className="mt-4"
                  >
                    <Button variant="outline" className="gap-2">
                      <ClipboardList className="h-4 w-4" />
                      {t.crm.viewForm}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>{t.crm.code}</TableHead>
                    <TableHead>{t.crm.origin}</TableHead>
                    <TableHead>{t.crm.name}</TableHead>
                    <TableHead>{t.crm.contactInfo}</TableHead>
                    <TableHead>{t.crm.location}</TableHead>
                    <TableHead>{t.crm.project}</TableHead>
                    <TableHead>{t.crm.status}</TableHead>
                    <TableHead>{t.crm.date}</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const brandProfile = getLeadBrandProfile(lead.brand);
                    return (
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
                          {brandProfile.label}
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
                        {formatLeadValue(lead.project_type, "project_type")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs ${leadStatusColors[lead.status]}`}
                        >
                          {leadStatusLabels[lead.status][locale]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(lead.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmLead(lead);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        {!restrictedBrandScope && (
        <TabsContent value="contacts" className="space-y-6">
          {/* Contacts Search */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.crm.searchContacts}
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
                  <p className="text-lg font-medium text-foreground">{t.crm.noContactsYet}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                    {contactSearch
                      ? t.crm.adjustSearch
                      : t.crm.addFirstContact}
                  </p>
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>{t.crm.fullName}</TableHead>
                    <TableHead>{t.crm.email}</TableHead>
                    <TableHead>{t.crm.phone}</TableHead>
                    <TableHead>{t.crm.source}</TableHead>
                    <TableHead>{t.common.created}</TableHead>
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
        )}

        {/* Clients Tab */}
        {!restrictedBrandScope && (
        <TabsContent value="clients" className="space-y-6">
      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.crm.searchClients}
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
                  <SelectValue placeholder={t.crm.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.crm.allStatuses}</SelectItem>
                  <SelectItem value="lead">{tenantStatusLabels.lead[locale]}</SelectItem>
                  <SelectItem value="active">{tenantStatusLabels.active[locale]}</SelectItem>
                  <SelectItem value="paused">{tenantStatusLabels.paused[locale]}</SelectItem>
                  <SelectItem value="archived">{tenantStatusLabels.archived[locale]}</SelectItem>
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
              <p className="text-lg font-medium text-foreground">{t.crm.noClientsFound}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                {search || statusFilter !== "all"
                  ? t.crm.adjustSearch
                  : t.crm.addFirstClient}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => handleOpenModal()} className="mt-6 gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t.crm.newClient}
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
                      {t.crm.clientName}
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead>{t.crm.primaryContact}</TableHead>
                  <TableHead>{t.crm.email}</TableHead>
                  <TableHead>{t.crm.status}</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-2">
                      {t.common.created}
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
                        {tenantStatusLabels[tenant.status][locale]}
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
                              {t.crm.view}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenModal(tenant)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t.crm.edit}
                          </DropdownMenuItem>
                          {tenant.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              {t.crm.archive}
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
                  {isES
                    ? `Mostrando ${(currentPage - 1) * ITEMS_PER_PAGE + 1} a ${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de ${totalCount} clientes`
                    : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount} clients`}
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
                    {isES ? `Página ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
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
        )}
      </Tabs>

      {/* Create/Edit Modal */}
      {!restrictedBrandScope && (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? t.crm.editClient : t.crm.newClient}
            </DialogTitle>
            <DialogDescription>
              {editingTenant
                ? isES
                  ? "Actualiza la información principal del cliente."
                  : "Update the client's main information."
                : isES
                  ? "Crea un nuevo cliente dentro del CRM."
                  : "Create a new client inside the CRM."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.crm.clientName} *</Label>
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
              <Label htmlFor="contact_name">{t.crm.primaryContact}</Label>
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
              <Label htmlFor="contact_email">{t.crm.email}</Label>
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
              <Label htmlFor="status">{t.crm.status}</Label>
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
                  <SelectItem value="lead">{tenantStatusLabels.lead[locale]}</SelectItem>
                  <SelectItem value="active">{tenantStatusLabels.active[locale]}</SelectItem>
                  <SelectItem value="paused">{tenantStatusLabels.paused[locale]}</SelectItem>
                  <SelectItem value="archived">{tenantStatusLabels.archived[locale]}</SelectItem>
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
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTenant ? t.crm.save : t.crm.createClient}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Lead Detail Modal */}
      <Dialog
        open={isLeadModalOpen}
        onOpenChange={(open) => {
          setIsLeadModalOpen(open);
          if (!open) {
            setIsEditingLead(false);
            setLeadSaveError("");
            setLeadSaveNotice("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedLead?.full_name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-primary">{selectedLead?.lead_code}</span>
                  {selectedLead && (
                    <Badge variant="secondary" className="text-xs">
                      {getLeadBrandProfile(selectedLead.brand).label}
                    </Badge>
                  )}
                  {selectedLead && (
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${leadStatusColors[selectedLead.status]}`}
                    >
                      {leadStatusLabels[selectedLead.status][locale]}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLead && (
            isEditingLead && leadDraft ? (
              <div className="space-y-6 mt-4">
                {leadSaveError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {leadSaveError}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead-full-name">{isES ? "Nombre completo" : "Full name"}</Label>
                    <Input
                      id="lead-full-name"
                      value={leadDraft.full_name}
                      onChange={(e) => handleLeadDraftChange("full_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-company-name">{t.crm.company}</Label>
                    <Input
                      id="lead-company-name"
                      value={leadDraft.company_name}
                      onChange={(e) => handleLeadDraftChange("company_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-email">Email</Label>
                    <Input
                      id="lead-email"
                      type="email"
                      value={leadDraft.email}
                      onChange={(e) => handleLeadDraftChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-whatsapp">WhatsApp</Label>
                    <Input
                      id="lead-whatsapp"
                      value={leadDraft.whatsapp}
                      onChange={(e) => handleLeadDraftChange("whatsapp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-city">{t.crm.city}</Label>
                    <Input
                      id="lead-city"
                      value={leadDraft.city}
                      onChange={(e) => handleLeadDraftChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-country">{t.crm.country}</Label>
                    <Input
                      id="lead-country"
                      value={leadDraft.country}
                      onChange={(e) => handleLeadDraftChange("country", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t.crm.status}</Label>
                    <Select
                      value={leadDraft.status}
                      onValueChange={(value) => handleLeadDraftChange("status", value as LeadStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["new_lead", "contacted", "qualified", "converted", "lost"] as LeadStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {leadStatusLabels[status][locale]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.projectType}</Label>
                    <Select
                      value={leadDraft.project_type || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("project_type", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona un tipo" : "Select a type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {projectTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.mainService}</Label>
                    <Select
                      value={leadDraft.main_service || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("main_service", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona un enfoque" : "Select a focus"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {mainServiceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.mainGoal}</Label>
                    <Select
                      value={leadDraft.main_goal || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("main_goal", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona un objetivo" : "Select a goal"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {mainGoalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.timeline}</Label>
                    <Select
                      value={leadDraft.timeline || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("timeline", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona un timeline" : "Select a timeline"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {timelineOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.budgetRange}</Label>
                    <Select
                      value={leadDraft.budget_range || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("budget_range", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona presupuesto" : "Select budget"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {budgetOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.crm.preferredContact}</Label>
                    <Select
                      value={leadDraft.preferred_contact_method || "__empty__"}
                      onValueChange={(value) => handleLeadDraftChange("preferred_contact_method", value === "__empty__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isES ? "Selecciona un canal" : "Select a channel"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">{isES ? "Sin definir" : "Not set"}</SelectItem>
                        {contactMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-organization-type">{t.crm.organizationType}</Label>
                    <Input
                      id="lead-organization-type"
                      value={leadDraft.organization_type}
                      onChange={(e) => handleLeadDraftChange("organization_type", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-expected-result">{t.crm.expectedResult}</Label>
                    <Input
                      id="lead-expected-result"
                      value={leadDraft.expected_result}
                      onChange={(e) => handleLeadDraftChange("expected_result", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-ideal-client">{t.crm.idealClient}</Label>
                    <Input
                      id="lead-ideal-client"
                      value={leadDraft.ideal_client}
                      onChange={(e) => handleLeadDraftChange("ideal_client", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-website">{t.crm.websiteUrl}</Label>
                    <Input
                      id="lead-website"
                      value={leadDraft.website_url}
                      onChange={(e) => handleLeadDraftChange("website_url", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lead-social-links">{t.crm.socialLinks}</Label>
                    <Input
                      id="lead-social-links"
                      value={leadDraft.social_links}
                      onChange={(e) => handleLeadDraftChange("social_links", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-project-description">{t.crm.projectDescription}</Label>
                  <textarea
                    id="lead-project-description"
                    value={leadDraft.project_description}
                    onChange={(e) => handleLeadDraftChange("project_description", e.target.value)}
                    className="min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-additional-notes">{t.crm.additionalNotes}</Label>
                  <textarea
                    id="lead-additional-notes"
                    value={leadDraft.additional_notes}
                    onChange={(e) => handleLeadDraftChange("additional_notes", e.target.value)}
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                  />
                </div>
              </div>
            ) : (
            <div className="space-y-6 mt-4">
              {leadSaveNotice && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {leadSaveNotice}
                </div>
              )}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Contact className="h-4 w-4" />
                  {isES ? "Información básica" : "Basic information"}
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.crm.name}</p>
                    <p className="font-medium">{selectedLead.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isES ? "Marca" : "Brand"}</p>
                    <p className="font-medium">{getLeadBrandProfile(selectedLead.brand).label}</p>
                  </div>
                  {selectedLead.company_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.company}</p>
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
                      <p className="text-xs text-muted-foreground">{t.crm.location}</p>
                      <p className="font-medium">{[selectedLead.city, selectedLead.country].filter(Boolean).join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {isES ? "Detalles del proyecto" : "Project details"}
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  {selectedLead.project_description && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.projectDescription}</p>
                      <p className="mt-1">{selectedLead.project_description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.organization_type && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.organizationType}</p>
                        <p className="font-medium">{selectedLead.organization_type}</p>
                      </div>
                    )}
                    {selectedLead.main_goal && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.mainGoal}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.main_goal, "main_goal")}</p>
                      </div>
                    )}
                    {selectedLead.expected_result && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.expectedResult}</p>
                        <p className="font-medium">{selectedLead.expected_result}</p>
                      </div>
                    )}
                    {selectedLead.main_service && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.mainService}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.main_service, "main_service")}</p>
                      </div>
                    )}
                    {selectedLead.ideal_client && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.idealClient}</p>
                        <p className="font-medium">{selectedLead.ideal_client}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.website_url && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.websiteUrl}</p>
                      <a href={selectedLead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {selectedLead.website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {selectedLead.social_links && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.socialLinks}</p>
                      <p className="font-medium">{selectedLead.social_links}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {isES ? "Branding" : "Branding"}
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.hasLogo}</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_logo ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_logo ? t.crm.yes : t.crm.no}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.hasBrandColors}</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_brand_colors ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_brand_colors ? t.crm.yes : t.crm.no}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.crm.hasCurrentLanding}</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedLead.has_current_landing ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                        {selectedLead.has_current_landing ? t.crm.yes : t.crm.no}
                      </p>
                    </div>
                    {selectedLead.visual_style && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.visualStyle}</p>
                        <p className="font-medium">{selectedLead.visual_style}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.available_content && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">{t.crm.availableContent}</p>
                      <p className="font-medium">{selectedLead.available_content}</p>
                    </div>
                  )}
                  {selectedLead.reference_websites && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">{t.crm.referenceWebsites}</p>
                      <p className="font-medium">{selectedLead.reference_websites}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {isES ? "Alcance del proyecto" : "Project scope"}
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.project_type && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.projectType}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.project_type, "project_type")}</p>
                      </div>
                    )}
                    {selectedLead.budget_range && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.budgetRange}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.budget_range, "budget_range")}</p>
                      </div>
                    )}
                    {selectedLead.timeline && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.timeline}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.timeline, "timeline")}</p>
                      </div>
                    )}
                    {selectedLead.preferred_contact_method && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.crm.preferredContact}</p>
                        <p className="font-medium">{formatLeadValue(selectedLead.preferred_contact_method, "preferred_contact_method")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedLead.additional_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t.crm.additionalNotes}
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p>{selectedLead.additional_notes}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-right">
                {isES ? `Recibido el ${formatDate(selectedLead.created_at)}` : `Received on ${formatDate(selectedLead.created_at)}`}
              </div>
            </div>
            )
          )}

          <DialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="gap-2 sm:mr-auto"
              onClick={() => selectedLead && setDeleteConfirmLead(selectedLead)}
              disabled={deletingLeadId === selectedLead?.id || leadSaving}
            >
              {deletingLeadId === selectedLead?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isES ? "Eliminar lead" : "Delete lead"}
            </Button>
            {selectedLead?.whatsapp && (
              <Button asChild variant="outline" className="gap-2">
                <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4" />
                  {isES ? "Contactar por WhatsApp" : "Contact via WhatsApp"}
                </a>
              </Button>
            )}
            {isEditingLead ? (
              <>
                <Button variant="outline" onClick={handleCancelLeadEdit} disabled={leadSaving}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleSaveLead} disabled={leadSaving || !leadDraft?.full_name.trim()}>
                  {leadSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isES ? "Guardando" : "Saving"}
                    </>
                  ) : (
                    isES ? "Guardar cambios" : "Save changes"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleStartLeadEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {isES ? "Editar lead" : "Edit lead"}
                </Button>
                <Button onClick={() => setIsLeadModalOpen(false)}>
                  {t.crm.close}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteConfirmLead} onOpenChange={(open) => !open && setDeleteConfirmLead(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{isES ? "Eliminar lead" : "Delete lead"}</DialogTitle>
            <DialogDescription>
              {isES
                ? "Esta acción es permanente y no se puede deshacer. Se eliminará el lead "
                : "This action is permanent and cannot be undone. The lead "}
              <span className="font-semibold text-foreground">{deleteConfirmLead?.full_name}</span>{" "}
              ({deleteConfirmLead?.lead_code})
              {isES ? " por completo." : " will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmLead(null)}
              disabled={!!deletingLeadId}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deleteConfirmLead && handleDeleteLead(deleteConfirmLead)}
              disabled={!!deletingLeadId}
            >
              {deletingLeadId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isES ? "Sí, eliminar" : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
