"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  Play,
  Pause,
  SkipForward,
  Send,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientTimelineState, ClientTimelineStageView } from "@/lib/editorial/timeline/types";

interface StaffTimelineControlProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  locked: "bg-gray-100 text-gray-400",
  upcoming: "bg-amber-50 text-amber-600",
  active: "bg-blue-50 text-blue-600",
  completed: "bg-green-50 text-green-600",
};

const STATUS_LABELS: Record<string, string> = {
  locked: "Bloqueado",
  upcoming: "Proximo",
  active: "Activo",
  completed: "Completado",
};

export function StaffTimelineControl({ projectId }: StaffTimelineControlProps) {
  const [timeline, setTimeline] = useState<ClientTimelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [reason, setReason] = useState("");

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/timeline/${projectId}`);
      const json = await res.json();
      if (json.success) {
        setTimeline(json.timeline);
      } else {
        setError(json.error ?? "Error al cargar timeline");
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  async function applyOverride(
    overrideType: string,
    stageKey?: string,
    payload?: Record<string, unknown>
  ) {
    setActionLoading(`${overrideType}-${stageKey ?? "all"}`);
    try {
      const res = await fetch(`/api/editorial/timeline/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideType, stageKey, payload, reason: reason || undefined }),
      });
      const json = await res.json();
      if (json.success && json.timeline) {
        setTimeline(json.timeline);
        setReason("");
        setMessageText("");
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm text-red-600">{error ?? "No se pudo cargar el timeline"}</p>
        <Button variant="outline" size="sm" onClick={fetchTimeline} className="ml-auto">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Timeline del Cliente
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Dia {timeline.currentDay} de {timeline.totalDays} &middot; Progreso: {timeline.overallProgress}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            {timeline.isPaused ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => applyOverride("resume")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "resume-all" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Reanudar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => applyOverride("pause")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "pause-all" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
                Pausar
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${timeline.overallProgress}%` }}
          />
        </div>

        {timeline.isPaused && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
            <Pause className="w-3 h-3" />
            Timeline pausado — el cliente no vera avances nuevos
          </div>
        )}
      </div>

      {/* Reason field */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <label className="text-xs font-medium text-gray-500 mb-1 block">
          Razon del override (opcional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Cliente premium, adelantar entrega..."
          className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-300"
        />
      </div>

      {/* Stage controls */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Control por Etapa
          </h4>
        </div>
        <div className="divide-y divide-gray-100">
          {timeline.stages.map((stage: ClientTimelineStageView) => {
            const isExpanded = expandedStage === stage.stageKey;
            return (
              <div key={stage.stageKey}>
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.stageKey)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="shrink-0">
                    <Calendar className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{stage.title}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[stage.status]}`}>
                        {STATUS_LABELS[stage.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Dia {stage.day} &middot; {stage.stageKey}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 bg-gray-50 space-y-2">
                    <p className="text-xs text-gray-500">{stage.message}</p>
                    <div className="flex flex-wrap gap-2">
                      {stage.status === "locked" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8"
                          onClick={() => applyOverride("reveal_early", stage.stageKey)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `reveal_early-${stage.stageKey}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          Revelar Ahora
                        </Button>
                      )}
                      {(stage.status === "active" || stage.status === "upcoming") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => applyOverride("complete_stage", stage.stageKey)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `complete_stage-${stage.stageKey}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Completar
                        </Button>
                      )}
                      {stage.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 border-gray-200 text-gray-500"
                          onClick={() => applyOverride("skip", stage.stageKey)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `skip-${stage.stageKey}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <SkipForward className="w-3 h-3" />
                          )}
                          Saltar
                        </Button>
                      )}
                    </div>

                    {/* Send message to this stage */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={expandedStage === stage.stageKey ? messageText : ""}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Mensaje personalizado para el cliente..."
                        className="flex-1 h-8 px-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-300"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() =>
                          applyOverride("send_message", stage.stageKey, {
                            message: messageText,
                          })
                        }
                        disabled={!messageText.trim() || actionLoading !== null}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Artifacts count */}
                    {stage.artifacts.length > 0 && (
                      <p className="text-xs text-gray-400">
                        {stage.artifacts.length} artefacto(s) visibles
                      </p>
                    )}
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
