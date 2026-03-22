"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrStaffOfficeBySlug } from "@/lib/idr/workspaces";

export default function IdrDirectOfficePage() {
  const params = useParams<{ officeSlug: string }>();
  const { locale } = useLanguage();
  const office = getIdrStaffOfficeBySlug(params.officeSlug, locale);

  if (!office) {
    return null;
  }

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
          {office.code}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">{office.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
          {office.summary}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: locale === "es" ? "Audiencia" : "Audience",
            value: office.audience,
          },
          {
            label: locale === "es" ? "Acceso" : "Access",
            value: office.access,
          },
          {
            label: locale === "es" ? "Objetivo inicial" : "Initial goal",
            value: office.launchGoal,
          },
        ].map((item) => (
          <Card key={item.label} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="text-base">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-[#9DA9BA]">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
          <CardHeader>
            <CardTitle>{locale === "es" ? "Funciones de la oficina" : "Office functions"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Responsabilidad operativa que esta oficina debe cumplir dentro de IDR."
                : "Operational responsibility this office must fulfill inside IDR."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {office.officeFunctions.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border px-4 py-3"
                style={{ borderColor: IDR_THEME.border, background: "rgba(255,255,255,0.02)" }}
              >
                <div
                  className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "rgba(201,166,70,0.10)", color: IDR_THEME.goldSoft }}
                >
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-[#F5F0E8]/92">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
          <CardHeader>
            <CardTitle>{locale === "es" ? "Contenido base de la oficina" : "Core office content"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Bloques iniciales que esta oficina va a administrar desde el primer release."
                : "Initial blocks this office will manage from the first release."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {office.contentBlocks.map((block) => (
              <div
                key={block.title}
                className="rounded-2xl border px-4 py-4"
                style={{
                  borderColor: IDR_THEME.border,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E2C36B]">{block.releasePhase}</p>
                <p className="mt-2 text-sm font-semibold text-[#F5F0E8]">{block.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#9DA9BA]">{block.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
          <CardHeader>
            <CardTitle>{locale === "es" ? "Equipo y accesos iniciales" : "Initial team and access"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Estas son las personas previstas para esta oficina y cómo quedará su acceso."
                : "These are the people planned for this office and how their access will be structured."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {office.seats.map((seat) => (
              <div
                key={seat.title}
                className="rounded-2xl border px-4 py-4"
                style={{
                  borderColor: IDR_THEME.border,
                  background:
                    "linear-gradient(135deg, rgba(201,166,70,0.08) 0%, rgba(114,47,55,0.08) 100%)",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E2C36B]">{seat.title}</p>
                <p className="mt-2 text-base font-semibold text-[#F5F0E8]">{seat.person}</p>
                <p className="mt-2 text-sm text-[#9DA9BA]">{seat.scope}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ background: "rgba(201,166,70,0.12)", color: IDR_THEME.goldSoft }}
                  >
                    {seat.accessLevel}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ background: "rgba(255,255,255,0.05)", color: IDR_THEME.ivory }}
                  >
                    {seat.credentialStatus}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
          <CardHeader>
            <CardTitle>{locale === "es" ? "Módulos de esta oficina" : "Modules for this office"}</CardTitle>
            <CardDescription className="text-[#9DA9BA]">
              {locale === "es"
                ? "Herramientas y contenedores que vivirán dentro del espacio privado."
                : "Tools and containers that will live inside the private space."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {office.modules.map((item) => (
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
      </section>
    </div>
  );
}
