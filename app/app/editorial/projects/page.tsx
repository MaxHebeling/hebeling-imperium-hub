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
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/editorial">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h1 className="text-xl font-bold">Proyectos Editoriales</h1>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin proyectos</CardTitle>
            <CardDescription>
              Aún no hay proyectos editoriales. Crea el primero para comenzar el pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Etapa actual</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate">{project.title}</div>
                      {project.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{project.subtitle}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.author_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STAGE_BADGE_VARIANTS[project.current_stage] as "secondary" | "default" | "outline" | "destructive" ?? "secondary"}>
                        {EDITORIAL_STAGE_LABELS[project.current_stage] ?? project.current_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress_percent} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {project.progress_percent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANTS[project.status] as "secondary" | "default" | "outline" | "destructive" ?? "secondary"}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/app/editorial/projects/${project.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">En progreso</p>
                  <p className="text-lg font-bold">
                    {projects.filter((p) => p.status === "in_progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Completados</p>
                  <p className="text-lg font-bold">
                    {projects.filter((p) => p.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Progreso medio</p>
                  <p className="text-lg font-bold">
                    {projects.length > 0
                      ? Math.round(
                          projects.reduce((acc, p) => acc + p.progress_percent, 0) / projects.length
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
