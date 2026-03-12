import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialCapability,
  EditorialProjectUserCapabilities,
  EditorialStaffAssignmentRole,
} from "@/lib/editorial/types/editorial";
import { DEFAULT_ROLE_CAPABILITIES } from "./constants";

type CapabilityDecision = {
  allowed: boolean;
  reason?: string;
  effectiveCapabilities: EditorialCapability[];
};

async function getRoleCapabilitiesFromDb(
  orgId: string,
  role: EditorialStaffAssignmentRole
): Promise<EditorialCapability[] | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_role_capabilities")
    .select("capabilities")
    .eq("org_id", orgId)
    .eq("role", role)
    .maybeSingle();
  if (error || !data) return null;
  return (data.capabilities ?? []) as EditorialCapability[];
}

async function getUserCapabilityOverride(
  projectId: string,
  userId: string
): Promise<EditorialProjectUserCapabilities | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_user_capabilities")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditorialProjectUserCapabilities;
}

async function getProjectStaffRoles(
  projectId: string,
  userId: string
): Promise<EditorialStaffAssignmentRole[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_staff_assignments")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error || !data) return [];
  return (data ?? []).map((r) => r.role as EditorialStaffAssignmentRole);
}

/**
 * Compute effective capabilities for a user in a project.
 * Source of truth order:
 * - Role capabilities from DB (if present) else fallback defaults
 * - Apply overrides: deny removes, allow adds
 */
export async function getEffectiveProjectCapabilities(options: {
  projectId: string;
  orgId: string;
  userId: string;
}): Promise<EditorialCapability[]> {
  const roles = await getProjectStaffRoles(options.projectId, options.userId);
  console.info("[capability-debug] roles for user", {
    projectId: options.projectId,
    orgId: options.orgId,
    userId: options.userId,
    roles,
  });

  const roleCapsLists = await Promise.all(
    roles.map(async (role) => {
      const fromDb = await getRoleCapabilitiesFromDb(options.orgId, role);
      const caps = fromDb ?? DEFAULT_ROLE_CAPABILITIES[role] ?? [];
      console.info("[capability-debug] role capabilities source", {
        projectId: options.projectId,
        orgId: options.orgId,
        userId: options.userId,
        role,
        fromDb: !!fromDb,
        capabilities: caps,
      });
      return caps;
    })
  );

  const base = new Set<EditorialCapability>(roleCapsLists.flat());
  const override = await getUserCapabilityOverride(options.projectId, options.userId);
  if (override) {
    console.info("[capability-debug] user override", {
      projectId: options.projectId,
      orgId: options.orgId,
      userId: options.userId,
      allow: override.allow,
      deny: override.deny,
    });
    (override.deny ?? []).forEach((c) => base.delete(c as EditorialCapability));
    (override.allow ?? []).forEach((c) => base.add(c as EditorialCapability));
  }
  const effective = Array.from(base);
  console.info("[capability-debug] effective capabilities", {
    projectId: options.projectId,
    orgId: options.orgId,
    userId: options.userId,
    effectiveCapabilities: effective,
  });
  return effective;
}

export async function requireEditorialCapability(options: {
  projectId: string;
  orgId: string;
  userId: string;
  capability: EditorialCapability;
}): Promise<CapabilityDecision> {
  const effectiveCapabilities = await getEffectiveProjectCapabilities(options);
  const allowed = effectiveCapabilities.includes(options.capability);
  const decision: CapabilityDecision = {
    allowed,
    reason: allowed ? undefined : `Missing capability: ${options.capability}`,
    effectiveCapabilities,
  };
  console.info("[capability-debug] requireEditorialCapability decision", {
    projectId: options.projectId,
    orgId: options.orgId,
    userId: options.userId,
    requestedCapability: options.capability,
    allowed: decision.allowed,
    reason: decision.reason,
    effectiveCapabilities: decision.effectiveCapabilities,
  });
  return decision;
}

