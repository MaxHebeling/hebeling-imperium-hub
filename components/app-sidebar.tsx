"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  FileText,
  Settings,
  CreditCard,
  Zap,
  BarChart3,
  UserCog,
  Shield,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Crown,
  Sword,
  Star,
  GitBranch,
  BrainCircuit,
  ShoppingBag,
  Truck,
  Settings2,
  FolderOpen,
  Globe,
  Handshake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Business unit definitions ───────────────────────────────────────────────

interface CompanyModule {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface BusinessUnit {
  slug: string;
  name: string;
  icon: React.ElementType;
  color: string;
  basePath: string;
  modules: CompanyModule[];
  status: "active" | "coming_soon";
}

const REINO_EDITORIAL_MODULES: CompanyModule[] = [
  { label: "Overview",     href: "/app/companies/reino-editorial/overview",      icon: LayoutDashboard },
  { label: "Proyectos",    href: "/app/companies/reino-editorial/projects",      icon: FolderKanban },
  { label: "Pipeline",     href: "/app/companies/reino-editorial/pipeline",      icon: GitBranch },
  { label: "AI Review",    href: "/app/companies/reino-editorial/ai",            icon: BrainCircuit },
  { label: "Autores",      href: "/app/companies/reino-editorial/authors",       icon: Users },
  { label: "Staff",        href: "/app/companies/reino-editorial/staff",         icon: UserCog },
  { label: "Marketplace",  href: "/app/companies/reino-editorial/marketplace",   icon: ShoppingBag },
  { label: "Distribución", href: "/app/companies/reino-editorial/distribution",  icon: Truck },
  { label: "Operaciones",  href: "/app/companies/reino-editorial/operations",    icon: Settings2 },
  { label: "Reportes",     href: "/app/companies/reino-editorial/reports",       icon: BarChart3 },
];

const BUSINESS_UNITS: BusinessUnit[] = [
  {
    slug: "reino-editorial",
    name: "Reino Editorial",
    icon: BookOpen,
    color: "#7C3AED",
    basePath: "/app/companies/reino-editorial",
    modules: REINO_EDITORIAL_MODULES,
    status: "active",
  },
  {
    slug: "ikingdom",
    name: "iKingdom",
    icon: Crown,
    color: "#059669",
    basePath: "/app/companies/ikingdom",
    modules: [],
    status: "coming_soon",
  },
  {
    slug: "imperium",
    name: "Imperium",
    icon: Sword,
    color: "#DC2626",
    basePath: "/app/companies/imperium",
    modules: [],
    status: "coming_soon",
  },
  {
    slug: "max-hebeling",
    name: "Max Hebeling",
    icon: Star,
    color: "#D97706",
    basePath: "/app/companies/max-hebeling",
    modules: [],
    status: "coming_soon",
  },
];

// ─── Shared infrastructure items ──────────────────────────────────────────────

const SHARED_INFRA = [
  { href: "/app/crm",          label: "CRM",          icon: Users },
  { href: "/app/clients",      label: "Clients",      icon: Building2 },
  { href: "/app/billing",      label: "Billing",      icon: CreditCard },
  { href: "/app/files",        label: "Files",        icon: FolderOpen },
  { href: "/app/intelligence", label: "Intelligence", icon: BarChart3 },
  { href: "/app/automations",  label: "Automations",  icon: Zap },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  userName: string;
  userRole: string;
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "superadmin": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "admin":      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "sales":      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "ops":        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:           return "bg-muted text-muted-foreground";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-detect which company is active from the current path
  const activeCompanySlug =
    BUSINESS_UNITS.find((bu) => pathname.startsWith(bu.basePath))?.slug ?? null;

  // Track expanded state for each company; auto-open when navigating into one
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set(activeCompanySlug ? [activeCompanySlug] : [])
  );

  // When pathname changes (e.g. user navigates), auto-expand the active company
  useEffect(() => {
    if (activeCompanySlug) {
      setExpandedSlugs((prev) => {
        if (prev.has(activeCompanySlug)) return prev;
        return new Set([...prev, activeCompanySlug]);
      });
    }
  }, [activeCompanySlug]);

  function toggleCompany(slug: string) {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function NavLink({
    href,
    icon: Icon,
    label,
    depth = 0,
    tooltip,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    depth?: number;
    tooltip?: string;
  }) {
    const active = isActive(href);
    const link = (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          depth === 0 ? "px-3 py-2" : "px-3 py-1.5 ml-3 text-[13px]",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isCollapsed && "justify-center px-2 ml-0"
        )}
      >
        <Icon
          className={cn(
            "shrink-0",
            depth === 0 ? "h-4 w-4" : "h-3.5 w-3.5",
            active && "text-sidebar-primary"
          )}
        />
        {!isCollapsed && (
          <>
            <span className="truncate">{label}</span>
            {active && depth === 0 && (
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {tooltip ?? label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return link;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* ── Logo ── */}
        <div className={cn("border-b border-sidebar-border", isCollapsed ? "p-3" : "p-4")}>
          <Link
            href="/app/dashboard"
            className={cn("flex items-center gap-3", isCollapsed && "justify-center")}
          >
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-sidebar-accent/50 shrink-0">
              <Image
                src="/logo.png"
                alt="Hebeling OS"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h2 className="font-semibold text-sidebar-foreground text-sm tracking-tight truncate">
                  Hebeling OS
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Business Operating System
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3">

          {/* GLOBAL */}
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Global
                </span>
              </div>
            )}
            <NavLink href="/app/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavLink href="/app/companies" icon={Building2} label="Empresas" tooltip="Empresas" />
          </div>

          {/* EMPRESAS (company-first nav) */}
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Empresas
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {BUSINESS_UNITS.map((unit) => {
                const Icon = unit.icon;
                const isExpanded = expandedSlugs.has(unit.slug);
                const isUnitActive = pathname.startsWith(unit.basePath);
                const isCS = unit.status === "coming_soon";

                return (
                  <div key={unit.slug}>
                    {/* Company header row */}
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={isCS ? "#" : `${unit.basePath}/overview`}
                            aria-disabled={isCS}
                            className={cn(
                              "flex items-center justify-center px-2 py-2 rounded-lg transition-all",
                              isUnitActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                              isCS && "opacity-50 pointer-events-none"
                            )}
                          >
                            <Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: isUnitActive ? unit.color : undefined }}
                            />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {unit.name}
                          {isCS && " (Próximamente)"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCS) toggleCompany(unit.slug);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isUnitActive
                            ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          isCS && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: isUnitActive ? unit.color : undefined }}
                        />
                        <span className="truncate flex-1 text-left">{unit.name}</span>
                        {isCS ? (
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5 opacity-70">
                            Soon
                          </Badge>
                        ) : (
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </button>
                    )}

                    {/* Company modules (expanded) */}
                    {!isCollapsed && isExpanded && unit.modules.length > 0 && (
                      <div className="mt-0.5 mb-1 space-y-0.5 border-l border-sidebar-border/60 ml-4">
                        {unit.modules.map((mod) => {
                          const ModIcon = mod.icon;
                          const modActive = isActive(mod.href);
                          return (
                            <Link
                              key={mod.href}
                              href={mod.href}
                              className={cn(
                                "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-r-lg text-[13px] font-medium transition-all",
                                modActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-violet-500 -ml-px"
                                  : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                              )}
                            >
                              <ModIcon
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  modActive && "text-violet-600"
                                )}
                              />
                              <span className="truncate">{mod.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* INFRAESTRUCTURA COMPARTIDA */}
          <div className="pt-1 border-t border-sidebar-border/40">
            {!isCollapsed && (
              <div className="px-3 pb-1 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Infraestructura
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {SHARED_INFRA.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </div>
          </div>

          {/* SISTEMA */}
          <div className="pt-1 border-t border-sidebar-border/40">
            {!isCollapsed && (
              <div className="px-3 pb-1 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Sistema
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              <NavLink href="/app/settings" icon={Settings} label="Settings" />
            </div>
          </div>
        </nav>

        {/* ── Footer — Collapse Toggle & User ── */}
        <div className="border-t border-sidebar-border">
          <div className={cn("p-2", isCollapsed ? "flex justify-center" : "")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "text-muted-foreground hover:text-sidebar-foreground",
                isCollapsed ? "w-10 h-10 p-0" : "w-full justify-start gap-2"
              )}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>{t.sidebar.collapse}</span>
                </>
              )}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="p-3 border-t border-sidebar-border/50">
              <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {userName}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] capitalize h-4 px-1.5",
                      getRoleBadgeColor(userRole)
                    )}
                  >
                    {userRole}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
