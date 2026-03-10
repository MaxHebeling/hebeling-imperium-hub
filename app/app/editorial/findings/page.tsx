"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Filter,
  Loader2,
  MoreHorizontal,
  Search,
  XCircle,
} from "lucide-react";
import type {
  AiFinding,
  AiFindingSeverity,
  AiFindingStatus,
  AiReviewActionType,
  EditorialStageKey,
} from "@/types/editorial";
import { EDITORIAL_STAGES } from "@/types/editorial";

// ─── Local helpers ────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<EditorialStageKey, string> = {
  ingesta: "Ingesta",
  estructura: "Estructura",
  estilo: "Estilo",
  ortotipografia: "Ortotipografía",
  maquetacion: "Maquetación",
  revision_final: "Revisión Final",
};

const SEVERITY_CONFIG: Record<
  AiFindingSeverity,
  { label: string; className: string }
> = {
  critical: {
    label: "Crítico",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  major: {
    label: "Mayor",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  minor: {
    label: "Menor",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  suggestion: {
    label: "Sugerencia",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
};

const STATUS_CONFIG: Record<
  AiFindingStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Abierto",
    className: "bg-muted text-muted-foreground",
  },
  accepted: {
    label: "Aceptado",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  resolved: {
    label: "Resuelto",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
};

const REVIEW_ACTIONS: {
  type: AiReviewActionType;
  label: string;
  nextStatus: AiFindingStatus;
}[] = [
  { type: "approve", label: "Aprobar", nextStatus: "accepted" },
  { type: "reject", label: "Rechazar", nextStatus: "rejected" },
  { type: "request_revision", label: "Solicitar revisión", nextStatus: "open" },
  { type: "escalate", label: "Escalar", nextStatus: "open" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface ActionDialogState {
  finding: AiFinding;
  actionType: AiReviewActionType;
  label: string;
  nextStatus: AiFindingStatus;
}

export default function EditorialFindingsPage() {
  const supabase = createClient();

  const [findings, setFindings] = useState<AiFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Action dialog
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [actionNote, setActionNote] = useState("");

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("editorial_ai_findings")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStage !== "all") {
        query = query.eq("stage_key", filterStage);
      }
      if (filterSeverity !== "all") {
        query = query.eq("severity", filterSeverity);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      const severityOrder: Record<string, number> = {
        critical: 0,
        major: 1,
        minor: 2,
        suggestion: 3,
      };

      const sorted = ((data ?? []) as AiFinding[]).sort(
        (a, b) =>
          (severityOrder[a.severity] ?? 99) -
          (severityOrder[b.severity] ?? 99)
      );

      setFindings(sorted);
    } catch (err) {
      console.error("[findings] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filterStage, filterSeverity, filterStatus]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const visible = findings.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );
  });

  const openDialog = (finding: AiFinding, action: (typeof REVIEW_ACTIONS)[number]) => {
    setActionNote("");
    setDialog({
      finding,
      actionType: action.type,
      label: action.label,
      nextStatus: action.nextStatus,
    });
  };

  const handleReviewAction = async () => {
    if (!dialog) return;
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update finding status
      await supabase
        .from("editorial_ai_findings")
        .update({ status: dialog.nextStatus })
        .eq("id", dialog.finding.id);

      // Record the review action for audit
      if (user) {
        await supabase.from("editorial_ai_review_actions").insert({
          finding_id: dialog.finding.id,
          reviewer_id: user.id,
          action_type: dialog.actionType,
          note: actionNote.trim() || null,
        });
      }

      setDialog(null);
      await fetchFindings();
    } catch (err) {
      console.error("[findings] review action error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────

  const total = findings.length;
  const openCount = findings.filter((f) => f.status === "open").length;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const pendingReview = findings.filter(
    (f) => f.status === "open" && f.severity !== "suggestion"
  ).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Hallazgos de IA Editorial
            </h1>
            <p className="text-sm text-muted-foreground">
              Revisión de hallazgos generados por el motor de IA del flujo editorial
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {total} hallazgos
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={total} icon={<Filter className="h-4 w-4" />} />
        <StatCard
          label="Abiertos"
          value={openCount}
          icon={<ChevronDown className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Críticos"
          value={criticalCount}
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          valueClassName="text-red-400"
        />
        <StatCard
          label="Pendiente revisión"
          value={pendingReview}
          icon={<XCircle className="h-4 w-4 text-orange-400" />}
          valueClassName="text-orange-400"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar hallazgos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {EDITORIAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(
                  ["critical", "major", "minor", "suggestion"] as AiFindingSeverity[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERITY_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(
                  ["open", "accepted", "rejected", "resolved"] as AiFindingStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Hallazgos</CardTitle>
          <CardDescription className="text-xs">
            {visible.length} resultado{visible.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando hallazgos...</span>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Título</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((finding) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    onAction={(action) => openDialog(finding, action)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      {dialog && (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{dialog.label}</DialogTitle>
              <DialogDescription className="text-sm">
                Hallazgo:{" "}
                <span className="font-medium text-foreground">
                  {dialog.finding.title}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs">
                  Nota (opcional)
                </Label>
                <Textarea
                  id="note"
                  rows={3}
                  placeholder="Agrega un comentario sobre esta acción..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog(null)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleReviewAction}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className={`text-lg font-semibold leading-none ${valueClassName ?? ""}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FindingRow({
  finding,
  onAction,
}: {
  finding: AiFinding;
  onAction: (action: (typeof REVIEW_ACTIONS)[number]) => void;
}) {
  const severity = SEVERITY_CONFIG[finding.severity];
  const status = STATUS_CONFIG[finding.status];
  const stage = STAGE_LABELS[finding.stage_key] ?? finding.stage_key;
  const isReviewed = finding.status !== "open";

  return (
    <TableRow className="group">
      <TableCell className="pl-6 max-w-xs">
        <p className="font-medium text-sm text-foreground truncate">
          {finding.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {finding.description}
        </p>
      </TableCell>

      <TableCell>
        <span className="text-xs text-muted-foreground">{stage}</span>
      </TableCell>

      <TableCell>
        <span className="text-xs capitalize text-muted-foreground">
          {finding.finding_type}
        </span>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={`text-xs ${severity.className}`}>
          {severity.label}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={`text-xs ${status.className}`}>
          {status.label}
        </Badge>
      </TableCell>

      <TableCell>
        {!isReviewed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {REVIEW_ACTIONS.map((action, i) => (
                <>
                  {i === 2 && <DropdownMenuSeparator key="sep" />}
                  <DropdownMenuItem
                    key={action.type}
                    onClick={() => onAction(action)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                </>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <BookOpen className="h-8 w-8 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">
        Sin hallazgos
      </p>
      <p className="text-xs text-muted-foreground/60">
        Los hallazgos del motor de IA aparecerán aquí.
      </p>
    </div>
  );
}
