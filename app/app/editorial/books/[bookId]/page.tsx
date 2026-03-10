"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Calendar,
  User,
  Shield,
} from "lucide-react";

import { StageChecklist } from "@/components/editorial/StageChecklist";
import { WorkflowEventFeed } from "@/components/editorial/WorkflowEventFeed";
import { BlockedBookAlert } from "@/components/editorial/BlockedBookAlert";

import type {
  EditorialBook,
  EditorialBookStageChecklist,
  EditorialBookAlert,
  EditorialWorkflowEvent,
  EditorialStage,
  EditorialStageStatus,
  RuleViolation,
} from "@/types/editorial";
import {
  EDITORIAL_STAGES,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_COLORS,
  EDITORIAL_STATUS_LABELS,
} from "@/types/editorial";

const STATUS_BADGE: Record<EditorialStageStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
  reopened: "bg-amber-100 text-amber-700",
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<EditorialBook | null>(null);
  const [checklists, setChecklists] = useState<EditorialBookStageChecklist[]>([]);
  const [alerts, setAlerts] = useState<EditorialBookAlert[]>([]);
  const [events, setEvents] = useState<EditorialWorkflowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Stage advance state
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [advanceError, setAdvanceError] = useState("");

  // Reopen state
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenError, setReopenError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [bookRes, eventsRes] = await Promise.all([
      fetch(`/api/editorial/books/${bookId}`),
      fetch(`/api/editorial/books/${bookId}/events`),
    ]);

    if (bookRes.ok) {
      const data = await bookRes.json();
      setBook(data.book);
      setChecklists(data.checklists ?? []);
      setAlerts(data.alerts ?? []);
    }
    if (eventsRes.ok) {
      const data = await eventsRes.json();
      setEvents(data.events ?? []);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current stage checklist
  const currentChecklist = book
    ? checklists.find((c) => c.stage === book.current_stage) ?? null
    : null;

  async function handleToggleItem(itemId: string, checked: boolean) {
    if (!book) return;
    await fetch(`/api/editorial/books/${bookId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_item",
        stage: book.current_stage,
        item_id: itemId,
        is_checked: checked,
      }),
    });
    await fetchData();
  }

  async function handleStartStage() {
    if (!book) return;
    await fetch(`/api/editorial/books/${bookId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        stage: book.current_stage,
      }),
    });
    await fetchData();
  }

  async function handleAdvance(forceOverride = false) {
    if (!book) return;
    setAdvanceError("");

    const body: Record<string, unknown> = { action: "advance" };
    if (forceOverride && overrideReason.trim()) {
      body.is_override = true;
      body.override_reason = overrideReason;
    }

    startTransition(async () => {
      const res = await fetch(`/api/editorial/books/${bookId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAdvanceDialog(false);
        setViolations([]);
        setOverrideReason("");
        await fetchData();
      } else if (res.status === 422) {
        setViolations(data.violations ?? []);
      } else {
        setAdvanceError(data.error ?? "Error al avanzar la etapa");
      }
    });
  }

  async function handleReopen() {
    if (!book || !reopenReason.trim()) {
      setReopenError("La razón es requerida para reabrir una etapa");
      return;
    }
    setReopenError("");

    startTransition(async () => {
      const res = await fetch(`/api/editorial/books/${bookId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen", reason: reopenReason }),
      });

      if (res.ok) {
        setShowReopenDialog(false);
        setReopenReason("");
        await fetchData();
      } else {
        const data = await res.json();
        setReopenError(data.error ?? "Error al reabrir la etapa");
      }
    });
  }

  async function handleResolveAlert(alertId: string) {
    await fetch(`/api/editorial/books/${bookId}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId }),
    });
    await fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-muted-foreground">Libro no encontrado</p>
        <Link href="/app/editorial/books">
          <Button variant="link">Volver a libros</Button>
        </Link>
      </div>
    );
  }

  const currentStageIndex = EDITORIAL_STAGES.indexOf(book.current_stage);
  const isLastStage = currentStageIndex === EDITORIAL_STAGES.length - 1;
  const isCompleted = book.overall_status === "completed";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/app/editorial/books"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Libros editoriales
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
            {book.author && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {book.author}
              </div>
            )}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
            {book.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Entrega: {new Date(book.due_date).toLocaleDateString("es")}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn("text-sm", STATUS_BADGE[book.overall_status])}
          >
            {EDITORIAL_STATUS_LABELS[book.overall_status]}
          </Badge>
        </div>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <BlockedBookAlert
          alerts={alerts}
          onResolve={handleResolveAlert}
          canResolve={true}
        />
      )}

      {/* Pipeline timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Pipeline editorial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {EDITORIAL_STAGES.map((stage, index) => {
              const isCompleted_ = index < currentStageIndex || isCompleted;
              const isCurrent = index === currentStageIndex && !isCompleted;
              const isFuture = index > currentStageIndex;
              const stageChecklist = checklists.find((c) => c.stage === stage);

              return (
                <div key={stage} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                        isCompleted_
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isCurrent
                          ? cn(EDITORIAL_STAGE_COLORS[stage], "border-current text-white")
                          : "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted_ ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1 text-center font-medium",
                        isCurrent
                          ? "text-foreground"
                          : isCompleted_
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {EDITORIAL_STAGE_LABELS[stage]}
                    </span>
                    {stageChecklist && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {EDITORIAL_STATUS_LABELS[stageChecklist.status]}
                      </span>
                    )}
                  </div>
                  {index < EDITORIAL_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 flex-shrink-0",
                        index < currentStageIndex ? "bg-emerald-500" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage action buttons */}
          {!isCompleted && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              {/* Advance stage */}
              <Dialog open={showAdvanceDialog} onOpenChange={(v) => {
                setShowAdvanceDialog(v);
                if (!v) { setViolations([]); setOverrideReason(""); setAdvanceError(""); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    {isLastStage ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Completar libro
                      </>
                    ) : (
                      <>
                        Avanzar a {EDITORIAL_STAGE_LABELS[EDITORIAL_STAGES[currentStageIndex + 1]]}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {violations.length > 0 ? "Reglas no cumplidas" : "Confirmar avance"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {violations.length === 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          ¿Confirmas que deseas avanzar la etapa actual a{" "}
                          <strong>
                            {EDITORIAL_STAGE_LABELS[
                              EDITORIAL_STAGES[currentStageIndex + 1] ?? book.current_stage
                            ]}
                          </strong>
                          ?
                        </p>
                        {advanceError && (
                          <p className="text-sm text-destructive">{advanceError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAdvance(false)}
                            disabled={isPending}
                            className="flex-1"
                          >
                            {isPending ? "Avanzando..." : "Confirmar"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAdvanceDialog(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {violations.map((v) => (
                            <div
                              key={v.rule_key}
                              className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-sm"
                            >
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-900">{v.rule_label}</p>
                                <p className="text-red-700 text-xs mt-0.5">{v.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-purple-500" />
                            Override (solo si tienes permisos)
                          </Label>
                          <Textarea
                            placeholder="Razón del override — requerida para auditoría"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            rows={2}
                          />
                        </div>
                        {advanceError && (
                          <p className="text-sm text-destructive">{advanceError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAdvance(true)}
                            disabled={!overrideReason.trim() || isPending}
                            variant="destructive"
                            size="sm"
                          >
                            Aplicar override
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanceDialog(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Reopen stage */}
              <Dialog open={showReopenDialog} onOpenChange={(v) => {
                setShowReopenDialog(v);
                if (!v) { setReopenReason(""); setReopenError(""); }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reabrir etapa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reabrir etapa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Reabrir la etapa{" "}
                      <strong>{EDITORIAL_STAGE_LABELS[book.current_stage]}</strong>{" "}
                      registrará un evento en el historial. Es obligatorio indicar la razón.
                    </p>
                    <div className="space-y-1.5">
                      <Label>Razón *</Label>
                      <Textarea
                        placeholder="Describe por qué se está reabriendo esta etapa..."
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    {reopenError && (
                      <p className="text-sm text-destructive">{reopenError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReopen}
                        disabled={!reopenReason.trim() || isPending}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        {isPending ? "Reabriendo..." : "Reabrir"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReopenDialog(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Checklist + Stages — 2/3 */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Etapa actual</TabsTrigger>
              <TabsTrigger value="all">Todas las etapas</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {EDITORIAL_STAGE_LABELS[book.current_stage]}
                    </CardTitle>
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        EDITORIAL_STAGE_COLORS[book.current_stage]
                      )}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <StageChecklist
                    checklist={currentChecklist}
                    stage={book.current_stage}
                    onToggleItem={handleToggleItem}
                    onStart={handleStartStage}
                    canManage={!isCompleted}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              {EDITORIAL_STAGES.map((stage) => {
                const checklist = checklists.find((c) => c.stage === stage);
                const stageIndex = EDITORIAL_STAGES.indexOf(stage);
                const isPastStage = stageIndex < currentStageIndex;
                const isCurrentStage = stage === book.current_stage;

                return (
                  <Card
                    key={stage}
                    className={cn(
                      isCurrentStage && "ring-1 ring-primary",
                      isPastStage && "opacity-75"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              EDITORIAL_STAGE_COLORS[stage]
                            )}
                          />
                          {EDITORIAL_STAGE_LABELS[stage]}
                          {isCurrentStage && (
                            <Badge
                              variant="outline"
                              className="text-xs text-primary border-primary/30 bg-primary/5"
                            >
                              Actual
                            </Badge>
                          )}
                        </CardTitle>
                        {checklist && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              STATUS_BADGE[checklist.status]
                            )}
                          >
                            {EDITORIAL_STATUS_LABELS[checklist.status]}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {checklist ? (
                        <StageChecklist
                          checklist={checklist}
                          stage={stage}
                          onToggleItem={handleToggleItem}
                          canManage={isCurrentStage && !isCompleted}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {stageIndex > currentStageIndex
                            ? "Esta etapa aún no ha comenzado."
                            : "Sin checklist."}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

        {/* Event feed — 1/3 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Historial de eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowEventFeed events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
