import { CompanyBridgeCard } from "@/components/company-bridge-card";

export default function ReinoEditorialAuthorsPage() {
  return (
    <div className="space-y-6 p-6 min-h-full" style={{ backgroundColor: "var(--re-bg)" }}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--re-text)" }}>Authors</h1>
        <p className="text-sm mt-1" style={{ color: "var(--re-text-muted)" }}>
          Portal de autores: proyectos, entregas y visibilidad.
        </p>
      </div>
      <CompanyBridgeCard
        title="Author Portal"
        description="Acceso al portal de autores (rutas /author)."
        href="/author"
        linkLabel="Abrir Author Portal"
      />
    </div>
  );
}
