"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FolderKanban, Calendar, Search } from "lucide-react";
import Link from "next/link";

type ProjectPhase = "discovery" | "copy" | "design" | "development" | "qa" | "deploy" | "support";
type ProjectStatus = "pending" | "in_progress" | "waiting_client" | "completed" | "cancelled";

interface Project {
  id: string;
  name: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  due_date: string | null;
  created_at: string;
  tenant: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

const PHASES: { value: ProjectPhase; label: string; color: string }[] = [
  { value: "discovery", label: "Discovery", color: "bg-slate-500" },
  { value: "copy", label: "Copy", color: "bg-amber-500" },
  { value: "design", label: "Design", color: "bg-pink-500" },
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "qa", label: "QA", color: "bg-purple-500" },
  { value: "deploy", label: "Deploy", color: "bg-emerald-500" },
  { value: "support", label: "Support", color: "bg-teal-500" },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  waiting_client: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  waiting_client: "Waiting Client",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function ReinoEditorialProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from("projects")
        .select("*, tenant:tenants(id, name), brand:brands(id, name)")
        .order("created_at", { ascending: false });

      // Filter to Reino Editorial brand projects client-side so the filter
      // is resilient to varying brand slug formats during migration.
      const reinoProjects = (data || []).filter(
        (p) =>
          p.brand?.name?.toLowerCase().includes("reino") ||
          p.brand?.name?.toLowerCase().includes("editorial")
      ) as Project[];

      setProjects(reinoProjects);
      setLoading(false);
    }

    fetchProjects();
  }, [supabase]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/app/companies/reino-editorial"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Reino Editorial
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Reino Editorial — Projects</h1>
        <p className="text-sm text-muted-foreground">
          All editorial projects for Reino Editorial
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const phase = PHASES.find((ph) => ph.value === project.phase);
            return (
              <Link
                key={project.id}
                href={`/app/companies/reino-editorial/projects/${project.id}`}
                className="block"
              >
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderKanban className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.name}</p>
                        {project.tenant && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.tenant.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {phase && (
                        <Badge className={`${phase.color} text-white text-xs`}>
                          {phase.label}
                        </Badge>
                      )}
                      <Badge className={`${STATUS_STYLES[project.status]} text-xs`}>
                        {STATUS_LABELS[project.status]}
                      </Badge>
                      {project.due_date && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
