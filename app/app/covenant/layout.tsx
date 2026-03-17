import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CovenantSidebar } from "@/components/covenant/covenant-sidebar";
import { CovenantTopbar } from "@/components/covenant/covenant-topbar";

export const metadata: Metadata = {
  title: "Covenant Core | Relationship Intelligence Platform",
  description: "Unified relationship intelligence across Editorial, iKingdom, Imperium and Ministerio",
};

export default async function CovenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is already handled by parent /app/layout.tsx
  // Just fetch user info for display
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user?.id)
    .single();

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--covenant-bg)" }}
    >
      <CovenantSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CovenantTopbar userName={profile?.full_name || profile?.email || "User"} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
