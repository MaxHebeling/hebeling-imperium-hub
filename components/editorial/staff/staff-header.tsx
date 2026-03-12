"use client";

import { cn } from "@/lib/utils";

interface StaffHeaderProps {
  title?: string;
  userEmail?: string | null;
  className?: string;
}

export function StaffHeader({
  title = "Staff Editorial",
  userEmail,
  className,
}: StaffHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <h1 className="font-semibold text-sm tracking-tight text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        {userEmail && (
          <span className="hidden sm:inline-block max-w-[180px] truncate text-xs text-muted-foreground">
            {userEmail}
          </span>
        )}
      </div>
    </header>
  );
}
