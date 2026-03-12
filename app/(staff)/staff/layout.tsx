import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffShell } from "@/components/editorial/staff/staff-shell";

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"] as const;

/**
 * Layout único para /staff/*.
 * Protege rutas (excepto login). StaffShell muestra sidebar + header + main
 * en rutas protegidas y solo children en /staff/login.
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff/login");
  }

  // Enforce staff-only access at page render time too (defense in depth).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as string | undefined;
  const isStaff = !!role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);
  if (!isStaff) {
    redirect("/staff/login");
  }

  return (
    <StaffShell userEmail={profile?.email ?? user.email ?? null}>
      {children}
    </StaffShell>
  );
}
