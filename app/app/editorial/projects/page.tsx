"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Loader2,
  ArrowLeft,
  Eye,
  BarChart2,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorialProject } from "@/lib/editorial/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ServiceType = "full_pipeline" | "reedicion" | "rediseno_portada" | "reedicion_y_portada";

const SERVICE_TYPES: { value: ServiceType; label: string; desc: string; icon: typeof BookOpen }[] = [
  { value: "full_pipeline", label: "Pipeline Completo", desc: "Nuevo libro: 8 etapas completas", icon: BookOpen },
  { value: "reedicion", label: "Re-edicion", desc: "Correccion y mejora de libro existente", icon: BookOpen },
  { value: "rediseno_portada", label: "Re-diseno de Portada", desc: "Nueva portada para libro existente", icon: Eye },
  { value: "reedicion_y_portada", label: "Re-edicion + Portada", desc: "Edicion completa + nueva portada", icon: BookOpen },
];

interface CreateProjectForm {
  title: string;
  subtitle: string;
  author_name: string;
  language: string;
  genre: string;
  service_type: ServiceType;
}

const INITIAL_FORM: CreateProjectForm = {
  title: "",
  subtitle: "",
  author_name: "",
  language: "es",
  genre: "",
  service_type: "full_pipeline",
};

export default function EditorialProjectsPage() {
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateProjectForm>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/editorial/projects/list");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      } else {
        setError(json.error ?? "Error al cargar proyectos");
      }
    } catch {
      setError("Error de red al cargar proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setCreateError("El titulo es obligatorio");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/editorial/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          author_name: form.author_name.trim() || undefined,
          language: form.language || "es",
          genre: form.genre.trim() || undefined,
          service_type: form.service_type,
        }),
      });
      const json = await res.json();
      if (res.ok && json.projectId) {
        setDialogOpen(false);
        setForm(INITIAL_FORM);
        await fetchProjects();
      } else {
        setCreateError(json.error ?? "Error al crear proyecto");
      }
    } catch {
      setCreateError("Error de red al crear proyecto");
    } finally {
      setCreating(false);
    }
  }

  function handleFieldChange(field: keyof CreateProjectForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.author_name && p.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + p.progress_percent, 0) / projects.length)
      : 0,
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app/editorial"
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all re-lift"
              style={{ 
                background: "var(--re-surface)", 
                border: "1px solid var(--re-border)",
                color: "var(--re-text-muted)" 
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl"
                style={{ 
                  background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                }}
              >
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--re-text)" }}>
                  Proyectos Editoriales
                </h1>
                <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                  Gestiona y supervisa todos los proyectos del pipeline
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="re-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: FolderOpen, color: "var(--re-blue)" },
            { label: "En progreso", value: stats.inProgress, icon: Clock, color: "var(--re-gold)" },
            { label: "Completados", value: stats.completed, icon: CheckCircle2, color: "var(--re-success)" },
            { label: "Progreso medio", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "var(--re-cyan)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="re-card p-4 flex items-center gap-3"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: `${color}12` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>{label}</p>
                <p className="text-xl font-bold" style={{ color: "var(--re-text)" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ 
              background: "var(--re-surface)",
              border: "1px solid var(--re-border)",
            }}
          >
            <Search className="w-4 h-4" style={{ color: "var(--re-text-subtle)" }} />
            <input
              type="text"
              placeholder="Buscar por titulo o autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--re-text)" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs px-2 py-1 rounded-md hover:bg-[var(--re-surface-2)]"
                style={{ color: "var(--re-text-muted)" }}
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--re-text-muted)" }} />
        </div>
      ) : error ? (
        <div
          className="re-card p-6 text-center text-sm"
          style={{ borderColor: "var(--re-danger)", color: "var(--re-danger)" }}
        >
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div
          className="re-card p-12 flex flex-col items-center gap-5 text-center"
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{ background: "var(--re-blue-pale)" }}
          >
            <BookOpen className="w-8 h-8" style={{ color: "var(--re-blue)" }} />
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: "var(--re-text)" }}>Sin proyectos</p>
            <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--re-text-muted)" }}>
              Aun no hay proyectos editoriales. Crea el primero para comenzar el pipeline de produccion.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="re-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onDelete={fetchProjects}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo Proyecto Editorial</DialogTitle>
              <DialogDescription>
                Completa los datos basicos. Podras cargar el manuscrito desde el detalle del proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {/* Service Type Selector */}
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de servicio</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => handleFieldChange("service_type", st.value)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{
                        background: form.service_type === st.value ? "var(--re-blue-pale)" : "var(--re-surface)",
                        borderColor: form.service_type === st.value ? "var(--re-blue)" : "var(--re-border)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <st.icon 
                          className="w-4 h-4" 
                          style={{ color: form.service_type === st.value ? "var(--re-blue)" : "var(--re-text-muted)" }}
                        />
                        <span 
                          className="text-xs font-semibold"
                          style={{ color: form.service_type === st.value ? "var(--re-blue)" : "var(--re-text)" }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 ml-6" style={{ color: "var(--re-text-muted)" }}>{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  placeholder="Titulo del libro"
                  value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  required
                  className="re-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subtitle">Subtitulo</Label>
                <Input
                  id="subtitle"
                  placeholder="Subtitulo (opcional)"
                  value={form.subtitle}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  className="re-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="author_name">Autor</Label>
                <Input
                  id="author_name"
                  placeholder="Nombre del autor"
                  value={form.author_name}
                  onChange={(e) => handleFieldChange("author_name", e.target.value)}
                  className="re-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="genre">Genero</Label>
                  <Input
                    id="genre"
                    placeholder="Novela, ensayo..."
                    value={form.genre}
                    onChange={(e) => handleFieldChange("genre", e.target.value)}
                    className="re-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    placeholder="es"
                    value={form.language}
                    onChange={(e) => handleFieldChange("language", e.target.value)}
                    className="re-input"
                  />
                </div>
              </div>
              {createError && (
                <p className="text-sm" style={{ color: "var(--re-danger)" }}>{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setForm(INITIAL_FORM);
                  setCreateError(null);
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="re-btn-primary">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Proyecto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: EditorialProject; onDelete: () => void }) {
  const statusConfig = {
    created: { label: "Creado", color: "var(--re-text-muted)", bg: "var(--re-surface-2)" },
    in_progress: { label: "En progreso", color: "var(--re-gold)", bg: "var(--re-gold-pale)" },
    review: { label: "En revision", color: "var(--re-blue)", bg: "var(--re-blue-pale)" },
    completed: { label: "Completado", color: "var(--re-success)", bg: "var(--re-success-pale)" },
    archived: { label: "Archivado", color: "var(--re-text-subtle)", bg: "var(--re-surface-2)" },
  };

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.created;

  return (
    <div className="re-card re-lift p-5 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link 
            href={`/app/editorial/projects/${project.id}`}
            className="block"
          >
            <h3 
              className="font-semibold text-base truncate group-hover:text-[var(--re-blue)] transition-colors"
              style={{ color: "var(--re-text)" }}
            >
              {project.title}
            </h3>
            {project.subtitle && (
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--re-text-muted)" }}>
                {project.subtitle}
              </p>
            )}
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              style={{ 
                background: "var(--re-surface-2)",
                color: "var(--re-text-muted)" 
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/editorial/projects/${project.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Proyecto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm(`Eliminar "${project.title}"? Esta accion no se puede deshacer.`)) {
                  fetch(`/api/editorial/projects/${project.id}`, { method: "DELETE" })
                    .then(res => res.json())
                    .then(data => { if (data.success) onDelete(); });
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Author */}
      {project.author_name && (
        <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>
          por {project.author_name}
        </p>
      )}

      {/* Stage Badge */}
      <div className="flex items-center gap-2">
        <span
          className="re-badge re-badge-blue"
        >
          {EDITORIAL_STAGE_LABELS[project.current_stage] ?? project.current_stage}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="re-progress flex-1">
          <div 
            className="re-progress-bar" 
            style={{ width: `${project.progress_percent}%` }}
          />
        </div>
        <span 
          className="text-xs font-semibold tabular-nums"
          style={{ color: "var(--re-blue)" }}
        >
          {project.progress_percent}%
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--re-border)" }}>
        <span className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
          {formatDate(project.created_at)}
        </span>
        <Link
          href={`/app/editorial/projects/${project.id}`}
          className="text-xs font-medium flex items-center gap-1 transition-colors hover:gap-2"
          style={{ color: "var(--re-blue)" }}
        >
          Ver detalle
          <Eye className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
