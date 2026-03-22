import type { EditorialStageKey } from "../types/editorial";

export const EDITORIAL_STAGE_KEYS: EditorialStageKey[] = [
  "recepcion",
  "preparacion",
  "edicion_editorial",
  "correccion_linguistica",
  "preprensa_kdp",
  "validacion_paginas",
  "maquetacion_interior",
  "briefing_portada",
  "generacion_portada",
  "marketing_editorial",
  "entrega_final",
];

export const EDITORIAL_STAGE_LABELS: Record<EditorialStageKey, string> = {
  recepcion: "Recepción del manuscrito",
  preparacion: "Preparación y estructuración",
  correccion_linguistica: "Corrección lingüística",
  edicion_editorial: "Edición editorial profunda",
  preprensa_kdp: "Preprensa y validación KDP",
  maquetacion_interior: "Maquetación interior final",
  validacion_paginas: "Validación de páginas y medidas",
  briefing_portada: "Briefing de portada",
  generacion_portada: "Generación de portada",
  marketing_editorial: "Marketing editorial",
  entrega_final: "Entrega final",
};

export const EDITORIAL_STAGE_PROGRESS: Record<EditorialStageKey, number> = {
  recepcion: 5,
  preparacion: 15,
  edicion_editorial: 30,
  correccion_linguistica: 45,
  preprensa_kdp: 55,
  validacion_paginas: 65,
  maquetacion_interior: 75,
  briefing_portada: 82,
  generacion_portada: 85,
  marketing_editorial: 92,
  entrega_final: 100,
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
