import { BriefLinkCard } from "@/components/ikingdom/brief-link-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ikingdomBriefLibrary } from "@/lib/ikingdom-office";

export const dynamic = "force-dynamic";

interface LeadBriefRow {
  id: string;
  company_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  key_service: string | null;
  landing_objective: string | null;
  created_at: string;
  lead: {
    lead_code: string | null;
    full_name: string | null;
    status: string | null;
  } | null;
}

type LeadSummary = NonNullable<LeadBriefRow["lead"]>;
type LeadRelation = LeadSummary | LeadSummary[] | null;
type LeadBriefRowRaw = Omit<LeadBriefRow, "lead"> & {
  lead: LeadRelation;
};

function normalizeLeadRelation(value: LeadRelation) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function isMissingBriefsSchema(error: { code?: string | null; message?: string | null }) {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function getRecentBriefs(): Promise<LeadBriefRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lead_briefs")
      .select(
        "id, company_name, contact_email, contact_phone, status, key_service, landing_objective, created_at, lead:leads(lead_code, full_name, status)"
      )
      .eq("brand", "ikingdom")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      if (isMissingBriefsSchema(error)) {
        return [];
      }

      console.error("[ikingdom/briefs] failed to load lead briefs:", error.message);
      return [];
    }

    return ((data ?? []) as LeadBriefRowRaw[]).map((brief) => ({
      ...brief,
      lead: normalizeLeadRelation(brief.lead),
    }));
  } catch (error) {
    console.error("[ikingdom/briefs] unexpected load error:", error);
    return [];
  }
}

export default async function IKingdomBriefsPage() {
  const recentBriefs = await getRecentBriefs();

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Briefs</h1>
        <p className="mt-1 text-muted-foreground">
          Biblioteca estratégica y registro real de briefs recibidos para iKingdom.
        </p>
      </div>

      <BriefLinkCard
        title="Link principal del brief de iKingdom"
        description="Déjalo visible en esta oficina digital para copiarlo cada vez que un prospecto solicite cotización."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Briefs recibidos</CardTitle>
              <CardDescription>
                Cada envío del brief general debe entrar aquí como brief enlazado a un lead, no como lead duplicado.
              </CardDescription>
            </div>
            <Badge variant="outline">{recentBriefs.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentBriefs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
              Aún no hay briefs sincronizados desde el formulario general. Cuando empiecen a llegar,
              aparecerán aquí como registros independientes del lead.
            </div>
          ) : (
            recentBriefs.map((brief) => (
              <div
                key={brief.id}
                className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr]"
              >
                <div>
                  <p className="font-medium text-foreground">{brief.company_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {brief.contact_email || brief.contact_phone || "Sin contacto visible"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lead asociado</p>
                  <p className="mt-1 text-sm">
                    {brief.lead?.lead_code || brief.lead?.full_name || "Pendiente"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Objetivo / servicio</p>
                  <p className="mt-1 text-sm">
                    {brief.key_service || brief.landing_objective || "Sin definir"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recibido</p>
                  <p className="mt-1 text-sm">{formatDate(brief.created_at)}</p>
                  <Badge className="mt-2 bg-[#C8A84B] text-slate-950">{brief.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
