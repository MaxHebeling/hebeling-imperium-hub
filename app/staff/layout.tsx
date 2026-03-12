import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { LanguageProvider } from "@/lib/i18n";

// Legacy /staff/* layout — mirrors the /app layout.
// These routes will be redirected to the company-first
// /app/companies/reino-editorial/* routes once migration is validated.
const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/portal/overview");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.org_id)
    .single();

  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          userName={profile.full_name || profile.email || "User"}
          userRole={profile.role}
        />
        <div className="flex-1 flex flex-col">
          <AppTopbar
            organizationName={organization?.name || "Organization"}
            userName={profile.full_name || profile.email || "User"}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </LanguageProvider>
  );
}
