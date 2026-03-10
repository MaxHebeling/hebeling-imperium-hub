import {
  BookOpen,
  FolderKanban,
  BrainCircuit,
  Truck,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STAT_CARDS = [
  { label: "Proyectos Activos",     value: "—", icon: FolderKanban,  color: "text-violet-600",  href: "/app/companies/reino-editorial/projects" },
  { label: "AI Jobs Corriendo",     value: "—", icon: BrainCircuit,  color: "text-blue-600",    href: "/app/companies/reino-editorial/ai" },
  { label: "Envíos Distribución",   value: "—", icon: Truck,         color: "text-emerald-600", href: "/app/companies/reino-editorial/distribution" },
  { label: "Órdenes Marketplace",   value: "—", icon: ShoppingBag,   color: "text-orange-600",  href: "/app/companies/reino-editorial/marketplace" },
];

const MODULE_LINKS = [
  { label: "Proyectos",    desc: "Gestiona proyectos editoriales y sus etapas",           href: "/app/companies/reino-editorial/projects",     icon: FolderKanban, badge: null },
  { label: "Pipeline",     desc: "Ciclo de vida editorial de producción",                  href: "/app/companies/reino-editorial/pipeline",     icon: TrendingUp,   badge: null },
  { label: "AI Review",    desc: "Revisión de calidad, gobernanza y flujos AI",            href: "/app/companies/reino-editorial/ai",            icon: BrainCircuit, badge: "AI" },
  { label: "Autores",      desc: "Portal de autores y gestión de accesos",                 href: "/app/companies/reino-editorial/authors",      icon: Users,        badge: null },
  { label: "Marketplace",  desc: "Servicios profesionales, órdenes y pagos",              href: "/app/companies/reino-editorial/marketplace",  icon: ShoppingBag,  badge: null },
  { label: "Distribución", desc: "Canales, envíos y metadatos de distribución global",    href: "/app/companies/reino-editorial/distribution", icon: Truck,        badge: null },
];

export default function ReinoEditorialOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reino Editorial</h1>
          <p className="text-sm text-muted-foreground">
            Editorial AI Engine — producción, distribución, marketplace e inteligencia editorial.
          </p>
        </div>
        <Badge
          className="ml-auto text-xs"
          style={{ backgroundColor: "#7C3AED20", color: "#7C3AED", borderColor: "#7C3AED40" }}
          variant="outline"
        >
          Editorial
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Module grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_LINKS.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href} className="group">
                <Card className="h-full transition-all group-hover:shadow-sm group-hover:border-violet-300/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-violet-600 shrink-0" />
                      <CardTitle className="text-sm">{mod.label}</CardTitle>
                      {mod.badge && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {mod.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs leading-relaxed">
                      {mod.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System status */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Estado del Sistema
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Base de datos", status: "online",  icon: CheckCircle2 },
            { label: "AI Pipeline",   status: "online",  icon: CheckCircle2 },
            { label: "Distribución",  status: "standby", icon: Clock },
            { label: "Alertas",       status: "online",  icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
              >
                <Icon
                  className={`h-3 w-3 ${
                    item.status === "online"  ? "text-emerald-500" :
                    item.status === "standby" ? "text-amber-500"   : "text-red-500"
                  }`}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span
                  className={`font-medium capitalize ${
                    item.status === "online"  ? "text-emerald-600" :
                    item.status === "standby" ? "text-amber-600"   : "text-red-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
