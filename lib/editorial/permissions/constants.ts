import type { EditorialCapability, EditorialStaffAssignmentRole } from "@/lib/editorial/types/editorial";

/**
 * Fallback defaults (used when DB table editorial_project_role_capabilities
 * isn't populated yet). Keep centralized to avoid hardcoding across endpoints.
 */
export const DEFAULT_ROLE_CAPABILITIES: Record<EditorialStaffAssignmentRole, EditorialCapability[]> = {
  manager: [
    "stage:update_status",
    "stage:approve",
    "stage:reopen",
    "files:upload",
    "files:read",
    "comments:create",
    "assignment:change",
    "rule:override",
    "ai:run",
    "ai:review",
  ],
  editor: [
    "stage:update_status",
    "stage:approve",
    "files:upload",
    "files:read",
    "comments:create",
    "ai:run",
    "ai:review",
  ],
  reviewer: ["stage:update_status", "files:read", "comments:create", "ai:run", "ai:review"],
  proofreader: ["stage:update_status", "files:read", "comments:create", "ai:run", "ai:review"],
  designer: ["files:upload", "files:read", "comments:create", "ai:review"],
};

