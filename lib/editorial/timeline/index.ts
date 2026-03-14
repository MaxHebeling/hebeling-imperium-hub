export {
  initializeTimeline,
  getClientTimeline,
  advanceTimeline,
  applyTimelineOverride,
  createArtifact,
  getArtifacts,
  toggleArtifactVisibility,
} from "./controller";

export { JOURNEY_STAGES, JOURNEY_STAGE_MAP, JOURNEY_TOTAL_DAYS } from "./journey-config";

export type {
  ClientTimelineEntry,
  ClientTimelineState,
  ClientTimelineStageView,
  ClientArtifactView,
  StageArtifact,
  TimelineOverride,
  TimelineOverrideType,
  ArtifactType,
  JourneyStageConfig,
  TimelineEntryStatus,
} from "./types";
