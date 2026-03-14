"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  ArrowUpDown,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";

interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  activeProjects: number;
  completedProjects: number;
  totalSpent: number;
  lastActivity: string;
  status: "active" | "inactive" | "prospect";
  tags: string[];
}

interface CrmEnhancedViewProps {
  clients: ClientRecord[];
  companySlug: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Activo", color: "bg-emerald-500/10 text-emerald-600" },
  inactive: { label: "Inactivo", color: "bg-muted text-muted-foreground" },
  prospect: { label: "Prospecto", color: "bg-blue-500/10 text-blue-600" },
};

export function CrmEnhancedView({ clients, companySlug }: CrmEnhancedViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "lastActivity" | "totalSpent">("lastActivity");

  const filteredClients = clients
    .filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "totalSpent") return b.totalSpent - a.totalSpent;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

  const totalActive = clients.filter((c) => c.status === "active").length;
  const totalProspects = clients.filter((c) => c.status === "prospect").length;

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-4">
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-muted-foreground">Total clientes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-4">
            <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-4">
            <p className="text-2xl font-bold text-blue-600">{totalProspects}</p>
            <p className="text-xs text-muted-foreground">Prospectos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </CardTitle>
            <Button size="sm" className="gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1">
              {["all", "active", "inactive", "prospect"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "Todos" : STATUS_LABELS[status]?.label ?? status}
                </Button>
              ))}
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-1.5">
            {filteredClients.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No se encontraron clientes.</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const statusInfo = STATUS_LABELS[client.status];
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium">{client.activeProjects} activos</p>
                        <p className="text-[10px] text-muted-foreground">${client.totalSpent.toLocaleString()}</p>
                      </div>
                      <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
                        {statusInfo?.label ?? client.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
