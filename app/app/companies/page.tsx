import Link from "next/link";
import {
  BookOpen,
  Crown,
  Sword,
  Star,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BusinessUnit {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: React.ElementType;
  type: string;
  modules: string[];
  status: "active" | "coming_soon";
}

const BUSINESS_UNITS: BusinessUnit[] = [
  {
    slug: "reino-editorial",
    name: "Reino Editorial",
    description:
      "Editorial AI Engine — book production, AI automation, marketplace, distribution and executive intelligence.",
    color: "#7C3AED",
    icon: BookOpen,
    type: "Editorial",
    modules: ["Projects", "Pipeline", "AI Review", "Authors", "Staff", "Marketplace", "Distribution", "Operations", "Reports"],
    status: "active",
  },
  {
    slug: "ikingdom",
    name: "iKingdom",
    description:
      "Digital coaching and personal development platform — lead intake, diagnosis, programs, and community.",
    color: "#059669",
    icon: Crown,
    type: "Coaching",
    modules: ["Overview", "Leads", "Programs", "Community", "Analytics"],
    status: "coming_soon",
  },
  {
    slug: "imperium",
    name: "Imperium",
    description:
      "Business consulting and strategy operations — advisory, transformation programs, and enterprise engagements.",
    color: "#DC2626",
    icon: Sword,
    type: "Consulting",
    modules: ["Overview", "Clients", "Projects", "Proposals", "Reports"],
    status: "coming_soon",
  },
  {
    slug: "max-hebeling",
    name: "Max Hebeling",
    description:
      "Personal brand, content, speaking, and thought leadership platform.",
    color: "#D97706",
    icon: Star,
    type: "Personal Brand",
    modules: ["Overview", "Content", "Speaking", "Media", "Partnerships"],
    status: "coming_soon",
  },
];

export default function CompaniesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona una empresa para acceder a su módulo operativo interno.
          </p>
        </div>
      </div>

      {/* Company cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUSINESS_UNITS.map((unit) => {
          const Icon = unit.icon;
          const isActive = unit.status === "active";

          return (
            <Link
              key={unit.slug}
              href={isActive ? `/app/companies/${unit.slug}/overview` : "#"}
              className={isActive ? "group" : "pointer-events-none opacity-60"}
              aria-disabled={!isActive}
            >
              <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: unit.color + "20", color: unit.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{unit.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[10px] px-2 h-4"
                          style={{ borderColor: unit.color + "40", color: unit.color }}
                        >
                          {unit.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          Próximamente
                        </Badge>
                      )}
                      {isActive && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm leading-relaxed">
                    {unit.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1">
                    {unit.modules.map((mod) => (
                      <span
                        key={mod}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
