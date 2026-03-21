"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  HardHat,
  PhoneCall,
  Radar,
  Target,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

export default function LeadHunterPage() {
  const { locale } = useLanguage();

  const pillars = [
    {
      title: locale === "es" ? "Intake con ANNA" : "ANNA Intake",
      description:
        locale === "es"
          ? "ANNA recibe solicitudes relacionadas con construccion, detecta intencion y captura la informacion minima para abrir la oportunidad correctamente."
          : "ANNA receives construction-related requests, detects intent, and captures the minimum information needed to open the opportunity correctly.",
      icon: Bot,
    },
    {
      title: locale === "es" ? "Pipeline de calificacion" : "Qualification Pipeline",
      description:
        locale === "es"
          ? "Lead Hunter convierte conversaciones y formularios en leads estructurados dentro del CRM con prioridad, origen y estado de seguimiento."
          : "Lead Hunter turns conversations and forms into structured CRM leads with priority, source, and follow-up status.",
      icon: Target,
    },
    {
      title: locale === "es" ? "Operacion de seguimiento" : "Follow-up Operations",
      description:
        locale === "es"
          ? "El equipo puede asignar responsables, registrar siguiente accion y mover cada oportunidad hasta llamada, reunion o cierre."
          : "The team can assign owners, register the next action, and move each opportunity toward a call, meeting, or close.",
      icon: Workflow,
    },
  ];

  const scope = [
    locale === "es"
      ? "Lead Hunter como business unit dentro de HEBELING OS"
      : "Lead Hunter as a business unit inside HEBELING OS",
    locale === "es"
      ? "Pipeline CRM para leads de construccion"
      : "CRM pipeline for construction leads",
    locale === "es"
      ? "ANNA como capa inicial de intake y routing"
      : "ANNA as the initial intake and routing layer",
    locale === "es"
      ? "Calificacion por tipo de proyecto, ubicacion y urgencia"
      : "Qualification by project type, location, and urgency",
    locale === "es"
      ? "Seguimiento humano con callback o handoff a meeting"
      : "Human follow-up with callback or meeting handoff",
  ];

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0B1420] text-[#E7ECF5]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-center bg-cover opacity-[0.22]"
          style={{
            backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.42]"
          style={{
            background:
              "radial-gradient(circle at 14% 18%, rgba(201,111,45,0.28), transparent 30%), radial-gradient(circle at 84% 22%, rgba(225,162,74,0.22), transparent 28%), radial-gradient(circle at 54% 48%, rgba(159,178,204,0.12), transparent 34%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,20,32,0.72) 0%, rgba(11,20,32,0.52) 18%, rgba(11,20,32,0.64) 46%, rgba(11,20,32,0.82) 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section
          className="relative overflow-hidden rounded-3xl border border-[#C96F2D]/20 p-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,27,45,0.98) 0%, rgba(22,34,53,0.96) 55%, rgba(201,111,45,0.18) 100%)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
          }}
        >
          <div
            className="absolute inset-0 bg-center bg-cover opacity-[0.28] pointer-events-none"
            style={{
              backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(11,20,32,0.96) 0%, rgba(11,20,32,0.84) 26%, rgba(11,20,32,0.46) 74%, rgba(11,20,32,0.8) 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#E1A24A]/30 bg-[#E1A24A]/10 text-[#E1A24A] hover:bg-[#E1A24A]/10">
                  {locale === "es" ? "Motor de leads para construccion" : "Construction Lead Engine"}
                </Badge>
                <Badge className="border-[#C96F2D]/30 bg-[#C96F2D]/10 text-[#F7D7AF] hover:bg-[#C96F2D]/10">
                  {locale === "es" ? "Prioridad ANNA" : "ANNA Priority"}
                </Badge>
                <Badge className="border-[#21D1AC]/20 bg-[#21D1AC]/10 text-[#6EE7D2] hover:bg-[#21D1AC]/10">
                  CRM Native
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F1B2D] ring-1 ring-[#E1A24A]/25">
                  <HardHat className="h-7 w-7 text-[#E1A24A]" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Lead Hunter</h1>
                  <p className="text-sm text-[#C7CED8]">
                    {locale === "es"
                      ? "Vertical estrategica para captacion, calificacion y seguimiento de oportunidades en construccion."
                      : "Strategic vertical for capturing, qualifying, and tracking construction opportunities."}
                  </p>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-[#9FB2CC]">
                {locale === "es"
                  ? "Lead Hunter es una business unit interna de HEBELING OS y uno de los primeros entornos donde ANNA puede demostrar valor comercial directo. El objetivo inicial no es construir un portal completo, sino activar un circuito real de intake, calificacion y handoff dentro del CRM compartido."
                  : "Lead Hunter is an internal business unit of HEBELING OS and one of the first environments where ANNA can demonstrate direct commercial value. The initial goal is not to build a full portal, but to activate a real intake, qualification, and handoff circuit inside the shared CRM."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95">
                <Link href="/app/crm?tab=leads&brand=lead_hunter">
                  {locale === "es" ? "Abrir CRM" : "Open CRM"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#C96F2D]/30 bg-[#C96F2D]/10 text-[#F7D7AF] hover:bg-[#C96F2D]/16"
              >
                <Link href="/apply/lead-hunter">
                  {locale === "es" ? "Abrir Intake" : "Open Intake"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#E7ECF5] hover:bg-[#162235]"
              >
                <Link href="/app/companies">{locale === "es" ? "Ver empresas" : "View companies"}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C96F2D]/12 ring-1 ring-[#C96F2D]/20">
                  <pillar.icon className="h-5 w-5 text-[#E1A24A]" />
                </div>
                <div>
                  <CardTitle className="text-base">{pillar.title}</CardTitle>
                  <CardDescription className="pt-1 text-[#9FB2CC]">
                    {pillar.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radar className="h-5 w-5 text-[#E1A24A]" />
                {locale === "es" ? "Scope inicial" : "Initial scope"}
              </CardTitle>
              <CardDescription className="text-[#9FB2CC]">
                {locale === "es"
                  ? "Primer slice operativo recomendado para lanzar Lead Hunter sin complejidad innecesaria."
                  : "Recommended first operational slice to launch Lead Hunter without unnecessary complexity."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scope.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#1E3048] bg-[#0F1B2D]/70 px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#E1A24A]/12 text-xs font-semibold text-[#E1A24A]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-[#D6DEEA]">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PhoneCall className="h-5 w-5 text-[#E1A24A]" />
                {locale === "es" ? "Meta operativa" : "Operational target"}
              </CardTitle>
              <CardDescription className="text-[#9FB2CC]">
                {locale === "es"
                  ? "La primera meta no es un portal perfecto, sino un flujo real y medible."
                  : "The first goal is not a perfect portal, but a real and measurable flow."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#C96F2D]/20 bg-[#C96F2D]/8 p-4">
                <p className="text-sm leading-7 text-[#F7E6CE]">
                  {locale === "es"
                    ? "Lead de construccion entra, ANNA lo recibe, el CRM crea o actualiza el registro, el equipo califica y se agenda seguimiento."
                    : "A construction lead comes in, ANNA receives it, the CRM creates or updates the record, the team qualifies it, and follow-up is scheduled."}
                </p>
              </div>

              <div className="space-y-2 text-sm text-[#9FB2CC]">
                <p>{locale === "es" ? "Esto convierte a Lead Hunter en:" : "This turns Lead Hunter into:"}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    {locale === "es"
                      ? "caso comercial protagonista para ANNA,"
                      : "a flagship commercial use case for ANNA,"}
                  </li>
                  <li>
                    {locale === "es"
                      ? "primer circuito medible de HEBELING OS,"
                      : "the first measurable circuit of HEBELING OS,"}
                  </li>
                  <li>
                    {locale === "es"
                      ? "base real para futuras automatizaciones y reporting."
                      : "a real base for future automation and reporting."}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
