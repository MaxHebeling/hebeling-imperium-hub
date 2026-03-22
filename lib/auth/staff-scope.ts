import { createClient } from "@/lib/supabase/server";
import { getStaffBrandScope, isRestrictedStaffRole, type StaffBrandScope } from "@/lib/staff-brand-access";

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffScopeSession = {
  userId: string;
  email: string | null;
  role: StaffRole;
  orgId: string;
  brandScope: StaffBrandScope | null;
  isRestricted: boolean;
};

export async function requireStaffScope(): Promise<StaffScopeSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, email, org_id, brand_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("FORBIDDEN");
  }

  if (!STAFF_ROLES.includes(profile.role as StaffRole)) {
    throw new Error("FORBIDDEN");
  }

  let brandScope: StaffBrandScope | null = null;

  if (profile.brand_id && isRestrictedStaffRole(profile.role)) {
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("slug")
      .eq("id", profile.brand_id)
      .maybeSingle();

    if (brandError) {
      throw new Error("FORBIDDEN");
    }

    brandScope = getStaffBrandScope(brand?.slug);
  }

  return {
    userId: user.id,
    email: (profile.email as string | null) ?? user.email ?? null,
    role: profile.role as StaffRole,
    orgId: profile.org_id as string,
    brandScope,
    isRestricted: !!brandScope,
  };
}

export function assertBrandAccess(session: StaffScopeSession, leadBrand?: string | null) {
  if (!session.brandScope) {
    return true;
  }

  if (!leadBrand) {
    return false;
  }

  return leadBrand === session.brandScope.crmBrand;
}
