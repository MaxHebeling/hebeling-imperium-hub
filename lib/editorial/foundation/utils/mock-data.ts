import { createEditorialPipelineService } from "../services";
import type {
  EditorialProjectAggregate,
  EditorialProjectInitializationInput,
} from "../models";

const DEFAULT_MOCK_INPUT: EditorialProjectInitializationInput = {
  author: "Reino Editorial Demo Author",
  title: "The Bridge of Light",
  manuscriptSource: "upload",
  originalFileName: "bridge-of-light.docx",
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  language: "es",
  genre: "Ficcion espiritual",
  sizeBytes: 184320,
  synopsis: "Demo manuscript used to validate the editorial workflow foundation.",
  tags: ["demo", "editorial", "workflow"],
  sourceLabel: "Local demo upload",
};

export function createMockEditorialProjectAggregate(
  overrides: Partial<EditorialProjectInitializationInput> = {}
): EditorialProjectAggregate {
  const service = createEditorialPipelineService();
  return service.initializeProject({
    ...DEFAULT_MOCK_INPUT,
    ...overrides,
  });
}

export function createMockAnalyzedProjectAggregate(): EditorialProjectAggregate {
  const service = createEditorialPipelineService();
  let aggregate = service.initializeProject(DEFAULT_MOCK_INPUT);

  aggregate = service.transition(aggregate, "normalized", {
    reason: "Mock normalization completed.",
  });
  aggregate = service.transition(aggregate, "analyzed", {
    reason: "Mock analysis completed.",
  });

  return aggregate;
}

export const mockEditorialProjectAggregate =
  createMockEditorialProjectAggregate();
