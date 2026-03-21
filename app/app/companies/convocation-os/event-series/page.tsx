import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Flame,
  Globe,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EVENT_SERIES = [
  {
    slug: "raf",
    name: "RAF Conference",
    subtitle: "Reforma · Avivamiento · Fuego",
    description:
      "Convocatoria espiritual contemporanea de alto impacto operada desde Convocation OS y presentada publicamente bajo su propia marca.",
    publicUrl: "https://www.rafconference.org",
    status: "Live public brand",
    cities: "Multi-city ready",
    editions: "Edition layer prepared",
  },
];

const OPERATING_PATH = [
  "Evelyn OS / HEBELING OS",
  "Convocation OS",
  "RAF Event Series",
  "Event Editions",
];

export default function ConvocationOSEventSeriesPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
            Convocation OS
          </Badge>
          <Badge variant="outline">Event Series Registry</Badge>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-400" />
            Event Series
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Catalogo interno de series operadas por Convocation OS. RAF aparece aqui como primer
            event series real, no como business unit independiente.
          </p>
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
            <span className={index === 2 ? "text-foreground" : undefined}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {EVENT_SERIES.map((series) => (
          <Card key={series.slug} className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{series.name}</CardTitle>
                  <CardDescription className="mt-2">{series.subtitle}</CardDescription>
                </div>
                <Badge variant="outline">{series.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">{series.description}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Parent unit: Convocation OS</Badge>
                <Badge variant="outline">Public face: rafconference.org</Badge>
                <Badge variant="outline">Child layer: Event Editions</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-background/45 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-amber-400" />
                    Public site
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">rafconference.org</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/45 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    Expansion
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{series.cities}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/45 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarDays className="h-4 w-4 text-amber-400" />
                    Editions
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{series.editions}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/app/companies/convocation-os/event-series/raf">
                    Abrir RAF Event Series
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={series.publicUrl} target="_blank" rel="noreferrer">
                    Abrir web publica
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Scaling logic
            </CardTitle>
            <CardDescription>
              La unidad queda preparada para operar varias marcas y varias ediciones sin cambiar la
              cara publica de cada evento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              Convocation OS administra series, speakers, agenda, links y estado operacional.
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              Cada event series puede abrir multiples event editions por ciudad, fecha y venue.
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              Cada marca publica conserva su dominio propio, mientras la logica interna permanece
              centralizada en Evelyn OS.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
