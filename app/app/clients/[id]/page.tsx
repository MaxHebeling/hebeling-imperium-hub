"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  FolderPlus,
  Globe,
  FileText,
  Briefcase,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Settings,
  CreditCard,
  Activity,
  MessageSquare,
  Plus,
  Download,
  Send,
  Trash2,
  Star,
  StarOff,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Rocket,
  FileCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Handshake,
  Flag,
  Upload,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  Archive,
  Link2,
} from "lucide-react";
import Link from "next/link";

type ClientStatus = "active" | "prospect" | "onboarding" | "paused" | "archived";
type DealStage = "discovery" | "proposal" | "negotiation" | "won" | "lost";
type ProjectStatus = "planning" | "in_progress" | "review" | "completed" | "blocked";
type WebsiteStatus = "draft" | "building" | "live" | "paused" | "archived";
type DocumentStatus = "draft" | "in_review" | "approved" | "sent";
type InvoiceStatus = "paid" | "pending" | "overdue" | "canceled";
type ContactStatus = "active" | "inactive" | "archived";

interface Client {
  id: string;
  name: string;
  company: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  phone: string | null;
  website: string | null;
  status: ClientStatus;
  created_at: string;
  business_unit: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
  tags: string[];
  notes: string | null;
}

interface Deal {
  id: string;
  name: string;
  stage: DealStage;
  value: number;
  owner_name: string;
  created_at: string;
  status: "active" | "inactive";
}

interface Project {
  id: string;
  name: string;
  type: string;
  owner_name: string;
  status: ProjectStatus;
  progress: number;
  start_date: string;
  due_date: string;
}

interface Website {
  id: string;
  name: string;
  domain: string | null;
  environment: string;
  status: WebsiteStatus;
  last_deploy: string | null;
  owner_name: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  created_at: string;
  owner_name: string;
}

interface Invoice {
  id: string;
  invoice_id: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  payment_method: string | null;
}

interface ActivityItem {
  id: string;
  type: "deal" | "project" | "website" | "document" | "invoice" | "form" | "status";
  description: string;
  user_name: string;
  user_avatar: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  is_primary: boolean;
  status: ContactStatus;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgClass: string }> = {
  active: { label: "Active", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  prospect: { label: "Prospect", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  onboarding: { label: "Onboarding", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  paused: { label: "Paused", color: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/30" },
  archived: { label: "Archived", color: "text-zinc-400", bgClass: "bg-zinc-500/10 border-zinc-500/30" },
};

const DEAL_STAGE_CONFIG: Record<DealStage, { label: string; color: string; bgClass: string }> = {
  discovery: { label: "Discovery", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  proposal: { label: "Proposal", color: "text-purple-400", bgClass: "bg-purple-500/10 border-purple-500/30" },
  negotiation: { label: "Negotiation", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  won: { label: "Won", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  lost: { label: "Lost", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30" },
};

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgClass: string }> = {
  planning: { label: "Planning", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  in_progress: { label: "In Progress", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  review: { label: "Review", color: "text-purple-400", bgClass: "bg-purple-500/10 border-purple-500/30" },
  completed: { label: "Completed", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  blocked: { label: "Blocked", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30" },
};

const WEBSITE_STATUS_CONFIG: Record<WebsiteStatus, { label: string; color: string; bgClass: string }> = {
  draft: { label: "Draft", color: "text-zinc-400", bgClass: "bg-zinc-500/10 border-zinc-500/30" },
  building: { label: "Building", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  live: { label: "Live", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  paused: { label: "Paused", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  archived: { label: "Archived", color: "text-zinc-400", bgClass: "bg-zinc-500/10 border-zinc-500/30" },
};

const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgClass: string }> = {
  draft: { label: "Draft", color: "text-zinc-400", bgClass: "bg-zinc-500/10 border-zinc-500/30" },
  in_review: { label: "In Review", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  approved: { label: "Approved", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  sent: { label: "Sent", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
};

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgClass: string }> = {
  paid: { label: "Paid", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30" },
  pending: { label: "Pending", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30" },
  overdue: { label: "Overdue", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30" },
  canceled: { label: "Canceled", color: "text-zinc-400", bgClass: "bg-zinc-500/10 border-zinc-500/30" },
};

// Mock data
const MOCK_CLIENT: Client = {
  id: "1",
  name: "TechCorp Solutions",
  company: "TechCorp Inc.",
  primary_contact_name: "John Smith",
  primary_contact_email: "john@techcorp.com",
  phone: "+1 (555) 123-4567",
  website: "https://techcorp.com",
  status: "active",
  created_at: "2024-01-15T10:00:00Z",
  business_unit: "Enterprise",
  owner_name: "Sarah Johnson",
  owner_avatar: null,
  tags: ["Enterprise", "Tech", "Priority"],
  notes: "Key enterprise client with multiple ongoing projects. Focus on website redesign and marketing automation.",
};

const MOCK_DEALS: Deal[] = [
  { id: "1", name: "Website Redesign Project", stage: "won", value: 75000, owner_name: "Sarah Johnson", created_at: "2024-01-20T10:00:00Z", status: "active" },
  { id: "2", name: "Marketing Automation Setup", stage: "proposal", value: 25000, owner_name: "Michael Chen", created_at: "2024-02-15T10:00:00Z", status: "active" },
  { id: "3", name: "Mobile App Development", stage: "discovery", value: 150000, owner_name: "Sarah Johnson", created_at: "2024-03-01T10:00:00Z", status: "active" },
];

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "Corporate Website Redesign", type: "Website", owner_name: "Alex Rivera", status: "in_progress", progress: 65, start_date: "2024-02-01T10:00:00Z", due_date: "2024-04-15T10:00:00Z" },
  { id: "2", name: "SEO Optimization Campaign", type: "Campaign", owner_name: "Sarah Johnson", status: "review", progress: 90, start_date: "2024-01-15T10:00:00Z", due_date: "2024-03-01T10:00:00Z" },
  { id: "3", name: "Brand Guidelines Update", type: "Audit", owner_name: "Michael Chen", status: "planning", progress: 15, start_date: "2024-03-10T10:00:00Z", due_date: "2024-04-30T10:00:00Z" },
  { id: "4", name: "Email Marketing Setup", type: "Campaign", owner_name: "Alex Rivera", status: "completed", progress: 100, start_date: "2023-11-01T10:00:00Z", due_date: "2023-12-15T10:00:00Z" },
];

const MOCK_WEBSITES: Website[] = [
  { id: "1", name: "TechCorp Main Website", domain: "techcorp.com", environment: "production", status: "live", last_deploy: "2024-03-05T14:30:00Z", owner_name: "Alex Rivera" },
  { id: "2", name: "TechCorp Blog", domain: "blog.techcorp.com", environment: "production", status: "live", last_deploy: "2024-03-04T11:00:00Z", owner_name: "Sarah Johnson" },
  { id: "3", name: "New Landing Page", domain: null, environment: "staging", status: "building", last_deploy: null, owner_name: "Alex Rivera" },
];

const MOCK_DOCUMENTS: Document[] = [
  { id: "1", name: "Website Redesign Proposal", type: "Proposal", status: "approved", created_at: "2024-01-18T10:00:00Z", owner_name: "Sarah Johnson" },
  { id: "2", name: "Service Agreement 2024", type: "Contract", status: "sent", created_at: "2024-01-22T10:00:00Z", owner_name: "Sarah Johnson" },
  { id: "3", name: "Project Brief - Mobile App", type: "Brief", status: "draft", created_at: "2024-03-02T10:00:00Z", owner_name: "Michael Chen" },
  { id: "4", name: "Q1 Performance Report", type: "PDF Export", status: "approved", created_at: "2024-03-01T10:00:00Z", owner_name: "Alex Rivera" },
];

const MOCK_INVOICES: Invoice[] = [
  { id: "1", invoice_id: "INV-2024-001", amount: 25000, status: "paid", due_date: "2024-02-15T10:00:00Z", payment_method: "Visa ending in 4242" },
  { id: "2", invoice_id: "INV-2024-002", amount: 25000, status: "paid", due_date: "2024-03-15T10:00:00Z", payment_method: "Visa ending in 4242" },
  { id: "3", invoice_id: "INV-2024-003", amount: 25000, status: "pending", due_date: "2024-04-15T10:00:00Z", payment_method: null },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: "1", type: "website", description: "Website deployed to production", user_name: "Alex Rivera", user_avatar: null, created_at: "2024-03-05T14:30:00Z" },
  { id: "2", type: "deal", description: "New deal created: Mobile App Development", user_name: "Sarah Johnson", user_avatar: null, created_at: "2024-03-01T10:00:00Z" },
  { id: "3", type: "invoice", description: "Invoice INV-2024-002 marked as paid", user_name: "System", user_avatar: null, created_at: "2024-03-15T09:00:00Z" },
  { id: "4", type: "document", description: "Document uploaded: Project Brief - Mobile App", user_name: "Michael Chen", user_avatar: null, created_at: "2024-03-02T10:00:00Z" },
  { id: "5", type: "project", description: "Project 'SEO Optimization Campaign' moved to Review", user_name: "Sarah Johnson", user_avatar: null, created_at: "2024-02-28T16:00:00Z" },
  { id: "6", type: "form", description: "Contact form submission received", user_name: "System", user_avatar: null, created_at: "2024-02-25T11:30:00Z" },
  { id: "7", type: "status", description: "Client status changed to Active", user_name: "Sarah Johnson", user_avatar: null, created_at: "2024-01-20T10:00:00Z" },
];

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "John Smith", role: "CEO", email: "john@techcorp.com", phone: "+1 (555) 123-4567", is_primary: true, status: "active" },
  { id: "2", name: "Emily Davis", role: "Marketing Director", email: "emily@techcorp.com", phone: "+1 (555) 234-5678", is_primary: false, status: "active" },
  { id: "3", name: "Robert Wilson", role: "CTO", email: "robert@techcorp.com", phone: "+1 (555) 345-6789", is_primary: false, status: "active" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      setLoading(true);
    }, 0);

    const timer = window.setTimeout(() => {
      setClient(MOCK_CLIENT);
      setDeals(MOCK_DEALS);
      setProjects(MOCK_PROJECTS);
      setWebsites(MOCK_WEBSITES);
      setDocuments(MOCK_DOCUMENTS);
      setInvoices(MOCK_INVOICES);
      setActivities(MOCK_ACTIVITIES);
      setContacts(MOCK_CONTACTS);
      setLoading(false);
    }, 500);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(timer);
    };
  }, [clientId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "deal": return <Handshake className="h-4 w-4 text-purple-400" />;
      case "project": return <Rocket className="h-4 w-4 text-blue-400" />;
      case "website": return <Globe className="h-4 w-4 text-cyan-400" />;
      case "document": return <FileText className="h-4 w-4 text-amber-400" />;
      case "invoice": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "form": return <MessageSquare className="h-4 w-4 text-pink-400" />;
      case "status": return <Flag className="h-4 w-4 text-orange-400" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const outstandingAmount = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Client not found</h3>
        <p className="text-sm text-muted-foreground mb-4">The client you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/app/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[client.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <ChevronRight className="h-4 w-4" />
        {client.business_unit && (
          <>
            <span>{client.business_unit}</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground">{client.name}</span>
      </div>

      {/* Premium Header Card */}
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-border/50">
                <AvatarFallback className="text-xl bg-muted/30">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                  <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{client.company}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {client.primary_contact_email && (
                    <a href={`mailto:${client.primary_contact_email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="h-4 w-4" />
                      {client.primary_contact_email}
                    </a>
                  )}
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </a>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                      <Globe className="h-4 w-4" />
                      {client.website.replace("https://", "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-muted/30 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Project
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" />
                New Deal
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                Create Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/40 border border-border/40 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-2 data-[state=active]:bg-background">
            <Briefcase className="h-4 w-4" />
            Deals
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{deals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-background">
            <FolderPlus className="h-4 w-4" />
            Projects
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{projects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="websites" className="gap-2 data-[state=active]:bg-background">
            <Globe className="h-4 w-4" />
            Websites
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{websites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            Documents
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{documents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-background">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            Contacts
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{contacts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderPlus className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-muted-foreground">Active Projects</span>
                    </div>
                    <p className="text-2xl font-bold">{projects.filter((p) => p.status !== "completed").length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs text-muted-foreground">Websites</span>
                    </div>
                    <p className="text-2xl font-bold">{websites.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      <span className="text-xs text-muted-foreground">Open Deals</span>
                    </div>
                    <p className="text-2xl font-bold">{deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-muted-foreground">Documents</span>
                    </div>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-muted-foreground">Outstanding</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(outstandingAmount)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {client.notes && (
                <Card className="bg-card/40 border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{client.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("activity")}>
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user_name} · {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Summary */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Client Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Client Since</span>
                    <span className="text-sm text-foreground">{formatDate(client.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Business Unit</span>
                    <span className="text-sm text-foreground">{client.business_unit || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Manager</span>
                    <span className="text-sm text-foreground">{client.owner_name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-sm text-emerald-400 font-medium">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Projects</span>
                    <span className="text-sm text-foreground">{projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Websites</span>
                    <span className="text-sm text-foreground">{websites.filter((w) => w.status === "live").length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Contact */}
              {contacts.find((c) => c.is_primary) && (
                <Card className="bg-card/40 border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      Primary Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const primary = contacts.find((c) => c.is_primary)!;
                      return (
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm bg-muted/30">
                              {getInitials(primary.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{primary.name}</p>
                            <p className="text-sm text-muted-foreground">{primary.role}</p>
                            <a href={`mailto:${primary.email}`} className="text-sm text-cyan-400 hover:underline">
                              {primary.email}
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Deals</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </div>
          {deals.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No deals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first deal for this client</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Deal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Deal Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Stage</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Value</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => {
                    const stageConfig = DEAL_STAGE_CONFIG[deal.stage];
                    return (
                      <TableRow key={deal.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/app/deals/${deal.id}`} className="hover:text-primary transition-colors">
                            {deal.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${stageConfig.bgClass} ${stageConfig.color} border`}>
                            {stageConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(deal.value)}</TableCell>
                        <TableCell className="text-muted-foreground">{deal.owner_name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(deal.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Deal</DropdownMenuItem>
                                <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" />Edit Deal</DropdownMenuItem>
                                <DropdownMenuItem><ArrowRight className="h-4 w-4 mr-2" />Advance Stage</DropdownMenuItem>
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
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
          {projects.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderPlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start a new project for this client</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Project Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Progress</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const statusConfig = PROJECT_STATUS_CONFIG[project.status];
                    const isOverdue = new Date(project.due_date) < new Date() && project.status !== "completed";
                    return (
                      <TableRow key={project.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/app/projects/${project.id}`} className="hover:text-primary transition-colors">
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/50 bg-background/30 text-xs">
                            {project.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{project.owner_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-32">
                            <Progress value={project.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-400" : "text-muted-foreground"}>
                          {formatDate(project.due_date)}
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Project</DropdownMenuItem>
                                <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem><CheckCircle2 className="h-4 w-4 mr-2" />Open Tasks</DropdownMenuItem>
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
        </TabsContent>

        {/* Websites Tab */}
        <TabsContent value="websites" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Websites</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Website
            </Button>
          </div>
          {websites.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No websites yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create a website for this client</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Website
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Website Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Domain</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Environment</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Last Deploy</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {websites.map((website) => {
                    const statusConfig = WEBSITE_STATUS_CONFIG[website.status];
                    return (
                      <TableRow key={website.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/app/websites/${website.id}`} className="hover:text-primary transition-colors">
                            {website.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {website.domain ? (
                            <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                              {website.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/50 bg-background/30 text-xs capitalize">
                            {website.environment}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(website.last_deploy)}</TableCell>
                        <TableCell className="text-muted-foreground">{website.owner_name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {website.domain && (
                                  <DropdownMenuItem asChild>
                                    <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2" />Open Website
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem><Rocket className="h-4 w-4 mr-2" />View Deployments</DropdownMenuItem>
                                <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" />Edit Website</DropdownMenuItem>
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
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <Button size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
          
          {/* Upload Area */}
          <Card className="bg-card/30 border-border/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
            </CardContent>
          </Card>

          {documents.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload your first document</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Document Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const statusConfig = DOCUMENT_STATUS_CONFIG[doc.status];
                    return (
                      <TableRow key={doc.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-medium text-foreground">{doc.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/50 bg-background/30 text-xs">
                            {doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatRelativeTime(doc.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.owner_name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                                <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                                <DropdownMenuItem><Send className="h-4 w-4 mr-2" />Send</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                </div>
                <p className="text-3xl font-bold text-amber-400">{formatCurrency(outstandingAmount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-muted-foreground">Subscription</span>
                </div>
                <p className="text-xl font-bold text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Renews Apr 15, 2024</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Invoices</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
          {invoices.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No invoices yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first invoice</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Invoice ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Payment Method</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusConfig = INVOICE_STATUS_CONFIG[invoice.status];
                    const isOverdue = invoice.status === "overdue" || (invoice.status === "pending" && new Date(invoice.due_date) < new Date());
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                        <TableCell className="font-medium text-foreground">{invoice.invoice_id}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-400" : "text-muted-foreground"}>
                          {formatDate(invoice.due_date)}
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{invoice.payment_method || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Invoice</DropdownMenuItem>
                                <DropdownMenuItem><Send className="h-4 w-4 mr-2" />Send Reminder</DropdownMenuItem>
                                <DropdownMenuItem><CheckCircle2 className="h-4 w-4 mr-2" />Record Payment</DropdownMenuItem>
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
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="deal">Deals</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="website">Websites</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="invoice">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-6">
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px flex-1 bg-border/40 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-muted/30">
                            {getInitials(activity.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{activity.user_name}</span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{formatRelativeTime(activity.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contacts</h2>
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Contact</DialogTitle>
                  <DialogDescription>Add a new contact for this client.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Full name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" placeholder="e.g. CEO, Marketing Director" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsAddContactOpen(false)}>Add Contact</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {contacts.length === 0 ? (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No contacts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your first contact</p>
                <Button className="gap-2" onClick={() => setIsAddContactOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Primary</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-muted/20 border-border/30 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted/30">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{contact.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a href={`mailto:${contact.email}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                            {contact.email}
                          </a>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => navigator.clipboard.writeText(contact.email)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.is_primary ? (
                          <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              {!contact.is_primary && (
                                <DropdownMenuItem><Star className="h-4 w-4 mr-2" />Set as Primary</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-medium">Basic Information</CardTitle>
                <CardDescription>Update the client&apos;s basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input id="client-name" defaultValue={client.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue={client.company || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business-unit">Business Unit</Label>
                  <Select defaultValue={client.business_unit || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="SMB">SMB</SelectItem>
                      <SelectItem value="Agency">Agency</SelectItem>
                      <SelectItem value="Startup">Startup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={client.primary_contact_email || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={client.phone || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue={client.website || ""} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Ownership */}
            <div className="space-y-6">
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Ownership</CardTitle>
                  <CardDescription>Manage account ownership and assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="owner">Account Owner</Label>
                    <Select defaultValue={client.owner_name || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                        <SelectItem value="Alex Rivera">Alex Rivera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={client.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Update Ownership</Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-card/40 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-red-400">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/20">
                    <div>
                      <p className="font-medium text-foreground">Archive Client</p>
                      <p className="text-sm text-muted-foreground">Hide this client from active lists</p>
                    </div>
                    <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                    <div>
                      <p className="font-medium text-foreground">Delete Client</p>
                      <p className="text-sm text-muted-foreground">Permanently delete this client and all data</p>
                    </div>
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
