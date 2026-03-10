import { notFound } from "next/navigation";
import { getStaffProject } from "@/lib/editorial/staff/services";
import { StaffProjectHeader } from "@/components/editorial/staff/staff-project-header";
import { StaffProjectTabs } from "@/components/editorial/staff/staff-project-tabs";
import { getProjectAlertsWithRecalc } from "@/lib/editorial/alerts/detection";
import { StaffAlertsPanel } from "@/components/editorial/staff/staff-alerts-panel";

interface StaffBookDetailPageProps {
  params: Promise<{ projectId: string }>;
}

/**
 * Staff Book Detail — UI premium con header + tabs (Resumen, Pipeline, Archivos, Comentarios, Asignaciones).
 * Mobile-first; reutiliza getStaffProject() y componentes editorial/staff.
 */
export default async function StaffBookDetailPage({ params }: StaffBookDetailPageProps) {
  const { projectId } = await params;
  const [detail, alerts] = await Promise.all([
    getStaffProject(projectId),
    getProjectAlertsWithRecalc(projectId),
  ]);

  if (!detail) {
    notFound();
  }

  const { project, created_by_name, created_by_email } = detail;

  return (
    <div className="space-y-6 pb-6">
      <StaffProjectHeader
        projectId={project.id}
        title={project.title}
        authorName={project.author_name}
        currentStage={project.current_stage}
        progressPercent={project.progress_percent}
        status={project.status}
        createdByName={created_by_name}
        createdByEmail={created_by_email}
      />

      <StaffAlertsPanel projectId={project.id} alerts={alerts} />

      <StaffProjectTabs detail={detail} />
    </div>
  );
}
