import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EDITION_MODELS = [
  {
    name: "RAF / Edition 01",
    city: "Current public cycle",
    timing: "Active event window",
    venue: "Public site + live registrations",
    status: "Current expression",
  },
  {
    name: "RAF / Next City Edition",
    city: "Next host city",
    timing: "Next confirmed date",
    venue: "Venue and agenda to be attached",
    status: "Expansion pipeline",
  },
  {
    name: "RAF / Reusable Edition Template",
    city: "Multi-city rollout",
    timing: "Reusable schedule block",
    venue: "Venue-adaptable operating template",
    status: "Architecture ready",
  },
];

const OPERATING_PATH = [
  "Evelyn OS / HEBELING OS",
  "Convocation OS",
  "RAF Event Series",
  "Event Editions",
];

export default function RAFEventSeriesPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
              First Event Series
            </Badge>
            <Badge variant="outline">Public brand stays external</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Flame className="h-6 w-6 text-amber-400" />
              RAF Event Series
            </h1>
            <p className="text-muted-foreground mt-1 max-w-3xl">
              RAF es la primera serie operada desde Convocation OS. La marca publica continua en
              <span className="text-foreground"> www.rafconference.org</span>, mientras Evelyn OS
              conserva la capa interna de comando, estructura y expansion por ediciones.
            </p>
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link href="https://www.rafconference.org" target="_blank" rel="noreferrer">
            Abrir sitio publico
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
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

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Public / internal split
            </CardTitle>
            <CardDescription>
              La separacion entre marca publica y centro de comando interno ya queda visible en la
              propia UX.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/45 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-amber-400" />
                RAF Conference
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Dominio publico, experiencia de marca, comunicacion y conversion del evento.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/45 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Flame className="h-4 w-4 text-amber-400" />
                Convocation OS
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Command center interno para series, ediciones, speakers, agenda, links y futuras
                experiencias.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Series profile</CardTitle>
            <CardDescription>
              RAF permanece como event series y no como business unit dentro del ecosistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Series:</span> RAF Conference
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Meaning:</span> Reforma · Avivamiento · Fuego
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Public domain:</span> rafconference.org
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Internal owner:</span> Convocation OS
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Child layer:</span> Event Editions
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event editions beneath RAF</CardTitle>
          <CardDescription>
            RAF funciona como series padre. Debajo de esta capa viven las event editions por
            ciudad, fecha y venue sin convertir el evento en una business unit separada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {EDITION_MODELS.map((edition) => (
            <div
              key={edition.name}
              className="rounded-xl border border-border/60 bg-background/45 p-4"
            >
              <h3 className="text-sm font-semibold text-foreground">{edition.name}</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>{edition.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-amber-400" />
                  <span>{edition.timing}</span>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                  {edition.venue}
                </div>
                <Badge variant="outline">{edition.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
