"use client";

import Link from "next/link";
import { ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StaffHeaderProps {
  title?: string;
  userEmail?: string | null;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function StaffHeader({
  title = "Staff Editorial",
  userEmail,
  className,
  breadcrumbs,
}: StaffHeaderProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: "HEBELING OS", href: "/app" },
    { label: "Reino Editorial", href: "/app/companies/reino-editorial" },
    { label: title },
  ];

  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <header
      className={cn(
        "re-glass sticky top-0 z-30 flex h-14 shrink-0 items-center px-6",
        className
      )}
    >
      {/* Breadcrumb */}
      <nav className="re-breadcrumb">
        <Link 
          href="/app" 
          className="re-breadcrumb-item hover:text-[var(--re-blue)] transition-colors"
        >
          <Crown className="w-3.5 h-3.5" />
          <span className="font-medium">HEBELING OS</span>
        </Link>
        
        {items.slice(1).map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 re-breadcrumb-separator" />
            {item.href ? (
              <Link
                href={item.href}
                className="re-breadcrumb-item hover:text-[var(--re-blue)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="re-breadcrumb-current">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {userEmail && (
          <span 
            className="hidden sm:inline-block max-w-[180px] truncate text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: "var(--re-surface-2)",
              color: "var(--re-text-muted)",
            }}
          >
            {userEmail}
          </span>
        )}
      </div>
    </header>
  );
}
