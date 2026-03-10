import { Star, Mic, Video, BookOpen, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED_MODULES = [
  { title: "Contenido",       desc: "Gestión de contenido, blog, newsletters y redes sociales.", icon: BookOpen },
  { title: "Speaking",        desc: "Agenda de conferencias, keynotes y compromisos públicos.",   icon: Mic },
  { title: "Media",           desc: "Podcast, video, entrevistas y presencia en medios.",         icon: Video },
  { title: "Partnerships",    desc: "Colaboraciones, partnerships y relaciones estratégicas.",    icon: Globe },
];

export default function MaxHebelingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/10">
          <Star className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Max Hebeling</h1>
          <p className="text-sm text-muted-foreground">
            Personal brand, content, speaking and thought leadership platform.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Próximamente</Badge>
      </div>

      <div className="rounded-lg border border-amber-200/40 bg-amber-50/30 dark:bg-amber-950/10 p-6 space-y-3">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Módulo en desarrollo
        </p>
        <p className="text-xs text-muted-foreground max-w-lg">
          La plataforma de marca personal gestionará contenido, conferencias, media y presencia pública. Será integrada en una fase futura de Hebeling OS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLANNED_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="opacity-60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">{mod.title}</CardTitle>
                  <Badge variant="outline" className="ml-auto text-[10px]">Planificado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{mod.desc}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
