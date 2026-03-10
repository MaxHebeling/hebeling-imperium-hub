"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, ClipboardList, Sparkles } from "lucide-react";

const navItems = [
  { href: "/staff/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/staff/books", label: "Libros", icon: BookOpen },
  { href: "/staff/ai", label: "AI", icon: Sparkles },
  { href: "/staff/operations", label: "Operaciones", icon: ClipboardList },
] as const;

export function StaffMobileNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex items-center justify-around border-t border-border bg-background/95 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
      role="navigation"
      aria-label="Navegación principal"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/staff/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors min-w-[64px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
