"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Code2,
  Palette,
  FileText,
  TestTube2,
  Rocket,
  Headphones,
  ClipboardList,
  PenTool,
  Upload,
} from "lucide-react";
import type { WebStageKey, WebStageStatus } from "@/lib/ikingdom/types/web-project";
import {
  WEB_STAGE_KEYS,
  WEB_STAGE_LABELS,
  WEB_STAGE_DESCRIPTIONS,
  WEB_SERVICE_TYPE_LABELS,
} from "@/lib/ikingdom/pipeline/constants";

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

const STAGE_ICONS: Record<WebStageKey, React.ElementType> = {
  briefing: ClipboardList,
  diseno: Palette,
  desarrollo: Code2,
  contenido: PenTool,
  revision: FileText,
  testing: TestTube2,
  lanzamiento: Rocket,
  soporte: Headphones,
};

function getStageStatusStyle(status: WebStageStatus) {
  switch (status) {
    case "completed":
      return { bg: "#00d4aa20", border: "#00d4aa50", text: "#00d4aa", icon: CheckCircle2, label: "Completada" };
    case "processing":
      return { bg: "#3b82f620", border: "#3b82f650", text: "#3b82f6", icon: Loader2, label: "En Proceso" };
    case "review_required":
      return { bg: "#f59e0b20", border: "#f59e0b50", text: "#f59e0b", icon: AlertCircle, label: "Revisi\u00f3n Requerida" };
    case "failed":
      return { bg: "#ef444420", border: "#ef444450", text: "#ef4444", icon: AlertCircle, label: "Error" };
    case "queued":
      return { bg: "#8b5cf620", border: "#8b5cf650", text: "#8b5cf6", icon: Clock, label: "En Cola" };
    default:
      return { bg: "#88888810", border: "#88888830", text: "#555555", icon: Clock, label: "Pendiente" };
  }
}

interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  domain: string | null;
  service_type: string | null;
  current_stage: WebStageKey;
  status: string;
  progress_percent: number;
  tech_stack: string | null;
  client_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface StageData {
  id: string;
  stage_key: WebStageKey;
  status: WebStageStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface FileData {
  id: string;
  file_name: string;
  stage_key: string | null;
  file_type: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const ALLOWED_FILE_TYPES = ".pdf,.docx,.doc,.psd,.ai,.fig,.sketch,.zip,.png,.jpg,.jpeg,.svg,.mp4,.html,.css,.js,.ts,.tsx,.jsx";
const MAX_FILE_SIZE_MB = 100;

export default function IKingdomProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  const [changingStage, setChangingStage] = useState(false);
  const [stageChangeError, setStageChangeError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ikingdom/projects/${projectId}/progress`);
      const json = await res.json();
      if (json.success) {
        setProject(json.project);
        setStages(json.stages);
        setFiles(json.files ?? []);
      }
    } catch {
      console.error("Error fetching project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStageChange = async (targetStage: WebStageKey) => {
    if (!project || changingStage) return;
    if (targetStage === project.current_stage) return;
    setChangingStage(true);
    setStageChangeError(null);
    try {
      const res = await fetch(`/api/ikingdom/projects/${projectId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStageChangeError(json.error ?? "Error al cambiar etapa");
        return;
      }
      await fetchData();
    } catch {
      setStageChangeError("Error de conexión al cambiar etapa");
    } finally {
      setChangingStage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`El archivo excede ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const res = await fetch(`/api/ikingdom/projects/${projectId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          stageKey: project.current_stage,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setUploadError(json.error ?? "Error al obtener URL de subida");
        return;
      }
      const putRes = await fetch(json.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        setUploadError("Error al subir archivo al storage");
        return;
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
      await fetchData();
    } catch {
      setUploadError("Error de conexión al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.accent }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: P.bg, color: P.text }}>
        <AlertCircle className="w-12 h-12" style={{ color: P.danger }} />
        <p className="text-lg font-semibold">Proyecto no encontrado</p>
        <Link href="/app/ikingdom/projects" className="text-sm underline" style={{ color: P.accent }}>
          Volver a proyectos
        </Link>
      </div>
    );
  }

  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

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
        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/app/ikingdom/projects"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80"
            style={{ color: P.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a proyectos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                {project.client_name && (
                  <span className="text-sm" style={{ color: P.textMuted }}>
                    {project.client_name}
                  </span>
                )}
                {project.domain && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: P.accent }}>
                    <Globe className="w-3.5 h-3.5" />
                    {project.domain}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm mt-2 max-w-xl" style={{ color: P.textMuted }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              {
                label: "Progreso",
                value: `${project.progress_percent}%`,
                color: P.accent,
              },
              {
                label: "Etapa Actual",
                value: WEB_STAGE_LABELS[project.current_stage] ?? project.current_stage,
                color: P.blue,
              },
              ...(project.service_type
                ? [
                    {
                      label: "Servicio",
                      value: WEB_SERVICE_TYPE_LABELS[project.service_type] ?? project.service_type,
                      color: P.gold,
                    },
                  ]
                : []),
              ...(project.tech_stack
                ? [
                    {
                      label: "Tech Stack",
                      value: project.tech_stack,
                      color: "#a78bfa",
                    },
                  ]
                : []),
            ].map((card) => (
              <div
                key={card.label}
                className="px-4 py-3 rounded-xl"
                style={{ background: P.surface, border: `1px solid ${P.border}` }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: P.textSubtle }}>
                  {card.label}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: card.color }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold mb-6">Pipeline de Construcci\u00f3n</h2>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: P.surface3 }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${project.progress_percent}%`,
                background: "linear-gradient(90deg, #00d4aa, #3b82f6)",
                boxShadow: "0 0 12px rgba(0,212,170,0.4)",
              }}
            />
          </div>
        </div>

        {/* Stage change error */}
        {stageChangeError && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {stageChangeError}
          </div>
        )}

        {/* Stage cards */}
        <div className="space-y-3">
          {WEB_STAGE_KEYS.map((key, idx) => {
            const stage = stageMap.get(key);
            const status = stage?.status ?? "pending";
            const style = getStageStatusStyle(status);
            const Icon = STAGE_ICONS[key];
            const StatusIcon = style.icon;
            const isCurrent = key === project.current_stage;
            const isClickable = key !== project.current_stage && !changingStage;

            return (
              <button
                key={key}
                type="button"
                disabled={!isClickable}
                onClick={() => handleStageChange(key)}
                className="w-full text-left rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: isCurrent ? `${P.surface}` : P.surface,
                  border: isCurrent ? `1px solid ${P.accent}40` : `1px solid ${P.border}`,
                  boxShadow: isCurrent ? "0 0 20px rgba(0,212,170,0.1)" : undefined,
                  opacity: changingStage ? 0.6 : 1,
                  cursor: isClickable ? "pointer" : "default",
                }}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Stage number */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: status === "completed"
                        ? "#00d4aa20"
                        : isCurrent
                        ? "#3b82f620"
                        : P.surface3,
                      border: `1px solid ${
                        status === "completed"
                          ? "#00d4aa40"
                          : isCurrent
                          ? "#3b82f640"
                          : P.border
                      }`,
                    }}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#00d4aa" }} />
                    ) : (
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: isCurrent ? P.blue : P.textSubtle,
                        }}
                      />
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: P.textSubtle }}
                      >
                        Etapa {idx + 1}
                      </span>
                      {isCurrent && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
                        >
                          Actual
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-sm font-semibold mt-0.5"
                      style={{
                        color: status === "completed" ? P.accent : isCurrent ? P.text : P.textMuted,
                      }}
                    >
                      {WEB_STAGE_LABELS[key]}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: P.textSubtle }}>
                      {WEB_STAGE_DESCRIPTIONS[key]}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5"
                    style={{
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${status === "processing" ? "animate-spin" : ""}`}
                    />
                    {style.label}
                  </div>
                </div>

                {/* Timestamp info */}
                {stage && (stage.started_at || stage.completed_at) && (
                  <div
                    className="flex items-center gap-4 px-4 pb-3 text-[10px]"
                    style={{ color: P.textSubtle }}
                  >
                    {stage.started_at && (
                      <span>
                        Inicio:{" "}
                        {new Date(stage.started_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {stage.completed_at && (
                      <span>
                        Fin:{" "}
                        {new Date(stage.completed_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* File upload section */}
        <div
          className="mt-8 rounded-xl p-5"
          style={{ background: P.surface, border: `1px solid ${P.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">Archivos del Proyecto</h3>
            <label
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: uploading ? P.surface3 : P.accent,
                color: uploading ? P.textMuted : "#000",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Subiendo..." : "Subir Archivo"}
              <input
                type="file"
                accept={ALLOWED_FILE_TYPES}
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {uploadError && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
              style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
              style={{ background: "#00d4aa20", color: "#00d4aa", border: "1px solid #00d4aa40" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Archivo subido correctamente
            </div>
          )}

          {files.length === 0 ? (
            <p className="text-xs" style={{ color: P.textSubtle }}>
              No hay archivos subidos aún.
            </p>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: P.surface3, border: `1px solid ${P.border}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.file_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px]" style={{ color: P.textSubtle }}>
                        {formatBytes(f.size_bytes)}
                      </span>
                      {f.stage_key && (
                        <span className="text-[10px]" style={{ color: P.accent }}>
                          {WEB_STAGE_LABELS[f.stage_key as WebStageKey] ?? f.stage_key}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: P.textSubtle }}>
                        {new Date(f.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: P.surface, color: P.textMuted, border: `1px solid ${P.border}` }}
                  >
                    .{f.file_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project meta */}
        <div
          className="mt-8 rounded-xl p-5"
          style={{ background: P.surface, border: `1px solid ${P.border}` }}
        >
          <h3 className="text-sm font-bold mb-3">Detalles del Proyecto</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: P.textSubtle }}>
                Creado
              </p>
              <p className="text-sm font-medium mt-0.5">
                {new Date(project.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {project.due_date && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: P.textSubtle }}>
                  Fecha L\u00edmite
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(project.due_date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {project.service_type && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: P.textSubtle }}>
                  Tipo de Servicio
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {WEB_SERVICE_TYPE_LABELS[project.service_type] ?? project.service_type}
                </p>
              </div>
            )}
            {project.tech_stack && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: P.textSubtle }}>
                  Tecnolog\u00edas
                </p>
                <p className="text-sm font-medium mt-0.5">{project.tech_stack}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
