"use client";

import Link from "next/link";
import { ArrowUpRight, Crown, ShieldCheck, Smartphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getIdrModuleContent, IDR_THEME } from "@/lib/idr/module-content";

export default function IdrOverviewPage() {
  const { locale } = useLanguage();
  const content = getIdrModuleContent(locale);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07101C] text-[#F5F0E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(circle at 18% 16%, rgba(201,166,70,0.18), transparent 26%), radial-gradient(circle at 82% 20%, rgba(114,47,55,0.18), transparent 24%), radial-gradient(circle at 50% 52%, rgba(63,164,106,0.08), transparent 32%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section
          className="relative overflow-hidden rounded-[30px] border p-8"
          style={{
            borderColor: IDR_THEME.border,
            background:
              "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 58%, rgba(201,166,70,0.10) 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.26)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="flex flex-wrap gap-2">
                {content.hero.badges.map((badge) => (
                  <Badge
                    key={badge}
                    className="border-[#C9A646]/25 bg-[#C9A646]/10 text-[#E2C36B] hover:bg-[#C9A646]/10"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: "rgba(201,166,70,0.7)" }}
                >
                  {content.hero.eyebrow}
                </p>
                <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                  {content.hero.title}
                </h1>
                <p className="max-w-2xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
                  {content.hero.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="text-[#07101C]"
                style={{
                  background: `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`,
                }}
              >
                <Link href="/app/companies/idr/staff">
                  {locale === "es" ? "Abrir carril staff" : "Open staff lane"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="text-[#F5F0E8] hover:bg-white/10"
                style={{
                  borderColor: IDR_THEME.borderStrong,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Link href="/idr/overview">
                  {locale === "es" ? "Ver portal inversionistas" : "View investor portal"}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.overviewPillars.map((pillar, index) => {
            const Icon = index === 0 ? Crown : index === 1 ? Users : ShieldCheck;

            return (
              <Card
                key={pillar.title}
                className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]"
              >
                <CardHeader className="space-y-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(201,166,70,0.10)" }}
                  >
                    <Icon className="h-6 w-6" style={{ color: IDR_THEME.goldSoft }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pillar.title}</CardTitle>
                    <CardDescription className="pt-2 text-[#9DA9BA]">
                      {pillar.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
                    style={{
                      color: IDR_THEME.goldSoft,
                      background: "rgba(201,166,70,0.10)",
                    }}
                  >
                    {pillar.metric}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle>{locale === "es" ? "Diseño de operación" : "Operating design"}</CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "El módulo IDR dentro de HEBELING OS queda dividido por audiencias, no por repos mezclados."
                  : "The IDR module inside HEBELING OS is split by audiences, not by mixed repositories."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                locale === "es"
                  ? "Staff: documentos, gobierno, decisiones, coordinación y trazabilidad."
                  : "Staff: documents, governance, decisions, coordination, and traceability.",
                locale === "es"
                  ? "Inversionistas: avisos, videos, notificaciones y recursos premium."
                  : "Investors: notices, videos, notifications, and premium resources.",
                locale === "es"
                  ? "HEBELING OS: permisos, publicación, control y evolución del sistema."
                  : "HEBELING OS: permissions, publishing, control, and system evolution.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: IDR_THEME.border,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,166,70,0.12)", color: IDR_THEME.goldSoft }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6" style={{ color: IDR_THEME.ivory }}>
                    {item}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#E2C36B]" />
                {locale === "es" ? "Capa móvil" : "Mobile layer"}
              </CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "El acceso del inversionista se está diseñando para sentirse como app premium."
                  : "Investor access is being designed to feel like a premium app."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.portalHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: IDR_THEME.border,
                    background:
                      "linear-gradient(135deg, rgba(63,164,106,0.08) 0%, rgba(201,166,70,0.08) 100%)",
                  }}
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
