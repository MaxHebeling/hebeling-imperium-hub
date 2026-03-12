"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, GitBranch, MessageSquare, Users, LayoutGrid, Sparkles, Download, Globe } from "lucide-react";
import { StaffProjectSummaryTab } from "./staff-project-summary-tab";
import { StaffPipelineTab } from "./staff-pipeline-tab";
import { StaffFilesTab } from "./staff-files-tab";
import { StaffCommentsTab } from "./staff-comments-tab";
import { StaffAssignmentsTab } from "./staff-assignments-tab";
import { AiStageAssistPanel } from "@/components/editorial/staff/ai-stage-assist-panel";
import { ExportPanel } from "@/components/editorial/export/export-panel";
import { DistributionPanel } from "@/components/editorial/distribution/distribution-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { StaffProjectDetail } from "@/lib/editorial/types/editorial";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";

interface StaffProjectTabsProps {
  detail: StaffProjectDetail;
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
}

const AI_TASKS_BY_STAGE: Partial<Record<EditorialStageKey, EditorialAiTaskKey[]>> = {
  estructura: ["structure_analysis", "issue_detection"],
  estilo: ["style_suggestions", "issue_detection"],
  ortotipografia: ["orthotypography_review", "issue_detection"],
};

function isAiSupportedStage(stageKey: string): stageKey is EditorialStageKey {
  return stageKey === "estructura" || stageKey === "estilo" || stageKey === "ortotipografia";
}

export function StaffProjectTabs({ detail, exports = [], distributions = [] }: StaffProjectTabsProps) {
  const { project, stages, files, comments, members, staffAssignments, created_by_name, created_by_email } = detail;

  const currentStageKey = project.current_stage;
  const aiStageLabel = EDITORIAL_STAGE_LABELS[currentStageKey as EditorialStageKey] ?? currentStageKey;
  const aiTasks = isAiSupportedStage(currentStageKey) ? (AI_TASKS_BY_STAGE[currentStageKey] ?? []) : [];

  return (
    <Tabs defaultValue="resumen" className="w-full">
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin md:overflow-visible">
        <TabsList className="inline-flex h-10 min-w-max rounded-lg bg-muted/60 p-1 md:w-full">
          <TabsTrigger value="resumen" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            AI
          </TabsTrigger>
          <TabsTrigger value="archivos" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            Archivos
          </TabsTrigger>
          <TabsTrigger value="comentarios" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="asignaciones" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Asignaciones
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Download className="h-3.5 w-3.5 shrink-0" />
            Export
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            Distribución
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="resumen" className="mt-4">
        <StaffProjectSummaryTab
          project={project}
          createdByName={created_by_name}
          createdByEmail={created_by_email}
          activity={detail.activity}
        />
      </TabsContent>

      <TabsContent value="pipeline" className="mt-4">
        <StaffPipelineTab
          projectId={project.id}
          stages={stages}
          currentStage={project.current_stage}
          files={files}
        />
      </TabsContent>

      <TabsContent value="ai" className="mt-4">
        {isAiSupportedStage(currentStageKey) ? (
          <AiStageAssistPanel projectId={project.id} stageKey={currentStageKey} tasks={aiTasks} />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI – Asistencia editorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                La asistencia AI aún no está habilitada para la etapa actual:{" "}
                <span className="font-medium text-foreground">{aiStageLabel}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Cambia la etapa a <span className="font-medium text-foreground">Estructura</span>,{" "}
                <span className="font-medium text-foreground">Estilo</span> u{" "}
                <span className="font-medium text-foreground">Ortotipografía</span> para ver acciones de AI.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="archivos" className="mt-4">
        <StaffFilesTab files={files} projectId={project.id} />
      </TabsContent>

      <TabsContent value="comentarios" className="mt-4">
        <StaffCommentsTab comments={comments} projectId={project.id} />
      </TabsContent>

      <TabsContent value="asignaciones" className="mt-4">
        <StaffAssignmentsTab
          members={members}
          staffAssignments={staffAssignments}
          projectId={project.id}
        />
      </TabsContent>

      <TabsContent value="export" className="mt-4">
        <ExportPanel
          projectId={project.id}
          projectTitle={project.title}
          exports={exports}
        />
      </TabsContent>

      <TabsContent value="distribution" className="mt-4">
        <DistributionPanel
          projectId={project.id}
          projectTitle={project.title}
          distributions={distributions}
        />
      </TabsContent>
    </Tabs>
  );
}
