import type { EditorialStageKey } from "../types/editorial";
import { EDITORIAL_STAGE_PROGRESS } from "./constants";

export function calculateProgressPercent(stage: EditorialStageKey): number {
  return EDITORIAL_STAGE_PROGRESS[stage] ?? 0;
}
