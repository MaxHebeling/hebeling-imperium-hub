"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { LogOut, BookMarked, FileText, MessageSquare, User, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/portal-notification-bell";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";

function getNavItems(locale: PortalLocale) {
  const t = getTranslations(locale);
  return [
    { href: "/portal/editorial/projects", label: t.myBooks, icon: BookMarked },
    { href: "/portal/updates", label: t.updates, icon: MessageSquare },
    { href: "/portal/notifications", label: t.notifications, icon: FileText },
    { href: "/portal/author-dashboard", label: t.authorPanel, icon: User },
  ];
}

interface PortalNavProps {
  userEmail?: string | null;
}

export function PortalNav({ userEmail }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [locale, setLocale] = useState<PortalLocale>("es");

  const t = getTranslations(locale);
  const navItems = getNavItems(locale);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  const toggleLocale = () => {
    const next: PortalLocale = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("reino-locale", next);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as BeforeInstallPromptEvent).prompt();
    const result = await (installPrompt as BeforeInstallPromptEvent).userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client-login");
    router.refresh();
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-[#1a3a6b]/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal/editorial/projects" className="flex items-center gap-2">
              <Image
                src="/logo-reino-editorial.png"
                alt="Reino Editorial"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-sm text-[#1a3a6b] tracking-tight hidden sm:inline">Reino Editorial</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5",
                      isActive
                        ? "bg-[#1a3a6b]/10 text-[#1a3a6b]"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={t.language}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase">{locale}</span>
            </button>

            <NotificationBell />
            {userEmail && (
              <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-40">
                {userEmail}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 h-8 px-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5 text-xs">{t.signOut}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur px-4 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-xs font-medium transition-colors py-1 px-3",
                  isActive ? "text-[#1a3a6b]" : "text-gray-400"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 text-xs font-medium text-gray-400 py-1 px-3"
          >
            <LogOut className="h-5 w-5" />
            {t.signOut}
          </button>
        </div>
      </div>
    </header>

    {/* PWA Install Banner */}
    {showInstallBanner && (
      <div className="fixed bottom-16 md:bottom-4 left-4 right-4 z-[60] md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-white border border-[#1a3a6b]/20 rounded-2xl shadow-lg p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1a3a6b]/10 shrink-0">
            <Download className="w-5 h-5 text-[#1a3a6b]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a3a6b]">{t.downloadApp}</p>
            <p className="text-xs text-gray-500">{t.downloadAppDesc}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              {locale === "es" ? "Ahora no" : "Not now"}
            </button>
            <button
              onClick={handleInstall}
              className="text-xs font-semibold text-white bg-[#1a3a6b] px-3 py-1.5 rounded-lg hover:bg-[#1a3a6b]/90 transition-colors"
            >
              {locale === "es" ? "Instalar" : "Install"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
