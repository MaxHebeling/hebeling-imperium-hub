import {
  EDITORIAL_FUTURE_STAGE_STATUS,
  EDITORIAL_INITIAL_STAGE_STATUS,
  EDITORIAL_INITIAL_STATE,
  EDITORIAL_WORKFLOW_SEQUENCE,
} from "../pipeline";
import { getNextEditorialWorkflowState } from "../pipeline";
import type {
  EditorialPhaseExecutionResult,
  EditorialPhaseHandler,
  EditorialPipelineService,
  EditorialProjectAggregate,
  EditorialProjectInitializationInput,
  EditorialWorkflowStage,
  EditorialWorkflowState,
  PipelineLog,
  PipelineLogDraft,
  WorkflowTransitionOptions,
} from "../models";
import {
  editorialProjectInitializationInputSchema,
  validateEditorialProjectAggregate,
  validateEditorialWorkflowTransition,
} from "../pipeline";
import {
  createFoundationId,
  createFoundationTimestamp,
} from "../utils/runtime";

function createPipelineLog(
  projectId: string,
  workflowId: string,
  draft: PipelineLogDraft
): PipelineLog {
  return {
    id: createFoundationId(),
    project_id: projectId,
    workflow_id: workflowId,
    stage_id: draft.stage_id ?? null,
    stage_key: draft.stage_key ?? null,
    event_type: draft.event_type,
    level: draft.level,
    message: draft.message,
    payload: draft.payload ?? null,
    created_at: createFoundationTimestamp(),
  };
}

function createWorkflowStages(projectId: string): EditorialWorkflowStage[] {
  return EDITORIAL_WORKFLOW_SEQUENCE.map((stageKey) => ({
    id: createFoundationId(),
    project_id: projectId,
    stage_key: stageKey,
    status:
      stageKey === EDITORIAL_INITIAL_STATE
        ? EDITORIAL_INITIAL_STAGE_STATUS
        : EDITORIAL_FUTURE_STAGE_STATUS,
    started_at:
      stageKey === EDITORIAL_INITIAL_STATE ? createFoundationTimestamp() : null,
    finished_at: null,
    agent_used: null,
    cost: null,
    output_file: null,
    logs: [],
  }));
}

function applyLogToAggregate(
  aggregate: EditorialProjectAggregate,
  log: PipelineLog
): EditorialProjectAggregate {
  const stages = aggregate.workflow.stages.map((stage) => {
    if (stage.id !== log.stage_id && stage.stage_key !== log.stage_key) {
      return stage;
    }

    return {
      ...stage,
      logs: [...stage.logs, log],
    };
  });

  return {
    ...aggregate,
    workflow: {
      ...aggregate.workflow,
      stages,
      updated_at: log.created_at,
    },
    logs: [...aggregate.logs, log],
  };
}

function appendTransitionLog(
  aggregate: EditorialProjectAggregate,
  fromState: EditorialWorkflowState,
  toState: EditorialWorkflowState,
  reason: string | null
): EditorialProjectAggregate {
  return applyLogToAggregate(
    aggregate,
    createPipelineLog(aggregate.project.id, aggregate.workflow.id, {
      stage_key: toState,
      event_type: "workflow.transitioned",
      level: "info",
      message: `Workflow transitioned from ${fromState} to ${toState}.`,
      payload: {
        fromState,
        toState,
        reason,
      },
    })
  );
}

export function createEditorialPipelineService(
  initialHandlers: EditorialPhaseHandler[] = []
): EditorialPipelineService {
  const handlers = new Map<EditorialWorkflowState, EditorialPhaseHandler>();

  initialHandlers.forEach((handler) => {
    handlers.set(handler.stageKey, handler);
  });

  return {
    initializeProject(
      input: EditorialProjectInitializationInput
    ): EditorialProjectAggregate {
      const parsed = editorialProjectInitializationInputSchema.parse(input);
      const timestamp = createFoundationTimestamp();
      const projectId = createFoundationId();
      const workflowId = createFoundationId();
      const metadataId = createFoundationId();
      const manuscriptAssetId = createFoundationId();

      const manuscriptAsset = {
        id: manuscriptAssetId,
        project_id: projectId,
        source_type: parsed.manuscriptSource,
        source_label: parsed.sourceLabel ?? parsed.originalFileName,
        source_uri: parsed.sourceUri ?? null,
        original_file_name: parsed.originalFileName,
        mime_type: parsed.mimeType,
        checksum: parsed.checksum ?? null,
        size_bytes: parsed.sizeBytes ?? null,
        extracted_text_uri: null,
        version: 1,
        uploaded_at: timestamp,
      };

      const metadata = {
        id: metadataId,
        project_id: projectId,
        author: parsed.author,
        title: parsed.title,
        subtitle: parsed.subtitle ?? null,
        language: parsed.language,
        genre: parsed.genre,
        synopsis: parsed.synopsis ?? null,
        tags: parsed.tags ?? [],
        created_at: timestamp,
        updated_at: timestamp,
      };

      const workflow = {
        id: workflowId,
        project_id: projectId,
        current_state: EDITORIAL_INITIAL_STATE,
        stages: createWorkflowStages(projectId),
        transitions: [
          {
            id: createFoundationId(),
            project_id: projectId,
            from_state: null,
            to_state: EDITORIAL_INITIAL_STATE,
            transitioned_at: timestamp,
            validated: true,
            reason: "Workflow initialized",
          },
        ],
        created_at: timestamp,
        updated_at: timestamp,
      };

      const project = {
        id: projectId,
        author: parsed.author,
        title: parsed.title,
        manuscript_source: parsed.manuscriptSource,
        language: parsed.language,
        genre: parsed.genre,
        current_status: EDITORIAL_INITIAL_STATE,
        metadata,
        manuscript_asset: manuscriptAsset,
        workflow_id: workflowId,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const aggregate: EditorialProjectAggregate = {
        project,
        workflow,
        logs: [],
      };

      const initialized = applyLogToAggregate(
        aggregate,
        createPipelineLog(projectId, workflowId, {
          stage_key: EDITORIAL_INITIAL_STATE,
          event_type: "workflow.initialized",
          level: "info",
          message: "Editorial workflow foundation initialized.",
          payload: {
            initialState: EDITORIAL_INITIAL_STATE,
            title: parsed.title,
            author: parsed.author,
          },
        })
      );

      return validateEditorialProjectAggregate(initialized);
    },

    transition(
      aggregate: EditorialProjectAggregate,
      nextState: EditorialWorkflowState,
      options?: WorkflowTransitionOptions
    ): EditorialProjectAggregate {
      const currentState = aggregate.workflow.current_state;
      validateEditorialWorkflowTransition(currentState, nextState);

      const timestamp = createFoundationTimestamp();
      const stages = aggregate.workflow.stages.map((stage) => {
        if (stage.stage_key === currentState) {
          return {
            ...stage,
            status: "completed" as const,
            finished_at: timestamp,
            agent_used: options?.agentUsed ?? stage.agent_used,
            cost: options?.cost ?? stage.cost,
            output_file: options?.outputFile ?? stage.output_file,
          };
        }

        if (stage.stage_key === nextState) {
          return {
            ...stage,
            status: "in_progress" as const,
            started_at: stage.started_at ?? timestamp,
          };
        }

        return stage;
      });

      const transitioned: EditorialProjectAggregate = {
        ...aggregate,
        project: {
          ...aggregate.project,
          current_status: nextState,
          updated_at: timestamp,
        },
        workflow: {
          ...aggregate.workflow,
          current_state: nextState,
          stages,
          transitions: [
            ...aggregate.workflow.transitions,
            {
              id: createFoundationId(),
              project_id: aggregate.project.id,
              from_state: currentState,
              to_state: nextState,
              transitioned_at: timestamp,
              validated: true,
              reason: options?.reason ?? null,
            },
          ],
          updated_at: timestamp,
        },
      };

      const withLog = appendTransitionLog(
        transitioned,
        currentState,
        nextState,
        options?.reason ?? null
      );

      return validateEditorialProjectAggregate(withLog);
    },

    appendLog(
      aggregate: EditorialProjectAggregate,
      draft: PipelineLogDraft
    ): EditorialProjectAggregate {
      const log = createPipelineLog(
        aggregate.project.id,
        aggregate.workflow.id,
        draft
      );

      return validateEditorialProjectAggregate(
        applyLogToAggregate(aggregate, log)
      );
    },

    getNextState(currentState: EditorialWorkflowState) {
      return getNextEditorialWorkflowState(currentState);
    },

    registerPhaseHandler(handler: EditorialPhaseHandler) {
      handlers.set(handler.stageKey, handler);
    },

    getPhaseHandler(stageKey: EditorialWorkflowState) {
      return handlers.get(stageKey);
    },

    async executeCurrentPhase(
      aggregate: EditorialProjectAggregate
    ): Promise<EditorialProjectAggregate> {
      const currentState = aggregate.workflow.current_state;
      const handler = handlers.get(currentState);

      if (!handler) {
        return this.appendLog(aggregate, {
          stage_key: currentState,
          event_type: "phase.handler_missing",
          level: "warning",
          message: `No phase handler registered for ${currentState}.`,
          payload: null,
        });
      }

      const stage = aggregate.workflow.stages.find(
        (candidate) => candidate.stage_key === currentState
      );

      if (!stage) {
        throw new Error(`Current stage ${currentState} is missing from workflow.`);
      }

      const result: EditorialPhaseExecutionResult = await handler.execute({
        aggregate,
        stage,
      });

      let updatedAggregate = aggregate;

      for (const logDraft of result.logs ?? []) {
        updatedAggregate = this.appendLog(updatedAggregate, {
          ...logDraft,
          stage_key: logDraft.stage_key ?? currentState,
          stage_id: logDraft.stage_id ?? stage.id,
        });
      }

      if (!result.nextState) {
        return updatedAggregate;
      }

      return this.transition(updatedAggregate, result.nextState, {
        reason: `Phase ${currentState} completed.`,
        agentUsed: result.agentUsed ?? null,
        cost: result.cost ?? null,
        outputFile: result.outputFile ?? null,
      });
    },
  };
}
