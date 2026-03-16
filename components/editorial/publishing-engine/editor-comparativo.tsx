"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Pen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileText,
  Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  original: string;
  corrected: string;
  justification: string;
  type: "spelling" | "grammar" | "style" | "structure" | "theological";
  severity: "low" | "medium" | "high" | "critical";
  location?: string;
  status: "pending" | "accepted" | "rejected" | "edited";
}

interface Props {
  projectId: string;
  suggestions: Suggestion[];
  originalText?: string;
  correctedText?: string;
  locale?: "es" | "en";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onAcceptAll?: () => void;
}

// ─── Severity config ─────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string; labelEn: string }> = {
  low: { color: "text-blue-700", bg: "bg-blue-50", label: "Baja", labelEn: "Low" },
  medium: { color: "text-amber-700", bg: "bg-amber-50", label: "Media", labelEn: "Medium" },
  high: { color: "text-orange-700", bg: "bg-orange-50", label: "Alta", labelEn: "High" },
  critical: { color: "text-red-700", bg: "bg-red-50", label: "Crítica", labelEn: "Critical" },
};

const TYPE_CONFIG: Record<string, { label: string; labelEn: string; color: string }> = {
  spelling: { label: "Ortografía", labelEn: "Spelling", color: "text-blue-600" },
  grammar: { label: "Gramática", labelEn: "Grammar", color: "text-purple-600" },
  style: { label: "Estilo", labelEn: "Style", color: "text-indigo-600" },
  structure: { label: "Estructura", labelEn: "Structure", color: "text-teal-600" },
  theological: { label: "Teológico", labelEn: "Theological", color: "text-amber-600" },
};

// ─── Editor Comparativo Component ────────────────────────────────────

export function EditorComparativo({
  suggestions,
  originalText,
  correctedText,
  locale = "es",
  onAccept,
  onReject,
  onEdit,
  onAcceptAll,
}: Props) {
  const [view, setView] = useState<"suggestions" | "split">("suggestions");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const isEs = locale === "es";

  // Filter suggestions
  const filtered = filter === "all"
    ? suggestions
    : suggestions.filter((s) => s.type === filter || s.status === filter);

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    accepted: suggestions.filter((s) => s.status === "accepted").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEs ? "Editor Comparativo" : "Comparative Editor"}
          </h2>
          <p className="text-sm text-gray-500">
            {isEs
              ? `${stats.total} sugerencias · ${stats.pending} pendientes · ${stats.accepted} aceptadas`
              : `${stats.total} suggestions · ${stats.pending} pending · ${stats.accepted} accepted`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setView("suggestions")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                view === "suggestions"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="mr-1 inline h-3 w-3" />
              {isEs ? "Sugerencias" : "Suggestions"}
            </button>
            <button
              onClick={() => setView("split")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                view === "split"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Eye className="mr-1 inline h-3 w-3" />
              {isEs ? "Vista dividida" : "Split view"}
            </button>
          </div>
          {stats.pending > 0 && onAcceptAll && (
            <button
              onClick={onAcceptAll}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              {isEs ? "Aceptar todo" : "Accept all"}
            </button>
          )}
        </div>
      </div>

      {/* ─── Filter chips ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: isEs ? "Todas" : "All" },
          { key: "spelling", label: isEs ? "Ortografía" : "Spelling" },
          { key: "grammar", label: isEs ? "Gramática" : "Grammar" },
          { key: "style", label: isEs ? "Estilo" : "Style" },
          { key: "structure", label: isEs ? "Estructura" : "Structure" },
          { key: "theological", label: isEs ? "Teológico" : "Theological" },
          { key: "pending", label: isEs ? "Pendientes" : "Pending" },
          { key: "accepted", label: isEs ? "Aceptadas" : "Accepted" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Content ──────────────────────────────────────────── */}
      {view === "suggestions" ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">
                {isEs ? "No hay sugerencias para mostrar" : "No suggestions to display"}
              </p>
            </div>
          ) : (
            filtered.map((suggestion) => {
              const isExpanded = expandedId === suggestion.id;
              const isEditing = editingId === suggestion.id;
              const sevConfig = SEVERITY_CONFIG[suggestion.severity] ?? SEVERITY_CONFIG.medium;
              const typeConfig = TYPE_CONFIG[suggestion.type] ?? TYPE_CONFIG.grammar;

              return (
                <div
                  key={suggestion.id}
                  className={`rounded-xl border transition-all ${
                    suggestion.status === "accepted"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : suggestion.status === "rejected"
                      ? "border-red-200 bg-red-50/30 opacity-60"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {/* Main row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {suggestion.status === "accepted" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : suggestion.status === "rejected" ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sevConfig.bg} ${sevConfig.color}`}>
                          {isEs ? sevConfig.label : sevConfig.labelEn}
                        </span>
                        <span className={`text-[10px] font-medium ${typeConfig.color}`}>
                          {isEs ? typeConfig.label : typeConfig.labelEn}
                        </span>
                        {suggestion.location && (
                          <span className="text-[10px] text-gray-400">{suggestion.location}</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="line-through text-red-500 truncate max-w-[200px]">{suggestion.original}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="text-emerald-700 font-medium truncate max-w-[200px]">{suggestion.corrected}</span>
                      </div>
                    </div>

                    {/* Expand icon */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                      {/* Justification */}
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          {isEs ? "Justificación:" : "Justification:"}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">{suggestion.justification}</p>
                      </div>

                      {/* Comparison */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                          <p className="text-[10px] font-semibold uppercase text-red-500">
                            {isEs ? "Original" : "Original"}
                          </p>
                          <p className="mt-1 text-sm text-gray-800">{suggestion.original}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <p className="text-[10px] font-semibold uppercase text-emerald-500">
                            {isEs ? "Corrección" : "Correction"}
                          </p>
                          <p className="mt-1 text-sm text-gray-800">{suggestion.corrected}</p>
                        </div>
                      </div>

                      {/* Edit mode */}
                      {isEditing && (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onEdit?.(suggestion.id, editText);
                                setEditingId(null);
                              }}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              {isEs ? "Guardar" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                              {isEs ? "Cancelar" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {suggestion.status === "pending" && !isEditing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAccept?.(suggestion.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {isEs ? "Aceptar" : "Accept"}
                          </button>
                          <button
                            onClick={() => onReject?.(suggestion.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3" />
                            {isEs ? "Rechazar" : "Reject"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(suggestion.id);
                              setEditText(suggestion.corrected);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            <Pen className="h-3 w-3" />
                            {isEs ? "Editar" : "Edit"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ─── Split View ──────────────────────────────────────── */
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              {isEs ? "Texto original" : "Original text"}
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {originalText || (isEs ? "Texto original no disponible" : "Original text not available")}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
              {isEs ? "Texto corregido por IA" : "AI-corrected text"}
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {correctedText || (isEs ? "Texto corregido no disponible" : "Corrected text not available")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
