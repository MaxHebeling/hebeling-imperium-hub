import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "IDR | Portal Privado",
  description: "Portal privado premium para la comunidad de Inversionistas del Reino.",
  manifest: "/idr/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IDR",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#07101C",
  width: "device-width",
  initialScale: 1,
};

export default async function IdrPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="idr-theme min-h-screen bg-[#07101C] text-[#F5F0E8]">{children}</div>;
}
