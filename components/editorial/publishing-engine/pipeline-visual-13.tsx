"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Brain,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  Eye,
  Download,
  Image,
  LayoutList,
  Pen,
  FileCheck,
  BookText,
  Rocket,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from "lucide-react";

// ─── Types (mirrors API response) ────────────────────────────────────

interface PhaseDefinition {
  key: string;
  order: number;
  label: string;
  labelEn: string;
  description: string;
  aiAgent: string | null;
  aiProvider: string;
  requiresHumanReview: boolean;
  isAiAutomated: boolean;
  outputs: { key: string; label: string; fileType: string; description: string }[];
  icon: string;
}

interface PhaseState {
  key: string;
  status: "pending" | "processing" | "completed" | "failed" | "needs_review" | "approved";
  order: number;
  label: string;
  summary: string | null;
  score: number | null;
  findings: {
    type: string;
    description: string;
    location: string | null;
    correction: string | null;
    confidence: number | null;
  }[];
  aiProvider: string;
  processingTimeMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  jobId: string | null;
}

interface PipelineResponse {
  state: {
    projectId: string;
    status: string;
    currentPhaseKey: string | null;
    currentPhaseIndex: number;
    totalPhases: number;
    completedPhases: number;
    progressPercent: number;
    phases: PhaseState[];
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
  };
  phases: PhaseDefinition[];
}

interface Props {
  projectId: string;
  onPhaseSelect?: (phaseKey: string) => void;
}

// ─── Icon Map ─────────────────────────────────────────────────────────

const PHASE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  manuscript_received: FileText,
  ai_diagnosis: Brain,
  spelling_correction: FileCheck,
  grammar_correction: FileCheck,
  style_editing: Pen,
  structural_review: LayoutList,
  theological_review: BookOpen,
  editorial_approval: CheckCircle2,
  interior_layout: BookText,
  cover_design: Image,
  final_review: Eye,
  export: Download,
  publication: Rocket,
};

// ─── Status Config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; ringColor: string; label: string }> = {
  pending: { color: "text-gray-400", bgColor: "bg-gray-100", ringColor: "ring-gray-200", label: "Pendiente" },
  processing: { color: "text-blue-600", bgColor: "bg-blue-50", ringColor: "ring-blue-400", label: "Procesando" },
  completed: { color: "text-emerald-600", bgColor: "bg-emerald-50", ringColor: "ring-emerald-400", label: "Completado" },
  failed: { color: "text-red-600", bgColor: "bg-red-50", ringColor: "ring-red-400", label: "Error" },
  needs_review: { color: "text-amber-600", bgColor: "bg-amber-50", ringColor: "ring-amber-400", label: "Revisión" },
  approved: { color: "text-emerald-600", bgColor: "bg-emerald-50", ringColor: "ring-emerald-400", label: "Aprobado" },
};

// ─── Main Component ──────────────────────────────────────────────────

export function PipelineVisual13({ projectId, onPhaseSelect }: Props) {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [runningAi, setRunningAi] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/publishing-engine`);
      if (!res.ok) throw new Error("Error al cargar el pipeline");
      const json: PipelineResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Run full AI pipeline (phase-by-phase to avoid Vercel timeout) ──
  const handleRunFullPipeline = async () => {
    setRunningAi(true);
    try {
      // Get AI-automated phases from the data we already have
      const aiPhases = (data?.phases ?? []).filter(
        (p: { isAiAutomated?: boolean; aiTaskKey?: string | null }) => p.isAiAutomated && p.aiTaskKey
      );

      for (const phase of aiPhases) {
        const res = await fetch(`/api/editorial/projects/${projectId}/publishing-engine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run-ai", phaseKey: phase.key }),
        });
        if (!res.ok) {
          console.error(`Error en fase ${phase.key}`);
        }
        // Refresh UI after each phase so user sees progress
        await fetchData();
      }
    } catch {
      // silently handle
    } finally {
      setRunningAi(false);
    }
  };

  // ── Run single phase AI ──
  const handleRunPhaseAi = async (phaseKey: string) => {
    try {
      await fetch(`/api/editorial/projects/${projectId}/publishing-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-ai", phaseKey }),
      });
      await fetchData();
    } catch {
      // silently handle
    }
  };

  // ── Advance to phase ──
  const handleAdvance = async (targetPhase: string) => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/publishing-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", targetPhase }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error("[v0] Error al aprobar fase:", json.error ?? json);
        setError(json.error ?? "Error al aprobar la fase");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error("[v0] Error en handleAdvance:", err);
      setError(err instanceof Error ? err.message : "Error de conexion");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600">{error ?? "Error al cargar"}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-red-500 underline">Reintentar</button>
      </div>
    );
  }

  const { state, phases: phaseDefinitions } = data;
  const phaseStates = state.phases;

  return (
    <div className="space-y-6">
      {/* ─── Error Toast ─────────────────────────────────────── */}
      {error && data && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:underline">
            Cerrar
          </button>
        </div>
      )}
      {/* ─── Header with progress ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pipeline Editorial</h2>
          <p className="text-sm text-gray-500">
            {state.completedPhases} de {state.totalPhases} fases completadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{state.progressPercent}%</span>
          </div>
          <button
            onClick={handleRunFullPipeline}
            disabled={runningAi}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {runningAi ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {runningAi ? "Procesando..." : "Ejecutar Pipeline IA"}
          </button>
        </div>
      </div>

      {/* ─── Global Progress Bar ──────────────────────────────── */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${state.progressPercent}%` }}
        />
      </div>

      {/* ─── Horizontal Pipeline Bar ──────────────────────────── */}
      <div className="overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-1 py-2" style={{ minWidth: "max-content" }}>
          {phaseDefinitions.map((phase, idx) => {
            const ps = phaseStates.find((p) => p.key === phase.key);
            const status = ps?.status ?? "pending";
            const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
            const Icon = PHASE_ICONS[phase.key] ?? FileText;
            const isSelected = selectedPhase === phase.key;
            const isCurrent = state.currentPhaseKey === phase.key;

            return (
              <div key={phase.key} className="flex items-center">
                {/* Node */}
                <button
                  onClick={() => {
                    setSelectedPhase(isSelected ? null : phase.key);
                    onPhaseSelect?.(phase.key);
                  }}
                  className={`group relative flex flex-col items-center transition-all duration-200 ${
                    isSelected ? "scale-105" : "hover:scale-[1.02]"
                  }`}
                >
                  {/* Circle */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-all ${config.bgColor} ${config.ringColor} ${
                      isCurrent ? "ring-4 shadow-md" : ""
                    } ${isSelected ? "ring-4 ring-blue-500 shadow-lg" : ""}`}
                  >
                    {status === "processing" ? (
                      <Loader2 className={`h-5 w-5 animate-spin ${config.color}`} />
                    ) : status === "completed" || status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : status === "failed" ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    )}
                  </div>
                  {/* Label */}
                  <span className={`mt-1.5 max-w-[72px] text-center text-[10px] font-medium leading-tight ${
                    status === "completed" || status === "approved"
                      ? "text-emerald-700"
                      : isCurrent
                      ? "text-blue-700"
                      : "text-gray-500"
                  }`}>
                    {phase.label}
                  </span>
                  {/* Order badge */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[8px] font-bold text-gray-600">
                    {phase.order}
                  </span>
                </button>
                {/* Connector */}
                {idx < phaseDefinitions.length - 1 && (
                  <div className={`mx-1 h-0.5 w-6 rounded-full ${
                    (ps?.status === "completed" || ps?.status === "approved") ? "bg-emerald-400" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Phase Detail Panel ──────────────────────── */}
      {selectedPhase && (
        <PhaseDetailPanel
          phaseKey={selectedPhase}
          phaseDefinition={phaseDefinitions.find((p) => p.key === selectedPhase)}
          phaseState={phaseStates.find((p) => p.key === selectedPhase)}
          onRunAi={handleRunPhaseAi}
          onAdvance={handleAdvance}
          onClose={() => setSelectedPhase(null)}
        />
      )}

      {/* ─── All Phases List (collapsed) ─────────────────────── */}
      {!selectedPhase && (
        <div className="space-y-2">
          {phaseDefinitions.map((phase) => {
            const ps = phaseStates.find((p) => p.key === phase.key);
            const status = ps?.status ?? "pending";
            const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
            const Icon = PHASE_ICONS[phase.key] ?? FileText;

            return (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}`}>
                  {status === "processing" ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${config.color}`} />
                  ) : status === "completed" || status === "approved" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{phase.order}</span>
                    <span className="text-sm font-medium text-gray-900">{phase.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{phase.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {phase.isAiAutomated && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">IA</span>
                  )}
                  {phase.requiresHumanReview && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Revisión</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Phase Detail Panel ─────────────────────────────────────────────

function PhaseDetailPanel({
  phaseKey,
  phaseDefinition,
  phaseState,
  onRunAi,
  onAdvance,
  onClose,
}: {
  phaseKey: string;
  phaseDefinition?: PhaseDefinition;
  phaseState?: PhaseState;
  onRunAi: (key: string) => void;
  onAdvance: (key: string) => void;
  onClose: () => void;
}) {
  const [showFindings, setShowFindings] = useState(false);

  if (!phaseDefinition) return null;

  const status = phaseState?.status ?? "pending";
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = PHASE_ICONS[phaseKey] ?? FileText;
  const findings = phaseState?.findings ?? [];
  const hasFindings = findings.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Fase {phaseDefinition.order}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{phaseDefinition.label}</h3>
            <p className="text-sm text-gray-500">{phaseDefinition.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>

      {/* Metadata chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {phaseDefinition.aiAgent && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Agente: {phaseDefinition.aiAgent}
          </span>
        )}
        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
          Proveedor: {phaseDefinition.aiProvider}
        </span>
        {phaseDefinition.requiresHumanReview && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Requiere revisión humana
          </span>
        )}
        {phaseState?.score != null && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Score: {phaseState.score}/100
          </span>
        )}
        {phaseState?.processingTimeMs != null && (
          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
            {(phaseState.processingTimeMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Summary */}
      {phaseState?.summary && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-700">{phaseState.summary}</p>
        </div>
      )}

      {/* Findings */}
      {hasFindings && (
        <div className="mt-4">
          <button
            onClick={() => setShowFindings(!showFindings)}
            className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>Hallazgos ({findings.length})</span>
            {showFindings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showFindings && (
            <div className="mt-2 space-y-2">
              {findings.map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      f.type === "error" ? "bg-red-100 text-red-700" :
                      f.type === "warning" ? "bg-amber-100 text-amber-700" :
                      f.type === "suggestion" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {f.type}
                    </span>
                    {f.location && <span className="text-[10px] text-gray-400">{f.location}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-700">{f.description}</p>
                  {f.correction && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Corrección: {f.correction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outputs */}
      {phaseDefinition.outputs.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Archivos generados</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {phaseDefinition.outputs.map((out) => (
              <div key={out.key} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
                <Download className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-700">{out.label}</span>
                <span className="rounded bg-gray-100 px-1 text-[10px] font-mono text-gray-500">.{out.fileType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {phaseDefinition.isAiAutomated && (status === "pending" || status === "failed") && (
          <button
            onClick={() => onRunAi(phaseKey)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            Ejecutar IA
          </button>
        )}
        {phaseDefinition.isAiAutomated && (status === "completed" || status === "needs_review") && (
          <button
            onClick={() => onRunAi(phaseKey)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Re-ejecutar IA
          </button>
        )}
        {status !== "pending" && phaseDefinition.order < 13 && (
          <button
            onClick={() => {
              const nextPhases = ["manuscript_received","ai_diagnosis","spelling_correction","grammar_correction","style_editing","structural_review","theological_review","editorial_approval","interior_layout","cover_design","final_review","export","publication"];
              const nextIdx = nextPhases.indexOf(phaseKey) + 1;
              if (nextIdx < nextPhases.length) onAdvance(nextPhases[nextIdx]);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprobar y avanzar
          </button>
        )}
      </div>
    </div>
  );
}
