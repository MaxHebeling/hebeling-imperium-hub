/**
 * Editorial pipeline barrel exports.
 *
 * Exposes stage keys, labels, progress values, status helpers, and transition
 * utilities for the 8-stage editorial workflow:
 *   ingesta → estructura → estilo → ortotipografía
 *   → maquetación → revisión_final → exportación → distribución
 */
export {
  EDITORIAL_STAGE_KEYS,
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_PROGRESS,
  EDITORIAL_STAGE_STATUSES,
} from "./constants";

export {
  isValidStageKey,
  getNextStage,
} from "./stage-utils";

export { calculateProgressPercent } from "./progress";

export {
  STAGE_CONFIG,
  initializeNextStage,
  transitionStageStatus,
  getStageStatus,
} from "./stage-transitions";

export {
  STAGE_REVEAL_DAYS,
  STAGE_CLIENT_MESSAGES,
  STAGE_CLIENT_LABELS,
  getClientVisibleStages,
  getClientVisibleProgress,
  getPendingNotifications,
} from "./client-delays";

export type { ClientStageVisibility } from "./client-delays";
