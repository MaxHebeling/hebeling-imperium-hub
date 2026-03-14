"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallPromptProps {
  locale?: "es" | "en";
}

export function PWAInstallPrompt({ locale = "es" }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem("reino-pwa-dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("reino-pwa-dismissed", "true");
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3a6b] to-[#2a5a9b] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {locale === "es"
                ? "Instalar Reino Editorial"
                : "Install Reino Editorial"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {locale === "es"
                ? "Accede mas rapido desde tu pantalla de inicio"
                : "Access faster from your home screen"}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-gray-100 shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full mt-3 h-10 rounded-xl bg-[#1a3a6b] text-white text-sm font-medium hover:bg-[#2a5a9b] transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {locale === "es" ? "Instalar App" : "Install App"}
        </button>
      </div>
    </div>
  );
}
