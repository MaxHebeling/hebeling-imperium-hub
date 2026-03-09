"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import { EDITORIAL_CONTACT_EMAIL } from "@/lib/editorial/portal-config";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

interface ProjectEntry {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  current_stage: EditorialStageKey;
  status: string;
  progress_percent: number;
  due_date: string | null;
  membership: {
    role: string;
    invited_at: string;
    accepted_at: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  in_progress: "En proceso",
  review: "En revisión",
  completed: "Completado",
  archived: "Archivado",
};

const ROLE_LABELS: Record<string, string> = {
  author: "Autor",
  reviewer: "Revisor",
  editor: "Editor",
};

export default function AuthorProjectsPage() {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/author/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      } else {
        setError(json.error ?? "Error al cargar proyectos");
      }
    } catch {
      setError("Error de red. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mis libros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proyectos editoriales en los que participas
          </p>
        </div>
        {!loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProjects}
            className="shrink-0"
            aria-label="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchProjects}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Sin proyectos asignados</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                El equipo editorial aún no te ha asignado a ningún proyecto.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              ¿Esperabas ver un libro aquí?{" "}
              <a
                href={`mailto:${EDITORIAL_CONTACT_EMAIL}`}
                className="underline underline-offset-2"
              >
                Contáctanos
              </a>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/author/projects/${project.id}`}
              className="block group"
            >
              <Card className="hover:shadow-md transition-shadow duration-150 active:scale-[0.99] transition-transform">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-snug truncate">
                            {project.title}
                          </p>
                          {project.author_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {project.author_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge variant="outline" className="text-xs h-5">
                          {EDITORIAL_STAGE_LABELS[project.current_stage] ??
                            project.current_stage}
                        </Badge>
                        <Badge variant="secondary" className="text-xs h-5">
                          {STATUS_LABELS[project.status] ?? project.status}
                        </Badge>
                        {project.membership?.role && (
                          <Badge
                            variant="outline"
                            className="text-xs h-5 text-purple-600 border-purple-300 dark:border-purple-700"
                          >
                            {ROLE_LABELS[project.membership.role] ??
                              project.membership.role}
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-2 mt-3">
                        <Progress
                          value={project.progress_percent}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs font-medium text-muted-foreground shrink-0 w-8 text-right">
                          {project.progress_percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
