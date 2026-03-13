"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, GitBranch, MessageSquare, Users, LayoutGrid, Sparkles, Download, Globe, Paintbrush } from "lucide-react";
import { StaffProjectSummaryTab } from "./staff-project-summary-tab";
import { StaffPipelineTab } from "./staff-pipeline-tab";
import { StaffFilesTab } from "./staff-files-tab";
import { StaffCommentsTab } from "./staff-comments-tab";
import { StaffAssignmentsTab } from "./staff-assignments-tab";
import { AiStageAssistPanel } from "@/components/editorial/staff/ai-stage-assist-panel";
import { ExportPanel } from "@/components/editorial/export/export-panel";
import { DistributionPanel } from "@/components/editorial/distribution/distribution-panel";
import { CoverGeneratorPanel } from "@/components/editorial/staff/cover-generator-panel";
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

const AI_TASKS_BY_STAGE: Record<EditorialStageKey, EditorialAiTaskKey[]> = {
  ingesta: ["manuscript_analysis", "issue_detection", "quality_scoring"],
  estructura: ["structure_analysis", "issue_detection"],
  estilo: ["style_suggestions", "issue_detection"],
  ortotipografia: ["orthotypography_review", "issue_detection"],
  maquetacion: ["layout_analysis", "typography_check", "page_flow_review", "issue_detection"],
  revision_final: ["issue_detection", "quality_scoring", "redline_diff"],
  export: ["export_validation", "metadata_generation", "quality_scoring"],
  distribution: ["metadata_generation"],
};

function isAiSupportedStage(stageKey: string): stageKey is EditorialStageKey {
  return stageKey in AI_TASKS_BY_STAGE;
}

export function StaffProjectTabs({ detail, exports = [], distributions = [] }: StaffProjectTabsProps) {
  const { project, stages, files, comments, members, staffAssignments, created_by_name, created_by_email } = detail;

  const currentStageKey = project.current_stage;
  const aiTasks = isAiSupportedStage(currentStageKey) ? AI_TASKS_BY_STAGE[currentStageKey] : [];

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
          <TabsTrigger value="portada" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Paintbrush className="h-3.5 w-3.5 shrink-0" />
            Portada AI
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
          exports={exports}
          distributions={distributions}
        />
      </TabsContent>

      <TabsContent value="ai" className="mt-4">
        <AiStageAssistPanel projectId={project.id} stageKey={currentStageKey as EditorialStageKey} tasks={aiTasks} />
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

      <TabsContent value="portada" className="mt-4">
        <CoverGeneratorPanel projectId={project.id} />
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
