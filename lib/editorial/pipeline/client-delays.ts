import type {
  EditorialAnyStageKey,
  EditorialPipelineStageKey,
} from "../types/editorial";
import { resolvePipelineStageKey } from "./stage-compat";

/**
 * Scheduled delay system for client visibility.
 * The AI processes everything internally in minutes, but the client
 * sees progress revealed gradually over 12 days.
 *
 * Each stage has a "reveal day" — the stage result becomes visible
 * to the client only after that many days since the pipeline started.
 */

/** Number of days after pipeline start that each stage becomes visible to the client. */
export const STAGE_REVEAL_DAYS: Record<EditorialPipelineStageKey, number> = {
  ingesta: 1,
  estructura: 3,
  estilo: 5,
  ortotipografia: 6,
  maquetacion: 8,
  revision_final: 9,
  export: 11,
  distribution: 12,
};

/** Human-readable status messages shown to the client for each stage. */
export const STAGE_CLIENT_MESSAGES: Record<
  EditorialPipelineStageKey,
  { active: string; completed: string }
> = {
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

/** Stage labels for client-facing display in Spanish. */
export const STAGE_CLIENT_LABELS: Record<EditorialPipelineStageKey, string> = {
  ingesta: "Revisión Inicial",
  estructura: "Análisis Estructural",
  estilo: "Corrección de Estilo",
  ortotipografia: "Corrección Ortotipográfica",
  maquetacion: "Diseño Interior",
  revision_final: "Revisión Final",
  export: "Preparación de Archivos",
  distribution: "Listo para Publicar",
};

const STAGE_ORDER: EditorialPipelineStageKey[] = [
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
  stageKey: EditorialPipelineStageKey;
  label: string;
  isRevealed: boolean;
  isActive: boolean;
  isCompleted: boolean;
  message: string;
  revealDay: number;
  /** Progress percentage (0-100) for this specific stage's reveal. */
  dayProgress: number;
}

/**
 * Determine which stages are visible to the client based on when the pipeline started.
 * @param pipelineStartedAt - ISO date string of when the pipeline was first started
 * @param actualCurrentStage - The actual stage the pipeline has reached internally
 */
export function getClientVisibleStages(
  pipelineStartedAt: string | null,
  actualCurrentStage: EditorialAnyStageKey
): ClientStageVisibility[] {
  const now = new Date();
  const startDate = pipelineStartedAt ? new Date(pipelineStartedAt) : now;
  const daysSinceStart = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const normalizedCurrentStage = resolvePipelineStageKey(actualCurrentStage);
  const actualStageIndex = STAGE_ORDER.indexOf(normalizedCurrentStage);

  return STAGE_ORDER.map((stageKey, index) => {
    const revealDay = STAGE_REVEAL_DAYS[stageKey];
    const isRevealed = daysSinceStart >= revealDay;

    // A stage is "completed" for the client if the next stage has been revealed
    // AND the actual pipeline has passed this stage
    const actuallyPassed = index <= actualStageIndex;
    const nextStageRevealed = index < STAGE_ORDER.length - 1
      ? daysSinceStart >= STAGE_REVEAL_DAYS[STAGE_ORDER[index + 1]]
      : daysSinceStart >= revealDay + 1;

    const isCompleted = isRevealed && actuallyPassed && nextStageRevealed;
    const isActive = isRevealed && actuallyPassed && !isCompleted;

    // Progress within the reveal window
    const dayProgress = isCompleted ? 100 : isActive ? Math.min(95, Math.round((daysSinceStart - revealDay) * 50)) : 0;

    const message = isCompleted
      ? STAGE_CLIENT_MESSAGES[stageKey].completed
      : isActive
        ? STAGE_CLIENT_MESSAGES[stageKey].active
        : "";

    return {
      stageKey,
      label: STAGE_CLIENT_LABELS[stageKey],
      isRevealed,
      isActive,
      isCompleted,
      message,
      revealDay,
      dayProgress,
    };
  });
}

/**
 * Calculate the client-visible progress percentage.
 * This is based on revealed stages, not actual progress.
 */
export function getClientVisibleProgress(
  pipelineStartedAt: string | null,
  actualCurrentStage: EditorialAnyStageKey
): number {
  const stages = getClientVisibleStages(pipelineStartedAt, actualCurrentStage);
  const completedCount = stages.filter((s) => s.isCompleted).length;
  const activeCount = stages.filter((s) => s.isActive).length;

  // Each completed stage = 12.5%, active stage = partial credit
  const baseProgress = (completedCount / 8) * 100;
  const activeProgress = (activeCount / 8) * 50; // active stage shows ~half progress

  return Math.min(100, Math.round(baseProgress + activeProgress));
}

/**
 * Get notification messages that should be sent to the client.
 * Compares previously sent notifications with what should now be visible.
 */
export function getPendingNotifications(
  pipelineStartedAt: string | null,
  actualCurrentStage: EditorialAnyStageKey,
  alreadyNotifiedStages: EditorialPipelineStageKey[]
): Array<{ stageKey: EditorialPipelineStageKey; message: string; type: "stage_completed" | "stage_active" }> {
  const stages = getClientVisibleStages(pipelineStartedAt, actualCurrentStage);
  const notifications: Array<{ stageKey: EditorialPipelineStageKey; message: string; type: "stage_completed" | "stage_active" }> = [];

  for (const stage of stages) {
    if (!stage.isRevealed) continue;
    if (alreadyNotifiedStages.includes(stage.stageKey)) continue;

    if (stage.isCompleted) {
      notifications.push({
        stageKey: stage.stageKey,
        message: `${stage.label}: ${STAGE_CLIENT_MESSAGES[stage.stageKey].completed}`,
        type: "stage_completed",
      });
    } else if (stage.isActive) {
      notifications.push({
        stageKey: stage.stageKey,
        message: `${stage.label}: ${STAGE_CLIENT_MESSAGES[stage.stageKey].active}`,
        type: "stage_active",
      });
    }
  }

  return notifications;
}
