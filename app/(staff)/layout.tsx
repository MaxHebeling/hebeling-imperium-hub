import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Editorial | Reino Editorial",
  description: "Panel interno del equipo editorial",
  robots: { index: false, follow: false },
};

/**
 * Route group (staff): no afecta la URL.
 * Rutas reales: /staff/login, /staff/dashboard, /staff/books, etc.
 */
export default function StaffRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
