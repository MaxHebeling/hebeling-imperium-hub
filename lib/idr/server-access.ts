import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessIdrPortal, canAccessIdrStaff } from "@/lib/idr/access";

type IdrSessionContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  brandSlug: string | null;
};

async function getIdrSessionContext(): Promise<IdrSessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, brand_id")
    .eq("id", user.id)
    .maybeSingle();

  let brandSlug: string | null = null;

  if (profile?.brand_id) {
    const { data: brand } = await supabase
      .from("brands")
      .select("slug")
      .eq("id", profile.brand_id)
      .maybeSingle();

    brandSlug = (brand?.slug as string | null) ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: (profile?.full_name as string | null) ?? null,
    role: (profile?.role as string | null) ?? null,
    brandSlug,
  };
}

export async function requireIdrCommunitySession() {
  const session = await getIdrSessionContext();

  if (!session) {
    redirect("/idr/acceso");
  }

  if (!canAccessIdrPortal(session.role, session.brandSlug)) {
    redirect("/idr/acceso?error=unauthorized");
  }

  return session;
}

export async function requireIdrStaffOfficeSession(officeSlug: string) {
  const session = await getIdrSessionContext();

  if (!session) {
    redirect(`/idr/oficinas/${officeSlug}/acceso`);
  }

  if (!canAccessIdrStaff(session.role, session.brandSlug)) {
    redirect(`/idr/oficinas/${officeSlug}/acceso?error=unauthorized`);
  }

  return session;
}
