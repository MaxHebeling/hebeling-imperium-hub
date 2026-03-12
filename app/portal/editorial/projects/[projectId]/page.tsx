"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CircleDot,
  Loader2,
  Upload,
  FileText,
  Download,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialComment,
  EditorialExport,
  EditorialStageKey,
  EditorialStageStatus,
} from "@/lib/editorial/types/editorial";
import {
  EDITORIAL_STAGE_KEYS,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_PROGRESS,
} from "@/lib/editorial/pipeline/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProgressData {
  project: Pick<
    EditorialProject,
    | "id"
    | "title"
    | "subtitle"
    | "author_name"
    | "language"
    | "genre"
    | "current_stage"
    | "status"
    | "progress_percent"
    | "due_date"
  >;
  stages: EditorialStage[];
  files: EditorialFile[];
  comments: EditorialComment[];
  exports: EditorialExport[];
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
const STATUS_ICONS: Record<EditorialStageStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  queued: <CircleDot className="w-4 h-4 text-blue-400" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  review_required: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
};

const STATUS_BADGE: Record<
  EditorialStageStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
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
  review_required: "Necesita revisión",
  approved: "Aprobada",
  failed: "Error",
  completed: "Completada",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/progress`
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error ?? "Error al cargar el proyecto");
      }
    } catch {
      setError("Error de red. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/upload`,
        { method: "POST", body: formData }
      );
      const json = await res.json();

      if (json.success) {
        setUploadSuccess(true);
        // Refresh to show new file
        await fetchData();
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        setUploadError(json.error ?? "Error al subir el archivo");
      }
    } catch {
      setUploadError("Error de red al subir el archivo");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando tu proyecto…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link
            href="/portal/editorial/projects"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Mis libros
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive">
              {error ?? "Proyecto no encontrado"}
            </p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, stages, files, comments, exports: projectExports } = data;
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link
          href="/portal/editorial/projects"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Mis libros
        </Link>
      </Button>

      {/* Project header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500 shrink-0" />
          <h1 className="text-xl font-bold tracking-tight leading-tight">
            {project.title}
          </h1>
        </div>
        {project.subtitle && (
          <p className="text-sm text-muted-foreground pl-7">{project.subtitle}</p>
        )}
        {project.author_name && (
          <p className="text-xs text-muted-foreground pl-7">
            por {project.author_name}
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Etapa actual</p>
            <Badge variant="default" className="text-xs">
              {EDITORIAL_STAGE_LABELS[project.current_stage as EditorialStageKey] ??
                project.current_stage}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Progreso</p>
            <div className="flex items-center gap-2">
              <Progress
                value={project.progress_percent}
                className="h-2 flex-1"
              />
              <span className="text-sm font-bold">
                {project.progress_percent}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload new version */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Subir nueva versión</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sube el manuscrito actualizado. La versión anterior se
                  conservará.
                </p>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-destructive px-1">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 px-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ¡Archivo subido correctamente!
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".doc,.docx,.pdf,.txt,.odt"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              className="w-full"
              size="lg"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar archivo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Formatos aceptados: .doc, .docx, .pdf, .txt, .odt
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estado del pipeline</CardTitle>
          <CardDescription className="text-xs">
            Cada etapa del proceso de producción de tu libro
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {EDITORIAL_STAGE_KEYS.map((key, index) => {
            const stage = stageMap.get(key);
            const status: EditorialStageStatus =
              (stage?.status as EditorialStageStatus) ?? "pending";
            const isCurrent = project.current_stage === key;
            const targetProgress = EDITORIAL_STAGE_PROGRESS[key];

            return (
              <div key={key}>
                <div
                  className={`flex items-start gap-3 px-4 py-3 ${
                    isCurrent
                      ? "bg-purple-50 dark:bg-purple-950/20"
                      : ""
                  }`}
                >
                  {/* Step number */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {EDITORIAL_STAGE_LABELS[key]}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-xs text-purple-600 border-purple-400"
                        >
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {STATUS_ICONS[status]}
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0 mt-1">
                    {targetProgress}%
                  </span>
                </div>
                {index < EDITORIAL_STAGE_KEYS.length - 1 && (
                  <Separator />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* My files (client-visible) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Mis archivos ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay archivos compartidos contigo.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate capitalize">
                      {file.file_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{file.version} · {formatBytes(file.size_bytes)} ·{" "}
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments from editorial team */}
      {comments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Notas del equipo editorial ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg border bg-muted/20 text-sm"
                >
                  <p className="text-foreground">{c.comment}</p>
                  {c.stage_key && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Etapa:{" "}
                      {EDITORIAL_STAGE_LABELS[
                        c.stage_key as EditorialStageKey
                      ] ?? c.stage_key}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exports / downloads */}
      {projectExports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              Descargas disponibles ({projectExports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {projectExports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold uppercase">
                      {exp.export_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{exp.version} · {formatDate(exp.created_at)}
                    </span>
                  </div>
                  <Badge variant="default" className="text-xs shrink-0">
                    Listo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due date */}
      {project.due_date && (
        <p className="text-xs text-muted-foreground text-center">
          Fecha estimada de entrega:{" "}
          <strong>{formatDate(project.due_date)}</strong>
        </p>
      )}
    </div>
  );
}
