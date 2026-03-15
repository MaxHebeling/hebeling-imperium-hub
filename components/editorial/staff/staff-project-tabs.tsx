"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Workflow,
  Cpu,
  FileText,
  LayoutTemplate,
  BookOpen,
  Paintbrush,
  Smartphone,
  Globe,
  Download,
  Shield,
  Hash,
  FileSignature,
  ClipboardList,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { WorkflowProfessionalPanel } from "@/components/editorial/staff/workflow-professional-panel";
import { BookSpecsPanel } from "@/components/editorial/staff/book-specs-panel";
import type { StaffProjectDetail } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";

// ─── Navigation structure ─────────────────────────────────────────────

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { key: "resumen", label: "Resumen", icon: LayoutGrid },
      { key: "workflow", label: "Workflow", icon: Workflow },
      { key: "timeline", label: "Timeline", icon: Clock },
    ],
  },
  {
    key: "editorial",
    label: "Editorial",
    items: [
      { key: "motor-editorial", label: "Motor Editorial", icon: Cpu },
      { key: "archivos", label: "Archivos", icon: FileText },
      { key: "correcciones", label: "Correcciones", icon: ClipboardList },
    ],
  },
  {
    key: "production",
    label: "Production",
    items: [
      { key: "interior", label: "Interior", icon: LayoutTemplate },
      { key: "book-specs", label: "Libro", icon: BookOpen },
      { key: "portada", label: "Portada AI", icon: Paintbrush },
    ],
  },
  {
    key: "publishing",
    label: "Publishing",
    items: [
      { key: "ebook", label: "eBook", icon: Smartphone },
      { key: "distribution", label: "Distribucion", icon: Globe },
      { key: "export", label: "Export", icon: Download },
      { key: "kdp", label: "KDP", icon: Shield },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { key: "metadatos", label: "Metadatos", icon: Hash },
      { key: "contratos", label: "Contratos", icon: FileSignature },
      { key: "comentarios", label: "Comentarios", icon: MessageSquare },
      { key: "asignaciones", label: "Asignaciones", icon: Users },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────

interface StaffProjectTabsProps {
  detail: StaffProjectDetail;
  exports?: EditorialExportJob[];
  distributions?: ProjectDistribution[];
}

// ─── Component ────────────────────────────────────────────────────────

export function StaffProjectTabs({ detail, exports = [], distributions = [] }: StaffProjectTabsProps) {
  const { project, stages, files, comments, members, staffAssignments, created_by_name, created_by_email } = detail;
  const [activeSection, setActiveSection] = useState("overview");
  const [activeTab, setActiveTab] = useState("resumen");

  const currentSection = NAV_SECTIONS.find((s) => s.key === activeSection) ?? NAV_SECTIONS[0];

  return (
    <div className="space-y-4">
      {/* ── Top section navigation (segmented control) ── */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <nav className="inline-flex min-w-max rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-1 shadow-sm">
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                setActiveSection(section.key);
                setActiveTab(section.items[0].key);
              }}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                activeSection === section.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Sub-navigation (tabs within section) ── */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="inline-flex min-w-max items-center gap-1 rounded-lg bg-muted/40 p-1">
          {currentSection.items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === item.key
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content panels ── */}
      <div className="mt-2">
        {activeTab === "resumen" && (
          <StaffProjectSummaryTab
            project={project}
            createdByName={created_by_name}
            createdByEmail={created_by_email}
            activity={detail.activity}
          />
        )}

        {activeTab === "workflow" && (
          <WorkflowProfessionalPanel projectId={project.id} />
        )}

        {activeTab === "motor-editorial" && (
          <StaffPipelineTab
            projectId={project.id}
            stages={stages}
            currentStage={project.current_stage}
            files={files}
            exports={exports}
            distributions={distributions}
          />
        )}

        {activeTab === "archivos" && (
          <StaffFilesTab files={files} projectId={project.id} />
        )}

        {activeTab === "timeline" && (
          <StaffTimelineControl projectId={project.id} />
        )}

        {activeTab === "comentarios" && (
          <StaffCommentsTab comments={comments} projectId={project.id} />
        )}

        {activeTab === "asignaciones" && (
          <StaffAssignmentsTab
            members={members}
            staffAssignments={staffAssignments}
            projectId={project.id}
          />
        )}

        {activeTab === "portada" && (
          <CoverGeneratorPanel projectId={project.id} />
        )}

        {activeTab === "export" && (
          <ExportPanel
            projectId={project.id}
            projectTitle={project.title}
            exports={exports}
          />
        )}

        {activeTab === "ebook" && (
          <EbookPipelinePanel projectId={project.id} />
        )}

        {activeTab === "distribution" && (
          <DistributionPanel
            projectId={project.id}
            projectTitle={project.title}
            distributions={distributions}
          />
        )}

        {activeTab === "book-specs" && (
          <BookSpecsPanel projectId={project.id} />
        )}

        {activeTab === "interior" && (
          <InteriorDesignPanel projectId={project.id} />
        )}

        {activeTab === "kdp" && (
          <KdpValidationPanel projectId={project.id} />
        )}

        {activeTab === "metadatos" && (
          <MetadataIsbnPanel projectId={project.id} />
        )}

        {activeTab === "contratos" && (
          <ContractCenterPanel
            projectId={project.id}
            projectTitle={project.title}
            clientName={created_by_name ?? created_by_email ?? undefined}
          />
        )}

        {activeTab === "correcciones" && (
          <CorrectionReportPanel projectId={project.id} />
        )}
      </div>
    </div>
  );
}
