import { Truck, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DISTRIBUTION_SECTIONS = [
  { title: "Canales",          desc: "Amazon KDP, Apple Books, Google Play, Kobo, B&N Press, IngramSpark.", table: "editorial_distribution_channels" },
  { title: "Metadatos",        desc: "Metadatos de distribución canónicos por proyecto (ISBN, BISAC, etc.).", table: "editorial_book_metadata" },
  { title: "Formatos",         desc: "Formatos habilitados por proyecto: paperback, hardcover, ebook, audio.", table: "editorial_distribution_formats" },
  { title: "Envíos",           desc: "Envíos de proyectos/formatos a canales — estado y tracking.",           table: "editorial_distribution_submissions" },
  { title: "Identificadores",  desc: "ASIN, Apple ID, Google ID, Kobo ID, etc. asignados por canal.",        table: "editorial_distribution_identifiers" },
  { title: "Jobs de Sync",     desc: "Trabajos de automatización y sincronización de distribución.",          table: "editorial_distribution_jobs" },
];

const CHANNEL_BADGES = [
  { name: "Amazon KDP",    color: "#FF9900" },
  { name: "Apple Books",   color: "#007AFF" },
  { name: "Google Play",   color: "#34A853" },
  { name: "Kobo",          color: "#BF2A2A" },
  { name: "B&N Press",     color: "#1B4B7A" },
  { name: "IngramSpark",   color: "#5B2D8E" },
];

export default function ReinoEditorialDistributionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600/10 flex items-center justify-center">
          <Truck className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Distribución Global</h1>
          <p className="text-xs text-muted-foreground">
            Canales de distribución, envíos, metadatos e identificadores globales.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">Fase 9</Badge>
      </div>

      {/* Channel badges */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> Canales de distribución
        </p>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_BADGES.map((ch) => (
            <span
              key={ch.name}
              className="text-xs px-2.5 py-1 rounded-full border font-medium"
              style={{ borderColor: ch.color + "40", color: ch.color, backgroundColor: ch.color + "10" }}
            >
              {ch.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DISTRIBUTION_SECTIONS.map((sec) => (
          <Card key={sec.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{sec.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">{sec.desc}</CardDescription>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                <code className="bg-muted px-1 rounded">{sec.table}</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
