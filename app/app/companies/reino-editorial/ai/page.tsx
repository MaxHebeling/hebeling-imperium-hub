import { BrainCircuit, Zap, Shield, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AI_MODULES = [
  {
    title: "AI Job Runs",
    description: "Trabajos de automatización editorial en ejecución y completados.",
    icon: Zap,
    table: "editorial_jobs",
    badge: "Fase 4",
  },
  {
    title: "Gobernanza AI",
    description: "Revisión de calidad, aprobaciones y políticas de gobernanza de AI.",
    icon: Shield,
    table: "editorial_ai_governance",
    badge: "Fase 5",
  },
  {
    title: "Review Queues",
    description: "Colas de revisión AI pendientes de aprobación por staff.",
    icon: ClipboardCheck,
    table: "editorial_review_queues",
    badge: "Fase 6",
  },
  {
    title: "AI Assistant",
    description: "Asistente editorial AI — copilot para las etapas del ciclo de vida.",
    icon: BrainCircuit,
    table: "editorial_ai_sessions",
    badge: "Fase 7",
  },
];

export default function ReinoEditorialAIPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600/10 flex items-center justify-center">
          <BrainCircuit className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Review & Gobernanza</h1>
          <p className="text-xs text-muted-foreground">
            Automatización AI, calidad, gobernanza y asistente editorial.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">AI</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AI_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-600 shrink-0" />
                  <CardTitle className="text-sm">{mod.title}</CardTitle>
                  <Badge variant="outline" className="ml-auto text-[10px]">{mod.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{mod.description}</CardDescription>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  <code className="bg-muted px-1 rounded">{mod.table}</code>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
