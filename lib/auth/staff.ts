import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffSession = {
  userId: string;
  email: string | null;
  role: StaffRole;
};

/**
 * Server-side staff guard for route handlers and server components.
 * Uses SSR anon client (RLS applies) and checks profiles.role.
 */
export async function requireStaff(): Promise<StaffSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("FORBIDDEN");
  }

  if (!STAFF_ROLES.includes(profile.role as StaffRole)) {
    throw new Error("FORBIDDEN");
  }

  return {
    userId: user.id,
    email: (profile.email as string | null) ?? user.email ?? null,
    role: profile.role as StaffRole,
  };
}

