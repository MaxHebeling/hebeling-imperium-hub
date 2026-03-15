"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────

interface SupervisorAlert {
  id: string;
  type: "warning" | "error" | "info" | "suggestion";
  title: string;
  description: string;
  stageKey?: string;
  projectId?: string;
  projectTitle?: string;
  timestamp: string;
}

interface SupervisorMetrics {
  activeProjects: number;
  blockedStages: number;
  avgProductionDays: number;
  aiJobsToday: number;
  errorsToday: number;
  pendingReview: number;
}

// ─── Labels ───────────────────────────────────────────────────────────

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  error: XCircle,
  info: CheckCircle2,
  suggestion: Zap,
};

const ALERT_COLORS: Record<string, string> = {
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  error: "border-red-500/30 bg-red-500/5 text-red-400",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  suggestion: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400",
};

const STAGE_LABELS: Record<string, string> = {
  ingesta: "Recepción",
  estructura: "Edición estructural",
  estilo: "Edición de línea",
  ortotipografia: "Corrección de estilo",
  maquetacion: "Maquetación",
  revision_final: "Revisión final",
  export: "Exportación",
  distribution: "Distribución",
};

// ─── Props ────────────────────────────────────────────────────────────

interface AiSupervisorPanelProps {
  projectId?: string;
  /** If true, shows project-specific view. Otherwise shows global view. */
  projectMode?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────

export function AiSupervisorPanel({
  projectId,
  projectMode = false,
}: AiSupervisorPanelProps) {
  const [metrics, setMetrics] = useState<SupervisorMetrics | null>(null);
  const [alerts, setAlerts] = useState<SupervisorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  const analyzeProject = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Fetch project pipeline status
      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`);
      const json = await res.json();

      if (!json.success) {
        setLoading(false);
        return;
      }

      const stages = json.stages ?? [];
      const generatedAlerts: SupervisorAlert[] = [];
      const now = new Date();

      // Analyze each stage for issues
      for (const stage of stages) {
        // Check for failed jobs
        const failedJobs = stage.jobs?.filter((j: { status: string }) => j.status === "failed") ?? [];
        if (failedJobs.length > 0) {
          generatedAlerts.push({
            id: `err-${stage.stageKey}`,
            type: "error",
            title: `Error en ${STAGE_LABELS[stage.stageKey] ?? stage.stageKey}`,
            description: `${failedJobs.length} trabajo(s) de IA fallaron en esta etapa. Revisa los logs y reintenta.`,
            stageKey: stage.stageKey,
            timestamp: now.toISOString(),
          });
        }

        // Check for stalled processing stages (>5 min)
        if (stage.status === "processing" && stage.startedAt) {
          const started = new Date(stage.startedAt);
          const minutes = (now.getTime() - started.getTime()) / 60000;
          if (minutes > 5) {
            generatedAlerts.push({
              id: `stall-${stage.stageKey}`,
              type: "warning",
              title: `Etapa atascada: ${STAGE_LABELS[stage.stageKey] ?? stage.stageKey}`,
              description: `Esta etapa lleva ${Math.round(minutes)} minutos procesando. Considera reiniciar el trabajo de IA.`,
              stageKey: stage.stageKey,
              timestamp: now.toISOString(),
            });
          }
        }

        // Check for stages needing review
        if (stage.status === "needs_review") {
          generatedAlerts.push({
            id: `review-${stage.stageKey}`,
            type: "info",
            title: `Revisión pendiente: ${STAGE_LABELS[stage.stageKey] ?? stage.stageKey}`,
            description: "La IA completó esta etapa. Requiere revisión y aprobación humana para continuar.",
            stageKey: stage.stageKey,
            timestamp: now.toISOString(),
          });
        }

        // AI suggestions based on results
        const completedJob = stage.jobs?.find(
          (j: { status: string; result: unknown }) => j.status === "completed" && j.result
        );
        if (completedJob?.result) {
          const result = completedJob.result as Record<string, unknown>;
          const score = (result.readiness_score ?? result.quality_score) as number | undefined;
          if (score !== undefined && score < 50) {
            generatedAlerts.push({
              id: `quality-${stage.stageKey}`,
              type: "suggestion",
              title: `Calidad baja en ${STAGE_LABELS[stage.stageKey] ?? stage.stageKey}`,
              description: `La puntuación de calidad es ${score}/100. Considera ejecutar una revisión IA adicional o asignar un editor humano.`,
              stageKey: stage.stageKey,
              timestamp: now.toISOString(),
            });
          }
        }
      }

      // Compute metrics
      const completedCount = stages.filter(
        (s: { status: string }) => s.status === "completed" || s.status === "approved"
      ).length;
      const failedCount = stages.filter(
        (s: { status: string }) => s.status === "failed"
      ).length;
      const processingCount = stages.filter(
        (s: { status: string }) => s.status === "processing" || s.status === "queued"
      ).length;
      const reviewCount = stages.filter(
        (s: { status: string }) => s.status === "needs_review"
      ).length;

      setMetrics({
        activeProjects: 1,
        blockedStages: failedCount,
        avgProductionDays: 0,
        aiJobsToday: completedCount + processingCount,
        errorsToday: failedCount,
        pendingReview: reviewCount,
      });

      setAlerts(generatedAlerts);
    } catch {
      console.error("[AiSupervisor] Error analyzing project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    analyzeProject();
  }, [analyzeProject]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground justify-center">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Analizando pipeline editorial...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Supervisor IA Editorial</h3>
              <p className="text-[10px] text-muted-foreground">
                Monitoreo inteligente del pipeline de producción
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={analyzeProject}
            className="h-8 px-2 text-xs gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Analizar
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-6 py-3 border-b border-border/20">
          <MetricCard
            icon={BookOpen}
            label="Proyectos"
            value={metrics.activeProjects}
            color="text-blue-400"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Bloqueadas"
            value={metrics.blockedStages}
            color="text-red-400"
          />
          <MetricCard
            icon={Clock}
            label="Revisión"
            value={metrics.pendingReview}
            color="text-amber-400"
          />
          <MetricCard
            icon={Zap}
            label="Jobs IA"
            value={metrics.aiJobsToday}
            color="text-indigo-400"
          />
          <MetricCard
            icon={XCircle}
            label="Errores"
            value={metrics.errorsToday}
            color="text-red-400"
          />
          <MetricCard
            icon={BarChart3}
            label="Producción"
            value={`${metrics.avgProductionDays}d`}
            color="text-emerald-400"
          />
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-6 py-3">
          <button
            type="button"
            onClick={() => setShowAlerts((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold w-full mb-2"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>
              Alertas del Supervisor ({alerts.length})
            </span>
            {showAlerts ? (
              <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
            )}
          </button>

          {showAlerts && (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const AlertIcon = ALERT_ICONS[alert.type] ?? AlertTriangle;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-xl border px-4 py-3 transition-all duration-200",
                      ALERT_COLORS[alert.type]
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{alert.title}</p>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">
                          {alert.description}
                        </p>
                        {alert.stageKey && (
                          <Badge
                            variant="outline"
                            className="text-[9px] mt-1.5 border-current/20"
                          >
                            {STAGE_LABELS[alert.stageKey] ?? alert.stageKey}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="px-6 py-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No se detectaron problemas. El pipeline funciona correctamente.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-muted/20 border border-border/20 px-2.5 py-2 text-center">
      <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", color)} />
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
