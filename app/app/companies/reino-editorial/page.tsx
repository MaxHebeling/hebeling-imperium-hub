import Link from "next/link";
import { FolderKanban, Sparkles, Settings2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACCESS = [
  {
    label: "Projects",
    description: "View and manage all Reino Editorial book projects",
    href: "/app/companies/reino-editorial/projects",
    icon: FolderKanban,
  },
  {
    label: "AI Review",
    description: "AI-assisted editorial review and stage validation",
    href: "/app/companies/reino-editorial/ai",
    icon: Sparkles,
  },
  {
    label: "Operations",
    description: "Team assignments, deadlines, and editorial operations",
    href: "/app/companies/reino-editorial/operations",
    icon: Settings2,
  },
];

export default function ReinoEditorialOverviewPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reino Editorial</h1>
        <p className="text-sm text-muted-foreground">
          Company overview — editorial pipeline, AI review, and operations
        </p>
      </div>

      {/* Quick Access */}
      <section>
        <h2 className="text-base font-medium mb-3">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACCESS.map(({ label, description, href, icon: Icon }) => (
            <Link key={label} href={href} className="block group">
              <Card className="h-full hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{label}</CardTitle>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
