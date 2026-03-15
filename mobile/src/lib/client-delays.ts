/**
 * Sistema de timeline editorial de 12 días — cliente.
 * Replica la lógica del portal web para mostrar progreso gradual.
 * El proceso interno es rápido, pero el cliente ve avance día a día.
 */

export type EditorialStageKey =
  | "ingesta"
  | "estructura"
  | "estilo"
  | "ortotipografia"
  | "maquetacion"
  | "revision_final"
  | "export"
  | "distribution";

/** Día en que cada etapa se revela al cliente. */
export const STAGE_REVEAL_DAYS: Record<EditorialStageKey, number> = {
  ingesta: 1,
  estructura: 3,
  estilo: 5,
  ortotipografia: 6,
  maquetacion: 8,
  revision_final: 9,
  export: 11,
  distribution: 12,
};

/** Etiquetas en español para el cliente. */
export const STAGE_CLIENT_LABELS: Record<EditorialStageKey, string> = {
  ingesta: "Recepción del manuscrito",
  estructura: "Análisis editorial",
  estilo: "Edición de estilo",
  ortotipografia: "Corrección ortotipográfica",
  maquetacion: "Maquetación interior",
  revision_final: "Prueba final",
  export: "Preparación de publicación",
  distribution: "Listo para publicar",
};

/** Descripciones humanizadas para cada etapa (sin mencionar IA). */
export const STAGE_DESCRIPTIONS: Record<EditorialStageKey, string> = {
  ingesta:
    "Tu manuscrito ha sido recibido por nuestro equipo editorial. Estamos preparando todo para iniciar el proceso de edición profesional de tu libro.",
  estructura:
    "Estamos revisando la organización de tu contenido para mejorar la claridad y la fuerza del mensaje de tu libro. Analizamos capítulos, secciones y la narrativa general.",
  estilo:
    "Nuestro equipo trabaja en la corrección de estilo de tu obra. Mejoramos la fluidez, el tono y la expresión para que tu mensaje llegue con la mayor claridad al lector.",
  ortotipografia:
    "Revisamos cada detalle ortográfico y tipográfico de tu libro. Nos aseguramos de que cada palabra, signo y formato esté perfecto.",
  maquetacion:
    "Estamos diseñando el interior de tu libro con un layout profesional. Definimos márgenes, tipografía, espaciado y todos los elementos visuales del interior.",
  revision_final:
    "Tu libro está en la revisión final exhaustiva. Verificamos que todo esté impecable antes de dar luz verde a la publicación.",
  export:
    "Estamos preparando los archivos finales de tu libro en todos los formatos necesarios para la publicación digital e impresa.",
  distribution:
    "¡Tu libro está listo! Estamos configurando la distribución en las plataformas editoriales para que tu obra llegue a los lectores.",
};

/** Mensajes de estado activo/completado para el cliente. */
export const STAGE_CLIENT_MESSAGES: Record<EditorialStageKey, { active: string; completed: string }> = {
  ingesta: {
    active: "Tu manuscrito está siendo revisado por nuestro equipo editorial.",
    completed: "Revisión inicial completada.",
  },
  estructura: {
    active: "Analizando la estructura narrativa de tu obra.",
    completed: "Análisis estructural completado.",
  },
  estilo: {
    active: "Nuestro equipo trabaja en la corrección de estilo.",
    completed: "Corrección de estilo finalizada.",
  },
  ortotipografia: {
    active: "Revisando ortografía y tipografía profesional.",
    completed: "Corrección ortotipográfica completada.",
  },
  maquetacion: {
    active: "Diseñando el interior de tu libro con layout profesional.",
    completed: "Diseño interior completado.",
  },
  revision_final: {
    active: "Tu libro está en revisión final exhaustiva.",
    completed: "Revisión final aprobada.",
  },
  export: {
    active: "Preparando los archivos finales de tu libro.",
    completed: "Archivos finales listos.",
  },
  distribution: {
    active: "Configurando la distribución de tu obra.",
    completed: "¡Tu libro está listo para publicar!",
  },
};

const STAGE_ORDER: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

export interface ClientStageVisibility {
  stageKey: EditorialStageKey;
  label: string;
  description: string;
  isRevealed: boolean;
  isActive: boolean;
  isCompleted: boolean;
  message: string;
  revealDay: number;
  dayProgress: number;
  index: number;
}

/**
 * Calcula qué etapas son visibles para el cliente basándose en el día del proceso.
 */
export function getClientVisibleStages(
  pipelineStartedAt: string | null,
  actualCurrentStage: EditorialStageKey
): ClientStageVisibility[] {
  const now = new Date();
  const startDate = pipelineStartedAt ? new Date(pipelineStartedAt) : now;
  const daysSinceStart = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const actualStageIndex = STAGE_ORDER.indexOf(actualCurrentStage);

  return STAGE_ORDER.map((stageKey, index) => {
    const revealDay = STAGE_REVEAL_DAYS[stageKey];
    const isRevealed = daysSinceStart >= revealDay;

    const actuallyPassed = index <= actualStageIndex;
    const nextStageRevealed =
      index < STAGE_ORDER.length - 1
        ? daysSinceStart >= STAGE_REVEAL_DAYS[STAGE_ORDER[index + 1]]
        : daysSinceStart >= revealDay + 1;

    const isCompleted = isRevealed && actuallyPassed && nextStageRevealed;
    const isActive = isRevealed && actuallyPassed && !isCompleted;

    const dayProgress = isCompleted ? 100 : isActive ? Math.min(95, Math.round((daysSinceStart - revealDay) * 50)) : 0;

    const message = isCompleted
      ? STAGE_CLIENT_MESSAGES[stageKey].completed
      : isActive
        ? STAGE_CLIENT_MESSAGES[stageKey].active
        : "";

    return {
      stageKey,
      label: STAGE_CLIENT_LABELS[stageKey],
      description: STAGE_DESCRIPTIONS[stageKey],
      isRevealed,
      isActive,
      isCompleted,
      message,
      revealDay,
      dayProgress,
      index,
    };
  });
}

/**
 * Calcula el progreso visible para el cliente (0-100%).
 */
export function getClientVisibleProgress(
  pipelineStartedAt: string | null,
  actualCurrentStage: EditorialStageKey
): number {
  const stages = getClientVisibleStages(pipelineStartedAt, actualCurrentStage);
  const completedCount = stages.filter((s) => s.isCompleted).length;
  const activeCount = stages.filter((s) => s.isActive).length;

  const baseProgress = (completedCount / 8) * 100;
  const activeProgress = (activeCount / 8) * 50;

  return Math.min(100, Math.round(baseProgress + activeProgress));
}

/**
 * Calcula el día actual del proceso de 12 días.
 */
export function getCurrentDay(pipelineStartedAt: string | null): number {
  if (!pipelineStartedAt) return 1;
  const now = new Date();
  const start = new Date(pipelineStartedAt);
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(12, Math.max(1, days + 1));
}

export { STAGE_ORDER };
