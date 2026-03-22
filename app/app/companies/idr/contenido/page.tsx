"use client";

import { CalendarClock, Layers3, SendHorizonal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getIdrModuleContent, IDR_THEME } from "@/lib/idr/module-content";

export default function IdrContentPage() {
  const { locale } = useLanguage();
  const content = getIdrModuleContent(locale);

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
            {locale === "es" ? "Command Center de Contenido" : "Content command center"}
          </p>
          <h1 className="font-heading text-3xl font-semibold">
            {locale === "es" ? "Publicación por audiencias y releases mensuales" : "Audience-based publishing and monthly releases"}
          </h1>
          <p className="max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
            {locale === "es"
              ? "Desde HEBELING OS, el staff de IDR debe poder decidir qué contenido se queda interno y qué contenido sale a la comunidad de inversionistas, con ritmo y trazabilidad."
              : "From HEBELING OS, the IDR staff should be able to decide what content stays internal and what content goes out to the investor community, with rhythm and traceability."}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.publishingTracks.map((track, index) => {
            const Icon = index === 0 ? Layers3 : index === 1 ? SendHorizonal : CalendarClock;

            return (
              <Card key={track.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A646]/10">
                    <Icon className="h-5 w-5 text-[#E2C36B]" />
                  </div>
                  <div>
                    <CardTitle>{track.title}</CardTitle>
                    <CardDescription className="pt-2 text-[#9DA9BA]">
                      {locale === "es" ? "Audiencia objetivo" : "Target audience"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{
                      color: IDR_THEME.goldSoft,
                      background: "rgba(201,166,70,0.10)",
                    }}
                  >
                    {track.audience}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
          <CardHeader>
            <CardTitle>{locale === "es" ? "Cadencia editorial sugerida" : "Suggested editorial cadence"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Una primera versión funcional debe priorizar orden de publicación y consistencia."
                : "A first functional version should prioritize publishing order and consistency."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {content.monthlyCadence.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border px-4 py-4"
                style={{
                  borderColor: IDR_THEME.border,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: IDR_THEME.goldSoft }}>
                  {item.label}
                </p>
                <p className="mt-2 text-sm" style={{ color: IDR_THEME.ivory }}>
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
