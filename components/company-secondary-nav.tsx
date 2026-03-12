"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type CompanyNavItem = {
  href: string;
  label: string;
};

interface CompanySecondaryNavProps {
  title: string;
  items: CompanyNavItem[];
  basePath: string;
}

export function CompanySecondaryNav({
  title,
  items,
  basePath,
}: CompanySecondaryNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/60 bg-card/30">
      <div className="px-6 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {title}
        </h2>
        <nav className="flex flex-wrap gap-1" aria-label="Company modules">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
