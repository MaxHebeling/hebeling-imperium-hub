"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrOfficeAccessPath } from "@/lib/idr/access";

interface IdrOfficeNavProps {
  officeSlug: string;
  officeCode: string;
  officeTitle: string;
  userEmail?: string | null;
  userName?: string | null;
}

export function IdrOfficeNav({
  officeSlug,
  officeCode,
  officeTitle,
  userEmail,
  userName,
}: IdrOfficeNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(getIdrOfficeAccessPath(officeSlug));
    router.refresh();
  };

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{
        borderColor: IDR_THEME.border,
        background:
          "linear-gradient(180deg, rgba(7,16,28,0.97) 0%, rgba(12,22,38,0.94) 100%)",
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
            <ShieldCheck className="h-5 w-5" style={{ color: IDR_THEME.goldSoft }} />
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: "rgba(201,166,70,0.72)" }}
            >
              {officeCode}
            </p>
            <h1 className="text-sm font-semibold" style={{ color: IDR_THEME.ivory }}>
              {officeTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="text-xs font-medium" style={{ color: IDR_THEME.ivory }}>
              {userName || "Miembro del staff"}
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
    </header>
  );
}
