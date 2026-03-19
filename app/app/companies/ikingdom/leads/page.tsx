import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ikingdomLeadRecords, ikingdomLeadStages } from "@/lib/ikingdom-office";

export default function IKingdomLeadsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-muted-foreground">
          Pipeline comercial de iKingdom desde el primer contacto hasta el cierre.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ikingdomLeadStages.map((stage) => (
          <Card key={stage.label}>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{stage.label}</CardTitle>
                <Badge className="bg-[#C8A84B] text-slate-950">{stage.count}</Badge>
              </div>
              <CardDescription className="leading-6">{stage.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros prioritarios</CardTitle>
          <CardDescription>
            Prospectos que deberían tener seguimiento visible desde la oficina digital.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ikingdomLeadRecords.map((record) => (
            <div
              key={`${record.company}-${record.status}`}
              className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]"
            >
              <div>
                <p className="font-medium text-foreground">{record.company}</p>
                <p className="text-sm text-muted-foreground">{record.contact}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Origen</p>
                <p className="mt-1 text-sm">{record.origin}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Estado</p>
                <p className="mt-1 text-sm">{record.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Valor estimado</p>
                <p className="mt-1 text-sm text-[#C8A84B]">{record.value}</p>
              </div>
              <div className="md:col-span-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Siguiente acción</p>
                <p className="mt-1 text-sm">{record.nextAction}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
