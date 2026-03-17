import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CovenantSidebar } from "@/components/covenant/covenant-sidebar";
import { CovenantTopbar } from "@/components/covenant/covenant-topbar";

export const metadata: Metadata = {
  title: "Covenant Core | Relationship Intelligence Platform",
  description: "Unified relationship intelligence across Editorial, iKingdom, Imperium and Ministerio",
};

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"];

export default async function CovenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile with role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/portal/overview");
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--covenant-bg)" }}
    >
      <CovenantSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CovenantTopbar userName={profile.full_name || profile.email || "User"} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
