"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { DEFAULT_IDR_OFFICE_ICON, IDR_OFFICE_ICONS } from "@/lib/idr/office-icons";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrStaffOfficeBySlug } from "@/lib/idr/workspaces";

export default function IdrOfficeDetailPage({
  params,
}: {
  params: { officeSlug: string };
}) {
  const { locale } = useLanguage();
  const office = getIdrStaffOfficeBySlug(params.officeSlug, locale);

  if (!office) {
    return (
      <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#1B2A40] bg-[#101C2E]/88 p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E2C36B]">
            {locale === "es" ? "Oficina no encontrada" : "Office not found"}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            {locale === "es" ? "Esa oficina no existe en la base actual." : "That office does not exist in the current map."}
          </h1>
          <Link href="/app/companies/idr/oficinas" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#E2C36B]">
            <ArrowLeft className="h-4 w-4" />
            {locale === "es" ? "Volver a oficinas" : "Back to offices"}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = IDR_OFFICE_ICONS[office.slug] ?? DEFAULT_IDR_OFFICE_ICON;

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section
          className="overflow-hidden rounded-[30px] border p-8"
          style={{
            borderColor: IDR_THEME.border,
            background:
              "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 54%, rgba(201,166,70,0.10) 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
          }}
        >
          <Link href="/app/companies/idr/oficinas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#E2C36B]">
            <ArrowLeft className="h-4 w-4" />
            {locale === "es" ? "Volver al mapa de oficinas" : "Back to office map"}
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.35em]"
                style={{ color: "rgba(201,166,70,0.7)" }}
              >
                {office.code}
              </p>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(201,166,70,0.10)" }}
                >
                  <Icon className="h-7 w-7 text-[#E2C36B]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl font-semibold tracking-tight">{office.title}</h1>
                  <p className="mt-2 text-sm leading-7 text-[#9DA9BA]">{office.subtitle}</p>
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-[#F5F0E8]/92">{office.summary}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: locale === "es" ? "Audiencia prevista" : "Expected audience",
              value: office.audience,
            },
            {
              label: locale === "es" ? "Modelo de acceso" : "Access model",
              value: office.access,
            },
            {
              label: locale === "es" ? "Objetivo del primer release" : "First release goal",
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
                  ? "Misión operativa de esta oficina dentro del sistema privado de IDR."
                  : "Operational mission of this office inside IDR’s private system."}
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
                ? "Blueprint inicial de lo que administrará esta oficina desde el primer release."
                : "Initial blueprint of what this office will manage from the first release."}
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
                  ? "Asignación base de personas, nivel de acceso y estado de credenciales."
                  : "Baseline assignment of people, access level, and credential status."}
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
              <CardTitle>{locale === "es" ? "Responsabilidades base" : "Core responsibilities"}</CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "Estas responsabilidades orientan la operación diaria de la oficina."
                  : "These responsibilities guide the office’s daily operation."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {office.responsibilities.map((item) => (
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
    </div>
  );
}
