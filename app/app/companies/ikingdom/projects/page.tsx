import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomProjectBoard, ikingdomProjectStages } from "@/lib/ikingdom-office";

export default function IKingdomProjectsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-1 text-muted-foreground">
          Control operativo de ejecución desde onboarding hasta publicación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fases estándar de iKingdom</CardTitle>
          <CardDescription>
            Flujo recomendado para proyectos de arquitectura digital premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ikingdomProjectStages.map((stage, index) => (
            <div key={stage} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Fase {index + 1}</p>
              <p className="mt-2 text-sm font-medium">{stage}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tablero actual</CardTitle>
          <CardDescription>
            Vista sugerida para que no se pierdan responsables ni bloqueos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ikingdomProjectBoard.map((project) => (
            <div
              key={project.name}
              className="grid gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-[1.2fr_0.9fr_0.9fr]"
            >
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.phase}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsable</p>
                <p className="mt-1 text-sm">{project.owner}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloqueo</p>
                <p className="mt-1 text-sm">{project.blocker}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
