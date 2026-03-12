 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Circle, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import { getNextStage } from "@/lib/editorial/pipeline/stage-utils";
import type { EditorialFile, EditorialStageKey, StageWithApprover } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import { AiStageAssistPanel } from "@/components/editorial/staff/ai-stage-assist-panel";
import { StageReviewPanel } from "@/components/editorial/staff/stage-review-panel";
import { StageMaquetacionPanel } from "@/components/editorial/staff/stage-maquetacion-panel";
import { StageExportPanel } from "@/components/editorial/staff/stage-export-panel";
import { StageDistributionPanel } from "@/components/editorial/staff/stage-distribution-panel";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";

const STAGE_ORDER: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  queued: "En cola",
  processing: "En proceso",
  review_required: "Revisión",
  approved: "Aprobado",
  failed: "Error",
  completed: "Completado",
};

const AI_TASKS_BY_STAGE: Partial<Record<EditorialStageKey, EditorialAiTaskKey[]>> = {
  estructura: ["structure_analysis", "issue_detection"],
  estilo: ["style_suggestions", "issue_detection"],
  ortotipografia: ["orthotypography_review", "issue_detection"],
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StageIcon({ status }: { status: string }) {
  if (status === "completed" || status === "approved") return <Check className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "processing" || status === "review_required") return <Loader2 className="h-4 w-4 text-primary shrink-0" />;
  if (status === "failed") return <Circle className="h-4 w-4 text-destructive shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
}

interface StaffPipelineTabProps {
  stages: StageWithApprover[];
  currentStage: string;
  projectId: string;
  files: EditorialFile[];
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
}

export function StaffPipelineTab({ 
  stages, 
  currentStage, 
  projectId, 
  files,
  exports = [],
  distributions = [],
}: StaffPipelineTabProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byKey = new Map(stages.map((s) => [s.stage_key, s]));
  const ordered = STAGE_ORDER.map((key) => ({
    key,
    label: EDITORIAL_STAGE_LABELS[key],
    stage: byKey.get(key),
  }));

  // Get current stage data for the review panel
  const currentStageData = byKey.get(currentStage as EditorialStageKey);
  const nextStageKey = getNextStage(currentStage as EditorialStageKey);

  const hasManuscript =
    files.some((f) => f.file_type === "manuscript_original") ||
    files.some((f) => f.file_type === "manuscript_edited");

  async function approve(stageKey: string) {
    setError(null);
    setIsApproving(stageKey);
    try {
      const res = await fetch(
        `/api/staff/projects/${projectId}/stages/${stageKey}/approve`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo aprobar la etapa.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red al aprobar la etapa.");
    } finally {
      setIsApproving(null);
    }
  }

  async function setStatus(stageKey: string, status: string) {
    setError(null);
    setIsApproving(stageKey);
    try {
      const res = await fetch(
        `/api/staff/projects/${projectId}/stages/${stageKey}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo actualizar el estado.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red al actualizar el estado.");
    } finally {
      setIsApproving(null);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Stage Review Panel - Main focus for current stage */}
      {currentStageData && currentStage !== "maquetacion" && currentStage !== "export" && currentStage !== "distribution" && (
        <StageReviewPanel
          projectId={projectId}
          stage={currentStageData}
          nextStageKey={nextStageKey}
          files={files}
          onApproved={() => router.refresh()}
        />
      )}

      {/* Specialized panel for Maquetacion */}
      {currentStage === "maquetacion" && currentStageData && (
        <StageMaquetacionPanel
          projectId={projectId}
          stage={currentStageData}
          files={files}
          onUploaded={() => router.refresh()}
        />
      )}

      {/* Specialized panel for Export */}
      {currentStage === "export" && currentStageData && (
        <StageExportPanel
          projectId={projectId}
          stage={currentStageData}
          exports={exports}
          onExportCreated={() => router.refresh()}
        />
      )}

      {/* Specialized panel for Distribution */}
      {currentStage === "distribution" && currentStageData && (
        <StageDistributionPanel
          projectId={projectId}
          stage={currentStageData}
          distributions={distributions}
          exports={exports}
          onDistributionCreated={() => router.refresh()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Etapas editoriales</CardTitle>
          <CardDescription>
            Estado, fechas y responsable por etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <ul className="space-y-0">
            {ordered.map(({ key, label, stage }, i) => {
              const isCurrent = currentStage === key;
              const status = stage?.status ?? "pending";
              const statusLabel = STATUS_LABELS[status] ?? status;
              const approver = stage?.approved_by_name ?? stage?.approved_by_email;
              const canApprove =
                isCurrent && status !== "approved" && status !== "completed";
              const approvalBlockedReason =
                isCurrent && key === "ingesta" && !hasManuscript
                  ? "Para aprobar Ingesta, sube al menos un manuscrito."
                  : null;

              return (
                <li
                  key={key}
                  className={`flex flex-col gap-2 border-border py-3 ${i < ordered.length - 1 ? "border-b" : ""} ${
                    isCurrent ? "bg-muted/30 -mx-3 px-3 rounded-md" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StageIcon status={status} />
                      <span className="font-medium text-sm">{label}</span>
                      {isCurrent && (
                        <Badge variant="default" className="shrink-0 text-xs">Actual</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isCurrent ? "default" : "secondary"} className="shrink-0 text-xs">
                        {statusLabel}
                      </Badge>
                      {isCurrent && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => setStatus(key, "processing")}
                            disabled={isApproving === key}
                          >
                            En proceso
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => setStatus(key, "review_required")}
                            disabled={isApproving === key}
                          >
                            Revisión
                          </Button>
                        </div>
                      )}
                      {canApprove && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2"
                          onClick={() => approve(key)}
                          disabled={isApproving === key || !!approvalBlockedReason}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isApproving === key ? "Aprobando…" : "Aprobar"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {approvalBlockedReason && (
                    <p className="pl-6 text-xs text-muted-foreground">
                      {approvalBlockedReason}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
                    {stage?.started_at && (
                      <span>Inicio: {formatDate(stage.started_at)}</span>
                    )}
                    {stage?.completed_at && (
                      <span>Fin: {formatDate(stage.completed_at)}</span>
                    )}
                    {stage?.approved_at && (
                      <span>Aprobado: {formatDate(stage.approved_at)}</span>
                    )}
                    {approver && (
                      <span>Por: {approver}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {isValidAiStage(currentStage) && (
        <AiStageAssistPanel
          projectId={projectId}
          stageKey={currentStage}
          tasks={AI_TASKS_BY_STAGE[currentStage] ?? []}
        />
      )}
    </div>
  );
}

function isValidAiStage(stageKey: string): stageKey is EditorialStageKey {
  return stageKey === "estructura" || stageKey === "estilo" || stageKey === "ortotipografia";
}
