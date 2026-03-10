import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal del Autor | Reino Editorial",
  description: "Sigue el progreso de tu libro y gestiona tu manuscrito",
  robots: { index: false, follow: false },
};

/** Root author layout: no auth here so /author/login can render. Protected routes use (dashboard)/layout.tsx. */
export default function AuthorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
