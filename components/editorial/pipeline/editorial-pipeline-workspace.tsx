"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { ProjectWorkflowDetail } from "@/lib/editorial/types/workflow";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";
import { PipelineStageBar } from "./pipeline-stage-bar";
import { StageWorkspacePanel } from "./stage-workspace-panel";
import { mapWorkflowToUIStages } from "./pipeline-stages";
import type { UIStageData } from "./pipeline-stages";

// --- Props ---

interface EditorialPipelineWorkspaceProps {
  projectId: string;
  projectTitle: string;
  files: EditorialFile[];
  exports: EditorialExportJob[];
  distributions: ProjectDistribution[];
  hasManuscript: boolean;
}

// --- Component ---

export function EditorialPipelineWorkspace({
  projectId,
  projectTitle,
  files,
  exports,
  distributions,
  hasManuscript,
}: EditorialPipelineWorkspaceProps) {
  const [detail, setDetail] = useState<ProjectWorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
      }
    } catch {
      // Silently fail - workspace is supplementary
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Compute UI stages from workflow data
  const uiStages: UIStageData[] = detail ? mapWorkflowToUIStages(detail) : [];

  // Auto-select the active stage on first load
  useEffect(() => {
    if (uiStages.length > 0 && !selectedStageId) {
      const activeStage = uiStages.find((s) => s.status === "active");
      if (activeStage) {
        setSelectedStageId(activeStage.stage.id);
      }
    }
  }, [uiStages, selectedStageId]);

  function handleSelectStage(stageId: string) {
    setSelectedStageId((prev) => (prev === stageId ? null : stageId));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading editorial pipeline...</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No workflow data available. The professional workflow may need to be initialized.
        </p>
      </div>
    );
  }

  const selectedStageData = selectedStageId
    ? uiStages.find((s) => s.stage.id === selectedStageId)
    : null;

  return (
    <div className="space-y-4">
      {/* Pipeline stage bar */}
      <PipelineStageBar
        stages={uiStages}
        selectedStageId={selectedStageId}
        onSelectStage={handleSelectStage}
        progressPercent={detail.workflow.progress_percent}
      />

      {/* Stage workspace panel */}
      {selectedStageId && selectedStageData && (
        <StageWorkspacePanel
          key={selectedStageId}
          projectId={projectId}
          stageData={selectedStageData}
          workflow={detail.workflow}
          onRefresh={fetchWorkflow}
          files={files}
          exports={exports}
          distributions={distributions}
          projectTitle={projectTitle}
          hasManuscript={hasManuscript}
        />
      )}
    </div>
  );
}
