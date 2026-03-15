"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWorkflowDetail } from "@/lib/editorial/types/workflow";

interface PipelineProgressBarProps {
  projectId: string;
}

const PHASE_LABELS: Record<string, string> = {
  intake: "Intake",
  editorial_analysis: "Analysis",
  structural_editing: "Structural",
  line_editing: "Line Edit",
  copyediting: "Copyedit",
  text_finalization: "Finalization",
  book_specifications: "Specs",
  book_production: "Production",
  final_proof: "Proof",
  publishing_prep: "Publishing",
  distribution: "Distribution",
};

type PhaseStatus = "completed" | "active" | "pending" | "blocked";

function getPhaseStatus(
  phase: ProjectWorkflowDetail["phases"][number]
): PhaseStatus {
  if (phase.isComplete) return "completed";
  if (phase.isCurrent) return "active";
  const hasBlocked = phase.stages.some(
    (s) => s.status?.status === "blocked"
  );
  if (hasBlocked) return "blocked";
  return "pending";
}

const STATUS_CONFIG: Record<
  PhaseStatus,
  { color: string; bgColor: string; borderColor: string; textColor: string }
> = {
  completed: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
  },
  active: {
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
  },
  pending: {
    color: "bg-muted-foreground/30",
    bgColor: "bg-muted/30",
    borderColor: "border-border",
    textColor: "text-muted-foreground",
  },
  blocked: {
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
};

function PhaseIcon({ status }: { status: PhaseStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "active":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "blocked":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

export function PipelineProgressBar({ projectId }: PipelineProgressBarProps) {
  const [detail, setDetail] = useState<ProjectWorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
      }
    } catch {
      // Silently fail — progress bar is supplementary
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading pipeline...</span>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const { phases } = detail;

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Progress percentage */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Pipeline Progress
        </span>
        <span className="text-sm font-semibold">
          {detail.workflow.progress_percent}%
        </span>
      </div>

      {/* Continuous progress bar */}
      <div className="relative h-1.5 w-full rounded-full bg-muted/60 mb-4 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
          style={{ width: `${detail.workflow.progress_percent}%` }}
        />
      </div>

      {/* Phase steps */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex items-start gap-0 min-w-max">
          {phases.map((phaseData, index) => {
            const status = getPhaseStatus(phaseData);
            const config = STATUS_CONFIG[status];
            const isLast = index === phases.length - 1;

            return (
              <div key={phaseData.phase.phase_key} className="flex items-start flex-1 min-w-0">
                {/* Phase node */}
                <div className="flex flex-col items-center gap-1.5 group cursor-default relative">
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all duration-200",
                      config.bgColor,
                      config.borderColor,
                      "group-hover:scale-110"
                    )}
                  >
                    <PhaseIcon status={status} />
                  </div>
                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight text-center whitespace-nowrap",
                      config.textColor
                    )}
                  >
                    {PHASE_LABELS[phaseData.phase.phase_key] ?? phaseData.phase.name}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10">
                    <div className="rounded-md bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-lg border border-border whitespace-nowrap">
                      {phaseData.phase.name}
                      {status === "active" && " (Active)"}
                      {status === "completed" && " (Done)"}
                      {status === "blocked" && " (Blocked)"}
                    </div>
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 flex items-center pt-4 px-0.5 min-w-[12px]">
                    <div
                      className={cn(
                        "h-0.5 w-full rounded-full transition-colors duration-300",
                        status === "completed"
                          ? "bg-emerald-500/40"
                          : "bg-border/60"
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
