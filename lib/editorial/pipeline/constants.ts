import type { EditorialStageKey } from "../types/editorial";

export const EDITORIAL_STAGE_KEYS: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

export const EDITORIAL_STAGE_LABELS: Record<EditorialStageKey, string> = {
  ingesta: "Ingesta",
  estructura: "Estructura",
  estilo: "Estilo",
  ortotipografia: "Ortotipografía",
  maquetacion: "Maquetación",
  revision_final: "Revisión Final",
  export: "Exportación",
  distribution: "Distribución",
};

export const EDITORIAL_STAGE_PROGRESS: Record<EditorialStageKey, number> = {
  ingesta: 10,
  estructura: 25,
  estilo: 40,
  ortotipografia: 55,
  maquetacion: 70,
  revision_final: 85,
  export: 95,
  distribution: 100,
};

export const EDITORIAL_STAGE_STATUSES = [
  "pending",
  "queued",
  "processing",
  "review_required",
  "approved",
  "failed",
  "completed",
] as const;
