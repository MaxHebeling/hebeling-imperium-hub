"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  HardHat,
  Radar,
  Workflow,
} from "lucide-react";

import { LeadHunterOperatingSystem } from "@/components/lead-hunter/operating-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

const LEAD_HUNTER_LOGO = "/logo-lead-hunter.svg";
const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`group relative overflow-hidden rounded-[28px] border border-[#E1A24A]/16 bg-[#0C1727]/78 backdrop-blur-sm ${className}`.trim()}
      style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(8,19,32,0.94) 0%, rgba(8,19,32,0.86) 38%, rgba(201,111,45,0.12) 100%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-[#C96F2D]" />
      <div className="relative">{children}</div>
    </Card>
  );
}

export default function LeadHunterPage() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#E1A24A] uppercase tracking-[0.28em] mb-1">
            HEBELING OS · LEAD HUNTER
          </p>
          <h1 className="text-2xl font-bold text-white">
            {locale === "es" ? "Lead Hunter Dashboard" : "Lead Hunter Dashboard"}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {locale === "es"
              ? "Sala privada de operación con la atmósfera visual original de Lead Hunter."
              : "Private operating room with the original Lead Hunter visual atmosphere."}
          </p>
        </div>
      </div>

      <ShellCard>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center overflow-hidden">
                <Image
                  src={LEAD_HUNTER_LOGO}
                  alt="Lead Hunter logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#E1A24A] hover:bg-[#C96F2D]/10">
                    {locale === "es" ? "Construction Lead Engine" : "Construction Lead Engine"}
                  </Badge>
                  <Badge variant="secondary">
                    {locale === "es" ? "Sala privada" : "Private room"}
                  </Badge>
                  <Badge variant="secondary">
                    {locale === "es" ? "Expediente propio" : "Native dossier"}
                  </Badge>
                </div>
                <h2 className="text-xl font-semibold text-white">Lead Hunter</h2>
                <p className="text-sm text-slate-300 mt-1">
                  {locale === "es"
                    ? "Vertical estratégica para permisos, inteligencia y activación de oportunidades en construcción."
                    : "Strategic vertical for permits, intelligence, and activation of construction opportunities."}
                </p>
                <p className="text-sm text-slate-300 mt-4 max-w-2xl leading-7">
                  {locale === "es"
                    ? "Aquí ya vive toda la operación de Lead Hunter: command center, inventario y expediente en una capa nativa con identidad propia y una puesta en escena más cinematográfica."
                    : "The full Lead Hunter operation now lives here: command center, inventory, and dossier in a native layer with its own identity and a more cinematic stage."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
              <Button asChild className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95">
                <Link href="/apply/lead-hunter">
                  {locale === "es" ? "Abrir intake" : "Open intake"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-background/60">
                <Link href="/app/companies/lead-hunter/leads/PRJ-2026-001245">
                  {locale === "es" ? "Ver expediente" : "Open dossier"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-2 md:grid-cols-3">
            {[
              {
                label: locale === "es" ? "Modo" : "Mode",
                value: locale === "es" ? "Dashboard de unidad" : "Business-unit dashboard",
                icon: HardHat,
              },
              {
                label: locale === "es" ? "Entrada principal" : "Primary entry",
                value: locale === "es" ? "Dashboard de Lead Hunter" : "Lead Hunter dashboard",
                icon: Radar,
              },
              {
                label: locale === "es" ? "Visibilidad" : "Visibility",
                value: locale === "es" ? "Todo conectado aquí" : "Everything connected here",
                icon: Workflow,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-[#081320]/72 px-3 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <item.icon className="h-4 w-4 text-[#E1A24A]" />
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </ShellCard>

      <LeadHunterOperatingSystem />
    </div>
  );
}
