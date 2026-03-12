"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import {
  ArrowLeft,
  Building2,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
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

interface Task {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
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
    waiting_client: "Waiting Client",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}

export interface ProjectDetailViewProps {
  /** Override the back navigation href. Defaults to /app/projects (legacy behavior). */
  backHref?: string;
  /** Override the back navigation label. Defaults to "Back to Projects". */
  backLabel?: string;
}

export function ProjectDetailView({
  backHref = "/app/projects",
  backLabel = "Back to Projects",
}: ProjectDetailViewProps) {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhase, setEditPhase] = useState<ProjectPhase>("discovery");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("pending");
  const [editDueDate, setEditDueDate] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: projectData } = await supabase
        .from("projects")
        .select("*, tenant:tenants(id, name), brand:brands(id, name)")
        .eq("id", projectId)
        .single();

      if (projectData) {
        setProject(projectData as Project);
        setEditName(projectData.name);
        setEditPhase(projectData.phase);
        setEditStatus(projectData.status);
        setEditDueDate(projectData.due_date || "");
      }

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      setTasks(tasksData || []);
      setLoading(false);
    }

    fetchData();
  }, [projectId, supabase]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: newTaskTitle.trim(),
          due_date: newTaskDueDate || null,
        })
        .select()
        .single();

      if (!error && data) {
        setTasks([...tasks, data]);
        setNewTaskTitle("");
        setNewTaskDueDate("");
      }
    });
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, done } : t));

    await supabase
      .from("tasks")
      .update({ done })
      .eq("id", taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));

    await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);
  };

  const handleUpdateProject = async () => {
    if (!editName.trim()) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("projects")
        .update({
          name: editName.trim(),
          phase: editPhase,
          status: editStatus,
          due_date: editDueDate || null,
        })
        .eq("id", projectId);

      if (!error) {
        setProject(prev => prev ? {
          ...prev,
          name: editName.trim(),
          phase: editPhase,
          status: editStatus,
          due_date: editDueDate || null,
        } : null);
        setIsEditModalOpen(false);
      }
    });
  };

  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Link href={backHref}>
          <Button variant="link">{backLabel}</Button>
        </Link>
      </div>
    );
  }

  const currentPhase = PHASES.find(p => p.value === project.phase);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href={backHref}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {project.tenant?.name || "No client"}
            </div>
            {project.brand && (
              <span>{project.brand.name}</span>
            )}
            {project.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due {new Date(project.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phase">Phase</Label>
                  <Select value={editPhase} onValueChange={(v) => setEditPhase(v as ProjectPhase)}>
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
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ProjectStatus)}>
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
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpdateProject}
                disabled={!editName.trim() || isPending}
                className="w-full"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status and Phase */}
      <div className="flex items-center gap-4">
        <Badge className={`${currentPhase?.color ?? "bg-muted"} text-white`}>
          {currentPhase?.label}
        </Badge>
        {getStatusBadge(project.status)}
      </div>

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {PHASES.map((phase, index) => {
              const currentIndex = PHASES.findIndex(p => p.value === project.phase);
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={phase.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? `${phase.color} text-white`
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                      {phase.label}
                    </span>
                  </div>
                  {index < PHASES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-4 ${
                        isCompleted ? "bg-emerald-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Tasks</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedTasks} of {totalTasks} completed
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{progressPercent}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-2" />

          {/* Add Task Form */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
              }}
            />
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim() || isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks yet. Add your first task above.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    task.done ? "bg-muted/50" : "bg-background"
                  }`}
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                  />
                  <span className={`flex-1 ${task.done ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
