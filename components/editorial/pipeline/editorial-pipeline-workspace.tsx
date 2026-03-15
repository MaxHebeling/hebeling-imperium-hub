"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { ProjectWorkflowDetail, WorkflowPhaseKey } from "@/lib/editorial/types/workflow";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";
import { PipelineStageBar } from "./pipeline-stage-bar";
import { StageWorkspacePanel } from "./stage-workspace-panel";

// ─── Props ───────────────────────────────────────────────────────────

interface EditorialPipelineWorkspaceProps {
  projectId: string;
  projectTitle: string;
  files: EditorialFile[];
  exports: EditorialExportJob[];
  distributions: ProjectDistribution[];
  hasManuscript: boolean;
}

// ─── Component ───────────────────────────────────────────────────────

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
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<WorkflowPhaseKey | null>(null);

  const fetchWorkflow = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/workflow`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
        // Auto-select current phase on first load
        if (!selectedPhase && json.data.workflow?.current_phase) {
          setSelectedPhase(json.data.workflow.current_phase as WorkflowPhaseKey);
        }
      } else {
        setError(json.error ?? "No se pudo cargar el flujo editorial.");
      }
    } catch {
      setError("Error de red al cargar el flujo editorial. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedPhase]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  function handleSelectPhase(phaseKey: WorkflowPhaseKey) {
    setSelectedPhase((prev) => (prev === phaseKey ? null : phaseKey));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando flujo editorial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 backdrop-blur-md p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchWorkflow(); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos de flujo disponibles. El flujo profesional se inicializará automáticamente.
        </p>
      </div>
    );
  }

  const selectedPhaseData = selectedPhase
    ? detail.phases.find((p) => p.phase.phase_key === selectedPhase)
    : null;

  return (
    <div className="space-y-4">
      {/* Pipeline stage bar */}
      <PipelineStageBar
        phases={detail.phases}
        selectedPhase={selectedPhase}
        onSelectPhase={handleSelectPhase}
        progressPercent={detail.workflow.progress_percent}
      />

      {/* Stage workspace panel */}
      {selectedPhase && selectedPhaseData && (
        <StageWorkspacePanel
          key={selectedPhase}
          projectId={projectId}
          phaseKey={selectedPhase}
          phaseData={selectedPhaseData}
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
