"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWorkflowDetail, WorkflowPhaseKey } from "@/lib/editorial/types/workflow";

// ─── Phase labels (short, for the pipeline bar) ──────────────────────

const PHASE_LABELS: Record<WorkflowPhaseKey, string> = {
  intake: "Manuscript",
  editorial_analysis: "AI Analysis",
  structural_editing: "Structural",
  line_editing: "Line Edit",
  copyediting: "Copyedit",
  text_finalization: "Finalization",
  book_specifications: "Book Specs",
  book_production: "Production",
  final_proof: "Final Proof",
  publishing_prep: "Publishing",
  distribution: "Distribution",
};

// ─── Phase status ────────────────────────────────────────────────────

type PhaseStatus = "completed" | "active" | "pending" | "blocked";

function getPhaseStatus(
  phase: ProjectWorkflowDetail["phases"][number]
): PhaseStatus {
  if (phase.isComplete) return "completed";
  if (phase.isCurrent) return "active";
  const hasBlocked = phase.stages.some((s) => s.status?.status === "blocked");
  if (hasBlocked) return "blocked";
  return "pending";
}

// ─── Status visual config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PhaseStatus,
  {
    ring: string;
    bg: string;
    text: string;
    connector: string;
    iconColor: string;
    selectedRing: string;
  }
> = {
  completed: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    connector: "bg-emerald-500/50",
    iconColor: "text-emerald-500",
    selectedRing: "ring-emerald-400",
  },
  active: {
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    connector: "bg-border/60",
    iconColor: "text-blue-500",
    selectedRing: "ring-blue-400",
  },
  pending: {
    ring: "ring-border/40",
    bg: "bg-muted/30",
    text: "text-muted-foreground/60",
    connector: "bg-border/40",
    iconColor: "text-muted-foreground/40",
    selectedRing: "ring-foreground/40",
  },
  blocked: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    connector: "bg-border/60",
    iconColor: "text-amber-500",
    selectedRing: "ring-amber-400",
  },
};

function PhaseIcon({ status, size = "sm" }: { status: PhaseStatus; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  switch (status) {
    case "completed":
      return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
    case "active":
      return <Loader2 className={cn(cls, "text-blue-500 animate-spin")} />;
    case "blocked":
      return <AlertTriangle className={cn(cls, "text-amber-500")} />;
    default:
      return <Circle className={cn(cls, "text-muted-foreground/40")} />;
  }
}

// ─── Props ───────────────────────────────────────────────────────────

interface PipelineStageBarProps {
  phases: ProjectWorkflowDetail["phases"];
  selectedPhase: WorkflowPhaseKey | null;
  onSelectPhase: (phaseKey: WorkflowPhaseKey) => void;
  progressPercent: number;
}

// ─── Component ───────────────────────────────────────────────────────

export function PipelineStageBar({
  phases,
  selectedPhase,
  onSelectPhase,
  progressPercent,
}: PipelineStageBarProps) {
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
            {phases.filter((p) => p.isComplete).length} of {phases.length} phases complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums">{progressPercent}%</span>
        </div>
      </div>

      {/* Pipeline nodes */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        <div className="flex items-start min-w-max">
          {phases.map((phaseData, index) => {
            const phaseKey = phaseData.phase.phase_key as WorkflowPhaseKey;
            const status = getPhaseStatus(phaseData);
            const config = STATUS_CONFIG[status];
            const isLast = index === phases.length - 1;
            const isSelected = selectedPhase === phaseKey;
            const completedStages = phaseData.stages.filter(
              (s) => s.status?.status === "completed"
            ).length;

            return (
              <div key={phaseKey} className="flex items-start flex-1 min-w-0">
                {/* Phase node */}
                <button
                  type="button"
                  onClick={() => onSelectPhase(phaseKey)}
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
                    <PhaseIcon status={status} size={isSelected ? "md" : "sm"} />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "text-[10px] font-semibold leading-tight text-center whitespace-nowrap transition-colors duration-200",
                        isSelected ? "text-foreground" : config.text
                      )}
                    >
                      {PHASE_LABELS[phaseKey] ?? phaseData.phase.name}
                    </span>
                    {/* Sub-stage count */}
                    <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                      {completedStages}/{phaseData.stages.length}
                    </span>
                  </div>

                  {/* Selected indicator */}
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
