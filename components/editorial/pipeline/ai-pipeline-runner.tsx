"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────

interface StageStatus {
  stageKey: string;
  status: string;
  aiSummary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  jobs: {
    jobType: string;
    status: string;
    result: Record<string, unknown> | null;
    error: string | null;
  }[];
}

interface PipelineProgress {
  currentStage: string;
  projectStatus: string;
  isProcessing: boolean;
  stages: StageStatus[];
}

// ─── Labels en español ────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  ingesta: "Análisis del manuscrito",
  estructura: "Edición estructural",
  estilo: "Edición de línea",
  ortotipografia: "Corrección de estilo",
  maquetacion: "Maquetación",
  revision_final: "Revisión final",
  export: "Exportación",
  distribution: "Distribución",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  queued: "En cola",
  processing: "Procesando",
  completed: "Completado",
  failed: "Error",
  pending: "Pendiente",
};

// ─── Props ────────────────────────────────────────────────────────────

interface AiPipelineRunnerProps {
  projectId: string;
  hasManuscript: boolean;
  onPipelineComplete?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function AiPipelineRunner({
  projectId,
  hasManuscript,
  onPipelineComplete,
}: AiPipelineRunnerProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`);
      const json = await res.json();
      if (json.success) {
        setProgress(json);
        if (!json.isProcessing && running) {
          setRunning(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          onPipelineComplete?.();
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, [projectId, running, onPipelineComplete]);

  // Start polling when running
  useEffect(() => {
    if (running && !pollingRef.current) {
      pollingRef.current = setInterval(fetchProgress, 5000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [running, fetchProgress]);

  // Initial fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  async function handleStartPipeline() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setRunning(true);
        setShowDetails(true);
        // Start polling immediately
        fetchProgress();
      } else {
        setError(json.error ?? "No se pudo iniciar el pipeline IA.");
      }
    } catch {
      setError("Error de red al iniciar el pipeline IA.");
    } finally {
      setStarting(false);
    }
  }

  // Compute progress stats
  const stages = progress?.stages ?? [];
  const completedStages = stages.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const failedStages = stages.filter((s) => s.status === "failed").length;
  const processingStages = stages.filter(
    (s) => s.status === "processing" || s.status === "queued"
  ).length;
  const totalStages = stages.length;
  const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const isProcessing = progress?.isProcessing ?? false;
  const currentProcessingStage = stages.find(
    (s) => s.status === "processing" || s.status === "queued"
  );

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Pipeline IA Editorial</h3>
              <p className="text-[10px] text-muted-foreground">
                {isProcessing
                  ? "Procesamiento en curso..."
                  : completedStages > 0
                  ? `${completedStages} de ${totalStages} etapas completadas`
                  : "Ejecuta el análisis IA completo del manuscrito"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isProcessing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchProgress}
                className="h-8 px-2 text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Actualizar
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleStartPipeline}
              disabled={starting || isProcessing || !hasManuscript}
              className={cn(
                "gap-1.5 text-xs shadow-md transition-all duration-200",
                isProcessing
                  ? "bg-muted text-muted-foreground"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02]"
              )}
            >
              {starting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {starting
                ? "Iniciando..."
                : isProcessing
                ? "Pipeline en ejecución"
                : "Ejecutar Pipeline IA Completo"}
            </Button>
          </div>
        </div>

        {!hasManuscript && (
          <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Sube un manuscrito primero para ejecutar el pipeline IA.
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Progress bar (shown when stages exist) */}
      {totalStages > 0 && (
        <div className="px-6 py-3 border-b border-border/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium">Progreso del Pipeline</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                {completedStages} completadas
              </span>
              {failedStages > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-400" />
                  {failedStages} errores
                </span>
              )}
              {processingStages > 0 && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                  {processingStages} en proceso
                </span>
              )}
            </div>
          </div>

          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                isProcessing
                  ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-[length:200%_100%] animate-pulse"
                  : failedStages > 0
                  ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                  : "bg-gradient-to-r from-emerald-500 to-blue-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current processing indicator */}
          {isProcessing && currentProcessingStage && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                Etapa {stages.indexOf(currentProcessingStage) + 1} de {totalStages}
                {" — "}
                {STAGE_LABELS[currentProcessingStage.stageKey] ?? currentProcessingStage.stageKey}
              </span>
            </div>
          )}

          <div className="text-right mt-1">
            <span className="text-lg font-bold tabular-nums text-foreground">{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Stage details toggle */}
      {totalStages > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full px-6 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            {showDetails ? "Ocultar detalles" : "Ver detalles por etapa"}
          </button>

          {showDetails && (
            <div className="px-6 pb-4 space-y-2">
              {stages.map((stage, idx) => {
                const hasResult = stage.jobs.some((j) => j.status === "completed" && j.result);
                const firstResult = stage.jobs.find((j) => j.result)?.result;
                const score = firstResult && typeof firstResult === "object"
                  ? (firstResult as Record<string, unknown>).readiness_score ??
                    (firstResult as Record<string, unknown>).quality_score ??
                    null
                  : null;
                const issueCount = firstResult && typeof firstResult === "object"
                  ? ((firstResult as Record<string, unknown>).issues as unknown[] | undefined)?.length ?? 0
                  : 0;
                const suggestions = firstResult && typeof firstResult === "object"
                  ? ((firstResult as Record<string, unknown>).recommendations as unknown[] | undefined)?.length ?? 0
                  : 0;

                return (
                  <div
                    key={stage.stageKey}
                    className={cn(
                      "rounded-xl border px-4 py-3 transition-all duration-200",
                      stage.status === "completed" || stage.status === "approved"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : stage.status === "processing" || stage.status === "queued"
                        ? "border-blue-500/20 bg-blue-500/5"
                        : stage.status === "failed"
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-border/20 bg-muted/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="shrink-0">
                          {stage.status === "completed" || stage.status === "approved" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : stage.status === "processing" || stage.status === "queued" ? (
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : stage.status === "failed" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {idx + 1}. {STAGE_LABELS[stage.stageKey] ?? stage.stageKey}
                          </span>
                          {stage.status === "failed" && stage.jobs.find((j) => j.error) && (
                            <p className="text-[10px] text-red-400 mt-0.5">
                              {stage.jobs.find((j) => j.error)?.error}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] border font-medium",
                            stage.status === "completed" || stage.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : stage.status === "processing" || stage.status === "queued"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : stage.status === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-muted/60 text-muted-foreground border-border/40"
                          )}
                        >
                          {JOB_STATUS_LABELS[stage.status] ?? stage.status}
                        </Badge>
                      </div>
                    </div>

                    {/* AI completion message */}
                    {hasResult && (stage.status === "completed" || stage.status === "approved") && (
                      <div className="mt-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-3 w-3 text-emerald-400" />
                          <span className="text-[10px] font-semibold text-emerald-400">
                            IA completó: {STAGE_LABELS[stage.stageKey]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          {score !== null && (
                            <span>Puntuación: <strong className="text-foreground">{String(score)}/100</strong></span>
                          )}
                          {issueCount > 0 && (
                            <span>Problemas: <strong className="text-amber-400">{issueCount}</strong></span>
                          )}
                          {suggestions > 0 && (
                            <span>Sugerencias: <strong className="text-blue-400">{suggestions}</strong></span>
                          )}
                        </div>
                        {stage.aiSummary && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                            {stage.aiSummary}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
