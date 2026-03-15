"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookMarked, LayoutDashboard, BookOpen, LogOut, ClipboardList, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/staff/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/staff/books", label: "Libros", icon: BookOpen },
  { href: "/staff/ai", label: "AI", icon: Zap },
  { href: "/staff/operations", label: "Operaciones", icon: ClipboardList },
] as const;

export function StaffSidebar({
  className,
  userEmail,
}: {
  className?: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/staff/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "w-56 shrink-0 border-r border-border bg-card flex flex-col",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookMarked className="h-5 w-5" />
        </div>
        <span className="font-semibold text-sm tracking-tight">
          Staff Editorial
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/staff/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />
      <div className="p-3">
        {userEmail && (
          <p className="px-3 py-1.5 text-xs text-muted-foreground truncate">
            {userEmail}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
