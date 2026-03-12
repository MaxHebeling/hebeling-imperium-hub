"use client";

import { usePathname } from "next/navigation";
import { StaffSidebar } from "./sidebar";
import { StaffHeader } from "./staff-header";
import { StaffMobileNav } from "./mobile-nav";

const STAFF_LOGIN_PATH = "/staff/login";

function getStaffPageTitle(pathname: string): string {
  if (pathname === "/staff/dashboard") return "Panel";
  if (pathname === "/staff/books") return "Libros";
  if (pathname.startsWith("/staff/books/")) return "Detalle";
  return "Staff Editorial";
}

interface StaffShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function StaffShell({ children, userEmail }: StaffShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === STAFF_LOGIN_PATH;

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <StaffSidebar className="hidden md:flex" userEmail={userEmail} />
      <div className="flex flex-1 flex-col min-h-screen md:min-h-0 w-full min-w-0">
        <StaffHeader title={getStaffPageTitle(pathname)} userEmail={userEmail} />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 w-full max-w-4xl mx-auto">
          {children}
        </main>
      </div>
      <StaffMobileNav className="md:hidden fixed bottom-0 left-0 right-0 z-40" />
    </div>
  );
}
