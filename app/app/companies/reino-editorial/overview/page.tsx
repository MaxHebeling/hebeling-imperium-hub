import Link from "next/link";
import { BookOpen, ArrowRight, ExternalLink, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PIPELINE_STAGES = [
  "Ingesta",
  "Estructura",
  "Estilo",
  "Ortotipografía",
  "Maquetación",
  "Revisión Final",
];

export default function ReinoEditorialOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-purple-500" />
          Reino Editorial
        </h1>
        <p className="text-muted-foreground mt-1">
          Pipeline editorial con IA: desde la ingesta del manuscrito hasta la revisión final.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="text-base">Acceso rápido</CardTitle>
            <CardDescription>
              Superficies operativas dentro de Reino Editorial en Hebeling OS.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link
                href="/app/companies/reino-editorial/projects"
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Projects
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link
                href="/app/companies/reino-editorial/ai"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                AI Review
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link
                href="/app/companies/reino-editorial/operations"
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Operations
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Etapas del flujo de producción editorial.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {PIPELINE_STAGES.map((stage, i) => (
                <li key={stage} className="flex items-center gap-2 text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                    {i + 1}
                  </span>
                  {stage}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Los módulos clave de esta unidad (Projects, AI Review, Operations)
              ya operan dentro de Hebeling OS bajo la arquitectura company-first.
            </p>
            <p>
              Las rutas legacy de staff (`/staff/books`, `/staff/ai`,
              `/staff/operations`) siguen activas durante la transición y se
              podrán redirigir aquí cuando se valide la migración completa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
