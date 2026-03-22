"use client";

import Link from "next/link";
import { BellRing, Clapperboard, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getIdrModuleContent, IDR_THEME } from "@/lib/idr/module-content";

export default function IdrInvestorsPage() {
  const { locale } = useLanguage();
  const content = getIdrModuleContent(locale);

  const icons = [BellRing, Clapperboard, Sparkles];

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
              {locale === "es" ? "Carril Inversionistas" : "Investor lane"}
            </p>
            <h1 className="font-heading text-3xl font-semibold">
              {locale === "es" ? "Experiencia premium de comunidad privada" : "Premium private community experience"}
            </h1>
            <p className="text-sm leading-7" style={{ color: IDR_THEME.muted }}>
              {locale === "es"
                ? "El inversionista no entra a una intranet fría. Entra a un entorno premium, claro y móvil, donde encuentra avisos, notificaciones, videos y recursos relevantes del ministerio."
                : "The investor does not enter a cold intranet. They enter a premium, clear, mobile-oriented environment where they find notices, notifications, videos, and relevant ministry resources."}
            </p>
          </div>

          <Button
            asChild
            className="text-[#07101C]"
            style={{ background: `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})` }}
          >
            <Link href="/idr/acceso">
              {locale === "es" ? "Abrir acceso inversionistas" : "Open investor access"}
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.investorTracks.map((track, index) => {
            const Icon = icons[index];

            return (
              <Card key={track.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
                <CardHeader className="space-y-4">
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

        <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#E2C36B]" />
                {locale === "es" ? "Experiencia tipo app" : "App-like experience"}
              </CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "El portal privado se está estructurando para instalarse como aplicación en el teléfono."
                  : "The private portal is being structured to install as an application on the phone."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.portalHighlights.map((item) => (
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
              <CardTitle>{locale === "es" ? "Cadencia de valor para la comunidad" : "Community value cadence"}</CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "El contenido debe sentirse curado, no improvisado."
                  : "Content must feel curated, not improvised."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.monthlyCadence.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: IDR_THEME.border,
                    background:
                      "linear-gradient(135deg, rgba(201,166,70,0.08) 0%, rgba(63,164,106,0.08) 100%)",
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
        </section>
      </div>
    </div>
  );
}
