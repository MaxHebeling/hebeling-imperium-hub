"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  BrainCircuit,
  Users,
  UserCog,
  ShoppingBag,
  Truck,
  Settings2,
  BarChart3,
  BookOpen,
  ChevronLeft,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const REINO_EDITORIAL_NAV: NavItem[] = [
  { label: "Overview",      href: "/app/companies/reino-editorial/overview",      icon: LayoutDashboard },
  { label: "Proyectos",     href: "/app/companies/reino-editorial/projects",      icon: FolderKanban },
  { label: "Pipeline",      href: "/app/companies/reino-editorial/pipeline",      icon: GitBranch },
  { label: "AI Review",     href: "/app/companies/reino-editorial/ai",            icon: BrainCircuit },
  { label: "Autores",       href: "/app/companies/reino-editorial/authors",       icon: Users },
  { label: "Staff",         href: "/app/companies/reino-editorial/staff",         icon: UserCog },
  { label: "Marketplace",   href: "/app/companies/reino-editorial/marketplace",   icon: ShoppingBag },
  { label: "Distribución",  href: "/app/companies/reino-editorial/distribution",  icon: Truck },
  { label: "Operaciones",   href: "/app/companies/reino-editorial/operations",    icon: Settings2 },
  { label: "Reportes",      href: "/app/companies/reino-editorial/reports",       icon: BarChart3 },
];

export function ReinoEditorialNav() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col">
      {/* Company header */}
      <div className="px-4 py-3 border-b border-border/60">
        <Link
          href="/app/companies"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="h-3 w-3" />
          Empresas
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-violet-600/15 flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">Reino Editorial</span>
        </div>
      </div>

      {/* Module navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {REINO_EDITORIAL_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600/10 text-violet-700 dark:text-violet-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-violet-600 dark:text-violet-400" : ""
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
