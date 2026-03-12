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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { EditorialProject } from "@/lib/editorial/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

const STAGE_BADGE_VARIANTS: Record<string, string> = {
  ingesta: "secondary",
  estructura: "secondary",
  estilo: "secondary",
  ortotipografia: "secondary",
  maquetacion: "secondary",
  revision_final: "default",
};

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  created: "secondary",
  in_progress: "default",
  review: "outline",
  completed: "default",
  archived: "outline",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface CreateProjectForm {
  title: string;
  subtitle: string;
  author_name: string;
  language: string;
  genre: string;
}

const INITIAL_FORM: CreateProjectForm = {
  title: "",
  subtitle: "",
  author_name: "",
  language: "es",
  genre: "",
};

export default function EditorialProjectsPage() {
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateProjectForm>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
      setCreateError("El título es obligatorio");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/editorial/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          author_name: form.author_name.trim() || undefined,
          language: form.language || "es",
          genre: form.genre.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
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

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/editorial"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--re-text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "#1B40C020" }}
            >
              <BookOpen className="w-4 h-4" style={{ color: "var(--re-cyan)" }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: "var(--re-text)" }}>
              Proyectos Editoriales
            </h1>
          </div>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--re-blue)",
            color: "#ffffff",
            boxShadow: "0 0 16px #1B40C040",
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ background: "var(--re-surface)", border: "1px solid var(--re-danger)30", color: "var(--re-danger)" }}
        >
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--re-surface)", border: "1px solid var(--re-border)" }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl"
            style={{ background: "#2DD4D415" }}
          >
            <BookOpen className="w-6 h-6" style={{ color: "var(--re-cyan)" }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--re-text)" }}>Sin proyectos</p>
            <p className="text-sm mt-1" style={{ color: "var(--re-text-muted)" }}>
              Aun no hay proyectos editoriales. Crea el primero para comenzar el pipeline.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--re-cyan-dim)", color: "var(--re-cyan)", border: "1px solid var(--re-border-cyan)" }}
          >
            <Plus className="w-4 h-4" />
            Crear Proyecto
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--re-surface)", border: "1px solid var(--re-border)" }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "var(--re-border)" }}>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Titulo</TableHead>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Autor</TableHead>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Etapa actual</TableHead>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Progreso</TableHead>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Estado</TableHead>
                <TableHead style={{ color: "var(--re-text-muted)" }}>Creado</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  style={{ borderColor: "var(--re-border)" }}
                  className="transition-colors hover:bg-white/5"
                >
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate" style={{ color: "var(--re-text)" }}>{project.title}</div>
                    {project.subtitle && (
                      <div className="text-xs truncate" style={{ color: "var(--re-text-muted)" }}>{project.subtitle}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                    {project.author_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "#2DD4D415", color: "var(--re-cyan)", border: "1px solid #2DD4D430" }}
                    >
                      {EDITORIAL_STAGE_LABELS[project.current_stage] ?? project.current_stage}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--re-surface-3)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${project.progress_percent}%`, background: "var(--re-blue-light)" }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right" style={{ color: "var(--re-text-muted)" }}>
                        {project.progress_percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: project.status === "completed" ? "#22d3a015" : "#F5C84215",
                        color: project.status === "completed" ? "var(--re-success)" : "var(--re-gold)",
                        border: `1px solid ${project.status === "completed" ? "#22d3a030" : "#F5C84230"}`,
                      }}
                    >
                      {project.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs" style={{ color: "var(--re-text-muted)" }}>
                    {formatDate(project.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/app/editorial/projects/${project.id}`}
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-white/10"
                      style={{ color: "var(--re-text-muted)" }}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: projects.length, icon: BarChart2, accent: "var(--re-cyan)" },
            { label: "En progreso", value: projects.filter((p) => p.status === "in_progress").length, icon: BookOpen, accent: "var(--re-blue-light)" },
            { label: "Completados", value: projects.filter((p) => p.status === "completed").length, icon: BarChart2, accent: "var(--re-success)" },
            {
              label: "Progreso medio",
              value: `${projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress_percent, 0) / projects.length) : 0}%`,
              icon: BarChart2,
              accent: "var(--re-gold)",
            },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{ background: `${accent}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>{label}</p>
                <p className="text-xl font-bold leading-tight" style={{ color: "var(--re-text)" }}>{value}</p>
              </div>
            </div>
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
                Completa los datos básicos. Podrás cargar el manuscrito desde el detalle del proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Título del libro"
                  value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  placeholder="Subtítulo (opcional)"
                  value={form.subtitle}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="author_name">Autor</Label>
                <Input
                  id="author_name"
                  placeholder="Nombre del autor"
                  value={form.author_name}
                  onChange={(e) => handleFieldChange("author_name", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="genre">Género</Label>
                  <Input
                    id="genre"
                    placeholder="Novela, ensayo..."
                    value={form.genre}
                    onChange={(e) => handleFieldChange("genre", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    placeholder="es"
                    value={form.language}
                    onChange={(e) => handleFieldChange("language", e.target.value)}
                  />
                </div>
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
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
              <Button type="submit" disabled={creating}>
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
