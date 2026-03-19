import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Globe,
  LayoutTemplate,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { BriefLinkCard } from "@/components/ikingdom/brief-link-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomKpis } from "@/lib/ikingdom-office";

const quickAccess = [
  {
    title: "Leads y pipeline",
    description: "Control comercial desde el primer contacto hasta el cierre.",
    href: "/app/companies/ikingdom/leads",
    icon: BriefcaseBusiness,
  },
  {
    title: "Briefs y diagnóstico",
    description: "Formatos de levantamiento, análisis y preparación estratégica.",
    href: "/app/companies/ikingdom/briefs",
    icon: FileText,
  },
  {
    title: "Propuestas",
    description: "Plantillas premium, seguimiento y próximos cierres.",
    href: "/app/companies/ikingdom/proposals",
    icon: WalletCards,
  },
  {
    title: "Proyectos activos",
    description: "Ejecución, fases, bloqueos y visibilidad operativa.",
    href: "/app/companies/ikingdom/projects",
    icon: LayoutTemplate,
  },
];

export default function IKingdomOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="border-[#C8A84B]/20 bg-[radial-gradient(circle_at_top_left,rgba(200,168,75,0.15),transparent_40%),linear-gradient(135deg,#131a24,#101720_60%,#182131)] text-white shadow-lg">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-2">
              <Badge className="border-[#C8A84B]/30 bg-[#C8A84B]/10 text-[#E6CA7A]">
                Oficina digital
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
                HEBELING OS
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-[#E6CA7A]" />
                <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                  iKingdom
                </CardTitle>
              </div>
              <CardDescription className="max-w-2xl text-sm leading-6 text-slate-300">
                Centro operativo para ventas, briefs, diagnósticos, propuestas y ejecución de
                proyectos de arquitectura digital premium.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {ikingdomKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{kpi.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{kpi.value}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-300">{kpi.note}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#C8A84B] text-slate-950 hover:bg-[#d5b96f]">
                <Link href="/app/companies/ikingdom/leads">
                  Ver pipeline comercial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href="/app/companies/ikingdom/briefs">
                  Abrir biblioteca estratégica
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <BriefLinkCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {quickAccess.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="border-border/60 bg-card/70">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A84B]/12 text-[#C8A84B]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="px-0 text-[#C8A84B] hover:bg-transparent hover:text-[#d5b96f]">
                  <Link href={item.href}>
                    Abrir módulo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C8A84B]" />
              <CardTitle className="text-base">Cómo debe operar esta oficina</CardTitle>
            </div>
            <CardDescription>
              Secuencia recomendada para que iKingdom controle venta, diagnóstico y entrega.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "1. Lead entra por formulario, WhatsApp o referencia.",
              "2. Se comparte el brief general y se monitorea su recepción.",
              "3. Se elabora diagnóstico arquitectónico digital con ticket sugerido.",
              "4. Se envía propuesta premium y se ejecuta seguimiento.",
              "5. Proyecto aprobado pasa a onboarding, producción y publicación.",
            ].map((step) => (
              <div key={step} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formatos que conviene estandarizar</CardTitle>
            <CardDescription>
              Estos son los formatos clave para que la oficina digital escale sin fricción.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Lead record con siguiente acción y valor estimado.",
              "Brief record con oferta, tráfico, estilo y assets pendientes.",
              "Diagnóstico con problema principal, oportunidad y recomendación.",
              "Propuesta con alcance, inversión, objeciones y probabilidad de cierre.",
              "Project record con fase, responsable, bloqueos y entregables.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
