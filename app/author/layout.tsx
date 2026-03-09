import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthorNav } from "@/components/author-nav";

export const metadata: Metadata = {
  title: "Portal del Autor | Reino Editorial",
  description: "Sigue el progreso de tu libro y gestiona tu manuscrito",
  robots: { index: false, follow: false },
};

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/author/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthorNav userEmail={user.email} />
      {/* Max width kept narrow for excellent mobile readability */}
      <main className="container mx-auto max-w-2xl px-4 py-6 pb-16">
        {children}
      </main>
    </div>
  );
}
