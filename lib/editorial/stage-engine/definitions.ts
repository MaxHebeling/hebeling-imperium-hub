import type {
  EditorialArtifactRole,
  EditorialWorkflowStageDefinition,
  EditorialWorkflowStageKey,
} from "@/lib/editorial/types/stage-engine";

export const EDITORIAL_WORKFLOW_STAGE_KEYS: EditorialWorkflowStageKey[] = [
  "ingesta",
  "diagnostico_editorial",
  "edicion_estructural",
  "edicion_linea",
  "copyediting_ortotipografia",
  "cierre_texto",
  "diseno_interior",
  "portada",
  "prueba_final",
  "publicacion",
  "postpublicacion",
];

const manuscriptRequired: EditorialArtifactRole[] = ["manuscript_original"];

export const EDITORIAL_WORKFLOW_STAGE_DEFINITIONS: EditorialWorkflowStageDefinition[] = [
  {
    key: "ingesta",
    name: "Ingesta",
    order: 1,
    description: "Recepcion, validacion tecnica y fingerprint del manuscrito.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: manuscriptRequired,
  },
  {
    key: "diagnostico_editorial",
    name: "Diagnostico Editorial",
    order: 2,
    description: "Dictamen editorial, mapa de riesgos y plan de intervencion.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: manuscriptRequired,
  },
  {
    key: "edicion_estructural",
    name: "Edicion Estructural",
    order: 3,
    description: "Revision narrativa, estructura, ritmo y arquitectura del manuscrito.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["editorial_working"],
  },
  {
    key: "edicion_linea",
    name: "Edicion de Linea",
    order: 4,
    description: "Claridad, voz, ritmo y refinamiento de la prosa.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["editorial_working"],
  },
  {
    key: "copyediting_ortotipografia",
    name: "Copyediting y Ortotipografia",
    order: 5,
    description: "Correccion gramatical, consistencia y ortotipografia.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["editorial_working"],
  },
  {
    key: "cierre_texto",
    name: "Cierre de Texto",
    order: 6,
    description: "Bloqueo del texto maestro y validacion final de contenido.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["master_text"],
  },
  {
    key: "diseno_interior",
    name: "Diseno Interior",
    order: 7,
    description: "Maquetacion, paginacion y produccion del interior.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["interior_pdf"],
  },
  {
    key: "portada",
    name: "Portada",
    order: 8,
    description: "Concepto, direccion de arte y aprobacion de portada.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["cover_final"],
  },
  {
    key: "prueba_final",
    name: "Prueba Final",
    order: 9,
    description: "Revision integral final de interior, portada y metadata.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["proof_pack"],
  },
  {
    key: "publicacion",
    name: "Publicacion",
    order: 10,
    description: "Preparacion y activacion de assets de distribucion.",
    requiresHumanApproval: true,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: ["distribution_asset"],
  },
  {
    key: "postpublicacion",
    name: "Postpublicacion",
    order: 11,
    description: "Seguimiento, erratas, mejoras y futuras iteraciones.",
    requiresHumanApproval: false,
    allowsAi: true,
    allowsFileOutput: true,
    requiredArtifactRoles: [],
  },
];

export const EDITORIAL_WORKFLOW_STAGE_MAP = Object.fromEntries(
  EDITORIAL_WORKFLOW_STAGE_DEFINITIONS.map((stage) => [stage.key, stage])
) as Record<EditorialWorkflowStageKey, EditorialWorkflowStageDefinition>;

export function getNextEditorialWorkflowStage(
  currentStageKey: EditorialWorkflowStageKey
): EditorialWorkflowStageKey | null {
  const currentIndex = EDITORIAL_WORKFLOW_STAGE_KEYS.indexOf(currentStageKey);
  if (currentIndex === -1 || currentIndex === EDITORIAL_WORKFLOW_STAGE_KEYS.length - 1) {
    return null;
  }

  return EDITORIAL_WORKFLOW_STAGE_KEYS[currentIndex + 1];
}

export function isEditorialWorkflowStageKey(value: string): value is EditorialWorkflowStageKey {
  return EDITORIAL_WORKFLOW_STAGE_KEYS.includes(value as EditorialWorkflowStageKey);
}
