import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyPlaceholderPageProps {
  title: string;
  description: string;
  moduleName: string;
}

export function CompanyPlaceholderPage({
  title,
  description,
  moduleName,
}: CompanyPlaceholderPageProps) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximamente</CardTitle>
          <CardDescription>
            El módulo <strong>{moduleName}</strong> se integrará aquí en una fase posterior
            de la migración company-first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura de rutas y navegación ya está preparada. El contenido y la lógica
            de negocio se conectarán sin romper la arquitectura actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
