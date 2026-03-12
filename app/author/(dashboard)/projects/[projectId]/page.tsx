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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  EDITORIAL_STAGE_KEYS,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_PROGRESS,
} from "@/lib/editorial/pipeline/constants";
import { UPLOAD_SUCCESS_DURATION_MS } from "@/lib/editorial/portal-config";
import type {
  EditorialStageKey,
  EditorialStageStatus,
} from "@/lib/editorial/types/editorial";

// ---------------------------------------------------------------------------
// Types returned by GET /api/author/projects/[projectId]
// ---------------------------------------------------------------------------
interface ProjectDetail {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  language: string;
  genre: string | null;
  current_stage: EditorialStageKey;
  status: string;
  progress_percent: number;
  due_date: string | null;
}

interface StageRow {
  id: string;
  stage_key: string;
  status: EditorialStageStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface FileRow {
  id: string;
  file_type: string;
  version: number;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: string;
  created_at: string;
}

interface CommentRow {
  id: string;
  stage_key: string | null;
  comment: string;
  visibility: string;
  created_at: string;
}

interface ExportRow {
  id: string;
  export_type: string;
  version: number;
  status: string;
  created_at: string;
}

interface ProgressData {
  project: ProjectDetail;
  memberRole: string;
  stages: StageRow[];
  files: FileRow[];
  comments: CommentRow[];
  exports: ExportRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  queued: <CircleDot className="w-4 h-4 text-blue-400" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  review_required: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  queued: "En cola",
  processing: "Procesando",
  review_required: "Necesita revisión",
  approved: "Aprobada",
  failed: "Error",
  completed: "Completada",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtBytes(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function AuthorProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/author/projects/${projectId}`);
      const json = await res.json();
      if (json.success) {
        setData(json as ProgressData);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/author/projects/${projectId}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();

      if (json.success) {
        setUploadMsg({
          type: "success",
          text: `¡Versión ${json.file?.version ?? ""} subida correctamente!`,
        });
        await fetchData();
        setTimeout(() => setUploadMsg(null), UPLOAD_SUCCESS_DURATION_MS);
      } else {
        setUploadMsg({ type: "error", text: json.error ?? "Error al subir" });
      }
    } catch {
      setUploadMsg({ type: "error", text: "Error de red al subir el archivo" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando tu proyecto…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
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

  const { project, memberRole, stages, files, comments, exports: exports_ } = data;
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));
  const isAuthor = memberRole === "author";

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      {/* Project header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500 shrink-0" />
          <h1 className="text-xl font-bold tracking-tight">{project.title}</h1>
        </div>
        {project.subtitle && (
          <p className="text-sm text-muted-foreground pl-7">{project.subtitle}</p>
        )}
        {project.author_name && (
          <p className="text-xs text-muted-foreground pl-7">
            por {project.author_name}
          </p>
        )}
        {project.due_date && (
          <p className="text-xs text-muted-foreground pl-7">
            Entrega estimada: <strong>{fmtDate(project.due_date)}</strong>
          </p>
        )}
      </div>

      {/* Progress card */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Etapa actual</p>
              <Badge variant="default" className="w-fit text-xs">
                {EDITORIAL_STAGE_LABELS[project.current_stage] ??
                  project.current_stage}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{project.progress_percent}%</p>
              <p className="text-xs text-muted-foreground">completado</p>
            </div>
          </div>
          <Progress value={project.progress_percent} className="h-2" />
        </CardContent>
      </Card>

      {/* Upload widget — only for authors */}
      {isAuthor && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/10">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Subir nueva versión</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El archivo anterior se conservará. Formatos: .doc, .docx,
                  .pdf, .txt, .odt
                </p>
              </div>
            </div>

            {uploadMsg && (
              <div
                className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
                  uploadMsg.type === "success"
                    ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {uploadMsg.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                {uploadMsg.text}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".doc,.docx,.pdf,.txt,.odt"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Subiendo…
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Seleccionar archivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pipeline stages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fases del proceso</CardTitle>
          <CardDescription className="text-xs">
            Estado de cada etapa editorial de tu libro
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {EDITORIAL_STAGE_KEYS.map((key, index) => {
            const stage = stageMap.get(key);
            const status = (stage?.status ?? "pending") as EditorialStageStatus;
            const isCurrent = project.current_stage === key;

            return (
              <div key={key}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 ${
                    isCurrent
                      ? "bg-purple-50 dark:bg-purple-950/20"
                      : ""
                  }`}
                >
                  {/* Step number */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
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
                          className="text-xs text-purple-600 border-purple-400 h-4"
                        >
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {STATUS_ICONS[status]}
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0">
                    {EDITORIAL_STAGE_PROGRESS[key]}%
                  </span>
                </div>
                {index < EDITORIAL_STAGE_KEYS.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Archivos ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay archivos disponibles.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate capitalize">
                      {f.file_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      v{f.version} · {fmtBytes(f.size_bytes)} · {fmtDate(f.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 capitalize">
                    {f.visibility}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments from the editorial team */}
      {comments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Notas del equipo ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg border bg-muted/20 text-sm"
                >
                  <p>{c.comment}</p>
                  {c.stage_key && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Etapa:{" "}
                      {EDITORIAL_STAGE_LABELS[c.stage_key as EditorialStageKey] ??
                        c.stage_key}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exports */}
      {exports_.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              Descargas ({exports_.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Descarga tu libro en diferentes formatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {exports_.map((ex) => (
                <ExportDownloadItem 
                  key={ex.id} 
                  projectId={projectId} 
                  exportItem={ex} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
      <Link
        href="/author/projects"
        className="flex items-center gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis libros
      </Link>
    </Button>
  );
}

function ExportDownloadItem({ 
  projectId, 
  exportItem 
}: { 
  projectId: string; 
  exportItem: ExportRow;
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (exportItem.status !== "completed") return;
    
    setDownloading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/author/projects/${projectId}/exports/${exportItem.id}/download`
      );
      const json = await res.json();
      
      if (!json.success || !json.downloadUrl) {
        setError(json.error ?? "Error al obtener descarga");
        return;
      }
      
      // Open the download URL in a new tab/trigger download
      window.open(json.downloadUrl, "_blank");
    } catch {
      setError("Error de red");
    } finally {
      setDownloading(false);
    }
  }

  const isReady = exportItem.status === "completed";

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase">
          {exportItem.export_type}
        </p>
        <p className="text-xs text-muted-foreground">
          v{exportItem.version} · {fmtDate(exportItem.created_at)}
        </p>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
      {isReady ? (
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </>
          )}
        </Button>
      ) : (
        <Badge variant="secondary" className="text-xs shrink-0">
          {exportItem.status === "processing" ? "Generando..." : "Pendiente"}
        </Badge>
      )}
    </div>
  );
}
