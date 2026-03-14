"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Building2,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  FolderOpen,
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

/* ─────────────────────────────────────────────────────────────
   Hebeling OS — Sidebar Navigation Structure
   Sections: COMMAND · BUSINESS · FINANCE · RESOURCES · SYSTEM
   ───────────────────────────────────────────────────────────── */
const navSections = [
  {
    titleKey: null as string | null,
    items: [
      { href: "/app/companies", labelKey: "companies", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "empresas" as const,
    items: [
      { href: "/app/companies", labelKey: "companies", icon: Building2 },
      { href: "/app/crm", labelKey: "crm", icon: Users },
    ],
  },
  {
    titleKey: "finance" as const,
    items: [
      { href: "/app/finance-vault", labelKey: "billing", icon: CreditCard },
    ],
  },
  {
    titleKey: "assets" as const,
    items: [
      { href: "/app/documents", labelKey: "files", icon: FolderOpen },
    ],
  },
  {
    titleKey: "system" as const,
    items: [
      { href: "/app/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  userName: string;
  userRole: string;
}

export function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-[#C8A75B]/20 text-[#C8A75B] border-[#C8A75B]/30";
      case "admin":
        return "bg-[#2F6FA3]/20 text-[#4F8DC4] border-[#2F6FA3]/30";
      case "sales":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "ops":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTranslatedNavLabel = (labelKey: string) => {
    const navTranslations = t.nav as Record<string, string>;
    return navTranslations[labelKey] || labelKey;
  };

  const getTranslatedSectionTitle = (titleKey: string) => {
    const sidebarTranslations = t.sidebar as Record<string, string>;
    return sidebarTranslations[titleKey] || titleKey;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("border-b border-sidebar-border", isCollapsed ? "p-3" : "p-4")}>
          <Link
            href="/app/companies"
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-sidebar-accent/50 ring-1 ring-[#C8A75B]/20">
              <Image
                src="/logo.png"
                alt="Hebeling Imperium"
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
                <p className="text-[10px] text-[#C8A75B]/70 font-medium uppercase tracking-widest truncate">
                  Enterprise
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navSections.map((section, sectionIndex) => (
            <div key={section.titleKey ?? `section-${sectionIndex}`}>
              {!isCollapsed && section.titleKey && (
                <div className="px-3 pt-4 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9FB2CC]/50">
                    {getTranslatedSectionTitle(section.titleKey)}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                        isActive
                          ? "bg-[#C8A75B]/10 text-[#E7ECF5]"
                          : "text-[#9FB2CC] hover:bg-sidebar-accent/50 hover:text-[#E7ECF5]",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      {/* Gold active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C8A75B] rounded-r-full" />
                      )}
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-[#C8A75B]" : "text-[#9FB2CC]/70 group-hover:text-[#9FB2CC]"
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">
                            {getTranslatedNavLabel(item.labelKey)}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-3 w-3 ml-auto text-[#C8A75B]/50" />
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-[#162235] border-[#1E3048] text-[#E7ECF5]">
                          {getTranslatedNavLabel(item.labelKey)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          ))}

        </nav>

        {/* Footer - Collapse Toggle & User */}
        <div className="border-t border-sidebar-border">
          {/* Collapse Toggle */}
          <div className={cn("p-2", isCollapsed ? "flex justify-center" : "")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "text-[#9FB2CC]/60 hover:text-[#E7ECF5] hover:bg-sidebar-accent/50",
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

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-3 border-t border-sidebar-border/50">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#0F1B2D]/50 ring-1 ring-[#1E3048]/50">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#C8A75B] to-[#6E1F2F] flex items-center justify-center text-[#0B1420] text-xs font-bold shrink-0">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E7ECF5] truncate">
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
