"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { IDR_THEME } from "@/lib/idr/module-content";

export type IdrCompanyNavItem = {
  href: string;
  label: string;
};

interface IdrCompanyNavProps {
  title: string;
  subtitle: string;
  items: IdrCompanyNavItem[];
}

export function IdrCompanyNav({ title, subtitle, items }: IdrCompanyNavProps) {
  const pathname = usePathname();

  return (
    <div
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{
        borderColor: IDR_THEME.border,
        background:
          "linear-gradient(180deg, rgba(7,16,28,0.96) 0%, rgba(12,22,38,0.94) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "rgba(201, 166, 70, 0.72)" }}
          >
            Inversionistas del Reino
          </span>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2
                className="font-heading text-2xl font-semibold tracking-tight"
                style={{ color: IDR_THEME.ivory }}
              >
                {title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm" style={{ color: IDR_THEME.muted }}>
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="IDR company modules">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive && "shadow-[0_10px_30px_rgba(201,166,70,0.14)]"
                )}
                style={{
                  color: isActive ? IDR_THEME.bg : IDR_THEME.ivory,
                  background: isActive
                    ? `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? "transparent" : IDR_THEME.border}`,
                }}
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
