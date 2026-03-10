"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Handshake,
  FolderKanban,
  Globe,
  FileText,
  Settings,
  ClipboardList,
  CreditCard,
  Zap,
  BarChart3,
  Building2,
  UserCog,
  Shield,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  BookOpen,
  Gauge,
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

// Navigation sections with items
const navSections = [
  {
    titleKey: "operations" as const,
    items: [
      { href: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/app/crm", labelKey: "crm", icon: Users },
      { href: "/app/deals", labelKey: "deals", icon: Handshake },
    ],
  },
  {
    titleKey: "assets" as const,
    items: [
      { href: "/app/projects", labelKey: "projects", icon: FolderKanban },
      { href: "/app/websites", labelKey: "websites", icon: Globe },
      { href: "/app/documents", labelKey: "documents", icon: FileText },
    ],
  },
  {
    titleKey: "finance" as const,
    items: [
      { href: "/app/finance-vault", labelKey: "financeVault", icon: CreditCard },
    ],
  },
  {
    titleKey: "automation" as const,
    items: [
      { href: "/app/automations", labelKey: "automations", icon: Zap },
    ],
  },
  {
    titleKey: "intelligence" as const,
    items: [
      { href: "/app/analytics", labelKey: "analytics", icon: BarChart3 },
    ],
  },
  {
    titleKey: "editorial" as const,
    items: [
      { href: "/app/editorial", labelKey: "editorialDashboard", icon: Gauge },
      { href: "/app/editorial/books", labelKey: "editorialBooks", icon: BookOpen },
    ],
  },
  {
    titleKey: "system" as const,
    items: [
      { href: "/app/organizations", labelKey: "organizations", icon: Building2 },
      { href: "/app/team", labelKey: "team", icon: UserCog },
      { href: "/app/roles", labelKey: "roles", icon: Shield },
      { href: "/app/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

// External links
const externalLinks = [
  {
    href: "https://ikingdom.org/apply?brand=ikingdom",
    labelKey: "applyForm",
    icon: ClipboardList,
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
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "admin":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
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
            href="/app/dashboard"
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-sidebar-accent/50">
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
                  Hebeling BOS
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Business Operating System
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.titleKey}>
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive && "text-sidebar-primary"
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">
                            {getTranslatedNavLabel(item.labelKey)}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
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

          {/* External Links */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-sidebar-border/50">
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t.sidebar.external}
                </span>
              </div>
              {externalLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {getTranslatedNavLabel(item.labelKey)}
                  </span>
                </a>
              ))}
            </div>
          )}
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

          {/* User Info */}
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
