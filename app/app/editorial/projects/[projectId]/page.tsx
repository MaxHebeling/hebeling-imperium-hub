"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CircleDot,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialExport,
  EditorialStageKey,
  EditorialStageStatus,
} from "@/lib/editorial/types/editorial";
import {
  EDITORIAL_STAGE_KEYS,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_PROGRESS,
} from "@/lib/editorial/pipeline/constants";

interface ProgressData {
  project: Pick<EditorialProject, "id" | "title" | "author_name" | "current_stage" | "status" | "progress_percent">;
  stages: EditorialStage[];
  files: EditorialFile[];
  exports: EditorialExport[];
}

const STATUS_ICONS: Record<EditorialStageStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  queued: <CircleDot className="w-4 h-4 text-blue-400" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  review_required: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
};

const STATUS_BADGE_MAP: Record<EditorialStageStatus, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "secondary",
  queued: "outline",
  processing: "default",
  review_required: "outline",
  approved: "default",
  failed: "destructive",
  completed: "default",
};

const STATUS_LABELS: Record<EditorialStageStatus, string> = {
  pending: "Pendiente",
  queued: "En cola",
  processing: "Procesando",
  review_required: "Revisión requerida",
  approved: "Aprobado",
  failed: "Fallido",
  completed: "Completado",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function EditorialProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/progress`);
      const json = await res.json();
      if (json.success) {
        setData({
          project: json.project,
          stages: json.stages,
          files: json.files,
          exports: json.exports,
        });
      } else {
        setError(json.error ?? "Error al cargar el proyecto");
      }
    } catch {
      setError("Error de red al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/app/editorial/projects" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a proyectos
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {error ?? "Proyecto no encontrado"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, stages, files, exports: projectExports } = data;

  // Build a stage map for quick lookup
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/app/editorial/projects"
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "var(--re-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a proyectos
      </Link>

      {/* Project Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: "linear-gradient(135deg, #1B40C0 0%, #2DD4D4 100%)" }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--re-text)" }}>
              {project.title}
            </h1>
            {project.author_name && (
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                por {project.author_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--re-text-muted)" }}>Estado</p>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#F5C84215", color: "var(--re-gold)", border: "1px solid #F5C84230" }}
          >
            {project.status}
          </span>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--re-text-muted)" }}>Etapa actual</p>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#2DD4D415", color: "var(--re-cyan)", border: "1px solid #2DD4D430" }}
          >
            {EDITORIAL_STAGE_LABELS[project.current_stage as EditorialStageKey] ?? project.current_stage}
          </span>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--re-text-muted)" }}>Progreso general</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--re-surface-3)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${project.progress_percent}%`, background: "var(--re-blue-light)" }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
              {project.progress_percent}%
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline stages */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--re-surface)", border: "1px solid var(--re-border)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>Pipeline Editorial</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>Estado de cada etapa del proceso de produccion.</p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--re-border)" }}>
          {EDITORIAL_STAGE_KEYS.map((key, index) => {
            const stage = stageMap.get(key);
            const status: EditorialStageStatus = (stage?.status as EditorialStageStatus) ?? "pending";
            const isCurrentStage = project.current_stage === key;
            const targetProgress = EDITORIAL_STAGE_PROGRESS[key];
            const isCompleted = status === "completed" || status === "approved";

            return (
              <div
                key={key}
                className="flex items-start gap-4 px-5 py-4 transition-colors"
                style={{
                  background: isCurrentStage ? "#1B40C010" : "transparent",
                  borderLeft: isCurrentStage ? "3px solid var(--re-blue-light)" : "3px solid transparent",
                }}
              >
                {/* Step number */}
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: isCompleted ? "#22d3a020" : isCurrentStage ? "#1B40C030" : "var(--re-surface-3)",
                    color: isCompleted ? "var(--re-success)" : isCurrentStage ? "var(--re-blue-light)" : "var(--re-text-subtle)",
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: "var(--re-text)" }}>
                      {EDITORIAL_STAGE_LABELS[key]}
                    </span>
                    {isCurrentStage && (
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-semibold"
                        style={{ background: "#1B40C030", color: "var(--re-blue-light)" }}
                      >
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {STATUS_ICONS[status]}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: isCompleted ? "#22d3a015" : status === "processing" ? "#1B40C020" : "var(--re-surface-3)",
                        color: isCompleted ? "var(--re-success)" : status === "processing" ? "var(--re-blue-light)" : "var(--re-text-muted)",
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  {stage?.started_at && (
                    <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                      Iniciado: {formatDate(stage.started_at)}
                    </p>
                  )}
                  {stage?.completed_at && (
                    <p className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                      Completado: {formatDate(stage.completed_at)}
                    </p>
                  )}
                </div>

                {/* Progress target */}
                <span className="text-xs shrink-0" style={{ color: "var(--re-text-subtle)" }}>
                  {targetProgress}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Archivos ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay archivos cargados aún.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{file.file_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {file.mime_type ?? "—"} · {formatBytes(file.size_bytes)} · v{file.version}
                    </span>
                    {file.stage_key && (
                      <span className="text-xs text-muted-foreground">
                        Etapa: {EDITORIAL_STAGE_LABELS[file.stage_key as EditorialStageKey] ?? file.stage_key}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">
                    {formatDate(file.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exports */}
      {projectExports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exportaciones ({projectExports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {projectExports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium uppercase">{exp.export_type}</span>
                    <span className="text-xs text-muted-foreground">v{exp.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exp.status === "ready" ? "default" : exp.status === "failed" ? "destructive" : "secondary"}>
                      {exp.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(exp.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
