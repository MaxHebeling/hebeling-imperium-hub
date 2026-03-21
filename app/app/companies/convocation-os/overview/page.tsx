import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIERARCHY = [
  {
    title: "Evelyn OS / HEBELING OS",
    description: "Ecosistema matriz que organiza las unidades internas del grupo.",
    icon: Building2,
  },
  {
    title: "Convocation OS",
    description: "Business unit operativa para convocatorias, eventos y experiences.",
    icon: Flame,
  },
  {
    title: "RAF Event Series",
    description: "Primer event series real operado desde esta unidad, no la unidad en si misma.",
    icon: Sparkles,
  },
  {
    title: "Event Editions",
    description: "Ejecuciones por ciudad, fecha y venue preparadas para crecer sin rehacer la base.",
    icon: CalendarDays,
  },
];

const OPERATING_PATH = [
  "Evelyn OS / HEBELING OS",
  "Convocation OS",
  "RAF Event Series",
  "Event Editions",
];

const CONTROL_SURFACES = [
  "Hero y narrativa publica del evento",
  "Speakers, agenda y estructura de experiencias",
  "Links de registro, cupos y activacion comercial",
  "Branding, estados operativos y escalado multi-ciudad",
];

export default function ConvocationOSOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
              Business Unit
            </Badge>
            <Badge variant="outline">Internal Command Center</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Flame className="h-6 w-6 text-amber-400" />
              Convocation OS
            </h1>
            <p className="text-muted-foreground mt-1 max-w-3xl">
              Unidad operativa interna dentro de Evelyn OS / HEBELING OS para administrar
              convocatorias, event series, speakers, agenda, branding y futuras ediciones sin
              convertir RAF en la business unit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/app/companies/convocation-os/event-series">
              Abrir event series
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="https://www.rafconference.org" target="_blank" rel="noreferrer">
              RAF public site
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs font-medium text-muted-foreground">
        {OPERATING_PATH.map((item, index) => (
          <div key={item} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="text-amber-400/80" aria-hidden="true">
                /
              </span>
            ) : null}
            <span
              className={index === 1 ? "text-foreground" : undefined}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Operating relationship</CardTitle>
          <CardDescription>
            La jerarquia operativa queda fijada para que la UX no confunda la unidad interna con la
            marca publica.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {HIERARCHY.map((item, index) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/60 bg-background/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <item.icon className="h-5 w-5 text-amber-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convocation OS control surface</CardTitle>
            <CardDescription>
              Esta unidad concentra la operacion interna. RAF Conference sigue viviendo afuera como
              experiencia publica en su propio dominio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {CONTROL_SURFACES.map((surface) => (
              <div
                key={surface}
                className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground"
              >
                {surface}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              First live event series
            </CardTitle>
            <CardDescription>
              RAF es el primer series operativo conectado a esta unidad interna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-background/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">RAF Conference</p>
                  <p className="text-sm text-muted-foreground">
                    Reforma · Avivamiento · Fuego
                  </p>
                </div>
                <Badge variant="outline">Series 01</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                La marca publica del evento vive en <span className="text-foreground">rafconference.org</span>.
                El control operativo, la estructura de series y la futura expansion por ediciones
                permanecen dentro de Convocation OS.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Globe className="h-4 w-4 text-amber-400" />
                  Public face
                </div>
                <p className="mt-2 text-sm text-muted-foreground">www.rafconference.org</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-amber-400" />
                  Edition model
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Listo para ciudades y fechas</p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/app/companies/convocation-os/event-series/raf">
                Entrar a RAF Event Series
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
