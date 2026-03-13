import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalNav } from "@/components/portal-nav";

export const metadata: Metadata = {
  title: "Reino Editorial — Portal de Autor",
  description: "Sigue el progreso editorial de tu libro en tiempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reino Editorial",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f9fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      <PortalNav userEmail={user.email} />
      <main className="container mx-auto max-w-lg px-4 py-6 pb-24 md:pb-8 md:max-w-6xl">
        {children}
      </main>
    </div>
  );
}
