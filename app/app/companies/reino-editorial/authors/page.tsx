import { CompanyBridgeCard } from "@/components/company-bridge-card";

export default function ReinoEditorialAuthorsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
        <p className="text-muted-foreground mt-1">
          Portal de autores: proyectos, entregas y visibilidad. No se mueve la ruta /author.
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
