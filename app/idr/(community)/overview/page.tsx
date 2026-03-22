"use client";

import { BellRing, Clapperboard, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getIdrModuleContent, IDR_THEME } from "@/lib/idr/module-content";
import { getIdrCommunityWorkspace } from "@/lib/idr/workspaces";

export default function IdrPortalOverviewPage() {
  const { locale } = useLanguage();
  const content = getIdrModuleContent(locale);
  const community = getIdrCommunityWorkspace(locale);

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-[28px] border p-6"
        style={{
          borderColor: IDR_THEME.border,
          background:
            "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 62%, rgba(201,166,70,0.08) 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
          {community.code}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">
          {community.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
          {community.summary}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {content.investorTracks.map((track, index) => {
          const Icon = index === 0 ? BellRing : index === 1 ? Clapperboard : Sparkles;

          return (
            <Card key={track.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
              <CardHeader className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A646]/10">
                  <Icon className="h-5 w-5 text-[#E2C36B]" />
                </div>
                <div>
                  <CardTitle>{track.title}</CardTitle>
                  <CardDescription className="pt-2 text-[#9DA9BA]">
                    {track.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle>{locale === "es" ? "Próximos formatos del portal" : "Upcoming portal formats"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Estructura base para avisos, videos y recursos exclusivos."
                : "Foundation structure for notices, videos, and exclusive resources."}
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {community.modules.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: IDR_THEME.border,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#E2C36B]" />
                {locale === "es" ? "Instalación en teléfono" : "Phone installation"}
              </CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "Este espacio está pensado para sentirse como una app privada de IDR desde el teléfono."
                  : "This space is designed to feel like a private IDR app from the phone."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {community.experiences.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: IDR_THEME.border,
                  background:
                    "linear-gradient(135deg, rgba(201,166,70,0.08) 0%, rgba(114,47,55,0.08) 100%)",
                }}
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
