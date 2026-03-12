import { ORG_ID } from "@/lib/leads/helpers";
import { calculateProgressPercent } from "@/lib/editorial/pipeline/progress";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import {
  listEditorialProjects,
  getEditorialProject,
  getProjectStages,
  getProjectFiles,
  getProjectComments,
  getProjectActivity,
  getProjectMembers,
  getProjectStaffAssignments,
  getProfilesByIds,
} from "@/lib/editorial/db/queries";
import type {
  StaffProjectListItem,
  StaffDashboardData,
  StaffProjectDetail,
  StaffProjectMember,
  StageWithApprover,
  EditorialProjectStaffAssignment,
  StaffActivityLogEntry,
} from "@/lib/editorial/types/editorial";

/** Progress from pipeline (single source of truth). */
function progressForStage(stage: string): number {
  return calculateProgressPercent(stage as EditorialStageKey);
}

/** Enrich project for list: progress from stage + creator profile + last activity. */
function toStaffListItem(
  project: Awaited<ReturnType<typeof listEditorialProjects>>[number],
  profileMap: Map<string, { full_name: string | null; email: string | null }>
): StaffProjectListItem {
  const creator = project.created_by
    ? profileMap.get(project.created_by)
    : undefined;
  return {
    ...project,
    progress_percent: progressForStage(project.current_stage),
    created_by_email: creator?.email ?? null,
    created_by_name: creator?.full_name ?? null,
    last_activity_at: project.updated_at ?? project.created_at,
  };
}

/**
 * List all editorial projects for staff (org-scoped).
 * Reuses listEditorialProjects + getProfilesByIds; progress from pipeline.
 */
export async function listStaffProjects(): Promise<StaffProjectListItem[]> {
  const projects = await listEditorialProjects(ORG_ID);
  const creatorIds = [
    ...new Set(
      projects.map((p) => p.created_by).filter((id): id is string => !!id)
    ),
  ];
  const profiles = await getProfilesByIds(creatorIds);
  const profileMap = new Map(
    profiles.map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  );
  return projects.map((p) => toStaffListItem(p, profileMap));
}

/**
 * Dashboard aggregates and recent projects.
 * Reuses listStaffProjects; counts derived from list.
 */
export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const items = await listStaffProjects();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inReviewCount = items.filter(
    (p) => p.status === "review" || p.status === "review_required"
  ).length;
  const completedThisMonthCount = items.filter((p) => {
    if (p.current_stage !== "revision_final" || p.status !== "completed")
      return false;
    const updated = p.updated_at ?? p.created_at;
    return new Date(updated) >= startOfMonth;
  }).length;

  const recentProjects = items
    .sort((a, b) => {
      const ta = a.last_activity_at ?? a.created_at;
      const tb = b.last_activity_at ?? b.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    })
    .slice(0, 8);

  return {
    projectsCount: items.length,
    inReviewCount,
    completedThisMonthCount,
    recentProjects,
  };
}

/**
 * Full project detail for staff: project, stages, files, comments, activity.
 * Progress from pipeline; creator profile for "responsable".
 */
export async function getStaffProject(
  projectId: string
): Promise<StaffProjectDetail | null> {
  const project = await getEditorialProject(projectId);
  if (!project) return null;

  const [stages, files, comments, activity, members, staffAssignmentsRaw] = await Promise.all([
    getProjectStages(projectId),
    getProjectFiles(projectId),
    getProjectComments(projectId),
    getProjectActivity(projectId),
    getProjectMembers(projectId),
    getProjectStaffAssignments(projectId),
  ]);

  const allUserIds = [
    ...(project.created_by ? [project.created_by] : []),
    ...members.map((m) => m.user_id),
    ...stages.map((s) => s.approved_by).filter((id): id is string => !!id),
    ...staffAssignmentsRaw.map((a) => a.user_id),
    ...activity.map((a) => a.actor_id).filter((id): id is string => !!id),
  ];
  const profiles = await getProfilesByIds([...new Set(allUserIds)]);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  let created_by_email: string | null = null;
  let created_by_name: string | null = null;
  if (project.created_by) {
    const creator = profileMap.get(project.created_by);
    if (creator) {
      created_by_email = creator.email;
      created_by_name = creator.full_name;
    }
  }

  const membersWithProfile: StaffProjectMember[] = members.map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      invited_at: m.invited_at,
      accepted_at: m.accepted_at,
      email: p?.email ?? null,
      full_name: p?.full_name ?? null,
    };
  });

  const stagesWithApprover: StageWithApprover[] = stages.map((s) => {
    const approver = s.approved_by ? profileMap.get(s.approved_by) : undefined;
    return {
      ...s,
      approved_by_name: approver?.full_name ?? null,
      approved_by_email: approver?.email ?? null,
    };
  });

  const staffAssignments: EditorialProjectStaffAssignment[] = staffAssignmentsRaw.map((a) => {
    const p = profileMap.get(a.user_id);
    return {
      id: a.id,
      project_id: a.project_id,
      user_id: a.user_id,
      role: a.role as EditorialProjectStaffAssignment["role"],
      assigned_by: a.assigned_by,
      assigned_at: a.assigned_at,
      user_full_name: p?.full_name ?? null,
      user_email: p?.email ?? null,
    };
  });

  const staffActivity: StaffActivityLogEntry[] = activity.map((a) => {
    const p = a.actor_id ? profileMap.get(a.actor_id) : undefined;
    return {
      ...a,
      stage_key: (a.stage_key as EditorialStageKey | null) ?? null,
      actor_name: p?.full_name ?? null,
      actor_email: p?.email ?? null,
    };
  });

  return {
    project: {
      ...project,
      progress_percent: progressForStage(project.current_stage),
    },
    stages: stagesWithApprover,
    files,
    comments,
    activity: staffActivity,
    members: membersWithProfile,
    staffAssignments,
    created_by_email,
    created_by_name,
  };
}
