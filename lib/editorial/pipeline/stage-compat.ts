import type {
  EditorialAnyStageKey,
  EditorialPipelineStageKey,
  EditorialProjectStageKey,
} from "@/lib/editorial/types/editorial";

export const EDITORIAL_PIPELINE_STAGE_KEYS: EditorialPipelineStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

const PIPELINE_STAGE_TO_PROJECT_STAGE: Record<
  EditorialPipelineStageKey,
  EditorialProjectStageKey
> = {
  ingesta: "recepcion",
  estructura: "preparacion",
  estilo: "edicion_editorial",
  ortotipografia: "correccion_linguistica",
  maquetacion: "maquetacion_interior",
  revision_final: "validacion_paginas",
  export: "marketing_editorial",
  distribution: "entrega_final",
};

const PROJECT_STAGE_TO_PIPELINE_STAGE: Record<
  EditorialProjectStageKey,
  EditorialPipelineStageKey
> = {
  recepcion: "ingesta",
  preparacion: "estructura",
  edicion_editorial: "estilo",
  correccion_linguistica: "ortotipografia",
  preprensa_kdp: "revision_final",
  maquetacion_interior: "maquetacion",
  validacion_paginas: "revision_final",
  briefing_portada: "maquetacion",
  generacion_portada: "maquetacion",
  marketing_editorial: "export",
  entrega_final: "distribution",
};

export function isPipelineStageKey(value: string): value is EditorialPipelineStageKey {
  return EDITORIAL_PIPELINE_STAGE_KEYS.includes(value as EditorialPipelineStageKey);
}

export function getNextPipelineStage(
  current: EditorialPipelineStageKey
): EditorialPipelineStageKey | null {
  const index = EDITORIAL_PIPELINE_STAGE_KEYS.indexOf(current);
  return index >= 0 && index < EDITORIAL_PIPELINE_STAGE_KEYS.length - 1
    ? EDITORIAL_PIPELINE_STAGE_KEYS[index + 1]
    : null;
}

export function mapPipelineStageToProjectStage(
  stageKey: EditorialPipelineStageKey
): EditorialProjectStageKey {
  return PIPELINE_STAGE_TO_PROJECT_STAGE[stageKey];
}

export function mapProjectStageToPipelineStage(
  stageKey: EditorialProjectStageKey
): EditorialPipelineStageKey {
  return PROJECT_STAGE_TO_PIPELINE_STAGE[stageKey];
}

export function resolvePipelineStageKey(
  stageKey: EditorialAnyStageKey
): EditorialPipelineStageKey {
  return isPipelineStageKey(stageKey)
    ? stageKey
    : mapProjectStageToPipelineStage(stageKey);
}
