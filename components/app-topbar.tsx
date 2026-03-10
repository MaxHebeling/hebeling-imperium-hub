"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Building2,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  Shield,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AppTopbarProps {
  organizationName: string;
  userName: string;
  userRole?: string;
}

// Breadcrumb mapping
const pathLabels: Record<string, string> = {
  app: "BOS",
  dashboard: "Dashboard",
  crm: "CRM",
  deals: "Deals",
  projects: "Projects",
  websites: "Websites",
  documents: "Documents",
  settings: "Settings",
  organizations: "Organizations",
  team: "Team",
  roles: "Roles & Permissions",
  analytics: "Analytics",
  payments: "Payments",
  automations: "Automations",
  // Company-first architecture (Hebeling OS)
  companies: "Empresas",
  "reino-editorial": "Reino Editorial",
  ikingdom: "iKingdom",
  imperium: "Imperium",
  "max-hebeling": "Max Hebeling",
  overview: "Overview",
  pipeline: "Pipeline",
  ai: "AI Review",
  authors: "Autores",
  staff: "Staff",
  marketplace: "Marketplace",
  distribution: "Distribución",
  operations: "Operaciones",
  reports: "Reportes",
  // Shared infrastructure
  billing: "Billing",
  intelligence: "Intelligence",
  files: "Files",
  clients: "Clients",
};

export function AppTopbar({ organizationName, userName, userRole = "admin" }: AppTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: "/" + segments.slice(0, index + 1).join("/"),
      isLast: index === segments.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left Section - Breadcrumbs */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              {crumb.isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center Section - Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.topbar.search}
            className="pl-9 h-9 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </div>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t.topbar.notifications}</span>
              <Badge variant="secondary" className="text-xs">3 {t.topbar.new}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                <span className="font-medium text-sm">{t.topbar.newLeadAssigned}</span>
                <span className="text-xs text-muted-foreground">John Doe - 2 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                <span className="font-medium text-sm">{t.topbar.dealUpdated}</span>
                <span className="text-xs text-muted-foreground">Acme Corp - 15 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                <span className="font-medium text-sm">{t.topbar.projectMilestone}</span>
                <span className="text-xs text-muted-foreground">Website Redesign - 1 hour ago</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary cursor-pointer">
              {t.topbar.viewAllNotifications}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Organization Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline text-sm font-medium truncate max-w-[120px]">
                {organizationName}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t.topbar.organizations}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-medium">{organizationName}</span>
              <Badge variant="secondary" className="ml-auto text-xs">{t.topbar.current}</Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/organizations" className="text-muted-foreground cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                {t.topbar.manageOrganizations}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Selector */}
        <LanguageSelector />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2 gap-2 hover:bg-accent/50"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                {getInitials(userName)}
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-none">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground capitalize leading-none mt-0.5">
                  {userRole}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  {userRole}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                {t.topbar.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                {t.nav.settings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="cursor-pointer">
                <CreditCard className="h-4 w-4 mr-2" />
                {t.topbar.billing}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.nav.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
