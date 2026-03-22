"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  EditorialAnyStageKey,
  EditorialFile,
  EditorialInterventionLevel,
  EditorialProject,
  EditorialStage,
  EditorialStageKey,
  EditorialStageStatus,
} from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type {
  EditorialApproval,
  EditorialFindingV2,
  EditorialStageRun,
  EditorialWorkflowStageKey,
} from "@/lib/editorial/types/stage-engine";
import { EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE } from "@/lib/editorial/foundation/pipeline/constants";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation/models";
import {
  getReinoEditorialDefaultFontSize,
  getReinoEditorialDefaultLineSpacing,
  getReinoEditorialTypographyPreset,
  KDP_TRIM_SIZES,
  REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS,
  REINO_EDITORIAL_COLLECTION_TRIM_SIZE_OPTIONS,
  REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID,
  REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID,
  REINO_EDITORIAL_FONT_SIZE_OPTIONS,
  REINO_EDITORIAL_TYPOGRAPHY_PRESET_OPTIONS,
  type ReinoEditorialTypographyPresetId,
} from "@/lib/editorial/kdp";
import {
  DEFAULT_EDITORIAL_INTERVENTION_LEVEL,
  EDITORIAL_INTERVENTION_LEVELS,
  getEditorialInterventionLevelMeta,
} from "@/lib/editorial/pipeline/editorial-policy";

type TechnicalStageStatus = "completed" | "current" | "pending";

interface ProgressData {
  project: Pick<
    EditorialProject,
    "id" | "title" | "author_name" | "current_stage" | "status" | "progress_percent"
  > & {
    client_id?: string | null;
    book_size?: string | null;
    special_kdp_format_enabled?: boolean | null;
    editorial_intervention_level?: EditorialInterventionLevel | null;
    body_font_preset_id?: ReinoEditorialTypographyPresetId | null;
    body_font_preset_label?: string | null;
    body_font_size?: number | null;
    body_line_spacing?: number | null;
    page_estimate?: number | null;
  };
  stages: EditorialStage[];
  files: EditorialFile[];
  workflowProgress?: {
    current_state: EditorialWorkflowState | null;
    current_source: "foundation" | "legacy_fallback";
    completed_count: number;
    total_count: number;
    technical_stages: Array<{
      key: EditorialWorkflowState;
      label: string;
      description: string;
      status: TechnicalStageStatus;
      asset_kind: string | null;
      asset_id: string | null;
      asset_version: number | null;
      asset_label: string | null;
      updated_at: string | null;
    }>;
  };
  currentStageWorkspace?: {
    workflow_stage_key: EditorialWorkflowStageKey;
    stage_run: EditorialStageRun | null;
    findings: EditorialFindingV2[];
    approvals: EditorialApproval[];
    latest_file: EditorialFile | null;
    gate_evaluation: {
      canComplete: boolean;
      reasons: Array<{
        code: string;
        message: string;
        blocking: boolean;
      }>;
      checklist?: {
        checklist_id: string | null;
        progress_percent: number | null;
        completed_required: number | null;
        total_required: number | null;
      };
    };
  };
}

const ALLOWED_FILE_TYPES = ".pdf,.docx,.doc,.epub,.txt";
const MAX_FILE_SIZE_MB = 100;
const MAX_STAGE_FILE_SIZE_MB = 25;
const REINO_EDITORIAL_COLLECTION_TRIM_SIZE_ID_SET = new Set<string>(
  REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS
);
const KDP_SPECIAL_TRIM_SIZE_OPTIONS = KDP_TRIM_SIZES.filter(
  (item) => !REINO_EDITORIAL_COLLECTION_TRIM_SIZE_ID_SET.has(item.id)
).map((item) => ({
  value: item.id,
  label: item.label,
}));

const VISIBLE_PIPELINE_PHASES: Array<{
  key: "diagnostico" | "edicion" | "correccion" | "maquetacion";
  label: string;
  description: string;
  stages: EditorialStageKey[];
  workflowStates: EditorialWorkflowState[];
}> = [
  {
    key: "diagnostico",
    label: "Recepción y diagnóstico",
    description: "Ingreso del manuscrito, validación y análisis inicial.",
    stages: ["recepcion", "preparacion"],
    workflowStates: ["received", "normalized", "analyzed"],
  },
  {
    key: "edicion",
    label: "Edición editorial",
    description: "Mejora estructural y claridad general del manuscrito.",
    stages: ["edicion_editorial"],
    workflowStates: ["editing_planned", "content_edited"],
  },
  {
    key: "correccion",
    label: "Corrección final",
    description: "Gramática, ortografía, estilo y cierre de texto.",
    stages: ["correccion_linguistica", "preprensa_kdp", "validacion_paginas"],
    workflowStates: ["proofread", "validated"],
  },
  {
    key: "maquetacion",
    label: "Maquetación y salida",
    description: "Interior editorial y control técnico final.",
    stages: ["maquetacion_interior", "briefing_portada", "generacion_portada", "marketing_editorial", "entrega_final"],
    workflowStates: ["layout_ready", "qa_passed"],
  },
];

const STAGE_TO_VISIBLE_PHASE: Record<EditorialStageKey, (typeof VISIBLE_PIPELINE_PHASES)[number]["key"]> = {
  recepcion: "diagnostico",
  preparacion: "diagnostico",
  edicion_editorial: "edicion",
  correccion_linguistica: "correccion",
  preprensa_kdp: "correccion",
  validacion_paginas: "correccion",
  maquetacion_interior: "maquetacion",
  briefing_portada: "maquetacion",
  generacion_portada: "maquetacion",
  marketing_editorial: "maquetacion",
  entrega_final: "maquetacion",
};

const STAGE_LABELS: Record<EditorialAnyStageKey, string> = {
  recepcion: "Recepción",
  preparacion: "Preparación y diagnóstico",
  edicion_editorial: "Edición editorial",
  correccion_linguistica: "Corrección lingüística",
  preprensa_kdp: "Cierre de texto",
  validacion_paginas: "Validación final",
  maquetacion_interior: "Maquetación interior",
  briefing_portada: "Brief de portada",
  generacion_portada: "Generación de portada",
  marketing_editorial: "Marketing editorial",
  entrega_final: "Entrega final",
  ingesta: "Recepción",
  estructura: "Preparación y diagnóstico",
  estilo: "Edición editorial",
  ortotipografia: "Corrección lingüística",
  maquetacion: "Maquetación interior",
  revision_final: "Validación final",
  export: "Marketing editorial",
  distribution: "Entrega final",
};

const WORKFLOW_TO_VISIBLE_PHASE: Record<
  EditorialWorkflowState,
  (typeof VISIBLE_PIPELINE_PHASES)[number]["key"]
> = {
  received: "diagnostico",
  normalized: "diagnostico",
  analyzed: "diagnostico",
  editing_planned: "edicion",
  content_edited: "edicion",
  proofread: "correccion",
  validated: "correccion",
  metadata_ready: "maquetacion",
  cover_ready: "maquetacion",
  layout_ready: "maquetacion",
  qa_passed: "maquetacion",
  packaged: "maquetacion",
  published: "maquetacion",
  marketed: "maquetacion",
};

const DELIVERABLE_READY_WORKFLOW_STATES: EditorialWorkflowState[] = [
  "qa_passed",
];

const DELIVERABLE_READY_LEGACY_STAGES: EditorialStageKey[] = [
  "correccion_linguistica",
  "preprensa_kdp",
  "validacion_paginas",
  "maquetacion_interior",
  "marketing_editorial",
  "entrega_final",
];

const AUTO_WORKFLOW_STOP_STATE: EditorialWorkflowState = "qa_passed";
const AUTO_WORKFLOW_DELIVERABLE_STATES: EditorialWorkflowState[] = [
  "received",
  "normalized",
  "analyzed",
  "editing_planned",
  "content_edited",
  "proofread",
  "validated",
  "layout_ready",
];

const STAGE_AI_TASK_MAP: Partial<Record<EditorialStageKey, EditorialAiTaskKey>> = {
  recepcion: "manuscript_analysis",
  preparacion: "quality_scoring",
  edicion_editorial: "structure_analysis",
  correccion_linguistica: "copyediting",
  preprensa_kdp: "redline_diff",
  maquetacion_interior: "layout_analysis",
  validacion_paginas: "export_validation",
  marketing_editorial: "metadata_generation",
};

type ActiveEditorialWorkflowState =
  (typeof EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE)[number];

const STATUS_LABELS: Record<EditorialStageStatus, string> = {
  pending: "Pendiente",
  queued: "En cola",
  processing: "Procesando",
  review_required: "Revisión requerida",
  approved: "Aprobado",
  failed: "Fallido",
  completed: "Completado",
};

const STATUS_ICONS: Record<EditorialStageStatus, ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  queued: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  review_required: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDurationShort(totalSeconds: number | null) {
  if (totalSeconds === null || Number.isNaN(totalSeconds) || totalSeconds < 0) return "—";
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function getEditorialFileName(file: EditorialFile | null | undefined) {
  if (!file?.storage_path) return "Archivo sin nombre";
  return file.storage_path.split("/").pop() || file.storage_path;
}

function isEditorialWorkflowState(value: unknown): value is ActiveEditorialWorkflowState {
  return (
    typeof value === "string" &&
    EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE.includes(
      value as ActiveEditorialWorkflowState
    )
  );
}

function normalizeVisibleWorkflowState(
  state: EditorialWorkflowState | null | undefined
): ActiveEditorialWorkflowState | null {
  if (!state) return null;
  if (state === "metadata_ready" || state === "cover_ready") return "validated";
  if (state === "packaged" || state === "published" || state === "marketed") {
    return "qa_passed";
  }
  return isEditorialWorkflowState(state) ? state : null;
}

function getWorkflowStateIndex(state: EditorialWorkflowState | null | undefined) {
  const normalizedState = normalizeVisibleWorkflowState(state);
  if (!normalizedState) return -1;
  return EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE.indexOf(normalizedState);
}

export default function EditorialProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadingStageVersion, setUploadingStageVersion] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [runningStageAi, setRunningStageAi] = useState(false);
  const [approvingStage, setApprovingStage] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingEditorialPolicy, setSavingEditorialPolicy] = useState(false);
  const [editorialPolicyResult, setEditorialPolicyResult] = useState<string | null>(null);
  const [savingKdpFormat, setSavingKdpFormat] = useState(false);
  const [kdpFormatResult, setKdpFormatResult] = useState<string | null>(null);
  const [changeRequestNotes, setChangeRequestNotes] = useState("");
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const stageVersionInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!projectId) return;
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/progress`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al cargar el proyecto");
        return null;
      }

      const nextData = {
        project: json.project,
        stages: json.stages,
        files: json.files,
        workflowProgress: json.workflowProgress,
        currentStageWorkspace: json.currentStageWorkspace,
      };

      setData(nextData);
      return nextData;
    } catch {
      if (!options?.silent) {
        setError("Error de red al cargar el proyecto");
      }
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const processingActive =
    runningPipeline || runningStageAi || approvingStage || requestingChanges || uploadingStageVersion;

  useEffect(() => {
    if (!processingActive || !processingStartedAt) return;
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [processingActive, processingStartedAt]);

  useEffect(() => {
    if (!runningPipeline) return;
    const id = window.setInterval(() => {
      void fetchData({ silent: true });
    }, 2500);
    return () => window.clearInterval(id);
  }, [fetchData, runningPipeline]);

  const project = data?.project ?? null;
  const stages = useMemo(() => data?.stages ?? [], [data?.stages]);
  const files = useMemo(() => data?.files ?? [], [data?.files]);
  const workflowProgress = data?.workflowProgress ?? null;
  const technicalStages = useMemo(
    () => workflowProgress?.technical_stages ?? [],
    [workflowProgress?.technical_stages]
  );
  const currentWorkflowState = workflowProgress?.current_state ?? null;
  const currentStageWorkspace = data?.currentStageWorkspace ?? null;
  const currentStageStatus = project ? stages.find((stage) => stage.stage_key === project.current_stage)?.status ?? "pending" : "pending";
  const currentStageFile = currentStageWorkspace?.latest_file ?? files[0] ?? null;
  const currentStageFindings = currentStageWorkspace?.findings ?? [];
  const currentStageApprovals = currentStageWorkspace?.approvals ?? [];
  const currentGateEvaluation = currentStageWorkspace?.gate_evaluation ?? null;
  const openFindings = currentStageFindings.filter((finding) => finding.status === "open");
  const criticalFindings = openFindings.filter((finding) => finding.severity === "critical");
  const currentTechnicalStage = technicalStages.find((stage) => stage.status === "current") ?? null;
  const currentVisiblePhaseKey = currentTechnicalStage
    ? WORKFLOW_TO_VISIBLE_PHASE[currentTechnicalStage.key]
    : project
      ? STAGE_TO_VISIBLE_PHASE[project.current_stage]
      : null;
  const currentVisiblePhase = currentVisiblePhaseKey
    ? VISIBLE_PIPELINE_PHASES.find((phase) => phase.key === currentVisiblePhaseKey) ?? null
    : null;
  const currentVisibleWorkflowStates = currentVisiblePhase?.workflowStates ?? [];
  const currentVisiblePhaseStageIndex =
    currentTechnicalStage && currentVisibleWorkflowStates.length > 0
      ? Math.max(0, currentVisibleWorkflowStates.indexOf(currentTechnicalStage.key) + 1)
      : 0;
  const currentVisiblePhaseCompletedStageCount =
    currentVisibleWorkflowStates.length > 0
      ? currentVisibleWorkflowStates.filter((stateKey) => {
          const stage = technicalStages.find((entry) => entry.key === stateKey);
          return stage?.status === "completed";
        }).length
      : 0;
  const currentActionElapsedSeconds =
    processingStartedAt !== null ? Math.max(0, Math.floor((clockNow - processingStartedAt) / 1000)) : null;
  const technicalProgressPercent =
    workflowProgress && workflowProgress.total_count > 0
      ? Math.round((workflowProgress.completed_count / workflowProgress.total_count) * 100)
      : (project?.progress_percent ?? 0);
  const technicalCompletedCount = workflowProgress?.completed_count ?? 0;
  const technicalTotalCount = workflowProgress?.total_count ?? technicalStages.length;
  const currentTechnicalStageIndex = currentTechnicalStage
    ? technicalStages.findIndex((stage) => stage.key === currentTechnicalStage.key) + 1
    : 0;
  const currentEditorialInterventionLevel =
    project?.editorial_intervention_level ?? DEFAULT_EDITORIAL_INTERVENTION_LEVEL;
  const currentEditorialPolicyMeta = getEditorialInterventionLevelMeta(
    currentEditorialInterventionLevel
  );
  const currentTrimSizeId = project?.book_size ?? REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID;
  const specialKdpFormatEnabled = project?.special_kdp_format_enabled === true;
  const currentBodyFontPresetId =
    project?.body_font_preset_id ?? REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID;
  const currentBodyFontPreset = getReinoEditorialTypographyPreset(
    currentBodyFontPresetId
  );
  const currentBodyFontSize =
    project?.body_font_size ?? getReinoEditorialDefaultFontSize(currentTrimSizeId);
  const currentBodyLineSpacing =
    project?.body_line_spacing ?? getReinoEditorialDefaultLineSpacing();
  const currentPageEstimate = project?.page_estimate ?? null;
  const currentTrimSizeLabel =
    KDP_TRIM_SIZES.find((item) => item.id === currentTrimSizeId)?.label ??
    currentTrimSizeId;
  const currentTrimSizeIsCollectionPreset =
    REINO_EDITORIAL_COLLECTION_TRIM_SIZE_ID_SET.has(currentTrimSizeId);
  const availableTrimSizeOptions = specialKdpFormatEnabled
    ? [
        ...REINO_EDITORIAL_COLLECTION_TRIM_SIZE_OPTIONS,
        ...KDP_SPECIAL_TRIM_SIZE_OPTIONS,
      ]
    : [...REINO_EDITORIAL_COLLECTION_TRIM_SIZE_OPTIONS];
  const shouldAutoAdvanceToCover =
    currentWorkflowState == null || currentWorkflowState !== "qa_passed";
  const autoRunInProgress = runningPipeline && shouldAutoAdvanceToCover;
  const autoWorkflowDeliverables = technicalStages.filter(
    (stage) => stage.asset_id && AUTO_WORKFLOW_DELIVERABLE_STATES.includes(stage.key)
  );
  const autoRunCurrentStageLabel =
    currentTechnicalStage?.label ??
    currentVisiblePhase?.label ??
    STAGE_LABELS[project?.current_stage ?? "recepcion"];
  const autoRunStagePositionLabel =
    currentTechnicalStageIndex > 0 ? `${currentTechnicalStageIndex} / ${technicalTotalCount}` : "Sincronizando";
  const autoRunStatusMessage = currentTechnicalStage
    ? `La IA está ejecutando ${currentTechnicalStage.label} y avanzará sola hasta Control de calidad.`
    : "La IA está encadenando el pipeline automáticamente y refrescando el avance en esta pantalla.";

  const visiblePhaseStates = useMemo(() => {
    if (technicalStages.length > 0) {
      return VISIBLE_PIPELINE_PHASES.map((phase) => {
        const members = phase.workflowStates
          .map((stateKey) => technicalStages.find((entry) => entry.key === stateKey))
          .filter(Boolean) as Array<(typeof technicalStages)[number]>;

        const isCurrent = members.some((stage) => stage.status === "current");
        const completedCount = members.filter((stage) => stage.status === "completed").length;
        const allDone = members.length > 0 && completedCount === members.length;

        return {
          ...phase,
          isCurrent,
          status: allDone ? "completed" : isCurrent ? "processing" : "pending",
          completedCount,
          totalCount: phase.workflowStates.length,
          currentTechnicalStageLabel: isCurrent ? currentTechnicalStage?.label ?? null : null,
        };
      });
    }

    const stageMap = new Map(stages.map((stage) => [stage.stage_key, stage]));

    return VISIBLE_PIPELINE_PHASES.map((phase) => {
      const members = phase.stages
        .map((stageKey) => stageMap.get(stageKey))
        .filter(Boolean) as EditorialStage[];

      const hasFailed = members.some((stage) => stage.status === "failed");
      const hasReview = members.some((stage) => stage.status === "review_required");
      const hasProcessing = members.some(
        (stage) => stage.status === "processing" || stage.status === "queued"
      );
      const allDone =
        members.length > 0 &&
        members.every((stage) => stage.status === "completed" || stage.status === "approved");
      const isCurrent = currentVisiblePhaseKey === phase.key;

      let status: EditorialStageStatus = "pending";
      if (hasFailed) status = "failed";
      else if (hasReview) status = "review_required";
      else if (hasProcessing) status = "processing";
      else if (allDone) status = "completed";

      return {
        ...phase,
        isCurrent,
        status,
        completedCount: members.filter(
          (stage) => stage.status === "completed" || stage.status === "approved"
        ).length,
        totalCount: phase.stages.length,
        currentTechnicalStageLabel:
          isCurrent && project ? STAGE_LABELS[project.current_stage] : null,
      };
    });
  }, [currentTechnicalStage?.label, currentVisiblePhaseKey, project, stages, technicalStages]);

  const completedVisiblePhasesCount = visiblePhaseStates.filter(
    (phase) => phase.status === "completed" || phase.status === "approved"
  ).length;
  const canApproveCurrentStage =
    !!project &&
    !approvingStage &&
    !!currentGateEvaluation?.canComplete &&
    (currentStageStatus === "review_required" || currentStageWorkspace?.stage_run?.status === "human_review");
  const canRunCurrentStage =
    !!project &&
    !runningPipeline &&
    files.length > 0 &&
    currentWorkflowState !== "qa_passed";

  const handleEditorialPolicyChange = useCallback(
    async (nextLevel: string) => {
      if (!projectId) return;

      const normalizedLevel = nextLevel as EditorialInterventionLevel;
      if (normalizedLevel === currentEditorialInterventionLevel) {
        return;
      }

      setSavingEditorialPolicy(true);
      setEditorialPolicyResult(null);

      try {
        const response = await fetch(`/api/editorial/projects/${projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            editorialInterventionLevel: normalizedLevel,
          }),
        });
        const json = await response.json();

        if (!json.success) {
          setEditorialPolicyResult(
            json.error ?? "No se pudo guardar el nivel editorial."
          );
          return;
        }

        setData((current) =>
          current
            ? {
                ...current,
                project: {
                  ...current.project,
                  editorial_intervention_level: json.editorialInterventionLevel,
                },
              }
            : current
        );
        setEditorialPolicyResult(
          "Nivel editorial actualizado. Se aplicará en las siguientes ejecuciones del pipeline."
        );
      } catch {
        setEditorialPolicyResult(
          "No se pudo guardar el nivel editorial por un error de red."
        );
      } finally {
        setSavingEditorialPolicy(false);
      }
    },
    [currentEditorialInterventionLevel, projectId]
  );

  const saveKdpFormatSettings = useCallback(
    async (options: {
      trimSizeId: string;
      specialKdpFormatEnabled: boolean;
      bodyFontPresetId?: ReinoEditorialTypographyPresetId;
      bodyFontSize?: number;
      successMessage: string;
    }) => {
      if (!projectId) return;

      setSavingKdpFormat(true);
      setKdpFormatResult(null);

      try {
        const response = await fetch(`/api/editorial/projects/${projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trimSizeId: options.trimSizeId,
            specialKdpFormatEnabled: options.specialKdpFormatEnabled,
            bodyFontPresetId: options.bodyFontPresetId,
            bodyFontSize: options.bodyFontSize,
          }),
        });
        const json = await response.json();

        if (!json.success) {
          setKdpFormatResult(
            json.error ?? "No se pudo guardar la configuración KDP."
          );
          return;
        }

        setData((current) =>
          current
            ? {
                ...current,
                project: {
                  ...current.project,
                  book_size: json.trimSizeId,
                  special_kdp_format_enabled: json.specialKdpFormatEnabled,
                  body_font_preset_id: json.bodyFontPresetId,
                  body_font_preset_label: json.bodyFontPresetLabel,
                  body_font_size: json.bodyFontSize,
                  body_line_spacing: json.bodyLineSpacing,
                  page_estimate: json.estimatedPages,
                },
              }
            : current
        );
        setKdpFormatResult(options.successMessage);
      } catch {
        setKdpFormatResult(
          "No se pudo guardar la configuración KDP por un error de red."
        );
      } finally {
        setSavingKdpFormat(false);
      }
    },
    [projectId]
  );

  const handleSpecialKdpFormatToggle = useCallback(
    async (checked: boolean) => {
      const nextTrimSizeId =
        !checked && !currentTrimSizeIsCollectionPreset
          ? REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID
          : currentTrimSizeId;

      await saveKdpFormatSettings({
        trimSizeId: nextTrimSizeId,
        specialKdpFormatEnabled: checked,
        successMessage: checked
          ? "Modo de formato especial KDP activado para este proyecto."
          : "Proyecto regresado al catálogo estándar de colección.",
      });
    },
    [
      currentTrimSizeId,
      currentTrimSizeIsCollectionPreset,
      saveKdpFormatSettings,
    ]
  );

  const handleTrimSizeChange = useCallback(
    async (nextTrimSizeId: string) => {
      const nextSpecialKdpFormatEnabled =
        specialKdpFormatEnabled ||
        !REINO_EDITORIAL_COLLECTION_TRIM_SIZE_ID_SET.has(nextTrimSizeId);

      await saveKdpFormatSettings({
        trimSizeId: nextTrimSizeId,
        specialKdpFormatEnabled: nextSpecialKdpFormatEnabled,
        successMessage: REINO_EDITORIAL_COLLECTION_TRIM_SIZE_ID_SET.has(
          nextTrimSizeId
        )
          ? "Formato estándar de colección actualizado."
          : "Formato especial KDP actualizado para este proyecto.",
      });
    },
    [saveKdpFormatSettings, specialKdpFormatEnabled]
  );

  const handleTypographyPresetChange = useCallback(
    async (nextPresetId: string) => {
      if (nextPresetId === currentBodyFontPresetId) {
        return;
      }

      await saveKdpFormatSettings({
        trimSizeId: currentTrimSizeId,
        specialKdpFormatEnabled,
        bodyFontPresetId: nextPresetId as ReinoEditorialTypographyPresetId,
        bodyFontSize: currentBodyFontSize,
        successMessage:
          "Tipografia editorial actualizada. La nueva paginacion estimada ya queda aplicada.",
      });
    },
    [
      currentBodyFontPresetId,
      currentBodyFontSize,
      currentTrimSizeId,
      saveKdpFormatSettings,
      specialKdpFormatEnabled,
    ]
  );

  const handleBodyFontSizeChange = useCallback(
    async (nextFontSizeValue: string) => {
      const nextBodyFontSize = Number(nextFontSizeValue);
      if (!Number.isFinite(nextBodyFontSize) || nextBodyFontSize === currentBodyFontSize) {
        return;
      }

      await saveKdpFormatSettings({
        trimSizeId: currentTrimSizeId,
        specialKdpFormatEnabled,
        bodyFontPresetId: currentBodyFontPresetId,
        bodyFontSize: nextBodyFontSize,
        successMessage:
          "Tamano de cuerpo actualizado. La estimacion de paginas se recalculo con la nueva configuracion.",
      });
    },
    [
      currentBodyFontPresetId,
      currentBodyFontSize,
      currentTrimSizeId,
      saveKdpFormatSettings,
      specialKdpFormatEnabled,
    ]
  );

  const runWorkflowStep = useCallback(async (options?: { targetState?: EditorialWorkflowState }) => {
    const res = await fetch(`/api/editorial/workflow/run-current`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        targetState: options?.targetState ?? null,
      }),
    });
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error ?? "No se pudo procesar la fase actual");
    }

    const refreshedData = await fetchData({ silent: true });
    const refreshedState = refreshedData?.workflowProgress?.current_state ?? null;
    const nextState = refreshedState ?? (isEditorialWorkflowState(json.nextState) ? json.nextState : null);

    return {
      message:
        typeof json.message === "string" && json.message.trim().length > 0
          ? json.message
          : "La etapa técnica actual se procesó correctamente y el workflow avanzó.",
      nextState,
      completed:
        json.completed === true ||
        (options?.targetState != null && nextState === options.targetState),
      partial: json.partial === true,
    };
  }, [fetchData, projectId]);

  async function handleInviteClient(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/staff/projects/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          projectId,
          clientName: inviteName.trim() || undefined,
        }),
      });
      const json = await res.json();
      setInviteResult({
        success: Boolean(json.success),
        message: json.message ?? json.error ?? "No se pudo enviar la invitación",
      });
    } catch {
      setInviteResult({ success: false, message: "Error de conexión" });
    } finally {
      setInviting(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`El archivo supera los ${MAX_FILE_SIZE_MB}MB permitidos.`);
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const urlRes = await fetch(`/api/editorial/projects/${projectId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const urlJson = await urlRes.json();

      if (!urlJson.success) {
        setUploadError(urlJson.error ?? "No se pudo preparar la subida");
        return;
      }

      const uploadRes = await fetch(urlJson.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadError("No se pudo subir el archivo al almacenamiento");
        return;
      }

      setUploadSuccess(true);
      await fetchData();
      window.setTimeout(() => setUploadSuccess(false), 2500);
    } catch {
      setUploadError("Error de conexión al subir el manuscrito");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleProcessCurrentPhase() {
    if (!canRunCurrentStage) return;

    setPipelineResult(null);

    setRunningPipeline(true);
    setProcessingStartedAt(Date.now());

    try {
      let stepResult = await runWorkflowStep(
        shouldAutoAdvanceToCover ? { targetState: AUTO_WORKFLOW_STOP_STATE } : undefined
      );
      if (shouldAutoAdvanceToCover) {
        for (let iteration = 0; iteration < 24 && !stepResult.completed; iteration += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, stepResult.partial ? 250 : 100));
          stepResult = await runWorkflowStep({ targetState: AUTO_WORKFLOW_STOP_STATE });
        }
        if (!stepResult.completed) {
          throw new Error(
            "La corrida automática excedió el número esperado de tandas. Vuelve a intentarlo para continuar desde el punto alcanzado."
          );
        }
      }
      setPipelineResult({
        success: true,
        message: stepResult.message,
      });
    } catch (caughtError) {
      setPipelineResult({
        success: false,
        message:
          caughtError instanceof Error && caughtError.message
            ? caughtError.message
            : "Error de conexión al procesar la fase actual",
      });
    } finally {
      setRunningPipeline(false);
      setProcessingStartedAt(null);
    }
  }

  async function handleRerunStageAi() {
    if (!project || runningStageAi) return;

    const taskKey = STAGE_AI_TASK_MAP[project.current_stage];
    if (!taskKey) {
      setPipelineResult({
        success: false,
        message: "La fase actual no tiene una tarea de IA manual configurable.",
      });
      return;
    }

    setRunningStageAi(true);
    setProcessingStartedAt(Date.now());
    setPipelineResult(null);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/stages/${project.current_stage}/ai/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskKey,
          sourceFileId: currentStageFile?.id,
          sourceFileVersion: currentStageFile?.version,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setPipelineResult({
          success: false,
          message: json.error ?? "No se pudo volver a correr la IA de esta fase",
        });
        return;
      }

      setPipelineResult({
        success: true,
        message: "La IA de la fase actual se volvió a ejecutar sobre el archivo vigente.",
      });
      await fetchData();
    } catch {
      setPipelineResult({
        success: false,
        message: "Error de conexión al volver a correr la IA",
      });
    } finally {
      setRunningStageAi(false);
      setProcessingStartedAt(null);
    }
  }

  async function handleStageRevisionUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    if (file.size > MAX_STAGE_FILE_SIZE_MB * 1024 * 1024) {
      setPipelineResult({
        success: false,
        message: `La versión corregida supera los ${MAX_STAGE_FILE_SIZE_MB}MB permitidos.`,
      });
      event.target.value = "";
      return;
    }

    setUploadingStageVersion(true);
    setPipelineResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", currentStageFile?.file_type ?? "working_file");
      formData.append("stageKey", project.current_stage);
      formData.append("visibility", currentStageFile?.visibility ?? "internal");

      const res = await fetch(`/api/staff/projects/${projectId}/files/upload`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        setPipelineResult({
          success: false,
          message: json.error ?? "No se pudo subir la nueva versión",
        });
        return;
      }

      setPipelineResult({
        success: true,
        message: "Se subió una nueva versión corregida. Ya puedes revisarla o volver a correr la IA.",
      });
      await fetchData();
    } catch {
      setPipelineResult({
        success: false,
        message: "Error de conexión al subir la nueva versión",
      });
    } finally {
      setUploadingStageVersion(false);
      event.target.value = "";
    }
  }

  async function handleApproveCurrentStage() {
    if (!project || approvingStage) return;

    setApprovingStage(true);
    setProcessingStartedAt(Date.now());
    setPipelineResult(null);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/stages/${project.current_stage}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (!json.success) {
        setPipelineResult({
          success: false,
          message: json.error ?? "No se pudo aprobar la fase",
        });
        return;
      }

      setPipelineResult({
        success: true,
        message: json.advancedTo
          ? `Fase aprobada. El proyecto avanzó a ${STAGE_LABELS[json.advancedTo as EditorialStageKey] ?? json.advancedTo}.`
          : "Fase aprobada correctamente.",
      });
      setChangeRequestNotes("");
      await fetchData();
    } catch {
      setPipelineResult({
        success: false,
        message: "Error de conexión al aprobar la fase",
      });
    } finally {
      setApprovingStage(false);
      setProcessingStartedAt(null);
    }
  }

  async function handleRequestChanges() {
    if (!project || requestingChanges) return;
    if (!changeRequestNotes.trim()) {
      setPipelineResult({
        success: false,
        message: "Escribe primero qué cambios quieres solicitar.",
      });
      return;
    }

    setRequestingChanges(true);
    setProcessingStartedAt(Date.now());
    setPipelineResult(null);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/stages/${project.current_stage}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: changeRequestNotes.trim() }),
      });
      const json = await res.json();

      if (!json.success) {
        setPipelineResult({
          success: false,
          message: json.error ?? "No se pudo pedir cambios",
        });
        return;
      }

      setPipelineResult({
        success: true,
        message: json.message ?? "Se registró la solicitud de cambios.",
      });
      setChangeRequestNotes("");
      await fetchData();
    } catch {
      setPipelineResult({
        success: false,
        message: "Error de conexión al pedir cambios",
      });
    } finally {
      setRequestingChanges(false);
      setProcessingStartedAt(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || !project) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/app/editorial/projects" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a proyectos
          </Link>
        </Button>
        <div className="re-card p-6 text-sm" style={{ color: "var(--re-danger)" }}>
          {error ?? "Proyecto no encontrado"}
        </div>
      </div>
    );
  }

  const currentStageFileViewUrl = currentStageFile ? `/api/editorial/files/${currentStageFile.id}/view` : null;
  const currentStageFileDownloadUrl = currentStageFile ? `/api/editorial/files/${currentStageFile.id}/download` : null;
  const correctionReportUrl = `/api/editorial/projects/${projectId}/correction-report`;
  const finalManuscriptUrl = `/api/editorial/projects/${projectId}/final-manuscript`;
  const deliverablesReady = workflowProgress?.current_state
    ? DELIVERABLE_READY_WORKFLOW_STATES.includes(workflowProgress.current_state)
    : DELIVERABLE_READY_LEGACY_STAGES.includes(project.current_stage);
  const finalManuscriptButtonLabel = "Descargar manuscrito corregido";
  const processWorkflowButtonLabel = shouldAutoAdvanceToCover
    ? "Procesar pipeline completo"
    : "Procesar siguiente fase";
  const runningWorkflowButtonLabel = shouldAutoAdvanceToCover
    ? "Procesando pipeline completo..."
    : "Procesando siguiente fase...";

  return (
    <div className="flex flex-col gap-6 p-8 max-w-6xl mx-auto">
      <Link
        href="/app/editorial/projects"
        className="inline-flex items-center gap-2 text-sm w-fit transition-all hover:gap-3 group"
        style={{ color: "var(--re-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver a proyectos
      </Link>

      <div className="re-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg shrink-0"
              style={{ background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)" }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--re-text)" }}>
                {project.title}
              </h1>
              {project.author_name ? (
                <p className="text-sm mt-1" style={{ color: "var(--re-text-muted)" }}>
                  por {project.author_name}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="re-badge">{project.status}</span>
                <span className="re-badge re-badge-blue">
                  {currentVisiblePhase?.label ?? STAGE_LABELS[project.current_stage]}
                </span>
                <span className="re-badge" style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}>
                  Etapa técnica: {currentTechnicalStage?.label ?? STAGE_LABELS[project.current_stage]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              className="group relative overflow-hidden rounded-2xl border px-4 py-3 cursor-pointer transition-all"
              style={{
                background: files.length === 0
                  ? "linear-gradient(135deg, rgba(45, 212, 212, 0.14) 0%, rgba(27, 64, 192, 0.1) 100%)"
                  : "var(--re-surface)",
                borderColor: files.length === 0 ? "rgba(45, 212, 212, 0.32)" : "var(--re-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: files.length === 0 ? "rgba(45, 212, 212, 0.18)" : "var(--re-surface-2)" }}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--re-cyan)" }} />
                  ) : (
                    <Upload className="w-5 h-5" style={{ color: files.length === 0 ? "var(--re-cyan)" : "var(--re-blue)" }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--re-text-subtle)" }}>
                    Manuscrito
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                    {uploading ? "Subiendo archivo..." : files.length === 0 ? "Cargar manuscrito" : "Cargar nueva versión"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>
                    PDF, DOCX, DOC, EPUB o TXT
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept={ALLOWED_FILE_TYPES}
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            <Button
              onClick={handleProcessCurrentPhase}
              disabled={!canRunCurrentStage}
              className="gap-2"
              style={{
                background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                color: "#fff",
              }}
            >
              {runningPipeline ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {runningWorkflowButtonLabel}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {processWorkflowButtonLabel}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setInviteOpen(true);
                setInviteResult(null);
              }}
            >
              {project.client_id ? <Mail className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {project.client_id ? "Reenviar invitación" : "Invitar cliente"}
            </Button>
          </div>
        </div>

        {uploadError ? (
          <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{ color: "var(--re-danger)", borderColor: "rgba(192,49,43,0.18)", background: "rgba(255,241,240,0.95)" }}>
            {uploadError}
          </div>
        ) : null}

        {uploadSuccess ? (
          <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{ color: "var(--re-success)", borderColor: "rgba(13,122,95,0.18)", background: "rgba(238,251,246,0.95)" }}>
            Manuscrito subido correctamente.
          </div>
        ) : null}

        {autoRunInProgress ? (
          <div
            className="mt-4 rounded-2xl border px-4 py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(27, 64, 192, 0.08) 0%, rgba(45, 212, 212, 0.08) 100%)",
              borderColor: "rgba(27, 64, 192, 0.16)",
            }}
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(27, 64, 192, 0.12)", color: "var(--re-blue)" }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--re-blue)" }}
                  >
                    Corrida automática activa
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                    {autoRunCurrentStageLabel}
                  </p>
                  <p className="text-xs mt-1 leading-5" style={{ color: "var(--re-text-muted)" }}>
                    {autoRunStatusMessage}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: "var(--re-text-subtle)" }}>
                    Esta vista se refresca sola cada pocos segundos. No hace falta volver a pulsar el botón.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div
                  className="rounded-xl border px-3 py-3"
                  style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(27, 64, 192, 0.14)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                    Tiempo en curso
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-blue)" }}>
                    {formatDurationShort(currentActionElapsedSeconds)}
                  </p>
                </div>
                <div
                  className="rounded-xl border px-3 py-3"
                  style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(27, 64, 192, 0.14)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                    Etapa confirmada
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                    {autoRunStagePositionLabel}
                  </p>
                </div>
                <div
                  className="rounded-xl border px-3 py-3"
                  style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(27, 64, 192, 0.14)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                    Objetivo
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                    Control de calidad
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="mt-4 rounded-2xl border px-4 py-4"
          style={{
            background: "var(--re-surface-2)",
            borderColor: "var(--re-border)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--re-text-subtle)" }}
              >
                Política editorial
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                Regla dura: la IA no puede agregar contenido nuevo ni quitar contenido sustancial del autor.
              </p>
              <p className="text-xs mt-1 leading-5" style={{ color: "var(--re-text-muted)" }}>
                El nivel define cuánta intervención de redacción se permite, pero siempre preservando hechos, intención y voz autoral.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <Label
                htmlFor="editorial-intervention-level"
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--re-text-subtle)" }}
              >
                Nivel de intervención
              </Label>
              <Select
                value={currentEditorialInterventionLevel}
                onValueChange={handleEditorialPolicyChange}
                disabled={savingEditorialPolicy || runningPipeline}
              >
                <SelectTrigger
                  id="editorial-intervention-level"
                  className="mt-2 w-full"
                  style={{ background: "var(--re-surface)" }}
                >
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {EDITORIAL_INTERVENTION_LEVELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs mt-2" style={{ color: "var(--re-text-muted)" }}>
                {currentEditorialPolicyMeta.description}
              </p>
            </div>
          </div>

          {editorialPolicyResult ? (
            <p className="text-xs mt-3" style={{ color: "var(--re-text-muted)" }}>
              {editorialPolicyResult}
            </p>
          ) : null}

          <div
            className="mt-4 rounded-2xl border px-4 py-4"
            style={{
              background: "var(--re-surface)",
              borderColor: "var(--re-border)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--re-text-subtle)" }}
                >
                  Formato Amazon KDP
                </p>
                <p
                  className="text-sm font-semibold mt-1"
                  style={{ color: "var(--re-text)" }}
                >
                  La colección estándar usa solo 6&quot; x 9&quot; y 5.5&quot; x 8.5&quot;.
                </p>
                <p
                  className="text-xs mt-1 leading-5"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  Si un cliente solicita otra medida oficial de Amazon, actívala
                  como excepción solo para este proyecto.
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  Formato actual: {currentTrimSizeLabel}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  Tipografia base: {project?.body_font_preset_label ?? currentBodyFontPreset.label} · {currentBodyFontSize} pt · interlineado {currentBodyLineSpacing.toFixed(2)}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  Paginacion estimada: {typeof currentPageEstimate === "number" ? `${currentPageEstimate} paginas` : "se recalculara cuando el proyecto tenga word count utilizable"}
                </p>
              </div>

              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                      Formato especial KDP
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
                      Permite tamaños oficiales de Amazon fuera del catálogo estándar.
                    </p>
                  </div>
                  <Switch
                    checked={specialKdpFormatEnabled}
                    onCheckedChange={handleSpecialKdpFormatToggle}
                    disabled={savingKdpFormat || runningPipeline}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="kdp-trim-size"
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--re-text-subtle)" }}
                  >
                    Trim Size
                  </Label>
                  <Select
                    value={currentTrimSizeId}
                    onValueChange={handleTrimSizeChange}
                    disabled={savingKdpFormat || runningPipeline}
                  >
                    <SelectTrigger
                      id="kdp-trim-size"
                      className="mt-2 w-full"
                      style={{ background: "var(--re-surface-2)" }}
                    >
                      <SelectValue placeholder="Selecciona un trim size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTrimSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs mt-2" style={{ color: "var(--re-text-muted)" }}>
                    {specialKdpFormatEnabled
                      ? "Modo excepción activo: puedes elegir cualquier tamaño oficial KDP."
                      : "Modo estándar activo: solo están disponibles los dos formatos base de colección."}
                  </p>
                </div>

                <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--re-text-subtle)" }}
                  >
                    Tipografia interior
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label
                        htmlFor="body-font-preset"
                        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: "var(--re-text-subtle)" }}
                      >
                        Tipo de letra base
                      </Label>
                      <Select
                        value={currentBodyFontPresetId}
                        onValueChange={handleTypographyPresetChange}
                        disabled={savingKdpFormat || runningPipeline}
                      >
                        <SelectTrigger
                          id="body-font-preset"
                          className="mt-2 w-full"
                          style={{ background: "var(--re-surface-2)" }}
                        >
                          <SelectValue placeholder="Selecciona una tipografia base" />
                        </SelectTrigger>
                        <SelectContent>
                          {REINO_EDITORIAL_TYPOGRAPHY_PRESET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs mt-2" style={{ color: "var(--re-text-muted)" }}>
                        {currentBodyFontPreset.description}
                      </p>
                    </div>

                    <div>
                      <Label
                        htmlFor="body-font-size"
                        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: "var(--re-text-subtle)" }}
                      >
                        Tamano de cuerpo
                      </Label>
                      <Select
                        value={String(currentBodyFontSize)}
                        onValueChange={handleBodyFontSizeChange}
                        disabled={savingKdpFormat || runningPipeline}
                      >
                        <SelectTrigger
                          id="body-font-size"
                          className="mt-2 w-full"
                          style={{ background: "var(--re-surface-2)" }}
                        >
                          <SelectValue placeholder="Selecciona un tamano" />
                        </SelectTrigger>
                        <SelectContent>
                          {REINO_EDITORIAL_FONT_SIZE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                              {option} pt
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs mt-2" style={{ color: "var(--re-text-muted)" }}>
                        El sistema recalcula paginas y maquetacion con este cuerpo. El interlineado operativo permanece en {currentBodyLineSpacing.toFixed(2)} para mantener consistencia KDP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {kdpFormatResult ? (
              <p className="text-xs mt-3" style={{ color: "var(--re-text-muted)" }}>
                {kdpFormatResult}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div
          className="rounded-2xl border px-4 py-3"
          style={{
            background: "rgba(255, 249, 235, 0.95)",
            color: "#8a5a00",
            borderColor: "rgba(245, 200, 66, 0.28)",
          }}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                Manuscrito faltante
              </p>
              <p className="mt-1 text-sm leading-6">
                Este proyecto no tiene un manuscrito vigente. No hay una fase ejecutándose en backend;
                el pipeline queda detenido hasta que cargues un archivo nuevo.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {pipelineResult ? (
        <div
          className="rounded-2xl border px-4 py-3"
          style={{
            background: pipelineResult.success ? "rgba(238, 251, 246, 0.96)" : "rgba(255, 241, 240, 0.97)",
            color: pipelineResult.success ? "var(--re-success)" : "var(--re-danger)",
            borderColor: pipelineResult.success ? "rgba(13, 122, 95, 0.18)" : "rgba(192, 49, 43, 0.18)",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              {pipelineResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                {pipelineResult.success ? "Sesión actualizada" : "Aviso de pruebas"}
              </p>
              <p className="mt-1 text-sm leading-6">{pipelineResult.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setPipelineResult(null)}
              className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      <div className="re-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Progreso del workflow
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
                Secuencia estricta de 9 etapas técnicas activas. La vista resumida por fases queda abajo como referencia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Avance
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: "var(--re-blue)" }}>
                {technicalProgressPercent}%
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Etapa técnica actual
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                {currentTechnicalStage?.label ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Posición técnica
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                {currentTechnicalStageIndex > 0 ? `${currentTechnicalStageIndex} / ${technicalTotalCount}` : "—"}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Fase editorial
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                {currentVisiblePhase?.label ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Tiempo actual
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: processingActive ? "var(--re-blue)" : "var(--re-text)" }}>
                {processingActive ? formatDurationShort(currentActionElapsedSeconds) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="re-progress h-3 overflow-hidden mt-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, technicalProgressPercent))}%`,
              background: "linear-gradient(90deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
            }}
          />
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--re-text-muted)" }}>
          {technicalCompletedCount} de {technicalTotalCount} etapas técnicas completadas.
        </p>
      </div>

      {technicalStages.length > 0 ? (
        <div className="re-card overflow-hidden">
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--re-border)" }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--re-text)" }}>
                Flujo técnico completo
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
                Secuencia real de 9 etapas visibles del pipeline AI-native.
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
            >
              {workflowProgress?.completed_count ?? 0} / {workflowProgress?.total_count ?? technicalStages.length} completadas
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--re-border)" }}>
            {technicalStages.map((stage, index) => (
              <div
                key={stage.key}
                className="flex items-start gap-4 px-5 py-4"
                style={{
                  background: stage.status === "current" ? "#1B40C010" : "transparent",
                  borderLeft:
                    stage.status === "current"
                      ? "3px solid var(--re-blue-light)"
                      : "3px solid transparent",
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0"
                  style={{
                    background:
                      stage.status === "completed"
                        ? "rgba(13, 122, 95, 0.12)"
                        : stage.status === "current"
                          ? "rgba(27, 64, 192, 0.12)"
                          : "var(--re-surface-3)",
                    color:
                      stage.status === "completed"
                        ? "var(--re-success)"
                        : stage.status === "current"
                          ? "var(--re-blue)"
                          : "var(--re-text-subtle)",
                  }}
                >
                  {stage.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : String(index + 1).padStart(2, "0")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                      {stage.label}
                    </p>
                    {stage.status === "current" ? (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        Actual
                      </Badge>
                    ) : null}
                    <span
                      className="inline-flex items-center gap-2 text-xs"
                      style={{ color: "var(--re-text-muted)" }}
                    >
                      {stage.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : stage.status === "current" ? (
                        runningPipeline ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      {stage.status === "completed"
                        ? "Completada"
                        : stage.status === "current"
                          ? runningPipeline
                            ? "Corrida automática activa"
                            : "Lista para continuar"
                          : "Pendiente"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                    {stage.description}
                  </p>
                  {(stage.asset_kind || stage.asset_version) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {stage.asset_kind ? (
                        <span
                          className="rounded-full px-2.5 py-1"
                          style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
                        >
                          Asset: {stage.asset_kind}
                        </span>
                      ) : null}
                      {stage.asset_version ? (
                        <span
                          className="rounded-full px-2.5 py-1"
                          style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
                        >
                          v{stage.asset_version}
                        </span>
                      ) : null}
                      {stage.updated_at ? (
                        <span
                          className="rounded-full px-2.5 py-1"
                          style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
                        >
                          Actualizado: {formatDate(stage.updated_at)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="re-card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--re-text)" }}>
              Resumen por fases
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
              Lectura ejecutiva en 4 bloques. El orden real y el avance verdadero están arriba en el flujo técnico.
            </p>
          </div>
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: "var(--re-blue-pale)", color: "var(--re-blue)" }}
          >
            {completedVisiblePhasesCount} / {VISIBLE_PIPELINE_PHASES.length} completadas
          </span>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {visiblePhaseStates.map((phase, index) => (
            <div
              key={phase.key}
              className="rounded-xl border p-4"
              style={{
                borderColor: phase.isCurrent ? "rgba(27, 64, 192, 0.25)" : "var(--re-border)",
                background: phase.isCurrent ? "#1B40C010" : "#fff",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0"
                  style={{
                    background:
                      phase.status === "completed"
                        ? "rgba(13, 122, 95, 0.12)"
                        : phase.isCurrent
                          ? "rgba(27, 64, 192, 0.12)"
                          : "var(--re-surface-3)",
                    color:
                      phase.status === "completed"
                        ? "var(--re-success)"
                        : phase.isCurrent
                          ? "var(--re-blue)"
                          : "var(--re-text-subtle)",
                  }}
                >
                  {phase.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <span className="inline-flex items-center gap-2 text-xs" style={{ color: "var(--re-text-muted)" }}>
                  {STATUS_ICONS[phase.status as EditorialStageStatus]}
                  {STATUS_LABELS[phase.status as EditorialStageStatus]}
                </span>
              </div>
              <p className="text-sm font-semibold mt-3" style={{ color: "var(--re-text)" }}>
                {phase.label}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                {phase.description}
              </p>
              {phase.currentTechnicalStageLabel ? (
                <div className="mt-3 text-[11px]">
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{ background: "rgba(27, 64, 192, 0.08)", color: "var(--re-blue)" }}
                  >
                    Actual: {phase.currentTechnicalStageLabel}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <div className="re-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--re-text-subtle)" }}>
                Fase actual
              </p>
              <h2 className="text-lg font-semibold" style={{ color: "var(--re-text)" }}>
                {currentTechnicalStage?.label ?? currentVisiblePhase?.label ?? STAGE_LABELS[project.current_stage]}
              </h2>
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                {currentTechnicalStage
                  ? `${currentTechnicalStage.description} · Fase editorial: ${currentVisiblePhase?.label ?? "—"}.`
                  : currentVisiblePhase?.description ?? "La sesión está enfocada en la fase actual del libro."}
              </p>
              {currentVisiblePhase ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5"
                    style={{ background: "rgba(27, 64, 192, 0.08)", color: "var(--re-blue)" }}
                  >
                    Etapa técnica {currentVisiblePhaseStageIndex || 1} de {currentVisibleWorkflowStates.length}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5"
                    style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
                  >
                    {currentVisiblePhaseCompletedStageCount}/{currentVisibleWorkflowStates.length} cerradas
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5"
                    style={{ background: "var(--re-surface-3)", color: "var(--re-text-muted)" }}
                  >
                    Actual: {currentTechnicalStage?.label ?? STAGE_LABELS[project.current_stage]}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)", background: "#fff" }}>
                <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                  Estado
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                  {STATUS_LABELS[currentStageStatus]}
                </p>
              </div>
              <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)", background: "#fff" }}>
                <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                  Run técnico
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: "var(--re-text)" }}>
                  {currentStageWorkspace?.stage_run?.status ?? "Sin run"}
                </p>
              </div>
              <div className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--re-border)", background: "#fff" }}>
                <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                  Hallazgos abiertos
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: criticalFindings.length > 0 ? "var(--re-danger)" : "var(--re-text)" }}>
                  {openFindings.length}
                  {criticalFindings.length > 0 ? ` · ${criticalFindings.length} críticos` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleProcessCurrentPhase} disabled={!canRunCurrentStage} className="gap-2">
                {runningPipeline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {runningWorkflowButtonLabel}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {processWorkflowButtonLabel}
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => stageVersionInputRef.current?.click()}
                disabled={uploadingStageVersion}
                variant="outline"
                className="gap-2"
              >
                {uploadingStageVersion ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir versión corregida
                  </>
                )}
              </Button>

              <Button
                onClick={handleRerunStageAi}
                disabled={runningStageAi || !STAGE_AI_TASK_MAP[project.current_stage]}
                variant="outline"
                className="gap-2"
              >
                {runningStageAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Volver a correr IA
                  </>
                )}
              </Button>

              <Button onClick={handleApproveCurrentStage} disabled={!canApproveCurrentStage} variant="outline" className="gap-2">
                {approvingStage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Aprobar fase
                  </>
                )}
              </Button>
            </div>

            <input
              ref={stageVersionInputRef}
              type="file"
              accept={ALLOWED_FILE_TYPES}
              className="hidden"
              onChange={handleStageRevisionUpload}
              disabled={uploadingStageVersion}
            />

            <div className="rounded-xl border p-4" style={{ borderColor: "var(--re-border)", background: "var(--re-surface-2)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                Decisión editorial
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--re-text-muted)" }}>
                Si esta fase no debe avanzar, deja la instrucción exacta y registra la devolución.
              </p>
              <textarea
                value={changeRequestNotes}
                onChange={(event) => setChangeRequestNotes(event.target.value)}
                placeholder="Ejemplo: revisar coherencia del capítulo 2, reducir repeticiones y corregir puntuación en diálogos."
                className="mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  minHeight: "110px",
                  borderColor: "var(--re-border)",
                  background: "#fff",
                  color: "var(--re-text)",
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={handleRequestChanges} disabled={requestingChanges} variant="outline" className="gap-2">
                  {requestingChanges ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Pedir cambios
                    </>
                  )}
                </Button>
              </div>
            </div>

            {currentStageWorkspace?.stage_run?.ai_summary ? (
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--re-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--re-text-subtle)" }}>
                  Resumen AI
                </p>
                <p className="text-sm mt-2 leading-6" style={{ color: "var(--re-text)" }}>
                  {currentStageWorkspace.stage_run.ai_summary}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="re-card p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Gate de salida
            </p>
            <p className="text-xs mt-1" style={{ color: currentGateEvaluation?.canComplete ? "var(--re-success)" : "var(--re-text-muted)" }}>
              {currentGateEvaluation?.canComplete
                ? "La fase está lista para aprobación."
                : "Todavía hay bloqueos o checklist pendiente."}
            </p>

            {currentGateEvaluation?.checklist ? (
              <p className="text-xs mt-3" style={{ color: "var(--re-text-subtle)" }}>
                Checklist: {currentGateEvaluation.checklist.completed_required ?? 0}/
                {currentGateEvaluation.checklist.total_required ?? 0} ·{" "}
                {currentGateEvaluation.checklist.progress_percent ?? 0}%
              </p>
            ) : null}

            {currentGateEvaluation?.reasons?.length ? (
              <div className="mt-3 space-y-2">
                {currentGateEvaluation.reasons.map((reason, index) => (
                  <div
                    key={`${reason.code}-${index}`}
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: reason.blocking ? "rgba(192, 49, 43, 0.08)" : "var(--re-surface-2)",
                      color: reason.blocking ? "var(--re-danger)" : "var(--re-text-muted)",
                      border: `1px solid ${reason.blocking ? "rgba(192, 49, 43, 0.15)" : "var(--re-border)"}`,
                    }}
                  >
                    {reason.message}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="re-card p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Contexto técnico
            </p>
            <div className="mt-3 space-y-2 text-xs" style={{ color: "var(--re-text-muted)" }}>
              <p>
                <strong style={{ color: "var(--re-text)" }}>Etapa técnica:</strong> {currentTechnicalStage?.label ?? STAGE_LABELS[project.current_stage]}
              </p>
              <p>
                <strong style={{ color: "var(--re-text)" }}>Workflow:</strong> {currentStageWorkspace?.workflow_stage_key ?? "Sin run"}
              </p>
              <p>
                <strong style={{ color: "var(--re-text)" }}>Aprobaciones:</strong> {currentStageApprovals.length}
              </p>
            </div>
          </div>

          <div className="re-card p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Entregables automáticos del pipeline
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
              Outputs del workflow AI-native desde recepción hasta maquetación.
            </p>

            {autoWorkflowDeliverables.length > 0 ? (
              <div className="mt-3 space-y-2">
                {autoWorkflowDeliverables.map((stage) => (
                  <div
                    key={stage.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3"
                    style={{ background: "var(--re-surface-3)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "var(--re-text)" }}>
                        {stage.label}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: "var(--re-text-muted)" }}>
                        {stage.asset_label ?? stage.asset_kind ?? "Asset generado"}
                        {stage.asset_version ? ` · v${stage.asset_version}` : ""}
                        {stage.updated_at ? ` · ${formatDate(stage.updated_at)}` : ""}
                      </p>
                    </div>
                    <a
                      href={`/api/editorial/workflow-assets/${stage.asset_id}/download`}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                      style={{ background: "var(--re-blue)", color: "#fff" }}
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs mt-3" style={{ color: "var(--re-text-subtle)" }}>
                La lista se llena sola a medida que la IA completa cada una de las primeras ocho fases.
              </p>
            )}
          </div>

          <div className="re-card p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Entregables editoriales
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
              Cuando el workflow cierra en Control de calidad, aquí puedes bajar el manuscrito final en DOCX y el reporte consolidado de correcciones.
            </p>

            {deliverablesReady ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={finalManuscriptUrl}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{ background: "var(--re-blue)", color: "#fff" }}
                >
                  <Download className="w-4 h-4" />
                  {finalManuscriptButtonLabel}
                </a>
                <a
                  href={correctionReportUrl}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{ background: "var(--re-surface-3)", color: "var(--re-text)" }}
                >
                  <FileText className="w-4 h-4" />
                  Reporte de corrección
                </a>
              </div>
            ) : (
              <p className="text-xs mt-3" style={{ color: "var(--re-text-subtle)" }}>
                Se habilitan al terminar todo el pipeline activo y cerrar Control de calidad.
              </p>
            )}
          </div>

          {currentStageFile ? (
            <div className="re-card p-4">
              <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                Archivo vigente
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--re-text)" }}>
                {getEditorialFileName(currentStageFile)}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
                {formatBytes(currentStageFile.size_bytes)} · {formatDate(currentStageFile.created_at)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentStageFileViewUrl ? (
                  <a
                    href={currentStageFileViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                    style={{ background: "var(--re-surface-3)", color: "var(--re-text)" }}
                  >
                    <Eye className="w-4 h-4" />
                    Abrir
                  </a>
                ) : null}
                {currentStageFileDownloadUrl ? (
                  <a
                    href={currentStageFileDownloadUrl}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                    style={{ background: "var(--re-blue)", color: "#fff" }}
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="re-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Hallazgos de la fase
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
              Revisión concentrada en la fase activa, sin paneles duplicados ni alertas flotantes.
            </p>
          </div>
          <Badge variant="outline">{currentStageFindings.length}</Badge>
        </div>

        {currentStageFindings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
            Todavía no hay hallazgos para esta fase.
          </p>
        ) : (
          <div className="space-y-3">
            {currentStageFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-xl border p-4"
                style={{
                  borderColor:
                    finding.severity === "critical"
                      ? "rgba(192, 49, 43, 0.24)"
                      : finding.severity === "warning"
                        ? "rgba(245, 200, 66, 0.24)"
                        : "var(--re-border)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                      {finding.title}
                    </p>
                    <p className="text-xs mt-1 leading-5" style={{ color: "var(--re-text-muted)" }}>
                      {finding.description}
                    </p>
                    {finding.suggestion ? (
                      <p className="text-xs mt-2" style={{ color: "var(--re-blue)" }}>
                        Sugerencia: {finding.suggestion}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={finding.severity === "critical" ? "destructive" : "outline"}>
                    {finding.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="re-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--re-border)" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--re-text-muted)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
              Archivos ({files.length})
            </h2>
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--re-text-subtle)" }}>
            Historial del proyecto
          </span>
        </div>

        <div className="px-5 py-4">
          {files.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-3" style={{ background: "#2DD4D415" }}>
                <Upload className="w-6 h-6" style={{ color: "var(--re-cyan)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                No hay archivos cargados aún.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const fileViewUrl = `/api/editorial/files/${file.id}/view`;
                const fileDownloadUrl = `/api/editorial/files/${file.id}/download`;
                return (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                    style={{ borderColor: "var(--re-border)", background: "var(--re-surface-2)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
                        {getEditorialFileName(file)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
                        {file.file_type} · {file.mime_type ?? "—"} · {formatBytes(file.size_bytes)} · v{file.version}
                      </p>
                      {file.stage_key ? (
                        <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                          {STAGE_LABELS[file.stage_key]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                        {formatDate(file.created_at)}
                      </span>
                      <a
                        href={fileViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "var(--re-surface-3)", color: "var(--re-text)" }}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </a>
                      <a
                        href={fileDownloadUrl}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "var(--re-surface-3)", color: "var(--re-text)" }}
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleInviteClient}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: "var(--re-blue-light)" }} />
                Invitar cliente al portal
              </DialogTitle>
              <DialogDescription>
                El cliente recibirá un email para registrarse y acceder a su proyecto.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-name">Nombre del cliente</Label>
                <Input
                  id="invite-name"
                  placeholder="Nombre completo (opcional)"
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email del cliente</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                />
              </div>

              {inviteResult ? (
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: inviteResult.success ? "#22d3a010" : "#ef444410",
                    color: inviteResult.success ? "var(--re-success)" : "var(--re-danger)",
                    border: inviteResult.success ? "1px solid #22d3a030" : "1px solid #ef444430",
                  }}
                >
                  {inviteResult.message}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="gap-2">
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar invitación
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
