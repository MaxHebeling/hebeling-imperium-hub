"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Globe,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Code2,
  Palette,
  Rocket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WebProject, WebProjectStatus, WebServiceType } from "@/lib/ikingdom/types/web-project";
import { WEB_STAGE_LABELS, WEB_SERVICE_TYPE_LABELS } from "@/lib/ikingdom/pipeline/constants";
import type { WebStageKey } from "@/lib/ikingdom/types/web-project";

/* ── Palette ── */
const P = {
  bg: "#0a0a0a",
  surface: "#141414",
  surface2: "#1c1c1c",
  surface3: "#252525",
  border: "#2a2a2a",
  text: "#f0f0f0",
  textMuted: "#888888",
  textSubtle: "#555555",
  accent: "#00d4aa",
  accentDim: "#00d4aa15",
  blue: "#3b82f6",
  gold: "#f5c842",
  danger: "#ef4444",
};

const STATUS_CONFIG: Record<WebProjectStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Borrador", color: "#888888", bg: "#88888815" },
  in_progress: { label: "En Progreso", color: "#3b82f6", bg: "#3b82f615" },
  review: { label: "En Revisi\u00f3n", color: "#f59e0b", bg: "#f59e0b15" },
  completed: { label: "Completado", color: "#00d4aa", bg: "#00d4aa15" },
  on_hold: { label: "En Espera", color: "#f59e0b", bg: "#f59e0b15" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "#ef444415" },
};

export default function IKingdomProjectsPage() {
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    client_name: "",
    domain: "",
    service_type: "" as string,
    tech_stack: "",
    description: "",
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ikingdom/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      }
    } catch {
      console.error("Error fetching projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ikingdom/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProject.title,
          client_name: newProject.client_name || undefined,
          domain: newProject.domain || undefined,
          service_type: newProject.service_type || undefined,
          tech_stack: newProject.tech_stack || undefined,
          description: newProject.description || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setNewProject({ title: "", client_name: "", domain: "", service_type: "", tech_stack: "", description: "" });
        await fetchProjects();
      }
    } catch {
      console.error("Error creating project");
    } finally {
      setCreating(false);
    }
  }

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.client_name?.toLowerCase().includes(q) ?? false) ||
      (p.domain?.toLowerCase().includes(q) ?? false)
    );
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "in_progress").length,
    review: projects.filter((p) => p.status === "review").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="min-h-full" style={{ background: P.bg, color: P.text }}>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,170,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/app/companies"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: P.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a empresas
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: "#ffffff", boxShadow: "0 0 20px rgba(0,212,170,0.2)" }}
              >
                <Image src="/logo-ikingdom.png" alt="iKingdom" width={48} height={48} className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">iKingdom Web</h1>
                <p className="text-sm" style={{ color: P.textMuted }}>
                  Gesti\u00f3n de proyectos web &middot; Pipeline de construcci\u00f3n
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #00d4aa, #3b82f6)",
                color: "#000000",
                boxShadow: "0 0 20px rgba(0,212,170,0.3)",
              }}
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto Web
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { icon: Globe, label: "Total", value: String(stats.total) },
              { icon: Code2, label: "En Desarrollo", value: String(stats.active) },
              { icon: AlertCircle, label: "En Revisi\u00f3n", value: String(stats.review) },
              { icon: CheckCircle2, label: "Completados", value: String(stats.completed) },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,212,170,0.1)" }}
                >
                  <s.icon className="w-4 h-4" style={{ color: P.accent }} />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: P.textSubtle }}>
                    {s.label}
                  </p>
                  <p className="text-sm font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.textSubtle }} />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: P.surface2,
                border: `1px solid ${P.border}`,
                color: P.text,
              }}
            />
          </div>
        </div>

        {/* Project list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: P.accent }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: P.accentDim }}
            >
              <Globe className="w-8 h-8" style={{ color: P.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: P.textMuted }}>
              {projects.length === 0 ? "No hay proyectos web a\u00fan" : "No se encontraron resultados"}
            </p>
            {projects.length === 0 && (
              <p className="text-xs mt-1" style={{ color: P.textSubtle }}>
                Crea tu primer proyecto web para comenzar.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((project) => {
              const statusConf = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;
              return (
                <Link
                  key={project.id}
                  href={`/app/ikingdom/projects/${project.id}`}
                  className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: P.surface,
                    border: `1px solid ${P.border}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* accent bar */}
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00d4aa, #3b82f6)" }} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate group-hover:text-[#00d4aa] transition-colors">
                          {project.title}
                        </h3>
                        {project.client_name && (
                          <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>
                            {project.client_name}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-2"
                        style={{ background: statusConf.bg, color: statusConf.color, border: `1px solid ${statusConf.color}30` }}
                      >
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Domain & service */}
                    <div className="flex items-center gap-3 mb-3">
                      {project.domain && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: P.accent }}>
                          <Globe className="w-3 h-3" />
                          {project.domain}
                        </span>
                      )}
                      {project.service_type && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: P.surface3, color: P.textMuted }}>
                          {WEB_SERVICE_TYPE_LABELS[project.service_type] ?? project.service_type}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: P.surface3 }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${project.progress_percent}%`,
                            background: "linear-gradient(90deg, #00d4aa, #3b82f6)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: P.accent }}>
                        {project.progress_percent}%
                      </span>
                    </div>

                    {/* Stage */}
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                      <span className="text-xs" style={{ color: P.textMuted }}>
                        Etapa: {WEB_STAGE_LABELS[project.current_stage as WebStageKey] ?? project.current_stage}
                      </span>
                      <span className="text-[10px]" style={{ color: P.textSubtle }}>
                        {new Date(project.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" style={{ color: P.accent }} />
                Nuevo Proyecto Web
              </DialogTitle>
              <DialogDescription>
                Crea un nuevo proyecto de desarrollo web para un cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wp-title">Nombre del proyecto *</Label>
                <Input
                  id="wp-title"
                  placeholder="Ej: Sitio Web Corporativo"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wp-client">Cliente</Label>
                  <Input
                    id="wp-client"
                    placeholder="Nombre del cliente"
                    value={newProject.client_name}
                    onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wp-domain">Dominio</Label>
                  <Input
                    id="wp-domain"
                    placeholder="ejemplo.com"
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de servicio</Label>
                  <Select
                    value={newProject.service_type}
                    onValueChange={(v) => setNewProject({ ...newProject, service_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing_page">Landing Page</SelectItem>
                      <SelectItem value="sitio_corporativo">Sitio Corporativo</SelectItem>
                      <SelectItem value="ecommerce">E-Commerce</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="webapp">Web App</SelectItem>
                      <SelectItem value="rediseno">Redise\u00f1o</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wp-tech">Tech Stack</Label>
                  <Input
                    id="wp-tech"
                    placeholder="Next.js, React..."
                    value={newProject.tech_stack}
                    onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wp-desc">Descripci\u00f3n</Label>
                <Input
                  id="wp-desc"
                  placeholder="Breve descripci\u00f3n del proyecto..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating || !newProject.title.trim()}>
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Crear Proyecto</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
