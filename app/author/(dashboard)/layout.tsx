import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthorNav } from "@/components/author-nav";

/** Protects /author (root), /author/projects/* — not /author/login. */
export default async function AuthorDashboardLayout({
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
      <main className="container mx-auto max-w-2xl px-4 py-6 pb-16">
        {children}
      </main>
    </div>
  );
}
