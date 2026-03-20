import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Globe,
  LayoutTemplate,
  MessagesSquare,
  Radar,
  Sparkles,
  Target,
  WalletCards,
  Workflow,
} from "lucide-react";
import { BriefLinkCard } from "@/components/ikingdom/brief-link-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomKpis } from "@/lib/ikingdom-office";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const quickAccess = [
  {
    title: "Leads",
    eyebrow: "Pipeline comercial",
    description: "Contactos nuevos, briefs pendientes y oportunidades en seguimiento.",
    href: "/app/companies/ikingdom/leads",
    icon: BriefcaseBusiness,
    stat: "12 activos",
  },
  {
    title: "Briefs",
    eyebrow: "Inteligencia de negocio",
    description: "Resumenes de marca, diagnosticos y contexto previo a la propuesta.",
    href: "/app/companies/ikingdom/briefs",
    icon: FileText,
    stat: "8 recibidos",
  },
  {
    title: "Propuestas",
    eyebrow: "Closing room",
    description: "Cotizaciones abiertas, objeciones detectadas y proximos cierres.",
    href: "/app/companies/ikingdom/proposals",
    icon: WalletCards,
    stat: "5 abiertas",
  },
  {
    title: "Proyectos",
    eyebrow: "Delivery board",
    description: "Arquitectura, desarrollo, revisiones y lanzamiento de entregables.",
    href: "/app/companies/ikingdom/projects",
    icon: LayoutTemplate,
    stat: "2 en produccion",
  },
];

const pipelineBoard = [
  {
    stage: "Nuevos",
    count: "06",
    detail: "Entradas recientes desde formulario y referral.",
    accent: "text-sky-200",
    border: "border-sky-400/20",
    bg: "from-sky-500/16 via-sky-500/6 to-transparent",
    icon: Radar,
  },
  {
    stage: "Brief",
    count: "08",
    detail: "Prospectos con informacion lista para diagnostico.",
    accent: "text-emerald-200",
    border: "border-emerald-400/20",
    bg: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    icon: FileText,
  },
  {
    stage: "Propuesta",
    count: "05",
    detail: "Seguimientos activos y ventana de cierre abierta.",
    accent: "text-amber-200",
    border: "border-amber-400/20",
    bg: "from-amber-500/16 via-amber-500/6 to-transparent",
    icon: WalletCards,
  },
  {
    stage: "Build",
    count: "02",
    detail: "Proyectos en ejecucion con visibilidad de entrega.",
    accent: "text-violet-200",
    border: "border-violet-400/20",
    bg: "from-violet-500/16 via-violet-500/6 to-transparent",
    icon: LayoutTemplate,
  },
];

const signalRows = [
  { label: "Respuesta comercial", value: "24h", progress: "78%" },
  { label: "Briefs convertidos a propuesta", value: "62%", progress: "62%" },
  { label: "Capacidad de estudio esta semana", value: "3 slots", progress: "48%" },
];

const activityFeed = [
  {
    title: "Brief recibido de firma legal premium",
    note: "Listo para diagnostico arquitectonico y propuesta inicial.",
    status: "Nuevo brief",
  },
  {
    title: "Seguimiento prioritario de propuesta high-ticket",
    note: "Cliente en decision, requiere llamada y recap de alcance.",
    status: "Seguimiento",
  },
  {
    title: "Landing boutique en etapa de arquitectura",
    note: "Pendiente validacion de mensajes clave y entregables visuales.",
    status: "Delivery",
  },
];

const operatingDoctrine = [
  "Lead entra por formulario, WhatsApp o referral y se registra con siguiente accion visible.",
  "Se comparte el brief general para capturar contexto, oferta, autoridad y assets.",
  "iKingdom produce diagnostico arquitectonico con enfoque de conversion, narrativa y ticket.",
  "Se envia propuesta premium, se ejecuta seguimiento y el cierre pasa a onboarding operativo.",
];

const deliveryStack = [
  "Brief general listo para copiar y enviar",
  "Diagnostico arquitectonico digital",
  "Propuesta premium con fases y alcance",
  "Tablero de proyecto con bloqueos y responsables",
  "Secuencia de lanzamiento y handoff final",
];

export default function IKingdomOverviewPage() {
  return (
    <div className="space-y-6 p-6">
      <section className="relative isolate overflow-hidden rounded-[32px] border border-[#C8A84B]/18 bg-[#08111B] text-white shadow-[0_24px_80px_rgba(2,8,20,0.48)]">
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, rgba(200,168,75,0.22), transparent 24%), radial-gradient(circle at 82% 14%, rgba(73,167,255,0.16), transparent 24%), radial-gradient(circle at 72% 74%, rgba(33,209,172,0.10), transparent 26%), linear-gradient(145deg, #09111B 0%, #0D1723 42%, #101B2A 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.2))",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E6CA7A] to-transparent opacity-70" />
        <div className="absolute inset-y-0 left-[48%] hidden w-px bg-white/8 xl:block" />

        <div className="relative grid min-h-[calc(100vh-10rem)] gap-6 p-6 xl:grid-cols-[0.95fr_1.05fr] xl:p-8">
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-[#C8A84B]/30 bg-[#C8A84B]/10 text-[#E6CA7A]">
                  CRM overview
                </Badge>
                <Badge variant="outline" className="border-sky-400/20 bg-sky-400/8 text-sky-200">
                  iKingdom command center
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[#E6CA7A] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                      Digital architecture office
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
                      iKingdom overview
                    </h1>
                  </div>
                </div>

                <p className="max-w-2xl text-base leading-7 text-slate-300 xl:text-lg">
                  Un tablero de control con lenguaje visual de CRM para ventas, briefs,
                  diagnosticos, propuestas y delivery. Todo el flujo de iKingdom visible desde una
                  sola pantalla y con presencia mucho mas ejecutiva.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#C8A84B] text-slate-950 hover:bg-[#d5b96f]">
                  <Link href="/app/companies/ikingdom/leads">
                    Abrir pipeline comercial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <Link href="/app/companies/ikingdom/briefs">
                    Revisar briefs y diagnosticos
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {ikingdomKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                    {kpi.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">{kpi.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{kpi.note}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {quickAccess.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[24px] border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C8A84B]/35 hover:bg-black/28"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl border border-[#C8A84B]/18 bg-[#C8A84B]/10 p-2.5 text-[#E6CA7A]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-white/35">
                        {item.stat}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">
                        {item.eyebrow}
                      </p>
                      <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                      <p className="text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#E6CA7A]">
                      Abrir modulo
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-rows-[1fr_auto]">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] xl:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                    Strategic workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Vista operativa tipo CRM
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                    Activo
                  </Badge>
                  <Badge variant="outline" className="border-white/10 text-white/60">
                    Actualizado hoy
                  </Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-[#07101A]/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          Pipeline snapshot
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          Estado de oportunidades
                        </h3>
                      </div>
                      <div className="rounded-2xl border border-sky-400/18 bg-sky-400/10 p-2 text-sky-200">
                        <Workflow className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {pipelineBoard.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.stage}
                            className={`rounded-[22px] border ${item.border} bg-gradient-to-br ${item.bg} p-4`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className={`rounded-2xl border border-white/10 bg-black/20 p-2 ${item.accent}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className={`text-2xl font-semibold ${item.accent}`}>
                                {item.count}
                              </span>
                            </div>
                            <p className="mt-4 text-sm font-medium text-white">{item.stage}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-[#07101A]/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-[#C8A84B]/20 bg-[#C8A84B]/10 p-2 text-[#E6CA7A]">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          Conversión y capacidad
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Señales clave del sistema
                        </h3>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {signalRows.map((row) => (
                        <div key={row.label} className="space-y-2">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-300">{row.label}</span>
                            <span className="font-medium text-white">{row.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/8">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-[#C8A84B] via-[#E6CA7A] to-sky-300"
                              style={{ width: row.progress }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-[#07101A]/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          Live activity
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          Bandeja ejecutiva
                        </h3>
                      </div>
                      <div className="rounded-2xl border border-violet-400/18 bg-violet-400/10 p-2 text-violet-200">
                        <MessagesSquare className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {activityFeed.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-[#07101A]/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-sky-400/18 bg-sky-400/10 p-2 text-sky-200">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          Executive pulse
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Ritmo semanal
                        </h3>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-7 items-end gap-2">
                      {[44, 58, 35, 72, 66, 84, 60].map((value, index) => (
                        <div key={value} className="space-y-2">
                          <div
                            className="rounded-t-xl bg-gradient-to-t from-[#C8A84B] via-[#E6CA7A] to-sky-300/90"
                            style={{ height: `${value}px` }}
                          />
                          <p className="text-center text-[10px] uppercase tracking-[0.16em] text-white/30">
                            {["L", "M", "M", "J", "V", "S", "D"][index]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[#C8A84B]/18 bg-[#C8A84B]/10 p-2 text-[#E6CA7A]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Operating doctrine
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Secuencia de la oficina
                    </h3>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {operatingDoctrine.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#C8A84B]/18 bg-[#C8A84B]/10 text-sm font-semibold text-[#E6CA7A]">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <BriefLinkCard
                title="Brief general siempre visible"
                description="Deja este acceso en primera linea para copiarlo y enviarlo apenas entre un lead calificado."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#C8A84B]/12 p-2 text-[#C8A84B]">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Ritmo operativo recomendado</CardTitle>
                <CardDescription>
                  La forma correcta de correr iKingdom como un sistema comercial y no como una
                  cadena de tareas aisladas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              "Mañana: revisar nuevos leads, briefs entrantes y prioridades comerciales.",
              "Mediodia: convertir briefs en diagnosticos y abrir propuestas con valor claro.",
              "Tarde: seguimiento a cierres, onboarding y desbloqueo de proyectos activos.",
              "Cierre: dejar siguiente accion, responsable y deadline visible en cada cuenta.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-border/60 bg-muted/20 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-500/12 p-2 text-sky-300">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Assets del command center</CardTitle>
                <CardDescription>
                  Elementos que deben quedar siempre disponibles en esta oficina digital.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliveryStack.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[18px] border border-border/60 px-4 py-3"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#C8A84B]" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
