import { BriefLinkCard } from "@/components/ikingdom/brief-link-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomBriefLibrary } from "@/lib/ikingdom-office";

export default function IKingdomBriefsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Briefs</h1>
        <p className="mt-1 text-muted-foreground">
          Biblioteca estratégica para levantar información, diagnosticar y preparar propuestas.
        </p>
      </div>

      <BriefLinkCard
        title="Link principal del brief de iKingdom"
        description="Déjalo visible en esta oficina digital para copiarlo cada vez que un prospecto solicite cotización."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {ikingdomBriefLibrary.map((item) => (
          <Card key={item.title}>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <CardDescription className="leading-6">{item.purpose}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Resultado esperado</p>
              <p className="mt-2 text-sm text-foreground">{item.output}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secuencia sugerida del diagnóstico</CardTitle>
          <CardDescription>
            El brief debería alimentar directamente la lectura arquitectónica de cada prospecto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "1. Revisar promesa principal, cliente ideal y servicio estrella.",
            "2. Detectar vacíos de autoridad, claridad y conversión.",
            "3. Definir estructura de landing, narrativa y CTA principal.",
            "4. Estimar complejidad técnica, assets faltantes y rango de inversión.",
          ].map((step) => (
            <div key={step} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {step}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
