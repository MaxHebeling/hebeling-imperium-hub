import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalNav } from "@/components/portal-nav";

export const metadata: Metadata = {
  title: "Client Portal | Hebeling Imperium",
  description: "Access your projects and documents",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client-login");
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav userEmail={user.email} />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
