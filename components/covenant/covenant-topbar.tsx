"use client";

import { useState } from "react";
import { Bell, Search, Sparkles, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CovenantTopbarProps {
  userName?: string;
}

export function CovenantTopbar({ userName = "Max Hebeling" }: CovenantTopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="h-16 border-b px-6 flex items-center justify-between shrink-0"
      style={{
        backgroundColor: "var(--covenant-bg)",
        borderColor: "var(--covenant-border)",
      }}
    >
      {/* Left: Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div
          className="relative flex-1 transition-all duration-200"
          style={{
            maxWidth: searchFocused ? "400px" : "320px",
          }}
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--covenant-text-muted)" }}
          />
          <Input
            placeholder="Search people, organizations, opportunities..."
            className="pl-9 h-10 text-sm border-0 focus-visible:ring-1 transition-all duration-200"
            style={{
              backgroundColor: "var(--covenant-bg-secondary)",
              color: "var(--covenant-text)",
              borderColor: searchFocused ? "var(--covenant-accent)" : "transparent",
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: "var(--covenant-bg)",
              borderColor: "var(--covenant-border)",
              color: "var(--covenant-text-muted)",
            }}
          >
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* AI Assistant Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 h-9 hover:bg-[var(--covenant-gold-glow)] transition-all duration-200 group"
          style={{
            color: "var(--covenant-gold)",
          }}
        >
          <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-sm font-medium">AI Assistant</span>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative hover:bg-[var(--covenant-bg-secondary)]"
          style={{ color: "var(--covenant-text-muted)" }}
        >
          <Bell className="h-4 w-4" />
          {/* Notification dot */}
          <span
            className="absolute top-2 right-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--covenant-accent)" }}
          />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 h-9 px-2 hover:bg-[var(--covenant-bg-secondary)]"
              style={{ color: "var(--covenant-text)" }}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--covenant-accent) 0%, var(--covenant-gold) 100%)",
                  color: "var(--covenant-bg)",
                }}
              >
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{userName}</span>
              <ChevronDown className="h-3 w-3" style={{ color: "var(--covenant-text-muted)" }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              backgroundColor: "var(--covenant-card)",
              borderColor: "var(--covenant-border)",
            }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              style={{ color: "var(--covenant-text)" }}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              style={{ color: "var(--covenant-text)" }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--covenant-border)" }} />
            <DropdownMenuItem
              className="cursor-pointer"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
