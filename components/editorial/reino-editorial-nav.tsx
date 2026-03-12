"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app/companies/reino-editorial/overview",      label: "Overview" },
  { href: "/app/companies/reino-editorial/projects",      label: "Projects" },
  { href: "/app/companies/reino-editorial/pipeline",      label: "Pipeline" },
  { href: "/app/companies/reino-editorial/ai",            label: "AI Review" },
  { href: "/app/companies/reino-editorial/authors",       label: "Authors" },
  { href: "/app/companies/reino-editorial/staff",         label: "Staff" },
  { href: "/app/companies/reino-editorial/marketplace",   label: "Marketplace" },
  { href: "/app/companies/reino-editorial/distribution",  label: "Distribution" },
  { href: "/app/companies/reino-editorial/operations",    label: "Operations" },
  { href: "/app/companies/reino-editorial/reports",       label: "Reports" },
];

export function ReinoEditorialNav() {
  const pathname = usePathname();

  return (
    <div
      className="re-nav"
      style={{
        backgroundColor: "var(--re-surface-nav)",
        borderBottom: "1px solid var(--re-border)",
        boxShadow: "var(--re-shadow-sm)",
      }}
    >
      <div className="px-6 py-3 flex flex-col gap-3">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{
              background: "linear-gradient(135deg, #1B40C0 0%, #2DD4D4 100%)",
            }}
          >
            {/* Book icon inline */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: "var(--re-blue)" }}
            >
              REINO
            </span>
            <span
              className="text-sm font-light tracking-widest ml-1.5"
              style={{ color: "var(--re-text-muted)", letterSpacing: "0.18em" }}
            >
              EDITORIAL
            </span>
          </div>
          {/* Gold accent line */}
          <div
            className="hidden sm:block h-px flex-1"
            style={{ background: "linear-gradient(90deg, var(--re-gold-bright) 0%, transparent 100%)", opacity: 0.4 }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-1" aria-label="Reino Editorial modules">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "hover:text-[var(--re-blue)]"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--re-blue)",
                        boxShadow: "0 2px 8px rgba(27,64,192,0.25)",
                      }
                    : {
                        color: "var(--re-text-muted)",
                        backgroundColor: "transparent",
                      }
                }
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
