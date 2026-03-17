"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Network,
  GitBranch,
  Target,
  MessageSquare,
  CalendarDays,
  BarChart3,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/covenant", label: "Overview", icon: LayoutDashboard },
  { href: "/covenant/people", label: "People", icon: Users },
  { href: "/covenant/organizations", label: "Organizations", icon: Building2 },
  { href: "/covenant/relationships", label: "Relationships", icon: Network },
  { href: "/covenant/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/covenant/opportunities", label: "Opportunities", icon: Target },
  { href: "/covenant/communications", label: "Communications", icon: MessageSquare },
  { href: "/covenant/events", label: "Events", icon: CalendarDays },
  { href: "/covenant/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/covenant/ai-insights", label: "AI Insights", icon: Sparkles },
  { href: "/covenant/settings", label: "Settings", icon: Settings },
];

export function CovenantSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col shrink-0 transition-all duration-300 border-r",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
        style={{
          backgroundColor: "var(--covenant-bg)",
          borderColor: "var(--covenant-border)",
        }}
      >
        {/* Header with Logo */}
        <div
          className={cn("border-b", isCollapsed ? "p-3" : "p-5")}
          style={{ borderColor: "var(--covenant-border)" }}
        >
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            {/* Premium Logo Mark */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, var(--covenant-accent) 0%, #1a9f85 100%)",
                boxShadow: "0 4px 20px var(--covenant-accent-glow)",
              }}
            >
              <Network className="h-5 w-5 text-white" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h2
                  className="font-semibold text-sm tracking-tight truncate"
                  style={{ color: "var(--covenant-text)" }}
                >
                  Covenant Core
                </h2>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.2em] truncate"
                  style={{ color: "var(--covenant-accent)" }}
                >
                  Relationship Intelligence
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Back to Hebeling OS */}
        <div
          className={cn("border-b", isCollapsed ? "p-2" : "px-3 py-2")}
          style={{ borderColor: "var(--covenant-border)" }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/app/companies"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group",
                  isCollapsed && "justify-center px-2"
                )}
                style={{ color: "var(--covenant-text-muted)" }}
              >
                <ArrowLeft className="h-4 w-4 group-hover:text-[var(--covenant-accent)] transition-colors" />
                {!isCollapsed && (
                  <span className="group-hover:text-[var(--covenant-text)] transition-colors">
                    Back to Hebeling OS
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                style={{
                  backgroundColor: "var(--covenant-card)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              >
                Back to Hebeling OS
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/covenant" && pathname.startsWith(item.href + "/"));
            const isOverviewActive = item.href === "/covenant" && pathname === "/covenant";

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isCollapsed && "justify-center px-2"
                )}
                style={{
                  backgroundColor: isActive || isOverviewActive ? "var(--covenant-accent-glow)" : "transparent",
                  color: isActive || isOverviewActive ? "var(--covenant-text)" : "var(--covenant-text-muted)",
                }}
              >
                {/* Accent indicator */}
                {(isActive || isOverviewActive) && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: "var(--covenant-accent)" }}
                  />
                )}
                <item.icon
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={{
                    color: isActive || isOverviewActive ? "var(--covenant-accent)" : "var(--covenant-text-muted)",
                  }}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {(isActive || isOverviewActive) && (
                      <ChevronRight
                        className="h-3 w-3 ml-auto"
                        style={{ color: "var(--covenant-accent)", opacity: 0.5 }}
                      />
                    )}
                  </>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="font-medium"
                    style={{
                      backgroundColor: "var(--covenant-card)",
                      borderColor: "var(--covenant-border)",
                      color: "var(--covenant-text)",
                    }}
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Footer - Collapse Toggle */}
        <div
          className="border-t p-2"
          style={{ borderColor: "var(--covenant-border)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hover:bg-[var(--covenant-bg-secondary)]",
              isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start gap-2"
            )}
            style={{ color: "var(--covenant-text-muted)" }}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
