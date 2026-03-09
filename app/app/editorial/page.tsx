import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, Layers, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditorialPage() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reino Editorial AI Engine</h1>
            <p className="text-sm text-muted-foreground">Módulo de producción editorial impulsado por inteligencia artificial</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            ¿Qué es el Reino Editorial AI Engine?
          </CardTitle>
          <CardDescription>
            Pipeline completo de producción editorial desde la ingesta del manuscrito hasta la exportación final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El Reino Editorial AI Engine automatiza cada etapa del proceso editorial: ingesta de manuscritos,
            análisis de estructura, mejora de estilo, corrección ortotipográfica, maquetación profesional y
            revisión final. Cada proyecto avanza por un pipeline supervisado con validaciones humanas en puntos clave.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline stages overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pipeline Editorial</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STAGES.map((stage, index) => (
            <Card key={stage.key} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <stage.icon className="w-4 h-4 text-purple-500" />
                  <CardTitle className="text-sm">{stage.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/app/editorial/projects" className="flex items-center gap-2">
            Ver Proyectos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

const PIPELINE_STAGES = [
  {
    key: "ingesta",
    label: "Ingesta",
    icon: FileText,
    description: "Carga del manuscrito original y validación de formato.",
  },
  {
    key: "estructura",
    label: "Estructura",
    icon: Layers,
    description: "Análisis y reorganización de la estructura narrativa.",
  },
  {
    key: "estilo",
    label: "Estilo",
    icon: Sparkles,
    description: "Mejora y homogeneización del estilo de escritura.",
  },
  {
    key: "ortotipografia",
    label: "Ortotipografía",
    icon: CheckCircle,
    description: "Corrección ortográfica, gramatical y tipográfica.",
  },
  {
    key: "maquetacion",
    label: "Maquetación",
    icon: BookOpen,
    description: "Diseño y composición del interior del libro.",
  },
  {
    key: "revision_final",
    label: "Revisión Final",
    icon: CheckCircle,
    description: "Revisión integral y aprobación para exportación.",
  },
];
