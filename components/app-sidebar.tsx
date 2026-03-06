"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Handshake,
  FolderKanban, 
  Globe,
  FileText,
  Settings,
  ClipboardList
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

type NavKey = "dashboard" | "crm" | "deals" | "projects" | "websites" | "documents" | "settings" | "applyForm";

const navItems: { href: string; labelKey: NavKey; icon: typeof LayoutDashboard }[] = [
  { href: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/app/crm", labelKey: "crm", icon: Users },
  { href: "/app/deals", labelKey: "deals", icon: Handshake },
  { href: "/app/projects", labelKey: "projects", icon: FolderKanban },
  { href: "/app/websites", labelKey: "websites", icon: Globe },
  { href: "/app/documents", labelKey: "documents", icon: FileText },
  { href: "/app/settings", labelKey: "settings", icon: Settings },
  { href: "/apply", labelKey: "applyForm", icon: ClipboardList },
];

interface AppSidebarProps {
  userName: string;
  userRole: string;
}

export function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

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

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Hebeling Imperium"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm tracking-tight">
              Hebeling Imperium
            </h2>
            <p className="text-xs text-muted-foreground">{t.nav.managementHub}</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
              {t.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>
      
      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {userName}
          </p>
          <Badge 
            variant="outline" 
            className={cn("mt-1 text-xs capitalize", getRoleBadgeColor(userRole))}
          >
            {userRole}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
