import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomProposalTemplates } from "@/lib/ikingdom-office";

export default function IKingdomProposalsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Propuestas</h1>
        <p className="mt-1 text-muted-foreground">
          Estructura comercial para cotización, alcance, seguimiento y cierre.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        {ikingdomProposalTemplates.map((template) => (
          <Card key={template.name}>
            <CardHeader>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="leading-6">{template.useCase}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Incluye</p>
              <p className="mt-2 text-sm">{template.includes}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos que conviene registrar por propuesta</CardTitle>
          <CardDescription>
            Si esto se captura bien, iKingdom gana memoria comercial y capacidad de seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "Empresa / contacto principal",
            "Versión de propuesta",
            "Monto y forma de pago",
            "Alcance y entregables",
            "Objeciones detectadas",
            "Probabilidad de cierre",
            "Fecha de seguimiento",
            "Razón de pérdida o cierre",
          ].map((field) => (
            <div key={field} className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
              {field}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
