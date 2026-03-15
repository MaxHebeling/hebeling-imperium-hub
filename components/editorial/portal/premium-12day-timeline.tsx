"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  FileSearch,
  PenTool,
  Type,
  Paintbrush,
  ShieldCheck,
  FileOutput,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

interface Premium12DayTimelineProps {
  currentStage: EditorialStageKey;
  createdAt: string;
  locale: PortalLocale;
}

interface TimelineDay {
  day: string;
  stageKey: EditorialStageKey;
  labelEs: string;
  labelEn: string;
  icon: React.ElementType;
}

const TIMELINE_DAYS: TimelineDay[] = [
  { day: "1-2", stageKey: "ingesta", labelEs: "Recepcion y validacion del manuscrito", labelEn: "Manuscript reception and validation", icon: BookOpen },
  { day: "3", stageKey: "estructura", labelEs: "Analisis editorial", labelEn: "Editorial analysis", icon: FileSearch },
  { day: "4-5", stageKey: "estilo", labelEs: "Edicion estructural y de estilo", labelEn: "Structural and style editing", icon: PenTool },
  { day: "6-7", stageKey: "ortotipografia", labelEs: "Correccion y refinamiento", labelEn: "Correction and refinement", icon: Type },
  { day: "8", stageKey: "maquetacion", labelEs: "Especificaciones y maquetacion", labelEn: "Specifications and layout", icon: Paintbrush },
  { day: "9-10", stageKey: "revision_final", labelEs: "Maquetacion y prueba final", labelEn: "Layout and final proof", icon: ShieldCheck },
  { day: "11", stageKey: "export", labelEs: "Preparacion de archivos finales", labelEn: "Final file preparation", icon: FileOutput },
  { day: "12", stageKey: "distribution", labelEs: "Entrega editorial", labelEn: "Editorial delivery", icon: Send },
];

const STAGE_ORDER: EditorialStageKey[] = [
  "ingesta", "estructura", "estilo", "ortotipografia",
  "maquetacion", "revision_final", "export", "distribution",
];

function getDaysSinceCreation(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getStageStatus(
  stageKey: EditorialStageKey,
  currentStage: EditorialStageKey,
  daysSince: number
): "completed" | "active" | "upcoming" | "locked" {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageIdx = STAGE_ORDER.indexOf(stageKey);

  if (stageIdx < currentIdx) return "completed";
  if (stageIdx === currentIdx) return "active";

  // For the client view, stages unlock progressively based on days
  const dayThresholds = [0, 3, 4, 6, 8, 9, 11, 12];
  if (daysSince >= dayThresholds[stageIdx]) return "upcoming";
  return "locked";
}

export function Premium12DayTimeline({ currentStage, createdAt, locale }: Premium12DayTimelineProps) {
  const t = getTranslations(locale);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const daysSince = getDaysSinceCreation(createdAt);

  const currentDayLabel = daysSince > 12 ? "12" : String(daysSince);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1a3a6b]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{t.editorialProcess}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.editorialProcessDesc}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a3a6b]/10">
            <Clock className="w-3.5 h-3.5 text-[#1a3a6b]" />
            <span className="text-xs font-semibold text-[#1a3a6b]">
              {locale === "es" ? `Dia ${currentDayLabel} de 12` : `Day ${currentDayLabel} of 12`}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4">
        <div className="relative">
          {TIMELINE_DAYS.map((item, idx) => {
            const status = getStageStatus(item.stageKey, currentStage, daysSince);
            const isExpanded = expandedStage === item.stageKey;
            const Icon = item.icon;
            const label = locale === "es" ? item.labelEs : item.labelEn;
            const description = (t.stageDescriptions as Record<string, string>)?.[item.stageKey] ?? "";
            const isLast = idx === TIMELINE_DAYS.length - 1;

            return (
              <div key={item.stageKey} className="relative">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[17px] top-[36px] w-0.5 ${
                      status === "completed" ? "bg-emerald-400" : status === "active" ? "bg-[#1a3a6b]/30" : "bg-gray-200"
                    }`}
                    style={{ height: isExpanded ? "calc(100% - 18px)" : "calc(100% - 18px)" }}
                  />
                )}

                {/* Stage row */}
                <button
                  onClick={() => status !== "locked" ? setExpandedStage(isExpanded ? null : item.stageKey) : undefined}
                  className={`relative flex items-start gap-3 w-full text-left py-2.5 transition-all ${
                    status === "locked" ? "opacity-40 cursor-default" : "cursor-pointer hover:bg-gray-50 rounded-xl px-1 -mx-1"
                  }`}
                  disabled={status === "locked"}
                >
                  {/* Status icon */}
                  <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all ${
                    status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : status === "active"
                        ? "bg-[#1a3a6b] text-white ring-4 ring-[#1a3a6b]/20"
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    {status === "completed" ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium leading-snug ${
                          status === "completed" ? "text-gray-700" : status === "active" ? "text-gray-900" : "text-gray-500"
                        }`}>
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {locale === "es" ? `Dia ${item.day}` : `Day ${item.day}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {status === "completed" && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {t.stageCompleted}
                          </span>
                        )}
                        {status === "active" && (
                          <span className="text-[10px] font-medium text-[#1a3a6b] bg-[#1a3a6b]/10 px-2 py-0.5 rounded-full animate-pulse">
                            {t.processing}
                          </span>
                        )}
                        {status !== "locked" && (
                          isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && description && (
                  <div className="ml-12 mb-3 mt-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
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
