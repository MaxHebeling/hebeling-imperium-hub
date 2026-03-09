import type { EditorialStageKey } from "../types/editorial";
import { EDITORIAL_STAGE_KEYS } from "./constants";

export function isValidStageKey(key: string): key is EditorialStageKey {
  return EDITORIAL_STAGE_KEYS.includes(key as EditorialStageKey);
}

export function getNextStage(current: EditorialStageKey): EditorialStageKey | null {
  const idx = EDITORIAL_STAGE_KEYS.indexOf(current);
  return idx >= 0 && idx < EDITORIAL_STAGE_KEYS.length - 1
    ? EDITORIAL_STAGE_KEYS[idx + 1]
    : null;
}
