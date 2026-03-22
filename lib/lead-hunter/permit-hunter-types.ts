export type PermitHunterLeadStage = "issuance" | "plan_check" | "other";

export type PermitHunterProjectType =
  | "adu"
  | "jadu"
  | "garage_conversion"
  | "remodel"
  | "addition"
  | "detached_structure"
  | "residential_building"
  | "combination_permit"
  | "unknown";

export type PermitHunterRecommendedAction =
  | "call_first"
  | "enrich_immediately"
  | "research_next"
  | "monitor_only";

export type PermitHunterRunStatus = "success" | "partial_failure" | "failure" | "running";

export type PermitHunterCommandType = "daily_scan" | "backfill_30" | "contact_sweep";

export type PermitHunterCommandStatus = "pending_supabase" | "completed";

export type PermitHunterCrmStage =
  | "new_lead"
  | "needs_enrichment"
  | "ready_to_contact"
  | "contacted"
  | "appointment_set"
  | "proposal_sent"
  | "won"
  | "lost";

export type PermitHunterCrmPriority = "urgent" | "high" | "normal" | "low";

export type PermitHunterCrmTaskType =
  | "call"
  | "text"
  | "email"
  | "research"
  | "site_visit"
  | "estimate"
  | "follow_up"
  | "custom";

export type PermitHunterCrmTaskStatus = "open" | "in_progress" | "done" | "blocked";

export type PermitHunterOutreachStatus = "new" | "attempted" | "contacted" | "won" | "lost";

export type PermitHunterOutreachChannel = "call" | "text" | "email" | "other";

export interface PermitHunterLead {
  id?: string;
  permitNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string | null;
  apn?: string | null;
  rawStatus: string;
  normalizedStage: PermitHunterLeadStage;
  scopeOfWork: string | null;
  rawDescription?: string | null;
  normalizedProjectType: PermitHunterProjectType;
  valuation: number | null;
  submittedAt?: string | null;
  updatedAt: string;
  sourceUrl?: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  mailingAddress: string | null;
  licensedProfessionalName: string | null;
  licensedProfessionalBusiness: string | null;
  licensedProfessionalLicenseType: string | null;
  enrichedAt?: string | null;
  score: number;
  recommendedAction: PermitHunterRecommendedAction;
  isHotLead: boolean;
}

export interface PermitHunterRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: PermitHunterRunStatus;
  permitsFound: number;
  permitsInserted: number;
  permitsUpdated: number;
  errorMessage: string | null;
}

export interface PermitHunterCommand {
  id: string;
  type: PermitHunterCommandType;
  status: PermitHunterCommandStatus;
  requestedAt: string;
  requestedBy: string;
  note: string | null;
}

export interface PermitHunterNote {
  id: string;
  permitNumber: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface PermitHunterOutreachRecord {
  permitNumber: string;
  status: PermitHunterOutreachStatus;
  channel: PermitHunterOutreachChannel | null;
  ownerResponse: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  updatedAt: string;
}

export interface PermitHunterCrmRecord {
  id: string;
  permitNumber: string;
  stage: PermitHunterCrmStage;
  priority: PermitHunterCrmPriority;
  assignedTo: string | null;
  estimatedValue: number | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  lastActivityAt: string | null;
  workflowSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermitHunterCrmTask {
  id: string;
  permitNumber: string;
  title: string;
  description: string | null;
  type: PermitHunterCrmTaskType;
  status: PermitHunterCrmTaskStatus;
  dueAt: string | null;
  assignedTo: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermitHunterDashboardData {
  metrics: {
    qualifiedLeadInventory: number;
    sourceCoverage: number;
    secondaryCandidates: number;
    hotLeads: number;
    freshIssuanceLeads: number;
    freshPlanCheckLeads: number;
    enrichmentPending: number;
    lastRunStatus: string;
  };
  reporting: {
    oldestLeadUpdatedAt: string | null;
    latestLeadUpdatedAt: string | null;
    lastSuccessfulRun: PermitHunterRun | null;
    recentRuns: PermitHunterRun[];
    inventoryByCity: Array<{
      city: string;
      count: number;
    }>;
    inventoryByProjectType: Array<{
      projectType: string;
      count: number;
    }>;
  };
  filters: {
    byContactStatus: Array<{
      key: "full_contact" | "owner_only" | "manual_research";
      label: string;
      count: number;
    }>;
    byProjectType: Array<{
      key: string;
      label: string;
      count: number;
    }>;
    byStage: Array<{
      key: "issuance" | "plan_check";
      label: string;
      count: number;
    }>;
  };
  priorities: Record<PermitHunterRecommendedAction, PermitHunterLead[]>;
  sections: {
    qualifiedPipeline: PermitHunterLead[];
    fullIssuanceInventory: PermitHunterLead[];
    secondaryCandidates: PermitHunterLead[];
    hotLeads: PermitHunterLead[];
    freshIssuance: PermitHunterLead[];
    freshPlanCheck: PermitHunterLead[];
    recentUpdates: PermitHunterLead[];
  };
}

export interface PermitHunterCrmBoardData {
  lanes: Array<{
    stage: PermitHunterCrmStage;
    label: string;
    leads: Array<{
      lead: PermitHunterLead;
      crm: PermitHunterCrmRecord;
      taskCount: number;
    }>;
  }>;
  stageCounts: Array<{
    stage: PermitHunterCrmStage;
    label: string;
    count: number;
  }>;
  assignees: Array<{
    name: string;
    leadCount: number;
    taskCount: number;
  }>;
  metrics: {
    openTasks: number;
    overdueTasks: number;
    unassignedLeads: number;
  };
  dueTasks: Array<{
    lead: PermitHunterLead;
    crm: PermitHunterCrmRecord;
    task: PermitHunterCrmTask;
  }>;
}

export interface PermitHunterLeadDetail {
  lead: PermitHunterLead | null;
  notes: PermitHunterNote[];
  outreach: PermitHunterOutreachRecord | null;
  crm: PermitHunterCrmRecord | null;
  tasks: PermitHunterCrmTask[];
}

export interface PermitHunterCommandCenterSnapshot {
  mode: "bridge_local";
  workspaceLabel: string;
  storageLabel: string;
  integrationStatus: "supabase_pending";
  reporting: {
    lastUpdatedAt: string;
    lastRunAt: string | null;
  };
  metrics: {
    trackedLeads: number;
    hotLeads: number;
    issuance: number;
    planCheck: number;
    fullContact: number;
    ownerOnly: number;
    manualResearch: number;
    pendingCommands: number;
  };
  priorityLeads: PermitHunterLead[];
  runs: PermitHunterRun[];
  commands: PermitHunterCommand[];
  dashboard: PermitHunterDashboardData;
  board: PermitHunterCrmBoardData;
}
