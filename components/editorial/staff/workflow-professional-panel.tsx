"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { ProjectWorkflowDetail } from "@/lib/editorial/types/workflow";

// ─── Status labels & colors ─────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  needs_review: "Revision",
  completed: "Completado",
  blocked: "Bloqueado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "default",
  needs_review: "outline",
  completed: "secondary",
  blocked: "destructive",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────────────────

interface WorkflowProfessionalPanelProps {
  projectId: string;
}

export function WorkflowProfessionalPanel({ projectId }: WorkflowProfessionalPanelProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<ProjectWorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [advancing, setAdvancing] = useState(false);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
        // Auto-expand current phase
        if (json.data.workflow?.current_phase) {
          setExpandedPhases((prev) => new Set([...prev, json.data.workflow.current_phase]));
        }
      } else {
        setError(json.error ?? "Error cargando workflow");
      }
    } catch {
      setError("Error de red al cargar workflow");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  function togglePhase(phaseKey: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseKey)) next.delete(phaseKey);
      else next.add(phaseKey);
      return next;
    });
  }

  async function handleAdvance() {
    setAdvancing(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo avanzar");
        return;
      }
      await fetchWorkflow();
      router.refresh();
    } catch {
      setError("Error de red al avanzar workflow");
    } finally {
      setAdvancing(false);
    }
  }

  async function handleUpdateStage(
    phaseKey: string,
    stageKey: string,
    status: string
  ) {
    try {
      await fetch(`/api/editorial/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_stage",
          phaseKey,
          stageKey,
          status,
        }),
      });
      await fetchWorkflow();
    } catch {
      setError("Error actualizando etapa");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando workflow profesional...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {error ?? "No se encontro el workflow para este proyecto."}
        </CardContent>
      </Card>
    );
  }

  const { workflow, phases } = detail;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <Card className="bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Workflow Editorial Profesional</CardTitle>
              <CardDescription>
                {workflow.status === "completed"
                  ? "Workflow completado"
                  : `Fase actual: ${phases.find((p) => p.isCurrent)?.phase.name ?? "—"}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold">{workflow.progress_percent}%</div>
                <div className="text-xs text-muted-foreground">Progreso</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={workflow.progress_percent} className="h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Intake</span>
            <span>Distribution</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Phase list */}
      <div className="space-y-2">
        {phases.map(({ phase, stages, isComplete, isCurrent }) => {
          const isExpanded = expandedPhases.has(phase.phase_key);
          const completedCount = stages.filter(
            (s) => s.status?.status === "completed"
          ).length;
          const totalCount = stages.length;

          return (
            <Card
              key={phase.phase_key}
              className={`bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md ${
                isCurrent
                  ? "border-primary/50 shadow-sm"
                  : isComplete
                    ? "opacity-75"
                    : ""
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => togglePhase(phase.phase_key)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        ) : isCurrent ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-sm">
                            {phase.order}. {phase.name}
                          </span>
                          {phase.description && (
                            <p className="text-xs text-muted-foreground">
                              {phase.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalCount}
                      </span>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Actual
                        </Badge>
                      )}
                      {isComplete && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-emerald-500/10 text-emerald-600"
                        >
                          Completada
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-3">
                  <ul className="space-y-0 border-t">
                    {stages.map(({ definition: stageDef, status: stageStatus }, i) => {
                      const isCurrentStage =
                        isCurrent &&
                        workflow.current_stage === stageDef.stage_key;
                      const stStatus = stageStatus?.status ?? "pending";

                      return (
                        <li
                          key={stageDef.stage_key}
                          className={`flex items-center justify-between gap-2 py-2.5 ${
                            i < stages.length - 1 ? "border-b" : ""
                          } ${isCurrentStage ? "bg-muted/40 -mx-3 px-3 rounded" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Stage type indicators */}
                            <div className="flex items-center gap-1">
                              {stageDef.is_ai_stage && (
                                <Bot className="h-3.5 w-3.5 text-blue-500" aria-label="AI Stage" />
                              )}
                              {stageDef.human_required && (
                                <User className="h-3.5 w-3.5 text-amber-500" aria-label="Human Required" />
                              )}
                              {stageDef.requires_approval && (
                                <ShieldCheck className="h-3.5 w-3.5 text-purple-500" aria-label="Approval Required" />
                              )}
                            </div>
                            <span className="text-sm">{stageDef.name}</span>
                            {isCurrentStage && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                Actual
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {stageStatus?.started_at && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                {formatDate(stageStatus.started_at)}
                              </span>
                            )}
                            <Badge
                              variant={STATUS_VARIANT[stStatus] ?? "secondary"}
                              className="text-[10px]"
                            >
                              {STATUS_LABEL[stStatus] ?? stStatus}
                            </Badge>
                            {isCurrentStage && stStatus !== "completed" && (
                              <div className="flex gap-1">
                                {stStatus === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStage(
                                        phase.phase_key,
                                        stageDef.stage_key,
                                        "processing"
                                      );
                                    }}
                                  >
                                    Iniciar
                                  </Button>
                                )}
                                {stStatus === "processing" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStage(
                                        phase.phase_key,
                                        stageDef.stage_key,
                                        "completed"
                                      );
                                    }}
                                  >
                                    Completar
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Advance button at bottom of current phase */}
                  {isCurrent && workflow.status !== "completed" && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAdvance}
                        disabled={advancing}
                        className="gap-1.5 hos-btn-primary border-0"
                      >
                        {advancing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        Avanzar workflow
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <Bot className="h-3 w-3 text-blue-500" /> AI
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-amber-500" /> Humano
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-purple-500" /> Aprobacion
        </span>
      </div>
    </div>
  );
}
