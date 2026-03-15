"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Clock,
  BookOpen,
  User2,
  FileOutput,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    label: "Completed",
  },
  active: {
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    connector: "bg-border/60",
    selectedRing: "ring-blue-400",
    label: "In Progress",
  },
  needs_review: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    connector: "bg-border/60",
    selectedRing: "ring-amber-400",
    label: "Needs Review",
  },
  pending: {
    ring: "ring-border/40",
    bg: "bg-muted/30",
    text: "text-muted-foreground/60",
    connector: "bg-border/40",
    selectedRing: "ring-foreground/40",
    label: "Not Started",
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

// ─── Props ───────────────────────────────────────────────────────────

interface PipelineStageBarProps {
  stages: UIStageData[];
  selectedStageId: string | null;
  onSelectStage: (stageId: string) => void;
  progressPercent: number;
}

// ─── Component ───────────────────────────────────────────────────────

export function PipelineStageBar({
  stages,
  selectedStageId,
  onSelectStage,
  progressPercent,
}: PipelineStageBarProps) {
  const completedCount = stages.filter((s) => s.status === "completed").length;

  const activeCount = stages.filter((s) => s.status === "active" || s.status === "needs_review").length;
  const blockedCount = stages.filter((s) => s.status === "blocked").length;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Book Production Progress header */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-tight">
              Book Production Progress
            </h3>
          </div>
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {completedCount} completed
          </span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 text-blue-500" />
              {activeCount} in progress
            </span>
          )}
          {blockedCount > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              {blockedCount} error
            </span>
          )}
          <span className="ml-auto">
            {stages.length - completedCount} remaining
          </span>
        </div>
      </div>

      {/* Pipeline nodes — smooth horizontal scroll */}
      <div className="overflow-x-auto scroll-smooth px-6 py-4 pb-5" style={{ scrollbarWidth: "thin" }}>
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
                    <span className={cn("text-[8px] font-medium", config.text)}>
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
                        <span className="truncate max-w-[56px]">{stageData.assignedEditor}</span>
                      </span>
                    )}
                    {/* Main output artifact */}
                    <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/40 mt-0.5">
                      <FileOutput className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[56px]">{stageData.stage.mainArtifact}</span>
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
