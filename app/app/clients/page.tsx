"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  FolderPlus,
  Globe,
  FileText,
  Briefcase,
  Building2,
  Upload,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type ClientStatus = "active" | "prospect" | "onboarding" | "paused" | "archived";

interface Client {
  id: string;
  name: string;
  company: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  status: ClientStatus;
  created_at: string;
  business_unit: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
  projects_count: number;
  websites_count: number;
  deals_count: number;
  total_revenue: number;
  last_activity: string | null;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgClass: string }> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
  },
  prospect: {
    label: "Prospect",
    color: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/30",
  },
  onboarding: {
    label: "Onboarding",
    color: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
  },
  paused: {
    label: "Paused",
    color: "text-orange-400",
    bgClass: "bg-orange-500/10 border-orange-500/30",
  },
  archived: {
    label: "Archived",
    color: "text-zinc-400",
    bgClass: "bg-zinc-500/10 border-zinc-500/30",
  },
};

const ITEMS_PER_PAGE = 10;

// Mock data for demonstration
const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "TechCorp Solutions",
    company: "TechCorp Inc.",
    primary_contact_name: "John Smith",
    primary_contact_email: "john@techcorp.com",
    status: "active",
    created_at: "2024-01-15T10:00:00Z",
    business_unit: "Enterprise",
    owner_name: "Sarah Johnson",
    owner_avatar: null,
    projects_count: 5,
    websites_count: 3,
    deals_count: 2,
    total_revenue: 125000,
    last_activity: "2024-03-05T14:30:00Z",
  },
  {
    id: "2",
    name: "GreenLeaf Marketing",
    company: "GreenLeaf LLC",
    primary_contact_name: "Emma Wilson",
    primary_contact_email: "emma@greenleaf.co",
    status: "active",
    created_at: "2024-02-20T09:00:00Z",
    business_unit: "SMB",
    owner_name: "Michael Chen",
    owner_avatar: null,
    projects_count: 3,
    websites_count: 2,
    deals_count: 1,
    total_revenue: 45000,
    last_activity: "2024-03-04T11:20:00Z",
  },
  {
    id: "3",
    name: "Stellar Brands",
    company: "Stellar Group",
    primary_contact_name: "David Brown",
    primary_contact_email: "david@stellar.com",
    status: "prospect",
    created_at: "2024-03-01T15:00:00Z",
    business_unit: "Enterprise",
    owner_name: "Sarah Johnson",
    owner_avatar: null,
    projects_count: 0,
    websites_count: 0,
    deals_count: 1,
    total_revenue: 0,
    last_activity: "2024-03-03T16:45:00Z",
  },
  {
    id: "4",
    name: "Horizon Ventures",
    company: "Horizon Capital",
    primary_contact_name: "Lisa Park",
    primary_contact_email: "lisa@horizonvc.com",
    status: "onboarding",
    created_at: "2024-02-28T12:00:00Z",
    business_unit: "Enterprise",
    owner_name: "Alex Rivera",
    owner_avatar: null,
    projects_count: 1,
    websites_count: 0,
    deals_count: 1,
    total_revenue: 75000,
    last_activity: "2024-03-05T09:15:00Z",
  },
  {
    id: "5",
    name: "Urban Eats",
    company: "Urban Foods Inc.",
    primary_contact_name: "Carlos Martinez",
    primary_contact_email: "carlos@urbaneats.com",
    status: "active",
    created_at: "2023-11-10T08:00:00Z",
    business_unit: "SMB",
    owner_name: "Michael Chen",
    owner_avatar: null,
    projects_count: 4,
    websites_count: 2,
    deals_count: 3,
    total_revenue: 89000,
    last_activity: "2024-03-02T17:00:00Z",
  },
  {
    id: "6",
    name: "Apex Fitness",
    company: "Apex Health Corp",
    primary_contact_name: "Jennifer Lee",
    primary_contact_email: "jen@apexfitness.com",
    status: "paused",
    created_at: "2023-09-05T14:00:00Z",
    business_unit: "SMB",
    owner_name: "Sarah Johnson",
    owner_avatar: null,
    projects_count: 2,
    websites_count: 1,
    deals_count: 0,
    total_revenue: 32000,
    last_activity: "2024-01-15T10:30:00Z",
  },
  {
    id: "7",
    name: "Nova Digital",
    company: "Nova Media Group",
    primary_contact_name: "Robert Kim",
    primary_contact_email: "robert@novadigital.io",
    status: "active",
    created_at: "2024-01-08T11:00:00Z",
    business_unit: "Agency",
    owner_name: "Alex Rivera",
    owner_avatar: null,
    projects_count: 8,
    websites_count: 6,
    deals_count: 4,
    total_revenue: 210000,
    last_activity: "2024-03-05T16:00:00Z",
  },
  {
    id: "8",
    name: "Coastal Realty",
    company: "Coastal Properties LLC",
    primary_contact_name: "Amanda Foster",
    primary_contact_email: "amanda@coastalrealty.com",
    status: "prospect",
    created_at: "2024-03-04T10:00:00Z",
    business_unit: "SMB",
    owner_name: "Michael Chen",
    owner_avatar: null,
    projects_count: 0,
    websites_count: 0,
    deals_count: 1,
    total_revenue: 0,
    last_activity: "2024-03-05T11:00:00Z",
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    // Simulate API call - in production, this would fetch from Supabase
    await new Promise((resolve) => setTimeout(resolve, 500));
    setClients(MOCK_CLIENTS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      search === "" ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.company?.toLowerCase().includes(search.toLowerCase()) ||
      client.primary_contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesBusinessUnit =
      businessUnitFilter === "all" || client.business_unit === businessUnitFilter;
    const matchesOwner = ownerFilter === "all" || client.owner_name === ownerFilter;
    return matchesSearch && matchesStatus && matchesBusinessUnit && matchesOwner;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    prospects: clients.filter((c) => c.status === "prospect").length,
    onboarding: clients.filter((c) => c.status === "onboarding").length,
    needsAttention: clients.filter(
      (c) => c.status === "paused" || (c.last_activity && new Date(c.last_activity) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    ).length,
  };

  // Get unique values for filters
  const businessUnits = [...new Set(clients.map((c) => c.business_unit).filter(Boolean))] as string[];
  const owners = [...new Set(clients.map((c) => c.owner_name).filter(Boolean))] as string[];

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

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
            Client Operating System
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage client relationships, projects, deals, and all related operations from one command center.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>
      </div>

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
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer">
              <UserPlus className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">New Client</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-200 cursor-pointer">
              <Briefcase className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Create Deal</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200 cursor-pointer">
              <FolderPlus className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">New Project</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer">
              <Globe className="h-5 w-5 text-foreground/80" />
              <span className="text-xs font-medium text-foreground/90">Create Website</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Total Clients
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.prospects}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Prospects
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.onboarding}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Onboarding
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.needsAttention}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Needs Attention
            </p>
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
                placeholder="Search clients, companies, contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | "all")}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Data Table */}
      {loading ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : paginatedClients.length === 0 ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">No clients found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {clients.length === 0
                ? "Get started by adding your first client to the operating system"
                : "Try adjusting your filters to find what you're looking for"}
            </p>
            {clients.length === 0 && (
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Business Unit</TableHead>
                <TableHead className="text-muted-foreground font-medium">Owner</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Projects</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Websites</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Deals</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Revenue</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Last Activity</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => {
                const statusConfig = STATUS_CONFIG[client.status];
                return (
                  <TableRow
                    key={client.id}
                    className="hover:bg-muted/20 border-border/30 transition-colors group"
                  >
                    <TableCell>
                      <Link
                        href={`/app/clients/${client.id}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <Avatar className="h-9 w-9 border border-border/50">
                          <AvatarFallback className="text-xs bg-muted/30">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.company}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {client.business_unit ? (
                        <Badge variant="outline" className="border-border/50 bg-background/30 text-xs">
                          {client.business_unit}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.owner_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={client.owner_avatar || undefined} />
                            <AvatarFallback className="text-[10px] bg-muted/30">
                              {getInitials(client.owner_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{client.owner_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-foreground font-medium">{client.projects_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-foreground font-medium">{client.websites_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-foreground font-medium">{client.deals_count}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-foreground font-medium">
                        {formatCurrency(client.total_revenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig.bgClass} ${statusConfig.color} border`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(client.last_activity)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/app/clients/${client.id}`}>
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
                              <Link href={`/app/clients/${client.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Client
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Create Project
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Globe className="h-4 w-4 mr-2" />
                              Create Website
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Briefcase className="h-4 w-4 mr-2" />
                              Create Deal
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <FileText className="h-4 w-4 mr-2" />
                              View Documents
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} of{" "}
                {filteredClients.length} clients
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
                <span className="text-sm text-muted-foreground">
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
        </Card>
      )}
    </div>
  );
}
