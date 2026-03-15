"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Bot,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PdfPreviewModal } from "./pdf-preview-modal";

// ─── Types ────────────────────────────────────────────────────────────

interface ArtifactItem {
  id: string;
  file_name: string;
  file_type: string;
  version: number;
  generated_by: "ai" | "human" | "system";
  status: "generating" | "ready" | "failed" | "superseded";
  mime_type: string;
  size_bytes: number | null;
  metadata: Record<string, string> | null;
  created_at: string;
  stage_key: string;
}

// ─── Labels en español ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  generating: "Generando",
  ready: "Listo",
  failed: "Error",
  superseded: "Versión anterior",
};

const STATUS_COLORS: Record<string, string> = {
  generating: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
  superseded: "bg-muted/60 text-muted-foreground border-border/40",
};

const GENERATED_BY_LABELS: Record<string, { label: string; icon: typeof Bot }> = {
  ai: { label: "IA", icon: Bot },
  human: { label: "Humano", icon: User },
  system: { label: "Sistema", icon: Settings },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Props ────────────────────────────────────────────────────────────

interface StageDocumentCenterProps {
  projectId: string;
  stageKey: string;
  /** The legacy stage key used to query artifacts (maps UI stage to DB stage) */
  dbStageKeys?: string[];
}

// ─── Component ────────────────────────────────────────────────────────

export function StageDocumentCenter({
  projectId,
  stageKey,
  dbStageKeys,
}: StageDocumentCenterProps) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewMeta, setPreviewMeta] = useState<Record<string, string> | undefined>();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch artifacts for all relevant DB stage keys
      const keys = dbStageKeys ?? [stageKey];
      const allArtifacts: ArtifactItem[] = [];

      for (const key of keys) {
        const res = await fetch(
          `/api/editorial/projects/${projectId}/artifacts?stage=${key}`
        );
        const json = await res.json();
        if (json.success && json.artifacts) {
          allArtifacts.push(...json.artifacts);
        }
      }

      setArtifacts(allArtifacts);
    } catch {
      console.error("[StageDocumentCenter] Error fetching artifacts");
    } finally {
      setLoading(false);
    }
  }, [projectId, stageKey, dbStageKeys]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const currentArtifacts = artifacts.filter((a) => a.status === "ready" || a.status === "generating");
  const historicalArtifacts = artifacts.filter((a) => a.status === "superseded" || a.status === "failed");

  async function handleDownload(artifact: ArtifactItem) {
    setDownloadingId(artifact.id);
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/artifacts/${artifact.id}/download`
      );
      const json = await res.json();
      if (json.success && json.url) {
        const a = document.createElement("a");
        a.href = json.url;
        a.download = json.fileName ?? artifact.file_name;
        a.target = "_blank";
        a.click();
      }
    } catch {
      console.error("[StageDocumentCenter] Download error");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePreview(artifact: ArtifactItem) {
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/artifacts/${artifact.id}/download`
      );
      const json = await res.json();
      if (json.success && json.url) {
        setPreviewUrl(json.url);
        setPreviewName(artifact.file_name);
        setPreviewMeta(artifact.metadata ?? undefined);
      }
    } catch {
      console.error("[StageDocumentCenter] Preview error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Cargando archivos de la etapa...
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-5 text-center">
        <FileText className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground/60">
          No hay archivos generados para esta etapa todavía.
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          Ejecuta el Pipeline IA para generar documentos automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-semibold">Archivos de la Etapa</h4>
          <Badge variant="outline" className="text-[10px]">
            {currentArtifacts.length} archivo{currentArtifacts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchArtifacts}
          className="h-7 px-2 text-xs gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Actualizar
        </Button>
      </div>

      {/* Current artifacts */}
      <div className="space-y-2">
        {currentArtifacts.map((artifact) => {
          const genBy = GENERATED_BY_LABELS[artifact.generated_by] ?? GENERATED_BY_LABELS.system;
          const GenIcon = genBy.icon;
          const isDownloading = downloadingId === artifact.id;
          const isPdf = artifact.file_type === "pdf";

          return (
            <div
              key={artifact.id}
              className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-4 py-3 hover:bg-card/60 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">
                        {artifact.file_name}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px] border font-medium shrink-0",
                          STATUS_COLORS[artifact.status]
                        )}
                      >
                        {artifact.status === "generating" && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                        )}
                        {STATUS_LABELS[artifact.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                      <span className="flex items-center gap-1">
                        <GenIcon className="h-3 w-3" />
                        {genBy.label}
                      </span>
                      <span className="uppercase font-medium">
                        {artifact.file_type}
                      </span>
                      <span>{formatFileSize(artifact.size_bytes)}</span>
                      <span>v{artifact.version}</span>
                      <span>{formatDate(artifact.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {artifact.status === "ready" && (
                  <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {isPdf && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => handlePreview(artifact)}
                        title="Ver PDF"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => handleDownload(artifact)}
                      disabled={isDownloading}
                      title="Descargar"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      Descargar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* History toggle */}
      {historicalArtifacts.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
          >
            <History className="h-3 w-3" />
            <span>Versiones anteriores ({historicalArtifacts.length})</span>
            {showHistory ? (
              <ChevronUp className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-auto" />
            )}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {historicalArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="rounded-lg border border-border/20 bg-muted/10 px-3 py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {artifact.file_name}
                    </span>
                    <Badge
                      className={cn(
                        "text-[9px] border font-medium shrink-0",
                        STATUS_COLORS[artifact.status]
                      )}
                    >
                      {STATUS_LABELS[artifact.status]}
                    </Badge>
                  </div>
                  {artifact.status === "superseded" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] gap-1"
                      onClick={() => handleDownload(artifact)}
                    >
                      <Download className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF Preview modal */}
      {previewUrl && (
        <PdfPreviewModal
          url={previewUrl}
          fileName={previewName}
          metadata={previewMeta}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}
