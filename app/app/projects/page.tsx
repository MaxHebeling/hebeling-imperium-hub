"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderKanban, Calendar, Building2, Search, LayoutGrid, List } from "lucide-react";
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

interface Tenant {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
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

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_client", label: "Waiting Client" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusBadge(status: ProjectStatus) {
  const styles: Record<ProjectStatus, string> = {
    pending: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    waiting_client: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels: Record<ProjectStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    waiting_client: "Waiting",
    completed: "Done",
    cancelled: "Cancelled",
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTenant, setFilterTenant] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formTenantId, setFormTenantId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formPhase, setFormPhase] = useState<ProjectPhase>("discovery");
  const [formStatus, setFormStatus] = useState<ProjectStatus>("pending");
  const [formDueDate, setFormDueDate] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;
      setOrgId(profile.org_id);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*, tenant:tenants(id, name), brand:brands(id, name)")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });

      setProjects((projectsData as Project[]) || []);

      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("org_id", profile.org_id)
        .order("name");

      setTenants(tenantsData || []);

      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name")
        .eq("org_id", profile.org_id)
        .order("name");

      setBrands(brandsData || []);
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const handleCreateProject = async () => {
    if (!formName.trim() || !formTenantId || !orgId) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          org_id: orgId,
          tenant_id: formTenantId,
          brand_id: formBrandId || null,
          name: formName.trim(),
          phase: formPhase,
          status: formStatus,
          due_date: formDueDate || null,
        })
        .select("*, tenant:tenants(id, name), brand:brands(id, name)")
        .single();

      if (!error && data) {
        setProjects([data as Project, ...projects]);
        setIsModalOpen(false);
        resetForm();
      }
    });
  };

  const handlePhaseChange = async (projectId: string, newPhase: ProjectPhase) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, phase: newPhase } : p
    ));

    const { error } = await supabase
      .from("projects")
      .update({ phase: newPhase })
      .eq("id", projectId);

    if (error) {
      const { data } = await supabase
        .from("projects")
        .select("*, tenant:tenants(id, name), brand:brands(id, name)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) || []);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormTenantId("");
    setFormBrandId("");
    setFormPhase("discovery");
    setFormStatus("pending");
    setFormDueDate("");
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = filterTenant === "all" || project.tenant?.id === filterTenant;
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesTenant && matchesStatus;
  });

  const projectsByPhase = PHASES.reduce((acc, phase) => {
    acc[phase.value] = filteredProjects.filter(p => p.phase === phase.value);
    return acc;
  }, {} as Record<ProjectPhase, Project[]>);

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const waitingProjects = projects.filter(p => p.status === "waiting_client").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage client projects across all phases</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Website Redesign"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant">Client</Label>
                <Select value={formTenantId} onValueChange={setFormTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand (optional)</Label>
                <Select value={formBrandId} onValueChange={setFormBrandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phase">Phase</Label>
                  <Select value={formPhase} onValueChange={(v) => setFormPhase(v as ProjectPhase)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProjectStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date (optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!formName.trim() || !formTenantId || isPending}
                className="w-full"
              >
                {isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{waitingProjects}</div>
            <p className="text-xs text-muted-foreground">Waiting Client</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTenant} onValueChange={setFilterTenant}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PHASES.map((phase) => (
            <div
              key={phase.value}
              className="flex-shrink-0 w-64"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const projectId = e.dataTransfer.getData("projectId");
                if (projectId) {
                  handlePhaseChange(projectId, phase.value);
                }
              }}
            >
              <div className={`rounded-t-lg px-3 py-2 ${phase.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{phase.label}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {projectsByPhase[phase.value].length}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/50 rounded-b-lg p-2 min-h-[400px] space-y-2">
                {projectsByPhase[phase.value].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No projects
                  </div>
                ) : (
                  projectsByPhase[phase.value].map((project) => (
                    <Link href={`/app/projects/${project.id}`} key={project.id}>
                      <Card
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("projectId", project.id);
                        }}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="font-medium text-sm line-clamp-2">{project.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {project.tenant?.name || "No client"}
                          </div>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(project.status)}
                            {project.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(project.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No projects found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {projects.length === 0
                    ? "Create your first project to get started"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProjects.map((project) => (
                  <Link
                    href={`/app/projects/${project.id}`}
                    key={project.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{project.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.tenant?.name || "No client"}</span>
                        {project.brand && <span>{project.brand.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={PHASES.find(p => p.value === project.phase)?.color + " text-white"}>
                        {PHASES.find(p => p.value === project.phase)?.label}
                      </Badge>
                      {getStatusBadge(project.status)}
                      {project.due_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(project.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
