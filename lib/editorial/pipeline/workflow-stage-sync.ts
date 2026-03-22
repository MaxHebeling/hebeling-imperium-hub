import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialProjectStageKey } from "@/lib/editorial/types/editorial";

const WORKFLOW_TO_LEGACY_STAGE: Record<
  EditorialWorkflowState,
  EditorialProjectStageKey
> = {
  received: "recepcion",
  normalized: "preparacion",
  analyzed: "preparacion",
  editing_planned: "edicion_editorial",
  content_edited: "edicion_editorial",
  proofread: "correccion_linguistica",
  validated: "preprensa_kdp",
  metadata_ready: "maquetacion_interior",
  cover_ready: "maquetacion_interior",
  layout_ready: "maquetacion_interior",
  qa_passed: "validacion_paginas",
  packaged: "entrega_final",
  published: "entrega_final",
  marketed: "entrega_final",
};

export function mapWorkflowStateToLegacyStage(
  state: EditorialWorkflowState
): EditorialProjectStageKey {
  return WORKFLOW_TO_LEGACY_STAGE[state];
}
