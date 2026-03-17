import type { EditorialStageKey } from "../types/editorial";

export const EDITORIAL_STAGE_KEYS: EditorialStageKey[] = [
  "recepcion",
  "preparacion",
  "correccion_linguistica",
  "edicion_editorial",
  "preprensa_kdp",
  "maquetacion_interior",
  "validacion_paginas",
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
  correccion_linguistica: 25,
  edicion_editorial: 35,
  preprensa_kdp: 45,
  maquetacion_interior: 55,
  validacion_paginas: 65,
  briefing_portada: 75,
  generacion_portada: 85,
  marketing_editorial: 95,
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
