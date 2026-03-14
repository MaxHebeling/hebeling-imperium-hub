"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Scissors,
  Type,
  LayoutTemplate,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
} from "lucide-react";
import type {
  ClientTimelineState,
  ClientTimelineStageView,
  ClientArtifactView,
} from "@/lib/editorial/timeline/types";

interface EditorialJourneyTimelineProps {
  projectId: string;
  locale?: "es" | "en";
}

const STAGE_ICONS: Record<string, React.ElementType> = {
  ingesta: BookOpen,
  estructura: Search,
  estilo: Scissors,
  ortotipografia: Type,
  maquetacion: LayoutTemplate,
  revision_final: Eye,
  export: Package,
  distribution: Truck,
};

const STATUS_STYLES = {
  completed: {
    dot: "bg-green-500",
    line: "bg-green-500",
    ring: "ring-green-100",
    text: "text-gray-900",
    bg: "",
  },
  active: {
    dot: "bg-[#1a3a6b]",
    line: "bg-gray-200",
    ring: "ring-blue-100",
    text: "text-gray-900",
    bg: "bg-blue-50/50",
  },
  upcoming: {
    dot: "bg-amber-400",
    line: "bg-gray-200",
    ring: "ring-amber-100",
    text: "text-gray-500",
    bg: "",
  },
  locked: {
    dot: "bg-gray-200",
    line: "bg-gray-100",
    ring: "ring-gray-100",
    text: "text-gray-300",
    bg: "",
  },
};

export function EditorialJourneyTimeline({
  projectId,
  locale = "es",
}: EditorialJourneyTimelineProps) {
  const [timeline, setTimeline] = useState<ClientTimelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/timeline/${projectId}`);
      const json = await res.json();
      if (json.success) {
        setTimeline(json.timeline);
        // Auto-expand active stage
        const active = json.timeline.stages.find(
          (s: ClientTimelineStageView) => s.status === "active"
        );
        if (active) setExpandedStage(active.stageKey);
      } else {
        setError(json.error ?? "Error");
      }
    } catch {
      setError(locale === "es" ? "Error de conexion" : "Connection error");
    } finally {
      setLoading(false);
    }
  }, [projectId, locale]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1a3a6b]/40" />
          <p className="text-xs text-gray-400">
            {locale === "es" ? "Cargando tu viaje editorial..." : "Loading your editorial journey..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-500">{error ?? "Error"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {locale === "es" ? "Tu Viaje Editorial" : "Your Editorial Journey"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === "es"
                ? `Dia ${timeline.currentDay} de ${timeline.totalDays}`
                : `Day ${timeline.currentDay} of ${timeline.totalDays}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#1a3a6b]">
              {timeline.overallProgress}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] transition-all duration-1000 ease-out"
            style={{ width: `${timeline.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="relative">
        {timeline.stages.map((stage, index) => {
          const isLast = index === timeline.stages.length - 1;
          const isExpanded = expandedStage === stage.stageKey;
          const styles = STATUS_STYLES[stage.status];
          const IconComponent = STAGE_ICONS[stage.stageKey] ?? BookOpen;

          return (
            <div key={stage.stageKey} className={styles.bg}>
              <button
                onClick={() => {
                  if (stage.status !== "locked") {
                    setExpandedStage(isExpanded ? null : stage.stageKey);
                  }
                }}
                disabled={stage.status === "locked"}
                className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors ${
                  stage.status !== "locked" ? "hover:bg-gray-50/50" : ""
                }`}
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ${styles.ring} ${
                      stage.status === "active" ? "animate-pulse" : ""
                    }`}
                  >
                    {stage.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : stage.status === "locked" ? (
                      <Lock className="w-3.5 h-3.5 text-gray-300" />
                    ) : (
                      <IconComponent
                        className={`w-4 h-4 ${
                          stage.status === "active" ? "text-[#1a3a6b]" : "text-amber-500"
                        }`}
                      />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 mt-1 ${styles.line}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${styles.text}`}>
                      {stage.title}
                    </span>
                    {stage.status === "active" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1a3a6b]/10 text-[#1a3a6b]">
                        {locale === "es" ? "En curso" : "In progress"}
                      </span>
                    )}
                    {stage.status === "completed" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600">
                        {locale === "es" ? "Listo" : "Done"}
                      </span>
                    )}
                  </div>
                  {stage.status !== "locked" && stage.message && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                      {stage.message}
                    </p>
                  )}
                </div>

                {/* Expand indicator */}
                {stage.status !== "locked" && (
                  <div className="shrink-0 pt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                )}
              </button>

              {/* Expanded content: artifacts */}
              {isExpanded && stage.artifacts.length > 0 && (
                <div className="px-5 pb-4 pl-16">
                  <div className="grid gap-2">
                    {stage.artifacts.map((artifact: ClientArtifactView) => (
                      <ArtifactCard
                        key={artifact.id}
                        artifact={artifact}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArtifactCard({
  artifact,
  locale,
}: {
  artifact: ClientArtifactView;
  locale: "es" | "en";
}) {
  const isImage = artifact.type === "cover_concept" || artifact.type === "book_mockup";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        {isImage && artifact.thumbnailUrl ? (
          <img
            src={artifact.thumbnailUrl}
            alt={artifact.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : artifact.type === "pdf_preview" ? (
          <FileText className="w-4 h-4 text-red-400" />
        ) : (
          <Image className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{artifact.title}</p>
        {artifact.description && (
          <p className="text-[11px] text-gray-400 truncate">{artifact.description}</p>
        )}
      </div>
      {artifact.downloadUrl && (
        <a
          href={artifact.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#1a3a6b] hover:underline shrink-0"
        >
          {locale === "es" ? "Ver" : "View"}
        </a>
      )}
    </div>
  );
}
