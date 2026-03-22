"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import type {
  PermitHunterCrmPriority,
  PermitHunterCrmRecord,
  PermitHunterCrmStage,
  PermitHunterCrmTask,
} from "@/lib/lead-hunter/permit-hunter-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const stages: PermitHunterCrmStage[] = [
  "new_lead",
  "needs_enrichment",
  "ready_to_contact",
  "contacted",
  "appointment_set",
  "proposal_sent",
  "won",
  "lost",
];

const priorities: PermitHunterCrmPriority[] = ["urgent", "high", "normal", "low"];

export function LeadHunterCrmWorkbench({
  permitNumber,
  crm,
  tasks,
}: {
  permitNumber: string;
  crm: PermitHunterCrmRecord;
  tasks: PermitHunterCrmTask[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<PermitHunterCrmStage>(crm.stage);
  const [priority, setPriority] = useState<PermitHunterCrmPriority>(crm.priority);
  const [assignedTo, setAssignedTo] = useState(crm.assignedTo ?? "");
  const [nextAction, setNextAction] = useState(crm.nextAction ?? "");
  const [nextActionDueAt, setNextActionDueAt] = useState(
    crm.nextActionDueAt?.slice(0, 16) ?? ""
  );
  const [workflowSummary, setWorkflowSummary] = useState(crm.workflowSummary ?? "");
  const [estimatedValue, setEstimatedValue] = useState(
    crm.estimatedValue?.toString() ?? ""
  );
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveCrm() {
    setBusy(true);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(permitNumber)}/crm`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            priority,
            assignedTo: assignedTo || null,
            nextAction: nextAction || null,
            nextActionDueAt: nextActionDueAt ? new Date(nextActionDueAt).toISOString() : null,
            workflowSummary: workflowSummary || null,
            estimatedValue: estimatedValue ? Number(estimatedValue) : null,
            lastActivityAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("No pude guardar el deal.");
      }

      toast({
        title: "Deal actualizado",
        description: "El workbench ya quedó guardado.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "No pude guardar el deal",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function createTask() {
    if (!taskTitle.trim()) return;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(permitNumber)}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription || null,
            type: "follow_up",
            status: "open",
            dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : null,
            assignedTo: taskAssignedTo || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("No pude crear la tarea.");
      }

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueAt("");
      setTaskAssignedTo("");
      toast({
        title: "Tarea creada",
        description: "La nueva tarea ya quedó dentro del workbench.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "No pude crear la tarea",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function markTaskDone(taskId: string) {
    setBusy(true);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        }
      );

      if (!response.ok) {
        throw new Error("No pude cerrar la tarea.");
      }

      toast({
        title: "Tarea completada",
        description: "La tarea quedó marcada como done.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "No pude cerrar la tarea",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
        <div className="h-px bg-[#C96F2D]" />
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Deal Workbench</CardTitle>
          <CardDescription className="text-muted-foreground">
            Etapa, prioridad, responsable y siguiente acción para este lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <select
            className="h-10 rounded-md border border-border bg-background/60 px-3 text-sm text-foreground"
            value={stage}
            onChange={(event) => setStage(event.target.value as PermitHunterCrmStage)}
          >
            {stages.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border bg-background/60 px-3 text-sm text-foreground"
            value={priority}
            onChange={(event) => setPriority(event.target.value as PermitHunterCrmPriority)}
          >
            {priorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Input
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            placeholder="Asignado a"
            className="bg-background/60"
          />
          <Input
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            placeholder="Siguiente acción"
            className="bg-background/60"
          />
          <Input
            value={estimatedValue}
            onChange={(event) => setEstimatedValue(event.target.value)}
            placeholder="Valor estimado"
            inputMode="numeric"
            className="bg-background/60"
          />
          <Input
            type="datetime-local"
            value={nextActionDueAt}
            onChange={(event) => setNextActionDueAt(event.target.value)}
            className="bg-background/60"
          />
          <Textarea
            value={workflowSummary}
            onChange={(event) => setWorkflowSummary(event.target.value)}
            placeholder="Resumen del workflow"
            className="min-h-28 bg-background/60"
          />
          <Button
            className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
            onClick={saveCrm}
            disabled={busy}
          >
            Guardar deal
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
        <div className="h-px bg-[#C96F2D]" />
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Tareas</CardTitle>
          <CardDescription className="text-muted-foreground">
            Cola operativa de este deal dentro de Lead Hunter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Título de tarea"
              className="bg-background/60"
            />
            <Textarea
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Descripción"
              className="min-h-20 bg-background/60"
            />
            <Input
              value={taskAssignedTo}
              onChange={(event) => setTaskAssignedTo(event.target.value)}
              placeholder="Asignado a"
              className="bg-background/60"
            />
            <Input
              type="datetime-local"
              value={taskDueAt}
              onChange={(event) => setTaskDueAt(event.target.value)}
              className="bg-background/60"
            />
            <Button variant="outline" className="border-[#C96F2D]/30 bg-background/60 text-[#E1A24A] hover:bg-[#C96F2D]/10 hover:text-[#E1A24A]" onClick={createTask} disabled={busy}>
              Agregar tarea
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tareas todavía.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.status.replaceAll("_", " ")} · {task.type.replaceAll("_", " ")}
                      </p>
                      {task.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {task.dueAt
                          ? `Vence ${new Date(task.dueAt).toLocaleString()}`
                          : "Sin fecha límite"}
                      </p>
                    </div>
                    {task.status !== "done" ? (
                      <Button
                        variant="outline"
                        className="border-[#C96F2D]/30 bg-card text-[#E1A24A] hover:bg-[#C96F2D]/10 hover:text-[#E1A24A]"
                        onClick={() => markTaskDone(task.id)}
                        disabled={busy}
                      >
                        Mark done
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
