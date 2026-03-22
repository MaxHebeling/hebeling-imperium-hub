"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Clapperboard, Home, LogOut, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IDR_THEME } from "@/lib/idr/module-content";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/idr/overview", label: "Resumen", icon: Home },
  { href: "/idr/notificaciones", label: "Avisos", icon: Bell },
  { href: "/idr/media", label: "Media", icon: Clapperboard },
];

interface IdrPortalNavProps {
  userEmail?: string | null;
  userName?: string | null;
}

export function IdrPortalNav({ userEmail, userName }: IdrPortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/idr/acceso");
    router.refresh();
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{
          borderColor: IDR_THEME.border,
          background:
            "linear-gradient(180deg, rgba(7,16,28,0.96) 0%, rgba(12,22,38,0.92) 100%)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border"
              style={{
                borderColor: IDR_THEME.borderStrong,
                background:
                  "linear-gradient(135deg, rgba(201,166,70,0.18) 0%, rgba(201,166,70,0.05) 100%)",
              }}
            >
              <span className="text-sm font-semibold tracking-[0.24em]" style={{ color: IDR_THEME.gold }}>
                IDR
              </span>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "rgba(201,166,70,0.72)" }}
              >
                Portal Privado
              </p>
              <h1 className="text-sm font-semibold" style={{ color: IDR_THEME.ivory }}>
                Inversionistas del Reino
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors"
                  )}
                  style={{
                    color: isActive ? IDR_THEME.bg : IDR_THEME.ivory,
                    background: isActive
                      ? `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "transparent" : IDR_THEME.border}`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="ml-3 hidden items-center gap-3 lg:flex">
              <div className="text-right">
                <p className="text-xs font-medium" style={{ color: IDR_THEME.ivory }}>
                  {userName || "Miembro IDR"}
                </p>
                {userEmail ? (
                  <p className="text-[11px]" style={{ color: IDR_THEME.muted }}>
                    {userEmail}
                  </p>
                ) : null}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-full px-3 py-2 text-sm"
                style={{
                  color: IDR_THEME.ivory,
                  border: `1px solid ${IDR_THEME.border}`,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Salir
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: IDR_THEME.border,
              background:
                "linear-gradient(135deg, rgba(201,166,70,0.09) 0%, rgba(114,47,55,0.08) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(201,166,70,0.12)" }}
              >
                <Smartphone className="h-5 w-5" style={{ color: IDR_THEME.goldSoft }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: IDR_THEME.ivory }}>
                  Experiencia móvil premium
                </p>
                <p className="text-xs" style={{ color: IDR_THEME.muted }}>
                  Este portal está pensado para instalarse como app y centralizar avisos, videos y recursos de IDR.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
        style={{
          borderColor: IDR_THEME.border,
          background: "rgba(7,16,28,0.96)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[11px]"
                style={{ color: isActive ? IDR_THEME.goldSoft : IDR_THEME.muted }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[11px]"
            style={{ color: IDR_THEME.muted }}
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>
    </>
  );
}
