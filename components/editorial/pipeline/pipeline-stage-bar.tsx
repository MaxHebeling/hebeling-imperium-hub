"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
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
  }
> = {
  completed: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    connector: "bg-emerald-500/50",
    selectedRing: "ring-emerald-400",
  },
  active: {
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    connector: "bg-border/60",
    selectedRing: "ring-blue-400",
  },
  pending: {
    ring: "ring-border/40",
    bg: "bg-muted/30",
    text: "text-muted-foreground/60",
    connector: "bg-border/40",
    selectedRing: "ring-foreground/40",
  },
  blocked: {
    ring: "ring-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-400",
    connector: "bg-border/60",
    selectedRing: "ring-red-400",
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

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 shadow-sm">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Editorial Pipeline
          </span>
          <div className="h-4 w-px bg-border/60" />
          <span className="text-xs text-muted-foreground">
            {completedCount} of {stages.length} stages complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Pipeline nodes */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        <div className="flex items-start min-w-max">
          {stages.map((stageData, index) => {
            const config = STATUS_CONFIG[stageData.status];
            const isLast = index === stages.length - 1;
            const isSelected = selectedStageId === stageData.stage.id;

            return (
              <div
                key={stageData.stage.id}
                className="flex items-start flex-1 min-w-0"
              >
                {/* Stage node */}
                <button
                  type="button"
                  onClick={() => onSelectStage(stageData.stage.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 group cursor-pointer relative transition-all duration-200",
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

                  {/* Label */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "text-[10px] font-semibold leading-tight text-center whitespace-nowrap transition-colors duration-200",
                        isSelected ? "text-foreground" : config.text
                      )}
                    >
                      {stageData.stage.shortLabel}
                    </span>
                    {stageData.totalCount > 0 && (
                      <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                        {stageData.completedCount}/{stageData.totalCount}
                      </span>
                    )}
                  </div>

                  {/* Selected indicator dot */}
                  {isSelected && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground/80" />
                  )}
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 flex items-center pt-4 px-1 min-w-[16px]">
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
