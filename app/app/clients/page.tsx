"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Search,
  Eye,
  BookOpen,
  UserCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface PortalClient {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  org_id?: string | null;
  role?: string | null;
  projects_count: number;
  created_at: string | null;
  updated_at?: string | null;
  last_project?: string | null;
  last_project_stage?: string | null;
  last_project_status?: string | null;
}

const ITEMS_PER_PAGE = 10;

const STAGE_LABELS: Record<string, string> = {
  ingesta: "Ingesta",
  estructura: "Estructura",
  estilo: "Estilo",
  ortotipografia: "Ortotipograf\u00eda",
  maquetacion: "Maquetaci\u00f3n",
  revision_final: "Revisi\u00f3n Final",
  export: "Exportación",
  distribution: "Distribuci\u00f3n",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [source, setSource] = useState<string>("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/portal-clients");
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error al obtener clientes");
        setClients([]);
      } else {
        setClients(data.clients ?? []);
        setSource(data.source ?? "");
      }
    } catch {
      setError("Error de conexi\u00f3n al servidor");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (client.full_name ?? "").toLowerCase().includes(q) ||
      (client.email ?? "").toLowerCase().includes(q) ||
      (client.id ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: clients.length,
    withProjects: clients.filter((c) => c.projects_count > 0).length,
    totalProjects: clients.reduce((sum, c) => sum + c.projects_count, 0),
    recentWeek: clients.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Sin actividad";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return "hace " + diffMins + "m";
    if (diffHours < 24) return "hace " + diffHours + "h";
    if (diffDays < 7) return "hace " + diffDays + "d";
    return date.toLocaleDateString("es-ES");
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) return email[0].toUpperCase();
    return "??";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Portal Clientes
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Clientes Registrados
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Clientes registrados en el portal editorial de Reino Editorial.
            {source === "projects" && (
              <span className="text-xs ml-2 text-amber-400">(datos desde proyectos)</span>
            )}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Total Clientes
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.withProjects}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Con Proyectos
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.totalProjects}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Proyectos Totales
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserPlus className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.recentWeek}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Nuevos (7d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card/30 border-border/40">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-red-400 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : paginatedClients.length === 0 && !error ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">
              {clients.length === 0 ? "Sin clientes registrados" : "Sin resultados"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {clients.length === 0
                ? "A\u00fan no hay clientes registrados en el portal editorial."
                : "Ajusta tu b\u00fasqueda para encontrar el cliente."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-muted-foreground font-medium">Cliente</TableHead>
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium">Rol</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Proyectos</TableHead>
                <TableHead className="text-muted-foreground font-medium">Registro</TableHead>
                <TableHead className="text-muted-foreground font-medium">{"\u00da"}ltima Actividad</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-muted/20 border-border/30 transition-colors group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarFallback className="text-xs bg-muted/30">
                          {getInitials(client.full_name, client.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {client.full_name ?? "Sin nombre"}
                        </p>
                        {client.last_project && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {client.last_project}
                            {client.last_project_stage && (
                              <span className="ml-1 text-cyan-400">
                                ({STAGE_LABELS[client.last_project_stage] ?? client.last_project_stage})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {client.email ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border/50 bg-background/30 text-xs capitalize"
                    >
                      {client.role ?? "cliente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground font-medium">{client.projects_count}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(client.updated_at ?? client.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={"/app/clients/" + client.id}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de{" "}
                {filteredClients.length} clientes
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
                  P{"\u00e1"}gina {currentPage} de {totalPages}
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
