"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Clock,
  BookOpen,
  User2,
  FileOutput,
  Play,
  ArrowRight,
  Zap,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UIStageData, UIStageStatus } from "./pipeline-stages";

// ─── Status visual config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  UIStageStatus,
  {
    ring: string;
    bg: string;
    text: string;
    connector: string;
    selectedRing: string;
    label: string;
  }
> = {
  completed: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    connector: "bg-emerald-500/50",
    selectedRing: "ring-emerald-400",
    label: "Completado",
  },
  active: {
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    connector: "bg-border/60",
    selectedRing: "ring-blue-400",
    label: "En progreso",
  },
  needs_review: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    connector: "bg-border/60",
    selectedRing: "ring-amber-400",
    label: "Requiere revisión",
  },
  pending: {
    ring: "ring-border/40",
    bg: "bg-muted/30",
    text: "text-muted-foreground/60",
    connector: "bg-border/40",
    selectedRing: "ring-foreground/40",
    label: "Pendiente",
  },
  blocked: {
    ring: "ring-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-400",
    connector: "bg-border/60",
    selectedRing: "ring-red-400",
    label: "Error",
  },
};

function StageIcon({
  status,
  size = "sm",
}: {
  status: UIStageStatus;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  switch (status) {
    case "completed":
      return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
    case "active":
      return <Loader2 className={cn(cls, "text-blue-500 animate-spin")} />;
    case "needs_review":
      return <Clock className={cn(cls, "text-amber-500")} />;
    case "blocked":
      return <AlertTriangle className={cn(cls, "text-red-500")} />;
    default:
      return <Circle className={cn(cls, "text-muted-foreground/40")} />;
  }
}

// ─── Compute next action helper ──────────────────────────────────────

function computeNextAction(stages: UIStageData[]): {
  label: string;
  stageId: string | null;
} {
  const needsReview = stages.find((s) => s.status === "needs_review");
  if (needsReview) {
    return {
      label: `Revisar: ${needsReview.stage.label}`,
      stageId: needsReview.stage.id,
    };
  }
  const active = stages.find((s) => s.status === "active");
  if (active) {
    return {
      label: `En progreso: ${active.stage.label}`,
      stageId: active.stage.id,
    };
  }
  const pending = stages.find((s) => s.status === "pending");
  if (pending) {
    return {
      label: `Siguiente: ${pending.stage.label}`,
      stageId: pending.stage.id,
    };
  }
  if (stages.every((s) => s.status === "completed")) {
    return { label: "Pipeline completado", stageId: null };
  }
  return { label: "", stageId: null };
}

// ─── AI Pipeline inline labels ───────────────────────────────────────

const AI_STAGE_LABELS: Record<string, string> = {
  ingesta: "Análisis del manuscrito",
  estructura: "Edición estructural",
  estilo: "Edición de línea",
  ortotipografia: "Corrección de estilo",
  maquetacion: "Maquetación",
  revision_final: "Revisión final",
  export: "Exportación",
  distribution: "Distribución",
};

// ─── Props ───────────────────────────────────────────────────────────

interface PipelineStageBarProps {
  stages: UIStageData[];
  selectedStageId: string | null;
  onSelectStage: (stageId: string) => void;
  progressPercent: number;
  projectId: string;
  hasManuscript: boolean;
  onPipelineComplete?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function PipelineStageBar({
  stages,
  selectedStageId,
  onSelectStage,
  progressPercent,
  projectId,
  hasManuscript,
  onPipelineComplete,
}: PipelineStageBarProps) {
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const activeCount = stages.filter(
    (s) => s.status === "active" || s.status === "needs_review"
  ).length;
  const blockedCount = stages.filter((s) => s.status === "blocked").length;
  const nextAction = computeNextAction(stages);

  // ─── Inline AI pipeline runner state ─────────────────────────────
  const [aiRunning, setAiRunning] = useState(false);
  const [aiStarting, setAiStarting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStages, setAiStages] = useState<
    { stageKey: string; status: string }[]
  >([]);
  const [aiIsProcessing, setAiIsProcessing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAiProgress = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/process-all`
      );
      const json = await res.json();
      if (json.success) {
        setAiStages(json.stages ?? []);
        setAiIsProcessing(json.isProcessing ?? false);
        if (!json.isProcessing && aiRunning) {
          setAiRunning(false);
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
  }, [projectId, aiRunning, onPipelineComplete]);

  useEffect(() => {
    if (aiRunning && !pollingRef.current) {
      pollingRef.current = setInterval(fetchAiProgress, 5000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [aiRunning, fetchAiProgress]);

  // Initial fetch to detect already-running pipeline
  useEffect(() => {
    fetchAiProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStartPipeline() {
    setAiStarting(true);
    setAiError(null);
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/process-all`,
        { method: "POST" }
      );
      const json = await res.json();
      if (json.success) {
        setAiRunning(true);
        fetchAiProgress();
      } else {
        setAiError(json.error ?? "No se pudo iniciar el pipeline IA.");
      }
    } catch {
      setAiError("Error de red al iniciar el pipeline IA.");
    } finally {
      setAiStarting(false);
    }
  }

  // AI progress stats
  const aiCompleted = aiStages.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const aiFailed = aiStages.filter((s) => s.status === "failed").length;
  const aiTotal = aiStages.length;
  const aiProgressPercent =
    aiTotal > 0 ? Math.round((aiCompleted / aiTotal) * 100) : 0;
  const currentAiStage = aiStages.find(
    (s) => s.status === "processing" || s.status === "queued"
  );

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Header: Progress + integrated AI Run button */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-tight">
              Progreso de Producción Editorial
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleStartPipeline}
              disabled={aiStarting || aiIsProcessing || !hasManuscript}
              className={cn(
                "gap-1.5 text-xs shadow-md transition-all duration-200 h-8",
                aiIsProcessing
                  ? "bg-muted text-muted-foreground"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02]"
              )}
            >
              {aiStarting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : aiIsProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {aiStarting
                ? "Iniciando..."
                : aiIsProcessing
                ? "Pipeline IA en ejecución"
                : "Ejecutar Pipeline IA"}
            </Button>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-muted-foreground">
          <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {progressPercent}%
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {completedCount} completadas
          </span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 text-blue-500" />
              {activeCount} en progreso
            </span>
          )}
          {blockedCount > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              {blockedCount} errores
            </span>
          )}
          <span className="ml-auto">
            {stages.length - completedCount} restantes
          </span>
        </div>

        {/* AI Pipeline inline progress (when running) */}
        {aiIsProcessing && currentAiStage && (
          <div className="mt-3 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 mb-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span className="font-semibold">Pipeline IA en ejecución</span>
              <span className="ml-auto tabular-nums font-bold">
                {aiProgressPercent}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-blue-500/20 overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 animate-pulse"
                style={{ width: `${aiProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-blue-300/80">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                Etapa {aiStages.indexOf(currentAiStage) + 1} de {aiTotal} —{" "}
                {AI_STAGE_LABELS[currentAiStage.stageKey] ??
                  currentAiStage.stageKey}
              </span>
            </div>
          </div>
        )}

        {/* AI Pipeline completed summary */}
        {!aiIsProcessing && aiTotal > 0 && aiCompleted > 0 && (
          <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">
                Pipeline IA: {aiCompleted}/{aiTotal} etapas completadas
              </span>
              {aiFailed > 0 && (
                <span className="flex items-center gap-1 text-red-400 ml-2">
                  <XCircle className="h-3 w-3" />
                  {aiFailed} errores
                </span>
              )}
            </div>
          </div>
        )}

        {/* No manuscript warning */}
        {!hasManuscript && (
          <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Sube un manuscrito primero para ejecutar el pipeline IA.
          </div>
        )}

        {/* AI Error */}
        {aiError && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {aiError}
          </div>
        )}

        {/* "Tu siguiente paso" indicator */}
        {nextAction.label && (
          <button
            type="button"
            onClick={() => {
              if (nextAction.stageId) onSelectStage(nextAction.stageId);
            }}
            className="mt-3 w-full rounded-lg bg-indigo-500/5 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300 flex items-center gap-2 hover:bg-indigo-500/10 transition-colors cursor-pointer group"
          >
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            <span className="font-medium">Tu siguiente paso:</span>
            <span className="text-indigo-400 font-semibold">
              {nextAction.label}
            </span>
          </button>
        )}
      </div>

      {/* Pipeline nodes — smooth horizontal scroll */}
      <div
        className="overflow-x-auto scroll-smooth px-6 py-4 pb-5"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-start min-w-max gap-0">
          {stages.map((stageData, index) => {
            const config = STATUS_CONFIG[stageData.status];
            const isLast = index === stages.length - 1;
            const isSelected = selectedStageId === stageData.stage.id;

            return (
              <div
                key={stageData.stage.id}
                className="flex items-start flex-1 min-w-0"
              >
                {/* Stage card */}
                <button
                  type="button"
                  onClick={() => onSelectStage(stageData.stage.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 group cursor-pointer relative transition-all duration-200 px-1",
                    "hover:scale-105 focus-visible:outline-none"
                  )}
                >
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full ring-2 transition-all duration-300",
                      isSelected ? "h-10 w-10" : "h-8 w-8",
                      config.bg,
                      isSelected ? config.selectedRing : config.ring,
                      isSelected && "ring-[3px] shadow-lg"
                    )}
                  >
                    <StageIcon
                      status={stageData.status}
                      size={isSelected ? "md" : "sm"}
                    />
                  </div>

                  {/* Label + metadata */}
                  <div className="flex flex-col items-center gap-0.5 w-[72px]">
                    <span
                      className={cn(
                        "text-[10px] font-semibold leading-tight text-center whitespace-nowrap transition-colors duration-200",
                        isSelected ? "text-foreground" : config.text
                      )}
                    >
                      {stageData.stage.shortLabel}
                    </span>
                    <span
                      className={cn("text-[8px] font-medium", config.text)}
                    >
                      {config.label}
                    </span>
                    {stageData.totalCount > 0 && (
                      <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                        {stageData.completedCount}/{stageData.totalCount}
                      </span>
                    )}
                    {/* Assigned editor */}
                    {stageData.assignedEditor && (
                      <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/50 mt-0.5">
                        <User2 className="h-2.5 w-2.5" />
                        <span className="truncate max-w-[56px]">
                          {stageData.assignedEditor}
                        </span>
                      </span>
                    )}
                    {/* Main output artifact */}
                    <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/40 mt-0.5">
                      <FileOutput className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[56px]">
                        {stageData.stage.mainArtifact}
                      </span>
                    </span>
                  </div>

                  {/* Selected indicator dot */}
                  {isSelected && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground/80" />
                  )}
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 flex items-center pt-4 px-0.5 min-w-[12px]">
                    <div
                      className={cn(
                        "h-0.5 w-full rounded-full transition-colors duration-500",
                        config.connector
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
