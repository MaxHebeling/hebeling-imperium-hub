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
  ChevronRight,
  Play,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ProjectWorkflowDetail,
  WorkflowPhaseKey,
  WorkflowStageKey,
} from "@/lib/editorial/types/workflow";

// ─── Existing panels integrated into stages ──────────────────────────

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

// ─── Status helpers ──────────────────────────────────────────────────

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Phase descriptions ──────────────────────────────────────────────

const PHASE_DESCRIPTIONS: Record<WorkflowPhaseKey, string> = {
  intake: "Upload and validate the original manuscript. Configure project settings and editorial admission.",
  editorial_analysis: "AI-powered analysis of manuscript structure, style, and potential issues.",
  structural_editing: "Structural editing with AI suggestions. Review and approve structural changes.",
  line_editing: "Line-by-line editing for voice consistency, style refinement, and flow.",
  copyediting: "Grammar correction, orthotypography review, and references validation.",
  text_finalization: "Lock the final text, create master manuscript, and obtain editorial approval.",
  book_specifications: "Configure book format, Amazon KDP settings, layout parameters, and pagination.",
  book_production: "Interior layout, cover design, and proof generation.",
  final_proof: "Final proof review, corrections, and production approval.",
  publishing_prep: "Generate metadata, register ISBN, set pricing strategy, and configure distribution.",
  distribution: "Export validation, publish to platforms, and activate on marketplaces.",
};

// ─── Props ───────────────────────────────────────────────────────────

interface StageWorkspacePanelProps {
  projectId: string;
  phaseKey: WorkflowPhaseKey;
  phaseData: ProjectWorkflowDetail["phases"][number];
  workflow: ProjectWorkflowDetail["workflow"];
  onRefresh: () => Promise<void>;
  // Data for integrated panels
  files?: EditorialFile[];
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
  projectTitle?: string;
  hasManuscript?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────

export function StageWorkspacePanel({
  projectId,
  phaseKey,
  phaseData,
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

  const { phase, stages, isComplete, isCurrent } = phaseData;
  const completedCount = stages.filter((s) => s.status?.status === "completed").length;

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

  async function handleUpdateStage(stageKey: string, status: string) {
    setUpdatingStage(stageKey);
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_stage",
          phaseKey,
          stageKey,
          status,
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
      {/* Phase header */}
      <div className="px-6 py-5 border-b border-border/30">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {phase.order}. {phase.name}
              </h2>
              {isComplete && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border text-xs">
                  Complete
                </Badge>
              )}
              {isCurrent && !isComplete && (
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 border text-xs">
                  Active
                </Badge>
              )}
              {!isCurrent && !isComplete && (
                <Badge className="bg-muted/60 text-muted-foreground border-border/40 border text-xs">
                  Upcoming
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {PHASE_DESCRIPTIONS[phaseKey]}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Stages</div>
              <div className="text-sm font-bold tabular-nums">
                {completedCount}/{stages.length}
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
      <div className="px-6 py-4">
        <div className="space-y-1">
          {stages.map(({ definition: stageDef, status: stageStatus }, i) => {
            const isCurrentStage = isCurrent && workflow.current_stage === stageDef.stage_key;
            const stStatus = stageStatus?.status ?? "pending";
            const isUpdating = updatingStage === stageDef.stage_key;

            return (
              <div
                key={stageDef.stage_key}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isCurrentStage
                    ? "bg-blue-500/5 border border-blue-500/20"
                    : "hover:bg-muted/30",
                  i < stages.length - 1 && !isCurrentStage && "border-b border-border/20"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status icon */}
                  <div className="shrink-0">
                    {stStatus === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : stStatus === "processing" ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : stStatus === "blocked" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : stStatus === "needs_review" ? (
                      <Clock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        stStatus === "completed" ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {stageDef.name}
                      </span>
                      {/* Type indicators */}
                      <div className="flex items-center gap-1">
                        {stageDef.is_ai_stage && (
                          <Bot className="h-3 w-3 text-blue-400/70" />
                        )}
                        {stageDef.human_required && (
                          <User className="h-3 w-3 text-amber-400/70" />
                        )}
                        {stageDef.requires_approval && (
                          <ShieldCheck className="h-3 w-3 text-purple-400/70" />
                        )}
                      </div>
                    </div>
                    {stageStatus?.started_at && (
                      <span className="text-[10px] text-muted-foreground/60">
                        Started {formatDate(stageStatus.started_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={cn(
                      "text-[10px] border font-medium",
                      STATUS_COLORS[stStatus] ?? STATUS_COLORS.pending
                    )}
                  >
                    {STATUS_LABEL[stStatus] ?? stStatus}
                  </Badge>

                  {/* Action buttons for current stage */}
                  {isCurrentStage && stStatus !== "completed" && (
                    <div className="flex gap-1 ml-1">
                      {stStatus === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs gap-1 hover:bg-blue-500/10 hover:text-blue-400"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStage(stageDef.stage_key, "processing")
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
                      {stStatus === "processing" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs gap-1 hover:bg-emerald-500/10 hover:text-emerald-400"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStage(stageDef.stage_key, "completed")
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

      {/* Phase-specific integrated content */}
      <PhaseContent
        phaseKey={phaseKey}
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

// ─── Phase-specific content ──────────────────────────────────────────

interface PhaseContentProps {
  phaseKey: WorkflowPhaseKey;
  projectId: string;
  files: EditorialFile[];
  exports: EditorialExportJob[];
  distributions: ProjectDistribution[];
  projectTitle: string;
  hasManuscript: boolean;
}

function PhaseContent({
  phaseKey,
  projectId,
  files,
  exports,
  distributions,
  projectTitle,
  hasManuscript,
}: PhaseContentProps) {
  const content = getPhaseContent(
    phaseKey,
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

function getPhaseContent(
  phaseKey: WorkflowPhaseKey,
  projectId: string,
  files: EditorialFile[],
  exports: EditorialExportJob[],
  distributions: ProjectDistribution[],
  projectTitle: string,
  hasManuscript: boolean
): React.ReactNode {
  switch (phaseKey) {
    case "intake":
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

    case "editorial_analysis":
      return <StaffProjectAiReview projectId={projectId} />;

    case "structural_editing":
    case "line_editing":
    case "copyediting":
      return <CorrectionReportPanel projectId={projectId} />;

    case "text_finalization":
      return null;

    case "book_specifications":
      return (
        <div className="space-y-4">
          <BookSpecsPanel projectId={projectId} />
          <KdpValidationPanel projectId={projectId} />
        </div>
      );

    case "book_production":
      return (
        <div className="space-y-4">
          <InteriorDesignPanel projectId={projectId} />
          <CoverGeneratorPanel projectId={projectId} />
        </div>
      );

    case "final_proof":
      return null;

    case "publishing_prep":
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
