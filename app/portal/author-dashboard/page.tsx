"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AuthorDashboardPanel } from "@/components/editorial/portal/author-dashboard-panel";
import { AppDownloadSection } from "@/components/editorial/portal/app-download-section";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";

const PORTAL_LOCALE_KEY = "reino-locale";
const PORTAL_LOCALE_EVENT = "reino-locale-change";

function getPortalLocaleSnapshot(): PortalLocale {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem(PORTAL_LOCALE_KEY);
  return saved === "en" || saved === "es" ? saved : "es";
}

function subscribePortalLocale(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(PORTAL_LOCALE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(PORTAL_LOCALE_EVENT, handleChange);
  };
}

export default function AuthorDashboardPage() {
  const locale = useSyncExternalStore<PortalLocale>(
    subscribePortalLocale,
    getPortalLocaleSnapshot,
    () => "es"
  );
  const [projectId, setProjectId] = useState<string | null>(null);

  // Fetch first project for the client
  useEffect(() => {
    void fetch("/api/editorial/client/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.projects?.length > 0) {
          setProjectId(json.projects[0].id);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {projectId && (
        <AuthorDashboardPanel projectId={projectId} locale={locale} />
      )}

      {!projectId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            {locale === "es"
              ? "No hay proyectos asociados a tu cuenta aun."
              : "No projects linked to your account yet."}
          </p>
        </div>
      )}

      <AppDownloadSection locale={locale} />
    </div>
  );
}
