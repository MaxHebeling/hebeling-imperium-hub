"use client";

import { useState } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";

interface AppDownloadSectionProps {
  locale: PortalLocale;
}

export function AppDownloadSection({ locale }: AppDownloadSectionProps) {
  const t = getTranslations(locale);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = () => {
    if (notifyEmail.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#1a3a6b]/5 via-white to-[#1a3a6b]/5 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
          <Smartphone className="w-7 h-7 text-[#1a3a6b]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{t.downloadApp}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t.downloadAppDesc}</p>
        </div>
      </div>

      {/* Coming soon state */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
            {t.comingSoon}
          </span>
        </div>

        {submitted ? (
          <div className="flex items-center gap-2 text-emerald-600 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            {locale === "es" ? "Te avisaremos cuando este disponible." : "We'll notify you when it's available."}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder={locale === "es" ? "Tu correo electronico" : "Your email address"}
              className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/30"
            />
            <Button
              size="sm"
              onClick={handleNotify}
              disabled={!notifyEmail.trim()}
              className="bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-xs h-9 px-4"
            >
              {t.notifyMe}
            </Button>
          </div>
        )}

        {/* App Store badges placeholder */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-10 px-4 rounded-lg bg-gray-900 flex items-center gap-2 opacity-30 cursor-not-allowed">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-white text-left">
              <p className="text-[8px] leading-none">App Store</p>
              <p className="text-[11px] font-semibold leading-tight">{t.comingSoon}</p>
            </div>
          </div>
          <div className="h-10 px-4 rounded-lg bg-gray-900 flex items-center gap-2 opacity-30 cursor-not-allowed">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.37.12-.7.37-.96L12.71 12l-9.34 9.46c-.25-.26-.37-.59-.37-.96zm16.64-6.95L5.25 21.19l10.47-5.92L17.36 14l2.28-0.45zM5.25 2.81l14.39 7.64L17.36 10l-1.64-1.27L5.25 2.81zm15.39 7.89l-2.8 1.57L16 10.73l1.83-1.01 2.81 1.48z"/>
            </svg>
            <div className="text-white text-left">
              <p className="text-[8px] leading-none">Google Play</p>
              <p className="text-[11px] font-semibold leading-tight">{t.comingSoon}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
