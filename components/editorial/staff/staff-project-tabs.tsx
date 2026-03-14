"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Users, LayoutGrid, Download, Globe, Paintbrush, Cpu, Clock, Smartphone, LayoutTemplate, Shield, Hash, FileSignature, ClipboardList } from "lucide-react";
import { StaffProjectSummaryTab } from "./staff-project-summary-tab";
import { StaffPipelineTab } from "./staff-pipeline-tab";
import { StaffTimelineControl } from "./staff-timeline-control";
import { StaffFilesTab } from "./staff-files-tab";
import { StaffCommentsTab } from "./staff-comments-tab";
import { StaffAssignmentsTab } from "./staff-assignments-tab";
import { ExportPanel } from "@/components/editorial/export/export-panel";
import { DistributionPanel } from "@/components/editorial/distribution/distribution-panel";
import { CoverGeneratorPanel } from "@/components/editorial/staff/cover-generator-panel";
import { EbookPipelinePanel } from "@/components/editorial/staff/ebook-pipeline-panel";
import { InteriorDesignPanel } from "@/components/editorial/staff/interior-design-panel";
import { KdpValidationPanel } from "@/components/editorial/staff/kdp-validation-panel";
import { MetadataIsbnPanel } from "@/components/editorial/staff/metadata-isbn-panel";
import { ContractCenterPanel } from "@/components/editorial/staff/contract-center-panel";
import { CorrectionReportPanel } from "@/components/editorial/staff/correction-report-panel";
import type { StaffProjectDetail } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";

interface StaffProjectTabsProps {
  detail: StaffProjectDetail;
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
}

export function StaffProjectTabs({ detail, exports = [], distributions = [] }: StaffProjectTabsProps) {
  const { project, stages, files, comments, members, staffAssignments, created_by_name, created_by_email } = detail;

  return (
    <Tabs defaultValue="resumen" className="w-full">
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin md:overflow-visible">
        <TabsList className="inline-flex h-10 min-w-max rounded-lg bg-muted/60 p-1 md:w-full">
          <TabsTrigger value="resumen" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="motor-editorial" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Cpu className="h-3.5 w-3.5 shrink-0" />
            Motor Editorial
          </TabsTrigger>
          <TabsTrigger value="archivos" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            Archivos
          </TabsTrigger>
          <TabsTrigger value="portada" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Paintbrush className="h-3.5 w-3.5 shrink-0" />
            Portada AI
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Download className="h-3.5 w-3.5 shrink-0" />
            Export
          </TabsTrigger>
          <TabsTrigger value="ebook" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            eBook
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            Distribución
          </TabsTrigger>
          <TabsTrigger value="interior" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
            Interior
          </TabsTrigger>
          <TabsTrigger value="kdp" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            KDP
          </TabsTrigger>
          <TabsTrigger value="metadatos" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Hash className="h-3.5 w-3.5 shrink-0" />
            Metadatos
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <FileSignature className="h-3.5 w-3.5 shrink-0" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="correcciones" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            Correcciones
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="comentarios" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="asignaciones" className="gap-1.5 px-3 text-xs sm:text-sm shrink-0">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Asignaciones
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

      <TabsContent value="motor-editorial" className="mt-4">
        <StaffPipelineTab
          projectId={project.id}
          stages={stages}
          currentStage={project.current_stage}
          files={files}
          exports={exports}
          distributions={distributions}
        />
      </TabsContent>

      <TabsContent value="archivos" className="mt-4">
        <StaffFilesTab files={files} projectId={project.id} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <StaffTimelineControl projectId={project.id} />
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

      <TabsContent value="ebook" className="mt-4">
        <EbookPipelinePanel projectId={project.id} />
      </TabsContent>

      <TabsContent value="distribution" className="mt-4">
        <DistributionPanel
          projectId={project.id}
          projectTitle={project.title}
          distributions={distributions}
        />
      </TabsContent>

      <TabsContent value="interior" className="mt-4">
        <InteriorDesignPanel projectId={project.id} />
      </TabsContent>

      <TabsContent value="kdp" className="mt-4">
        <KdpValidationPanel projectId={project.id} />
      </TabsContent>

      <TabsContent value="metadatos" className="mt-4">
        <MetadataIsbnPanel projectId={project.id} />
      </TabsContent>

      <TabsContent value="contratos" className="mt-4">
        <ContractCenterPanel
          projectId={project.id}
          projectTitle={project.title}
          clientName={created_by_name ?? created_by_email ?? undefined}
        />
      </TabsContent>

      <TabsContent value="correcciones" className="mt-4">
        <CorrectionReportPanel projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
