import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ShoppingCart, BookOpen, Store, Printer, Library, TrendingUp } from "lucide-react";
import { DISTRIBUTION_CHANNEL_LABELS } from "@/lib/editorial/distribution/types";

const AVAILABLE_CHANNELS = [
  { 
    id: "amazon_kdp", 
    name: "Amazon KDP", 
    icon: ShoppingCart, 
    description: "Kindle Direct Publishing - La mayor plataforma de ebooks",
    formats: ["EPUB", "MOBI", "PDF"],
    commission: "30%",
    status: "available"
  },
  { 
    id: "apple_books", 
    name: "Apple Books", 
    icon: BookOpen, 
    description: "Distribuye en dispositivos Apple",
    formats: ["EPUB"],
    commission: "30%",
    status: "available"
  },
  { 
    id: "google_play", 
    name: "Google Play Libros", 
    icon: Store, 
    description: "Llega a usuarios de Android en todo el mundo",
    formats: ["EPUB", "PDF"],
    commission: "30%",
    status: "available"
  },
  { 
    id: "kobo", 
    name: "Kobo", 
    icon: BookOpen, 
    description: "Popular en Canada y Europa",
    formats: ["EPUB"],
    commission: "30%",
    status: "available"
  },
  { 
    id: "print_on_demand", 
    name: "Impresion bajo demanda", 
    icon: Printer, 
    description: "Imprime y envia libros fisicos sin inventario",
    formats: ["PDF"],
    commission: "40%",
    status: "coming_soon"
  },
  { 
    id: "library", 
    name: "Bibliotecas", 
    icon: Library, 
    description: "OverDrive, Libby y otras plataformas de bibliotecas",
    formats: ["EPUB"],
    commission: "Variable",
    status: "coming_soon"
  },
];

export default function ReinoEditorialDistributionPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Distribution
        </h1>
        <p className="text-sm text-muted-foreground">
          Canales de distribucion disponibles para tus proyectos editoriales.
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Canales Disponibles
            </CardDescription>
            <CardTitle className="text-3xl">
              {AVAILABLE_CHANNELS.filter(c => c.status === "available").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Proximamente
            </CardDescription>
            <CardTitle className="text-3xl">
              {AVAILABLE_CHANNELS.filter(c => c.status === "coming_soon").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Alcance Global
            </CardDescription>
            <CardTitle className="text-3xl">190+</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">paises</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canales de Distribucion</CardTitle>
          <CardDescription>
            Configura la distribucion desde la pagina de cada proyecto en la pestana "Distribucion".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  className="flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    {channel.status === "coming_soon" ? (
                      <Badge variant="outline">Proximamente</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Disponible
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{channel.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {channel.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span>{channel.formats.join(", ")}</span>
                    <span>·</span>
                    <span>Comision: {channel.commission}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
