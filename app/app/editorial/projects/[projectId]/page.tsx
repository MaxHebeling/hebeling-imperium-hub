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
  Upload,
  Mail,
  UserPlus,
  Send,
  CheckCheck,
  Download,
  Ruler,
  BookCopy,
  ChevronDown,
  ChevronRight,
  Star,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  Eye,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialExport,
  EditorialJob,
  EditorialStageKey,
  EditorialStageStatus,
} from "@/lib/editorial/types/editorial";
import {
  EDITORIAL_STAGE_KEYS,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_PROGRESS,
} from "@/lib/editorial/pipeline/constants";
import {
  KDP_TRIM_SIZES,
  KDP_PAPER_SPECS,
  KDP_PAPER_LABELS,
  KDP_BINDING_LABELS,
  KDP_BLEED_LABELS,
} from "@/lib/editorial/kdp";
import type {
  KdpPaperType,
  KdpBindingType,
  KdpBleedOption,
  KdpCoverDimensions,
} from "@/lib/editorial/kdp";

interface AiAnalysisResult {
  summary: string;
  score: number | null;
  strengths: string[];
  improvements: string[];
  issues: { type: "error" | "warning" | "suggestion"; description: string; location: string | null; suggestion: string | null }[];
  recommendations: string[];
  metadata: Record<string, unknown> | null;
}

interface ProgressData {
  project: Pick<EditorialProject, "id" | "title" | "author_name" | "current_stage" | "status" | "progress_percent"> & { client_id?: string | null };
  stages: EditorialStage[];
  files: EditorialFile[];
  exports: EditorialExport[];
  jobs: EditorialJob[];
}

const ALLOWED_FILE_TYPES = ".pdf,.docx,.doc,.epub,.txt";
const MAX_FILE_SIZE_MB = 100;

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

  // Invite client state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Correction report download state
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);



  // Expanded stage detail state
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  function toggleStageExpand(key: string) {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Pipeline run state
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{ success: boolean; message: string; stagesProcessed?: number } | null>(null);

  // KDP format configurator state
  const [kdpTrimSizeId, setKdpTrimSizeId] = useState("6x9");
  const [kdpPaperType, setKdpPaperType] = useState<KdpPaperType>("cream");
  const [kdpBinding, setKdpBinding] = useState<KdpBindingType>("paperback");
  const [kdpBleed, setKdpBleed] = useState<KdpBleedOption>("no_bleed");
  const [kdpPageCount, setKdpPageCount] = useState<number>(200);
  const [kdpResult, setKdpResult] = useState<KdpCoverDimensions | null>(null);
  const [kdpError, setKdpError] = useState<string | null>(null);
  const [kdpCalculating, setKdpCalculating] = useState(false);

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
          jobs: json.jobs ?? [],
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

  async function handleInviteClient(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/staff/projects/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          projectId,
          clientName: inviteName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInviteResult({ success: true, message: json.message });
        await fetchData();
      } else {
        setInviteResult({ success: false, message: json.error ?? "Error al enviar invitación" });
      }
    } catch {
      setInviteResult({ success: false, message: "Error de conexión" });
    } finally {
      setInviting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError("El archivo supera los 100MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      // Step 1: Get a signed upload URL from our API (small JSON request)
      const urlRes = await fetch("/api/editorial/projects/" + projectId + "/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const urlJson = await urlRes.json();
      if (!urlJson.success) {
        setUploadError(urlJson.error ?? "Error al preparar la subida");
        return;
      }

      // Step 2: Upload file directly to Supabase Storage using the signed URL
      const uploadRes = await fetch(urlJson.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadError("Error al subir el archivo al almacenamiento");
        return;
      }

      setUploadSuccess(true);
      await fetchData();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setUploadError("Error de conexión al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRunPipeline() {
    if (runningPipeline) return;
    
    // Check if there are files uploaded
    if (data && data.files.length === 0) {
      setPipelineResult({ success: false, message: "Primero debes subir un manuscrito antes de ejecutar el pipeline." });
      return;
    }

    setRunningPipeline(true);
    setPipelineResult(null);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/pipeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        setPipelineResult({ 
          success: true, 
          message: json.message,
          stagesProcessed: json.stagesProcessed?.length ?? 0
        });
        await fetchData(); // Refresh data to show updated stages
      } else {
        setPipelineResult({ success: false, message: json.error ?? "Error al ejecutar el pipeline" });
      }
    } catch {
      setPipelineResult({ success: false, message: "Error de conexion al ejecutar el pipeline" });
    } finally {
      setRunningPipeline(false);
    }
  }

  async function handleKdpCalculate() {
    setKdpCalculating(true);
    setKdpError(null);
    setKdpResult(null);
    try {
      const res = await fetch("/api/editorial/kdp-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trimSizeId: kdpTrimSizeId,
          paperType: kdpPaperType,
          binding: kdpBinding,
          bleed: kdpBleed,
          pageCount: kdpPageCount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setKdpResult(json.dimensions);
      } else {
        setKdpError(json.error ?? "Error al calcular dimensiones");
      }
    } catch {
      setKdpError("Error de conexión");
    } finally {
      setKdpCalculating(false);
    }
  }

  async function handleDownloadCorrectionReport() {
    setDownloadingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/correction-report`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Error al generar reporte" }));
        setReportError(json.error ?? "Error al generar el reporte de correcciones");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const fileName = fileNameMatch?.[1] ?? `Correcciones_${projectId}.docx`;
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setReportError("Error de conexión al descargar el reporte");
    } finally {
      setDownloadingReport(false);
    }
  }

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

  const { project, stages, files, exports: projectExports, jobs } = data;

  // Build a stage map for quick lookup
  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

  // Build a map of AI job results per stage_key (latest job per stage)
  const stageJobMap = new Map<string, AiAnalysisResult>();
  const stageJobStatusMap = new Map<string, EditorialJob>();
  for (const job of jobs) {
    if (job.stage_key) {
      stageJobStatusMap.set(job.stage_key, job);
      if (job.status === "succeeded" && job.output_ref) {
        try {
          const parsed = typeof job.output_ref === "string" ? JSON.parse(job.output_ref) : job.output_ref;
          if (parsed && typeof parsed === "object" && "summary" in parsed) {
            stageJobMap.set(job.stage_key, parsed as AiAnalysisResult);
          }
        } catch { /* ignore parse errors */ }
      }
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
      {/* Back nav */}
      <Link
        href="/app/editorial/projects"
        className="inline-flex items-center gap-2 text-sm w-fit transition-all hover:gap-3 group"
        style={{ color: "var(--re-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver a proyectos
      </Link>

      {/* Project Header */}
      <div className="re-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg shrink-0"
              style={{ background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)" }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--re-text)" }}>
                {project.title}
              </h1>
              {project.author_name && (
                <p className="text-sm mt-0.5" style={{ color: "var(--re-text-muted)" }}>
                  por {project.author_name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="re-badge"
                  style={{ 
                    background: project.status === "completed" ? "var(--re-success-pale)" : "var(--re-gold-pale)",
                    color: project.status === "completed" ? "var(--re-success)" : "var(--re-gold)",
                    border: `1px solid ${project.status === "completed" ? "rgba(13, 122, 95, 0.2)" : "rgba(196, 139, 10, 0.2)"}`
                  }}
                >
                  {project.status}
                </span>
                <span className="re-badge re-badge-blue">
                  {EDITORIAL_STAGE_LABELS[project.current_stage as EditorialStageKey] ?? project.current_stage}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Run Pipeline Button - Primary Action */}
            {project.status !== "completed" && (
              <button
                onClick={handleRunPipeline}
                disabled={runningPipeline || files.length === 0}
                className="re-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: runningPipeline ? "var(--re-blue-deep)" : "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                  boxShadow: "0 4px 14px rgba(27, 64, 192, 0.3)",
                }}
              >
                {runningPipeline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ejecutar Pipeline IA
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => { setInviteOpen(true); setInviteResult(null); }}
              className="re-btn-secondary flex items-center gap-2"
            >
              {project.client_id ? <Mail className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {project.client_id ? "Reenviar Invitacion" : "Invitar Cliente"}
            </button>
          </div>
        </div>

        {/* Pipeline Result Message */}
        {pipelineResult && (
          <div 
            className="mt-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{
              background: pipelineResult.success ? "var(--re-success-pale)" : "var(--re-danger-pale)",
              color: pipelineResult.success ? "var(--re-success)" : "var(--re-danger)",
              border: `1px solid ${pipelineResult.success ? "rgba(13, 122, 95, 0.2)" : "rgba(192, 49, 43, 0.2)"}`
            }}
          >
            {pipelineResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {pipelineResult.message}
          </div>
        )}
      </div>

      {/* Progress Card */}
      <div className="re-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>Progreso General</p>
          <span 
            className="text-2xl font-bold"
            style={{ color: "var(--re-blue)" }}
          >
            {project.progress_percent}%
          </span>
        </div>
        <div className="re-progress h-2">
          <div 
            className="re-progress-bar" 
            style={{ width: `${project.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="re-card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--re-text)" }}>Pipeline Editorial - 8 Etapas</h2>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
              Clic en <Eye className="w-3 h-3 inline" /> para ver resultados IA de cada etapa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span 
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "var(--re-blue-pale)", color: "var(--re-blue)" }}
            >
              {stages.filter(s => s.status === "completed" || s.status === "approved").length} / {EDITORIAL_STAGE_KEYS.length} completadas
            </span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--re-border)" }}>
          {EDITORIAL_STAGE_KEYS.map((key, index) => {
            const stage = stageMap.get(key);
            const status: EditorialStageStatus = (stage?.status as EditorialStageStatus) ?? "pending";
            const isCurrentStage = project.current_stage === key;
            const targetProgress = EDITORIAL_STAGE_PROGRESS[key];
            const isCompleted = status === "completed" || status === "approved";
            const aiResult = stageJobMap.get(key);
            const aiJob = stageJobStatusMap.get(key);
            const isExpanded = expandedStages.has(key);
            const hasAiData = !!aiResult;
            const isProcessing = status === "processing" || status === "queued";

            return (
              <div key={key}>
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors w-full text-left"
                  style={{
                    background: isCurrentStage ? "#1B40C010" : "transparent",
                    borderLeft: isCurrentStage ? "3px solid var(--re-blue-light)" : "3px solid transparent",
                  }}
                >
                  {/* Step number */}
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      background: isCompleted ? "#22d3a020" : isProcessing ? "#1B40C030" : "var(--re-surface-3)",
                      color: isCompleted ? "var(--re-success)" : isProcessing ? "var(--re-blue-light)" : "var(--re-text-subtle)",
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--re-text)" }}
                      >
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
                      {hasAiData && aiResult.score !== null && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1"
                          style={{ background: "#F5C84215", color: "var(--re-gold, #F5C842)", border: "1px solid #F5C84230" }}
                        >
                          <Star className="w-3 h-3" /> {aiResult.score}/10
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
                      {hasAiData && (
                        <span className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                          · {aiResult.issues.length} hallazgos · {aiResult.recommendations.length} recomendaciones
                        </span>
                      )}
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

                  {/* View Results Button + Progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    {(hasAiData || aiJob) ? (
                      <button
                        type="button"
                        onClick={() => toggleStageExpand(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isExpanded ? "var(--re-blue)" : "var(--re-surface-3)",
                          color: isExpanded ? "#fff" : "var(--re-text-muted)",
                          border: "1px solid var(--re-border)",
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? "Ocultar" : "Ver Resultados"}
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    ) : (
                      <span 
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ 
                          background: "var(--re-surface-3)",
                          color: "var(--re-text-subtle)" 
                        }}
                      >
                        Sin datos
                      </span>
                    )}
                    <span 
                      className="text-xs font-medium tabular-nums"
                      style={{ color: isCompleted ? "var(--re-success)" : "var(--re-text-subtle)" }}
                    >
                      {targetProgress}%
                    </span>
                  </div>
                </div>

                {/* Expanded AI Analysis Detail */}
                {isExpanded && (
                  <div
                    className="px-5 pb-5 pt-0"
                    style={{ background: isCurrentStage ? "#1B40C008" : "#00000008", borderLeft: isCurrentStage ? "3px solid var(--re-blue-light)" : "3px solid transparent" }}
                  >
                    {aiJob && !aiResult && aiJob.status === "running" && (
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--re-blue-light)" }} />
                        <span className="text-sm" style={{ color: "var(--re-text-muted)" }}>IA procesando esta etapa...</span>
                      </div>
                    )}
                    {aiJob && !aiResult && aiJob.status === "failed" && (
                      <div className="rounded-xl p-4 mt-2" style={{ background: "#ef444410", border: "1px solid #ef444430" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                          <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>Error en el procesamiento IA</span>
                        </div>
                        {aiJob.error_log && (
                          <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>{aiJob.error_log}</p>
                        )}
                      </div>
                    )}
                    {aiResult && (
                      <div className="space-y-4 mt-2">
                        {/* Summary */}
                        <div className="rounded-xl p-4" style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--re-blue-light)" }}>
                            <BookOpen className="w-3.5 h-3.5" /> Resumen del Análisis
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--re-text)" }}>{aiResult.summary}</p>
                        </div>

                        {/* Score + Strengths + Improvements row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Score */}
                          {aiResult.score !== null && (
                            <div className="rounded-xl p-4 text-center" style={{ background: "#F5C84210", border: "1px solid #F5C84230" }}>
                              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--re-gold, #F5C842)" }}>Puntuación</p>
                              <p className="text-3xl font-black" style={{ color: "var(--re-gold, #F5C842)" }}>{aiResult.score}<span className="text-sm font-normal">/10</span></p>
                            </div>
                          )}
                          {/* Strengths */}
                          {aiResult.strengths.length > 0 && (
                            <div className="rounded-xl p-4" style={{ background: "#22d3a010", border: "1px solid #22d3a030" }}>
                              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "var(--re-success, #22d3a0)" }}>
                                <TrendingUp className="w-3.5 h-3.5" /> Fortalezas ({aiResult.strengths.length})
                              </p>
                              <ul className="space-y-1">
                                {aiResult.strengths.map((s, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--re-text)" }}>
                                    <span style={{ color: "var(--re-success)" }}>+</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Improvements */}
                          {aiResult.improvements.length > 0 && (
                            <div className="rounded-xl p-4" style={{ background: "#f59e0b10", border: "1px solid #f59e0b30" }}>
                              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#f59e0b" }}>
                                <Lightbulb className="w-3.5 h-3.5" /> Mejoras ({aiResult.improvements.length})
                              </p>
                              <ul className="space-y-1">
                                {aiResult.improvements.map((imp, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--re-text)" }}>
                                    <span style={{ color: "#f59e0b" }}>!</span> {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Issues / Tracked Changes - 1x1 breakdown */}
                        {aiResult.issues.length > 0 && (
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--re-border)" }}>
                            <div className="px-4 py-3" style={{ background: "var(--re-surface-2)", borderBottom: "1px solid var(--re-border)" }}>
                              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--re-text)" }}>
                                <ShieldAlert className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                                Hallazgos Detallados ({aiResult.issues.length})
                              </h4>
                              <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>Cada cambio con su justificación y sugerencia de corrección</p>
                            </div>
                            <div className="divide-y" style={{ borderColor: "var(--re-border)" }}>
                              {aiResult.issues.map((issue, i) => {
                                const typeColors = {
                                  error: { bg: "#ef444410", border: "#ef444440", text: "#ef4444", label: "Error" },
                                  warning: { bg: "#f59e0b10", border: "#f59e0b40", text: "#f59e0b", label: "Advertencia" },
                                  suggestion: { bg: "#3b82f610", border: "#3b82f640", text: "#3b82f6", label: "Sugerencia" },
                                };
                                const tc = typeColors[issue.type];
                                return (
                                  <div key={i} className="px-4 py-3" style={{ background: i % 2 === 0 ? "transparent" : "#00000005" }}>
                                    <div className="flex items-start gap-3">
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5"
                                        style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                                      >
                                        {tc.label}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm" style={{ color: "var(--re-text)" }}>{issue.description}</p>
                                        {issue.location && (
                                          <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                                            <span className="font-medium">Ubicación:</span> {issue.location}
                                          </p>
                                        )}
                                        {issue.suggestion && (
                                          <div className="mt-2 rounded-lg px-3 py-2" style={{ background: "#22d3a008", border: "1px solid #22d3a020" }}>
                                            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--re-success, #22d3a0)" }}>Corrección sugerida:</p>
                                            <p className="text-xs" style={{ color: "var(--re-text)" }}>{issue.suggestion}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {aiResult.recommendations.length > 0 && (
                          <div className="rounded-xl p-4" style={{ background: "#1B40C008", border: "1px solid #1B40C030" }}>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--re-blue-light)" }}>
                              <Lightbulb className="w-3.5 h-3.5" /> Recomendaciones ({aiResult.recommendations.length})
                            </h4>
                            <ul className="space-y-1.5">
                              {aiResult.recommendations.map((rec, i) => (
                                <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--re-text)" }}>
                                  <span className="font-bold" style={{ color: "var(--re-blue-light)" }}>{i + 1}.</span> {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Files + Upload */}
      <div className="re-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--re-text-muted)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>Archivos ({files.length})</h2>
          </div>
          <label
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            style={{
              background: "var(--re-cyan-dim, #2DD4D415)",
              color: "var(--re-cyan)",
              border: "1px solid var(--re-border-cyan, #2DD4D430)",
            }}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Subiendo..." : "Subir Manuscrito"}
            <input
              type="file"
              accept={ALLOWED_FILE_TYPES}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {uploadError && (
          <div className="px-5 py-2 text-xs" style={{ color: "var(--re-danger, #ef4444)", background: "#ef444410" }}>
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="px-5 py-2 text-xs flex items-center gap-1" style={{ color: "var(--re-success, #22d3a0)", background: "#22d3a010" }}>
            <CheckCheck className="w-3.5 h-3.5" /> Archivo subido correctamente
          </div>
        )}

        <div className="px-5 py-4">
          {files.length === 0 ? (
            <div className="text-center py-6">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-3"
                style={{ background: "#2DD4D415" }}
              >
                <Upload className="w-6 h-6" style={{ color: "var(--re-cyan)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>No hay archivos cargados aún.</p>
              <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>Sube el manuscrito en PDF, DOCX, DOC, EPUB o TXT.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors"
                  style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                      style={{ background: "#1B40C015" }}
                    >
                      <FileText className="w-4 h-4" style={{ color: "var(--re-blue-light)" }} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block" style={{ color: "var(--re-text)" }}>{file.file_type}</span>
                      <span className="text-xs" style={{ color: "var(--re-text-muted)" }}>
                        {file.mime_type ?? "—"} · {formatBytes(file.size_bytes)} · v{file.version}
                      </span>
                      {file.stage_key && (
                        <span className="text-xs ml-2" style={{ color: "var(--re-cyan)" }}>
                          {EDITORIAL_STAGE_LABELS[file.stage_key as EditorialStageKey] ?? file.stage_key}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs shrink-0 ml-4" style={{ color: "var(--re-text-subtle)" }}>
                    {formatDate(file.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Correction Report Download */}
      <div className="re-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>Reporte de Correcciones</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>
            Genera un documento Word con todos los errores ortográficos y gramaticales encontrados.
          </p>
        </div>
        <div className="px-5 py-4">
          {reportError && (
            <div className="mb-3 rounded-lg px-3 py-2 text-xs" style={{ color: "var(--re-danger, #ef4444)", background: "#ef444410", border: "1px solid #ef444430" }}>
              {reportError}
            </div>
          )}
          <button
            onClick={handleDownloadCorrectionReport}
            disabled={downloadingReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center"
            style={{
              background: "linear-gradient(135deg, #1B40C0 0%, #2DD4D4 100%)",
              color: "#ffffff",
              boxShadow: "0 0 16px #1B40C040",
              opacity: downloadingReport ? 0.7 : 1,
            }}
          >
            {downloadingReport ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando reporte...</>
            ) : (
              <><Download className="w-4 h-4" /> Descargar Reporte de Correcciones (.docx)</>
            )}
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--re-text-subtle)" }}>
            El documento incluye errores agrupados por tipo y severidad, listo para enviar al autor.
          </p>
        </div>
      </div>

      {/* KDP Format Configurator */}
      <div className="re-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <BookCopy className="w-4 h-4" style={{ color: "var(--re-gold, #F5C842)" }} />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>Formato Amazon KDP</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>
              Calcula las dimensiones exactas de la portada, lomo y sangrado para Amazon KDP.
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Trim Size */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                Tamaño de corte (Trim Size)
              </Label>
              <select
                value={kdpTrimSizeId}
                onChange={(e) => setKdpTrimSizeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--re-surface-2)",
                  color: "var(--re-text)",
                  border: "1px solid var(--re-border)",
                }}
              >
                {KDP_TRIM_SIZES.map((ts) => (
                  <option key={ts.id} value={ts.id}>
                    {ts.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Type */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                Tipo de papel
              </Label>
              <select
                value={kdpPaperType}
                onChange={(e) => setKdpPaperType(e.target.value as KdpPaperType)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--re-surface-2)",
                  color: "var(--re-text)",
                  border: "1px solid var(--re-border)",
                }}
              >
                {KDP_PAPER_SPECS.map((ps) => (
                  <option key={ps.type} value={ps.type}>
                    {ps.label} ({ps.ppi} PPI, {ps.minPages}-{ps.maxPages} págs)
                  </option>
                ))}
              </select>
            </div>

            {/* Binding */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                Encuadernación
              </Label>
              <select
                value={kdpBinding}
                onChange={(e) => setKdpBinding(e.target.value as KdpBindingType)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--re-surface-2)",
                  color: "var(--re-text)",
                  border: "1px solid var(--re-border)",
                }}
              >
                {(["paperback", "hardcover"] as KdpBindingType[]).map((b) => (
                  <option key={b} value={b}>
                    {KDP_BINDING_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>

            {/* Bleed */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                Sangrado (Bleed)
              </Label>
              <select
                value={kdpBleed}
                onChange={(e) => setKdpBleed(e.target.value as KdpBleedOption)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--re-surface-2)",
                  color: "var(--re-text)",
                  border: "1px solid var(--re-border)",
                }}
              >
                {(["no_bleed", "bleed"] as KdpBleedOption[]).map((bl) => (
                  <option key={bl} value={bl}>
                    {KDP_BLEED_LABELS[bl]}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Count */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                Número de páginas (par)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={24}
                  max={828}
                  step={2}
                  value={kdpPageCount}
                  onChange={(e) => setKdpPageCount(Number(e.target.value))}
                  className="w-32"
                />
                <input
                  type="range"
                  min={24}
                  max={828}
                  step={2}
                  value={kdpPageCount}
                  onChange={(e) => setKdpPageCount(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
                  {kdpPageCount} págs
                </span>
              </div>
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={handleKdpCalculate}
            disabled={kdpCalculating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center"
            style={{
              background: "linear-gradient(135deg, #F5C842 0%, #e6a817 100%)",
              color: "#000",
              boxShadow: "0 0 16px #F5C84240",
              opacity: kdpCalculating ? 0.7 : 1,
            }}
          >
            {kdpCalculating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</>
            ) : (
              <><Ruler className="w-4 h-4" /> Calcular Dimensiones de Portada</>
            )}
          </button>

          {/* Error */}
          {kdpError && (
            <div
              className="mt-3 rounded-lg px-3 py-2 text-xs"
              style={{ color: "var(--re-danger, #ef4444)", background: "#ef444410", border: "1px solid #ef444430" }}
            >
              {kdpError}
            </div>
          )}

          {/* Results */}
          {kdpResult && (
            <div className="mt-4 space-y-3">
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--re-gold, #F5C842)" }}>
                  Dimensiones de Portada Completa
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Ancho total</p>
                    <p className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
                      {kdpResult.fullWidthIn}&quot; ({kdpResult.fullWidthMm} mm)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Alto total</p>
                    <p className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
                      {kdpResult.fullHeightIn}&quot; ({kdpResult.fullHeightMm} mm)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Resolución (300 DPI)</p>
                    <p className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
                      {kdpResult.fullWidthPx} x {kdpResult.fullHeightPx} px
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--re-cyan, #2DD4D4)" }}>
                  Lomo (Spine)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Ancho del lomo</p>
                    <p className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
                      {kdpResult.spineWidthIn}&quot; ({kdpResult.spineWidthMm} mm)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Sangrado por lado</p>
                    <p className="text-sm font-bold" style={{ color: "var(--re-text)" }}>
                      {kdpResult.bleedIn}&quot; ({(kdpResult.bleedIn * 25.4).toFixed(2)} mm)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--re-text-subtle)" }}>Texto en lomo</p>
                    <p className="text-sm font-bold" style={{ color: kdpResult.spineTextRecommended ? "var(--re-success, #22d3a0)" : "var(--re-danger, #ef4444)" }}>
                      {kdpResult.spineTextRecommended ? "Recomendado" : "No recomendado (lomo < 0.5\")"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{ background: "var(--re-surface-2)", border: "1px solid var(--re-border)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--re-blue-light, #1B40C0)" }}>
                  Configuración Usada
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p style={{ color: "var(--re-text-subtle)" }}>Trim Size</p>
                    <p className="font-medium" style={{ color: "var(--re-text)" }}>{kdpResult.trimSize.label}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--re-text-subtle)" }}>Papel</p>
                    <p className="font-medium" style={{ color: "var(--re-text)" }}>{KDP_PAPER_LABELS[kdpResult.paperType]}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--re-text-subtle)" }}>Encuadernación</p>
                    <p className="font-medium" style={{ color: "var(--re-text)" }}>{KDP_BINDING_LABELS[kdpResult.binding]}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--re-text-subtle)" }}>Páginas</p>
                    <p className="font-medium" style={{ color: "var(--re-text)" }}>{kdpResult.pageCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Invite Client Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleInviteClient}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: "var(--re-blue-light)" }} />
                Invitar Cliente al Portal
              </DialogTitle>
              <DialogDescription>
                El cliente recibirá un email para registrarse con contraseña y acceder a su proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-name">Nombre del cliente</Label>
                <Input
                  id="invite-name"
                  placeholder="Nombre completo (opcional)"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email del cliente *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              {inviteResult && (
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: inviteResult.success ? "#22d3a010" : "#ef444410",
                    color: inviteResult.success ? "var(--re-success, #22d3a0)" : "var(--re-danger, #ef4444)",
                    border: inviteResult.success ? "1px solid #22d3a030" : "1px solid #ef444430",
                  }}
                >
                  {inviteResult.success && <CheckCheck className="w-4 h-4 inline mr-1" />}
                  {inviteResult.message}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                {inviting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Enviar Invitación</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
