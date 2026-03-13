import Link from "next/link";
import { Building2, BookOpen, Globe, Crown, User, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BUSINESS_UNITS = [
  {
    slug: "reino-editorial",
    name: "Reino Editorial",
    description: "Producción editorial con pipeline de IA: ingesta, estructura, estilo, ortotipografía, maquetación y revisión final.",
    href: "/app/companies/reino-editorial",
    icon: BookOpen,
    accent: "text-purple-600 dark:text-purple-400",
    bgAccent: "bg-purple-500/10 border-purple-500/20",
    oficinaHref: "/app/editorial/oficina",
  },
  {
    slug: "ikingdom",
    name: "iKingdom",
    description: "Unidad de negocio iKingdom. Aplicaciones, diagnóstico e intake.",
    href: "/app/companies/ikingdom",
    icon: Globe,
    accent: "text-emerald-600 dark:text-emerald-400",
    bgAccent: "bg-emerald-500/10 border-emerald-500/20",
    oficinaHref: "/app/editorial/oficina",
  },
  {
    slug: "imperium",
    name: "Imperium",
    description: "Unidad de negocio Imperium. Operaciones y gestión.",
    href: "/app/companies/imperium",
    icon: Crown,
    accent: "text-amber-600 dark:text-amber-400",
    bgAccent: "bg-amber-500/10 border-amber-500/20",
    oficinaHref: "/app/editorial/oficina",
  },
  {
    slug: "max-hebeling",
    name: "Max Hebeling",
    description: "Unidad de negocio Max Hebeling.",
    href: "/app/companies/max-hebeling",
    icon: User,
    accent: "text-blue-600 dark:text-blue-400",
    bgAccent: "bg-blue-500/10 border-blue-500/20",
    oficinaHref: "/app/editorial/oficina",
  },
] as const;

export default function CompaniesPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          Empresas
        </h1>
        <p className="text-muted-foreground mt-1">
          Unidades de negocio de Hebeling OS. Selecciona una para acceder a su panel y módulos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BUSINESS_UNITS.map((unit) => {
          const Icon = unit.icon;
          return (
            <Link key={unit.slug} href={unit.href}>
              <Card
                className={`h-full transition-all hover:shadow-md hover:border-muted-foreground/20 ${unit.bgAccent} border`}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${unit.bgAccent}`}
                  >
                    <Icon className={`h-6 w-6 ${unit.accent}`} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {unit.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${unit.accent}`}>
                    Entrar →
                  </span>
                  <Link
                    href={unit.oficinaHref}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-[#1a3a6b]/10 text-[#1a3a6b] hover:bg-[#1a3a6b] hover:text-white border border-[#1a3a6b]/20"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Oficina
                  </Link>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
