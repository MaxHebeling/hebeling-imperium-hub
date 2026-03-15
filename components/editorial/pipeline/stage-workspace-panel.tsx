"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Check,
  Clock,
  AlertCircle,
  Circle,
  Play,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectWorkflow } from "@/lib/editorial/types/workflow";
import type { UIStageData, UIStageStatus } from "./pipeline-stages";

// --- Existing panels integrated into stages ---

import { StaffProjectAiReview } from "@/components/editorial/staff/project-ai-review";
import { BookSpecsPanel } from "@/components/editorial/staff/book-specs-panel";
import { CoverGeneratorPanel } from "@/components/editorial/staff/cover-generator-panel";
import { InteriorDesignPanel } from "@/components/editorial/staff/interior-design-panel";
import { MetadataIsbnPanel } from "@/components/editorial/staff/metadata-isbn-panel";
import { ExportPanel } from "@/components/editorial/export/export-panel";
import { DistributionPanel } from "@/components/editorial/distribution/distribution-panel";
import { EbookPipelinePanel } from "@/components/editorial/staff/ebook-pipeline-panel";
import { CorrectionReportPanel } from "@/components/editorial/staff/correction-report-panel";
import { KdpValidationPanel } from "@/components/editorial/staff/kdp-validation-panel";
import { StaffFilesTab } from "@/components/editorial/staff/staff-files-tab";
import { StaffManuscriptAiCta } from "@/components/editorial/staff/staff-manuscript-ai-cta";
import { ReinoEditorialManuscriptUpload } from "@/components/editorial/reino-editorial-manuscript-upload";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";

// --- Status helpers ---

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "In Progress",
  needs_review: "Needs Review",
  completed: "Completed",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted/60 text-muted-foreground border-border/40",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  needs_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  blocked: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STAGE_STATUS_BADGE: Record<UIStageStatus, { label: string; cls: string }> = {
  completed: { label: "Complete", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  active: { label: "Active", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  pending: { label: "Upcoming", cls: "bg-muted/60 text-muted-foreground border-border/40" },
  blocked: { label: "Blocked", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Props ---

interface StageWorkspacePanelProps {
  projectId: string;
  stageData: UIStageData;
  workflow: ProjectWorkflow;
  onRefresh: () => Promise<void>;
  files?: EditorialFile[];
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
  projectTitle?: string;
  hasManuscript?: boolean;
}

// --- Component ---

export function StageWorkspacePanel({
  projectId,
  stageData,
  workflow,
  onRefresh,
  files = [],
  exports = [],
  distributions = [],
  projectTitle = "",
  hasManuscript = false,
}: StageWorkspacePanelProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOutputs, setShowOutputs] = useState(false);

  const { stage, status, substages, completedCount, totalCount, isCurrent } = stageData;
  const badge = STAGE_STATUS_BADGE[status];

  async function handleAdvance() {
    setAdvancing(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not advance workflow");
        return;
      }
      await onRefresh();
      router.refresh();
    } catch {
      setError("Network error advancing workflow");
    } finally {
      setAdvancing(false);
    }
  }

  async function handleUpdateStage(stageKey: string, dbPhaseKey: string, newStatus: string) {
    setUpdatingStage(stageKey);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_stage",
          phaseKey: dbPhaseKey,
          stageKey,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not update stage");
      }
      await onRefresh();
    } catch {
      setError("Network error updating stage");
    } finally {
      setUpdatingStage(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Stage header */}
      <div className="px-6 py-5 border-b border-border/30">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {stage.order}. {stage.label}
              </h2>
              <Badge className={cn("border text-xs font-medium", badge.cls)}>
                {badge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stage.description}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Stages</div>
              <div className="text-sm font-bold tabular-nums">
                {completedCount}/{totalCount}
              </div>
            </div>
            {isCurrent && workflow.status !== "completed" && (
              <Button
                size="sm"
                onClick={handleAdvance}
                disabled={advancing}
                className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-md"
              >
                {advancing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                Advance
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sub-stages list */}
      {substages.length > 0 && (
        <div className="px-6 py-4">
          <div className="space-y-1">
            {substages.map((sub, i) => {
              const isCurrentSub = isCurrent && workflow.current_stage === sub.stageKey;
              const isUpdating = updatingStage === sub.stageKey;

              return (
                <div
                  key={sub.stageKey}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isCurrentSub
                      ? "bg-blue-500/5 border border-blue-500/20"
                      : "hover:bg-muted/30",
                    i < substages.length - 1 && !isCurrentSub && "border-b border-border/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {sub.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : sub.status === "processing" ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : sub.status === "blocked" ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : sub.status === "needs_review" ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            sub.status === "completed"
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {sub.isAiStage && (
                            <Bot className="h-3 w-3 text-blue-400/70" />
                          )}
                          {sub.humanRequired && (
                            <User className="h-3 w-3 text-amber-400/70" />
                          )}
                          {sub.requiresApproval && (
                            <ShieldCheck className="h-3 w-3 text-purple-400/70" />
                          )}
                        </div>
                      </div>
                      {sub.startedAt && (
                        <span className="text-[10px] text-muted-foreground/60">
                          Started {formatDate(sub.startedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={cn(
                        "text-[10px] border font-medium",
                        STATUS_COLORS[sub.status] ?? STATUS_COLORS.pending
                      )}
                    >
                      {STATUS_LABEL[sub.status] ?? sub.status}
                    </Badge>

                    {isCurrentSub && sub.status !== "completed" && (
                      <div className="flex gap-1 ml-1">
                        {sub.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs gap-1 hover:bg-blue-500/10 hover:text-blue-400"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStage(sub.stageKey, sub.dbPhaseKey, "processing")
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            Start
                          </Button>
                        )}
                        {sub.status === "processing" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs gap-1 hover:bg-emerald-500/10 hover:text-emerald-400"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStage(sub.stageKey, sub.dbPhaseKey, "completed")
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outputs */}
      {stage.outputs.length > 0 && (
        <div className="px-6 pb-3">
          <button
            type="button"
            onClick={() => setShowOutputs((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full"
          >
            <FileText className="h-3 w-3" />
            <span>Outputs</span>
            {showOutputs ? (
              <ChevronUp className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-auto" />
            )}
          </button>
          {showOutputs && (
            <ul className="mt-2 space-y-1">
              {stage.outputs.map((output) => (
                <li
                  key={output}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                  {output}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Integrated tools & panels */}
      <StageTools
        stageId={stage.id}
        projectId={projectId}
        files={files}
        exports={exports}
        distributions={distributions}
        projectTitle={projectTitle}
        hasManuscript={hasManuscript}
      />

      {/* Legend */}
      <div className="px-6 py-3 border-t border-border/20 flex flex-wrap gap-4 text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Bot className="h-3 w-3 text-blue-400/60" /> AI Stage
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-amber-400/60" /> Human Required
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-purple-400/60" /> Approval Required
        </span>
      </div>
    </div>
  );
}

// --- Stage-specific tools & panels ---

interface StageToolsProps {
  stageId: string;
  projectId: string;
  files: EditorialFile[];
  exports: EditorialExportJob[];
  distributions: ProjectDistribution[];
  projectTitle: string;
  hasManuscript: boolean;
}

function StageTools({
  stageId,
  projectId,
  files,
  exports,
  distributions,
  projectTitle,
  hasManuscript,
}: StageToolsProps) {
  const content = getToolsForStage(
    stageId,
    projectId,
    files,
    exports,
    distributions,
    projectTitle,
    hasManuscript
  );

  if (!content) return null;

  return (
    <div className="px-6 pb-5 space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <div className="h-px flex-1 bg-border/30" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Tools & Actions
        </span>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      {content}
    </div>
  );
}

function getToolsForStage(
  stageId: string,
  projectId: string,
  files: EditorialFile[],
  exports: EditorialExportJob[],
  distributions: ProjectDistribution[],
  projectTitle: string,
  hasManuscript: boolean
): React.ReactNode {
  switch (stageId) {
    case "manuscript":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/50 bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Manuscript Upload</p>
              <p className="text-xs text-muted-foreground">
                Upload the original manuscript to begin the editorial process.
              </p>
            </div>
            <ReinoEditorialManuscriptUpload projectId={projectId} />
          </div>
          {hasManuscript && (
            <StaffManuscriptAiCta
              projectId={projectId}
              hasLatestManuscript={hasManuscript}
            />
          )}
          <StaffFilesTab files={files} projectId={projectId} />
        </div>
      );

    case "ai-analysis":
      return <StaffProjectAiReview projectId={projectId} />;

    case "structural-editing":
    case "line-editing":
    case "copyediting":
      return <CorrectionReportPanel projectId={projectId} />;

    case "book-specs":
      return (
        <div className="space-y-4">
          <BookSpecsPanel projectId={projectId} />
          <KdpValidationPanel projectId={projectId} />
        </div>
      );

    case "layout":
      return <InteriorDesignPanel projectId={projectId} />;

    case "cover-design":
      return <CoverGeneratorPanel projectId={projectId} />;

    case "final-proof":
      return null;

    case "publishing":
      return (
        <div className="space-y-4">
          <MetadataIsbnPanel projectId={projectId} />
          <ExportPanel
            projectId={projectId}
            projectTitle={projectTitle}
            exports={exports}
          />
          <EbookPipelinePanel projectId={projectId} />
        </div>
      );

    case "distribution":
      return (
        <DistributionPanel
          projectId={projectId}
          projectTitle={projectTitle}
          distributions={distributions}
        />
      );

    default:
      return null;
  }
}
