"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EditorialProject } from "@/lib/editorial/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  in_progress: "En proceso",
  review: "En revisión",
  completed: "Completado",
  archived: "Archivado",
};

const STATUS_VARIANTS: Record<
  string,
  "secondary" | "default" | "outline" | "destructive"
> = {
  created: "secondary",
  in_progress: "default",
  review: "outline",
  completed: "default",
  archived: "outline",
};

export default function ClientEditorialProjectsPage() {
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/editorial/client/projects/list");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      } else {
        setError(json.error ?? "Error al cargar tus proyectos");
      }
    } catch {
      setError("Error de red. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
          <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mis Libros</h1>
          <p className="text-sm text-muted-foreground">
            Proyectos editoriales asociados a tu cuenta
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando proyectos…</p>
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
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Sin proyectos aún</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu equipo editorial aún no ha vinculado ningún libro a tu cuenta.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/portal/editorial/projects/${project.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow active:scale-[0.99] transition-transform">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Book icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
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
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>

                      {/* Stage + status badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {EDITORIAL_STAGE_LABELS[project.current_stage] ??
                            project.current_stage}
                        </Badge>
                        <Badge
                          variant={
                            STATUS_VARIANTS[project.status] ?? "secondary"
                          }
                          className="text-xs"
                        >
                          {STATUS_LABELS[project.status] ?? project.status}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <Progress
                          value={project.progress_percent}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">
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

      {/* Info note */}
      {!loading && !error && projects.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          ¿No ves tu libro?{" "}
          <a
            href="mailto:editorial@hebeling.io"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Contáctanos
          </a>{" "}
          para vincularlo a tu cuenta.
        </p>
      )}
    </div>
  );
}
