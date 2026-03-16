"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  Download,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface TimelineDay {
  day: number;
  dayRange: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  status: "completed" | "in_progress" | "upcoming" | "pending";
  phaseKeys: string[];
}

interface Props {
  projectId: string;
  projectTitle?: string;
  authorName?: string;
  locale?: "es" | "en";
}

// ─── Author Timeline Component ───────────────────────────────────────

export function AuthorTimeline12Day({
  projectId,
  projectTitle,
  authorName,
  locale = "es",
}: Props) {
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/editorial/projects/${projectId}/publishing-engine`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Build timeline from phases
        const phases = data.phases ?? [];
        const results = data.results ?? [];
        const pipeline = data.pipeline ?? {};

        // Map to 12-day timeline
        const TIMELINE_DAYS: TimelineDay[] = [
          {
            day: 1,
            dayRange: locale === "es" ? "Día 1" : "Day 1",
            label: locale === "es" ? "Recepción del manuscrito" : "Manuscript reception",
            labelEn: "Manuscript reception",
            description:
              locale === "es"
                ? "Tu manuscrito ha sido recibido y está siendo preparado para el proceso editorial."
                : "Your manuscript has been received and is being prepared for the editorial process.",
            descriptionEn:
              "Your manuscript has been received and is being prepared for the editorial process.",
            status: getStatusForPhase("manuscript_intake", results, pipeline),
            phaseKeys: ["manuscript_intake"],
          },
          {
            day: 2,
            dayRange: locale === "es" ? "Día 2-3" : "Day 2-3",
            label: locale === "es" ? "Análisis editorial" : "Editorial analysis",
            labelEn: "Editorial analysis",
            description:
              locale === "es"
                ? "Nuestro equipo está analizando la estructura, el estilo y la calidad general de tu manuscrito."
                : "Our team is analyzing the structure, style, and overall quality of your manuscript.",
            descriptionEn:
              "Our team is analyzing the structure, style, and overall quality of your manuscript.",
            status: getStatusForPhase("ai_analysis", results, pipeline),
            phaseKeys: ["ai_analysis"],
          },
          {
            day: 4,
            dayRange: locale === "es" ? "Día 4-5" : "Day 4-5",
            label:
              locale === "es"
                ? "Corrección ortográfica y gramatical"
                : "Spelling and grammar correction",
            labelEn: "Spelling and grammar correction",
            description:
              locale === "es"
                ? "Estamos perfeccionando la ortografía, gramática y puntuación de tu texto."
                : "We are perfecting the spelling, grammar, and punctuation of your text.",
            descriptionEn:
              "We are perfecting the spelling, grammar, and punctuation of your text.",
            status: getStatusForPhase("orthotypographic_correction", results, pipeline),
            phaseKeys: ["orthotypographic_correction"],
          },
          {
            day: 6,
            dayRange: locale === "es" ? "Día 6-7" : "Day 6-7",
            label: locale === "es" ? "Edición de estilo" : "Style editing",
            labelEn: "Style editing",
            description:
              locale === "es"
                ? "Estamos mejorando la claridad, coherencia y fluidez de tu escritura."
                : "We are improving the clarity, coherence, and fluency of your writing.",
            descriptionEn:
              "We are improving the clarity, coherence, and fluency of your writing.",
            status: getStatusForPhase("style_editing", results, pipeline),
            phaseKeys: ["style_editing"],
          },
          {
            day: 8,
            dayRange: locale === "es" ? "Día 8" : "Day 8",
            label:
              locale === "es"
                ? "Especificaciones del libro"
                : "Book specifications",
            labelEn: "Book specifications",
            description:
              locale === "es"
                ? "Se están calculando las especificaciones técnicas del libro para su formato final."
                : "Technical book specifications are being calculated for the final format.",
            descriptionEn:
              "Technical book specifications are being calculated for the final format.",
            status: getStatusForPhase("auto_layout", results, pipeline),
            phaseKeys: ["auto_layout"],
          },
          {
            day: 9,
            dayRange: locale === "es" ? "Día 9-10" : "Day 9-10",
            label:
              locale === "es"
                ? "Maquetación y diseño interior"
                : "Layout and interior design",
            labelEn: "Layout and interior design",
            description:
              locale === "es"
                ? "Estamos preparando el diseño interior profesional de tu libro."
                : "We are preparing the professional interior design of your book.",
            descriptionEn:
              "We are preparing the professional interior design of your book.",
            status: getStatusForPhase("interior_design", results, pipeline),
            phaseKeys: ["interior_design"],
          },
          {
            day: 10,
            dayRange: locale === "es" ? "Día 10" : "Day 10",
            label: locale === "es" ? "Diseño de portada" : "Cover design",
            labelEn: "Cover design",
            description:
              locale === "es"
                ? "Nuestro equipo creativo está diseñando la portada de tu libro."
                : "Our creative team is designing the cover of your book.",
            descriptionEn:
              "Our creative team is designing the cover of your book.",
            status: getStatusForPhase("cover_design", results, pipeline),
            phaseKeys: ["cover_design"],
          },
          {
            day: 11,
            dayRange: locale === "es" ? "Día 11" : "Day 11",
            label: locale === "es" ? "Revisión final" : "Final review",
            labelEn: "Final review",
            description:
              locale === "es"
                ? "Se está realizando la revisión final exhaustiva antes de la exportación."
                : "A thorough final review is being conducted before export.",
            descriptionEn:
              "A thorough final review is being conducted before export.",
            status: getStatusForPhase("final_review", results, pipeline),
            phaseKeys: ["final_review"],
          },
          {
            day: 12,
            dayRange: locale === "es" ? "Día 12" : "Day 12",
            label:
              locale === "es"
                ? "Libro listo para publicación"
                : "Book ready for publication",
            labelEn: "Book ready for publication",
            description:
              locale === "es"
                ? "¡Tu libro ha completado el proceso editorial y está listo para ser publicado!"
                : "Your book has completed the editorial process and is ready for publication!",
            descriptionEn:
              "Your book has completed the editorial process and is ready for publication!",
            status: getStatusForPhase("final_export", results, pipeline),
            phaseKeys: ["final_export"],
          },
        ];

        setTimeline(TIMELINE_DAYS);
      } catch {
        // Fallback: empty timeline
        setTimeline([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const completedDays = timeline.filter((d) => d.status === "completed").length;
  const currentDay = timeline.find((d) => d.status === "in_progress");
  const progressPercent = Math.round((completedDays / timeline.length) * 100);
  const isComplete = completedDays === timeline.length;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ─── Welcome Header ──────────────────────────────────── */}
      <div className="text-center">
        <BookOpen className="mx-auto h-10 w-10 text-[#1a3a6b]" />
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {locale === "es"
            ? `Bienvenido${authorName ? `, ${authorName}` : ""}`
            : `Welcome${authorName ? `, ${authorName}` : ""}`}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {locale === "es"
            ? "Este es el progreso editorial actual de tu libro."
            : "Here is the current editorial progress of your book."}
        </p>
      </div>

      {/* ─── Book Card ───────────────────────────────────────── */}
      {projectTitle && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {locale === "es" ? "Tu libro" : "Your book"}
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {projectTitle}
              </h2>
              {authorName && (
                <p className="text-sm text-gray-500">{authorName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#1a3a6b]">
                {progressPercent}%
              </p>
              <p className="text-xs text-gray-400">
                {locale === "es"
                  ? `${currentDay ? `Día ${currentDay.day} de 12` : isComplete ? "Completado" : "En espera"}`
                  : `${currentDay ? `Day ${currentDay.day} of 12` : isComplete ? "Completed" : "Pending"}`}
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-[#2F6FA3] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {currentDay && (
            <p className="mt-2 text-xs text-gray-500">
              {locale === "es" ? "Etapa actual: " : "Current stage: "}
              <span className="font-medium text-gray-700">{currentDay.label}</span>
            </p>
          )}
        </div>
      )}

      {/* ─── Timeline ────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-1">
          {timeline.map((day) => {
            const isExpanded = expandedDay === day.day;
            return (
              <div key={day.day} className="relative pl-12">
                {/* Node */}
                <div
                  className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    day.status === "completed"
                      ? "border-green-500 bg-green-500"
                      : day.status === "in_progress"
                      ? "border-blue-500 bg-blue-500"
                      : day.status === "upcoming"
                      ? "border-gray-300 bg-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {day.status === "completed" && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                  {day.status === "in_progress" && (
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                  )}
                </div>

                {/* Content */}
                <button
                  onClick={() =>
                    setExpandedDay(isExpanded ? null : day.day)
                  }
                  className="w-full rounded-xl p-3 text-left transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {day.dayRange}
                      </span>
                      <h3
                        className={`text-sm font-medium ${
                          day.status === "completed"
                            ? "text-green-700"
                            : day.status === "in_progress"
                            ? "text-blue-700"
                            : "text-gray-500"
                        }`}
                      >
                        {day.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <TimelineStatusBadge status={day.status} locale={locale} />
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-gray-600">
                        {day.description}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Completion Message ───────────────────────────────── */}
      {isComplete && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            {locale === "es"
              ? "¡Tu libro está listo!"
              : "Your book is ready!"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {locale === "es"
              ? "Tu libro ha completado exitosamente el proceso editorial y está listo para ser entregado, vendido y distribuido."
              : "Your book has successfully completed the editorial process and is ready for delivery, sale, and distribution."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a3a6b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#153056]">
              <Download className="h-4 w-4" />
              {locale === "es" ? "Descargar libro" : "Download book"}
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FileText className="h-4 w-4" />
              {locale === "es" ? "Ver portada" : "View cover"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 pt-6 text-center">
        <p className="text-xs text-gray-400">Reino Editorial</p>
        <p className="mt-1 text-[10px] italic text-gray-300">
          &ldquo;Y Jehov&aacute; me respondi&oacute;, y dijo: Escribe la
          visi&oacute;n, y decl&aacute;rala en tablas, para que corra el que
          leyere en ella.&rdquo;
        </p>
        <p className="text-[10px] text-gray-300">
          Habacuc 2:2 &mdash; Reina-Valera 1960
        </p>
      </footer>
    </div>
  );
}

// ─── Helper: get status for a phase ──────────────────────────────────

function getStatusForPhase(
  phaseKey: string,
  results: { phaseKey: string; status: string }[],
  pipeline: { currentPhaseKey?: string | null }
): "completed" | "in_progress" | "upcoming" | "pending" {
  const result = results.find((r) => r.phaseKey === phaseKey);
  if (result?.status === "completed") return "completed";
  if (result?.status === "processing" || pipeline.currentPhaseKey === phaseKey)
    return "in_progress";
  if (result?.status === "needs_review") return "in_progress";
  return "pending";
}

// ─── Timeline Status Badge ───────────────────────────────────────────

function TimelineStatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: string;
}) {
  const config: Record<string, { label: string; labelEn: string; className: string }> = {
    completed: {
      label: "Completado",
      labelEn: "Completed",
      className: "bg-green-100 text-green-700",
    },
    in_progress: {
      label: "En proceso",
      labelEn: "In progress",
      className: "bg-blue-100 text-blue-700",
    },
    upcoming: {
      label: "Próximamente",
      labelEn: "Coming soon",
      className: "bg-gray-100 text-gray-500",
    },
    pending: {
      label: "Pendiente",
      labelEn: "Pending",
      className: "bg-gray-50 text-gray-400",
    },
  };
  const c = config[status] ?? config.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${c.className}`}
    >
      {locale === "es" ? c.label : c.labelEn}
    </span>
  );
}
