"use client";

import { MetricsSection } from "@/components/dashboard/metrics-section";
import { SystemActivityFeed } from "@/components/dashboard/system-activity-feed";
import { CompaniesPanel } from "@/components/dashboard/companies-panel";
import { AiPanel } from "@/components/dashboard/ai-panel";
import { useLanguage } from "@/lib/i18n";

export default function DashboardPage() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Hebeling OS</p>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            {locale === "es" ? "Dashboard del Sistema Operativo" : "Operating System Dashboard"}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Row 1: KPI metrics strip */}
      <MetricsSection />

      {/* Row 2: Activity feed + Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <SystemActivityFeed />
        </div>
        <div className="lg:col-span-3">
          <CompaniesPanel />
        </div>
      </div>

      {/* Row 3: ANNA AI panel */}
      <AiPanel />
    </div>
  );
}
