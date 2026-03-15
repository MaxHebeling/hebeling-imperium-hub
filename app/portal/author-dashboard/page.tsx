"use client";

import { useState, useEffect } from "react";
import { AuthorDashboardPanel } from "@/components/editorial/portal/author-dashboard-panel";
import { AppDownloadSection } from "@/components/editorial/portal/app-download-section";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";

export default function AuthorDashboardPage() {
  const [locale, setLocale] = useState<PortalLocale>("es");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  // Listen for locale changes from nav
  useEffect(() => {
    const interval = setInterval(() => {
      const current = localStorage.getItem("reino-locale") as PortalLocale | null;
      if (current && current !== locale) setLocale(current);
    }, 500);
    return () => clearInterval(interval);
  }, [locale]);

  // Fetch first project for the client
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch("/api/editorial/client/projects");
        const json = await res.json();
        if (json.success && json.projects?.length > 0) {
          setProjectId(json.projects[0].id);
        }
      } catch {
        // silently fail
      }
    }
    fetchProject();
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
