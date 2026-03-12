import type { EditorialStageKey } from "../types/editorial";

export const EDITORIAL_STAGE_KEYS: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
];

export const EDITORIAL_STAGE_LABELS: Record<EditorialStageKey, string> = {
  ingesta: "Ingesta",
  estructura: "Estructura",
  estilo: "Estilo",
  ortotipografia: "Ortotipografía",
  maquetacion: "Maquetación",
  revision_final: "Revisión Final",
};

export const EDITORIAL_STAGE_PROGRESS: Record<EditorialStageKey, number> = {
  ingesta: 15,
  estructura: 30,
  estilo: 50,
  ortotipografia: 70,
  maquetacion: 90,
  revision_final: 100,
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
