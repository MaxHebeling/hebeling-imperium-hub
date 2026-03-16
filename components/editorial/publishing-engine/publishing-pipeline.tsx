"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  CheckCircle2,
  FileText,
  Pen,
  Layout,
  Palette,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Send,
  Clock,
  Zap,
  ArrowRight,
} from "lucide-react";

// ─── Types (matching API response) ───────────────────────────────────

interface PhaseDefinition {
  key: string;
  order: number;
  label: string;
  labelEn: string;
  description: string;
  aiAgent: string;
  aiProvider: string;
  requiresHumanReview: boolean;
  isAiAutomated: boolean;
  outputs: { key: string; label: string; fileType: string; description: string }[];
  icon: string;
}

interface PhaseState {
  key: string;
  status: "pending" | "processing" | "completed" | "failed" | "needs_review";
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

// ─── Phase Icons ─────────────────────────────────────────────────────

const PHASE_ICONS: Record<string, typeof BookOpen> = {
  manuscript_received: BookOpen,
  ai_diagnosis: Search,
  spelling_correction: FileText,
  grammar_correction: FileText,
  style_editing: Pen,
  structural_review: Layout,
  theological_review: Eye,
  editorial_approval: CheckCircle2,
  interior_layout: Layout,
  cover_design: Palette,
  final_review: Eye,
  export: Download,
  publication: Send,
};

// ─── Main Component ──────────────────────────────────────────────────

export function PublishingPipeline({ projectId }: { projectId: string }) {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/publishing-engine`);
      if (!res.ok) throw new Error("Error al cargar pipeline");
      const json = await res.json();
      setData(json);
      // Auto-select current phase
      if (!selectedPhase && json.state?.currentPhaseKey) {
        setSelectedPhase(json.state.currentPhaseKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedPhase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while AI is running
  useEffect(() => {
    if (!runningAI) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [runningAI, fetchData]);

  const handleAdvance = async (targetPhase: string) => {
    setAdvancing(true);
    try {
      await fetch(`/api/editorial/projects/${projectId}/publishing-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance", targetPhase }),
      });
      await fetchData();
    } finally {
      setAdvancing(false);
    }
  };

  const handleRunAI = async () => {
    setRunningAI(true);
    try {
      // The process-all endpoint now processes ALL stages synchronously
      // and only returns after everything is complete (up to 5 min).
      // We poll in the background while waiting for the response.
      const pollInterval = setInterval(fetchData, 5000);

      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      clearInterval(pollInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error del servidor" }));
        setError(data.error ?? "Error al procesar pipeline");
      }

      // Final refresh to get all completed results
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setRunningAI(false);
    }
  };

  const handleSavePrompt = async (phaseKey: string) => {
    if (!promptText.trim()) return;
    await fetch(`/api/editorial/projects/${projectId}/publishing-engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-prompt", phaseKey, prompt: promptText }),
    });
    setPromptText("");
    setShowPrompt(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-3 text-sm text-gray-500">Cargando pipeline editorial...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600">{error ?? "Error al cargar"}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-red-500 underline">
          Reintentar
        </button>
      </div>
    );
  }

  const { state: pipeline, phases } = data;
  const phaseStates = pipeline.phases;
  const selected = phases.find((p) => p.key === selectedPhase);
  const selectedResult = phaseStates.find((r) => r.key === selectedPhase);

  // Progress
  const completedCount = phaseStates.filter((r) => r.status === "completed").length;
  const progressPercent = pipeline.progressPercent ?? Math.round((completedCount / phases.length) * 100);

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pipeline Editorial IA
          </h2>
          <p className="text-sm text-gray-500">
            {completedCount} de {phases.length} fases completadas — {progressPercent}%
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAI}
            disabled={runningAI}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {runningAI ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {runningAI ? "Procesando IA..." : "Ejecutar Pipeline IA"}
          </button>
        </div>
      </div>

      {/* ─── Progress Bar ───────────────────────────────────── */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ─── Pipeline Line (9 phases) ───────────────────────── */}
      <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-0 min-w-max">
          {phases.map((phase, i) => {
            const result = phaseStates.find((r) => r.key === phase.key);
            const status = result?.status ?? "pending";
            const isSelected = selectedPhase === phase.key;
            const isCurrent = pipeline.currentPhaseKey === phase.key;
            const Icon = PHASE_ICONS[phase.key] ?? FileText;

            // Status colors
            let ringColor = "border-gray-200 bg-white";
            let iconColor = "text-gray-400";
            let labelColor = "text-gray-500";
            if (status === "completed") {
              ringColor = "border-green-400 bg-green-50";
              iconColor = "text-green-600";
              labelColor = "text-green-700";
            } else if (status === "processing") {
              ringColor = "border-blue-400 bg-blue-50";
              iconColor = "text-blue-600";
              labelColor = "text-blue-700";
            } else if (status === "needs_review") {
              ringColor = "border-amber-400 bg-amber-50";
              iconColor = "text-amber-600";
              labelColor = "text-amber-700";
            } else if (status === "failed") {
              ringColor = "border-red-400 bg-red-50";
              iconColor = "text-red-600";
              labelColor = "text-red-700";
            }

            return (
              <div key={phase.key} className="flex items-center">
                {/* Phase Node */}
                <button
                  onClick={() => setSelectedPhase(phase.key)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-gray-50 ${
                    isSelected ? "bg-gray-50 ring-2 ring-blue-300" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${ringColor}`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : status === "processing" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center max-w-[72px] ${labelColor}`}>
                    {phase.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">
                      Actual
                    </span>
                  )}
                  {result?.processingTimeMs != null && result.status === "completed" && (
                    <span className="text-[8px] text-gray-400">
                      {(result.processingTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </button>

                {/* Connector */}
                {i < phases.length - 1 && (
                  <div
                    className={`h-0.5 w-6 ${
                      status === "completed" ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Next Step Indicator ─────────────────────────────── */}
      {pipeline.currentPhaseKey && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
          <ArrowRight className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-700">
            <strong>Tu siguiente paso:</strong>{" "}
            {phases.find((p) => p.key === pipeline.currentPhaseKey)?.label ?? ""}
          </span>
        </div>
      )}

      {/* ─── Selected Phase Workspace ────────────────────────── */}
      {selected && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Phase Header */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  {(() => {
                    const Icon = PHASE_ICONS[selected.key] ?? FileText;
                    return <Icon className="h-5 w-5 text-gray-600" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Fase {selected.order}: {selected.label}
                  </h3>
                  <p className="text-sm text-gray-500">{selected.aiAgent}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <StatusBadge status={selectedResult?.status ?? "pending"} />
                {/* Advance Button */}
                {selectedResult?.status !== "completed" && (
                  <button
                    onClick={() => {
                      const nextPhase = phases.find((p) => p.order === selected.order + 1);
                      if (nextPhase) handleAdvance(nextPhase.key);
                    }}
                    disabled={advancing}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                  >
                    {advancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                    Avanzar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Phase Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Description */}
            <p className="text-sm text-gray-600">{selected.description}</p>

            {/* Score */}
            {selectedResult?.score != null && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Puntuación:</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        selectedResult.score >= 70
                          ? "bg-green-500"
                          : selectedResult.score >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${selectedResult.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{selectedResult.score}/100</span>
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedResult?.summary && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-700">{selectedResult.summary}</p>
              </div>
            )}

            {/* Findings */}
            {selectedResult && selectedResult.findings.length > 0 && (
              <PhaseFindings findings={selectedResult.findings} />
            )}

            {/* Outputs */}
            {selected.outputs.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Archivos generados</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selected.outputs.map((output) => (
                    <div
                      key={output.key}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-all hover:border-gray-200 hover:shadow-sm"
                    >
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{output.label}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{output.fileType}</p>
                      </div>
                      <button className="text-xs text-blue-500 hover:text-blue-700">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Editor */}
            <div>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Editar con prompt personalizado
              </button>
              {showPrompt && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ej: mejorar tono pastoral, reducir repeticiones, hacer portada minimalista..."
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                    rows={3}
                  />
                  <button
                    onClick={() => handleSavePrompt(selected.key)}
                    disabled={!promptText.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    Guardar prompt
                  </button>
                </div>
              )}
            </div>

            {/* Human Review Required */}
            {selected.requiresHumanReview && selectedResult?.status === "needs_review" && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700">
                  <strong>Revisión requerida.</strong> Esta fase necesita aprobación del staff antes de continuar.
                </span>
                <button
                  onClick={() => handleAdvance(selected.key)}
                  className="ml-auto rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
                >
                  Aceptar y continuar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-gray-100 text-gray-600" },
    processing: { label: "Procesando", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completado", className: "bg-green-100 text-green-700" },
    needs_review: { label: "Requiere revisión", className: "bg-amber-100 text-amber-700" },
    failed: { label: "Error", className: "bg-red-100 text-red-700" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Phase Findings ──────────────────────────────────────────────────

function PhaseFindings({ findings }: { findings: PhaseResult["findings"] }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? findings : findings.slice(0, 3);

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-gray-700">
        Hallazgos ({findings.length})
      </h4>
      <div className="space-y-2">
        {displayed.map((f, i) => (
          <div key={i} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
                  f.type === "error"
                    ? "bg-red-500"
                    : f.type === "warning"
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-xs text-gray-700">{f.description}</p>
                {f.location && (
                  <p className="mt-1 text-[10px] text-gray-400">Ubicación: {f.location}</p>
                )}
                {f.correction && (
                  <p className="mt-1 text-[10px] text-green-600">Corrección: {f.correction}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {findings.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-blue-500 hover:text-blue-700"
        >
          {expanded ? "Ver menos" : `Ver todos (${findings.length})`}
        </button>
      )}
    </div>
  );
}
