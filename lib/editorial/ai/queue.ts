/**
 * Token-aware job queue for the editorial AI pipeline.
 *
 * Features:
 * - Sequential execution of heavy GPT tasks (no parallel OpenAI calls)
 * - Minimum configurable delay between jobs (default 25s)
 * - Per-job token usage estimation based on manuscript length + task type
 * - Rolling TPM (tokens-per-minute) tracker that pauses the queue when
 *   approaching the OpenAI rate limit
 * - Automatic retry with exponential backoff after cooldown
 * - Stage-order enforcement so jobs run in pipeline order
 */

import type { EditorialAiTaskKey, EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

// ─── Configuration ──────────────────────────────────────────────────────

/** Minimum pause (ms) between consecutive job executions. */
const MIN_INTER_JOB_DELAY_MS = 25_000; // 25 seconds

/** OpenAI TPM limit for gpt-4o (Tier 1 default). Adjust per your plan. */
const OPENAI_TPM_LIMIT = 800_000;

/** When estimated rolling TPM reaches this fraction of the limit, pause. */
const TPM_PAUSE_THRESHOLD = 0.85;

/** Cooldown (ms) to wait when the TPM threshold is hit before retrying. */
const TPM_COOLDOWN_MS = 60_000; // 60 seconds

/** Maximum retry attempts for a single job before marking it as failed. */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms). */
const RETRY_BASE_DELAY_MS = 10_000;

/** Rolling window (ms) for tracking token usage. */
const TPM_WINDOW_MS = 60_000;

// ─── Stage ordering (pipeline sequence) ────────────────────────────────

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

function stageIndex(key: EditorialStageKey): number {
  const idx = STAGE_ORDER.indexOf(key);
  return idx === -1 ? STAGE_ORDER.length : idx;
}

// ─── Token estimation ──────────────────────────────────────────────────

/**
 * Rough token-per-character ratios for Spanish text:
 *   ~1 token ≈ 4 characters (conservative for Spanish / mixed content).
 *
 * We estimate total tokens as:
 *   input_tokens  = ceil(manuscriptChars / 4) + systemPromptOverhead
 *   output_tokens = taskOutputEstimate
 *   total         = input_tokens + output_tokens
 */
const SYSTEM_PROMPT_OVERHEAD_TOKENS = 1_500; // system prompt + schema overhead

/** Estimated output tokens per task type. */
const TASK_OUTPUT_ESTIMATES: Record<string, number> = {
  manuscript_analysis: 3_000,
  structure_analysis: 3_000,
  style_suggestions: 4_000,
  orthotypography_review: 4_000,
  layout_analysis: 2_500,
  redline_diff: 5_000,
  export_validation: 2_000,
  metadata_generation: 2_000,
  issue_detection: 2_500,
  quality_scoring: 1_500,
  typography_check: 2_000,
  page_flow_review: 2_000,
  // Anthropic tasks — still estimated for queue budgeting
  line_editing: 6_000,
  copyediting: 6_000,
  concept_review: 3_000,
};

export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Estimate how many tokens a job will consume.
 *
 * @param manuscriptCharCount - length of the manuscript text in characters
 * @param taskKey             - the AI task type
 */
export function estimateJobTokens(
  manuscriptCharCount: number,
  taskKey: EditorialAiTaskKey
): TokenEstimate {
  const inputTokens =
    Math.ceil(manuscriptCharCount / 4) + SYSTEM_PROMPT_OVERHEAD_TOKENS;
  const outputTokens = TASK_OUTPUT_ESTIMATES[taskKey] ?? 3_000;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

// ─── Rolling TPM tracker ───────────────────────────────────────────────

interface TokenUsageEntry {
  timestamp: number;
  tokens: number;
}

class TokenRateTracker {
  private entries: TokenUsageEntry[] = [];

  /** Record token usage at the current time. */
  record(tokens: number): void {
    this.entries.push({ timestamp: Date.now(), tokens });
    this.prune();
  }

  /** Get the sum of tokens used in the rolling window. */
  currentTPM(): number {
    this.prune();
    return this.entries.reduce((sum, e) => sum + e.tokens, 0);
  }

  /** Returns true when we should pause to avoid exceeding the TPM limit. */
  shouldPause(): boolean {
    return this.currentTPM() >= OPENAI_TPM_LIMIT * TPM_PAUSE_THRESHOLD;
  }

  /** Estimated ms to wait before the window rolls past enough usage. */
  estimatedCooldownMs(): number {
    if (!this.shouldPause()) return 0;
    const oldest = this.entries[0];
    if (!oldest) return TPM_COOLDOWN_MS;
    const age = Date.now() - oldest.timestamp;
    // Wait until the oldest entries fall out of the window
    return Math.max(TPM_WINDOW_MS - age + 1_000, TPM_COOLDOWN_MS);
  }

  private prune(): void {
    const cutoff = Date.now() - TPM_WINDOW_MS;
    this.entries = this.entries.filter((e) => e.timestamp > cutoff);
  }
}

// ─── Queue entry ───────────────────────────────────────────────────────

export interface QueueEntry {
  jobId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  taskKey: EditorialAiTaskKey;
  context: EditorialAiJobContext;
  manuscriptText?: string;
  skipAutoAdvance?: boolean;
  /** Estimated token cost for this job. */
  estimatedTokens: number;
  /** Number of times this entry has been retried. */
  retryCount: number;
  /** Timestamp when the entry was enqueued. */
  enqueuedAt: number;
}

export type JobProcessor = (entry: QueueEntry) => Promise<void>;

export type QueueEventType =
  | "job_started"
  | "job_completed"
  | "job_failed"
  | "job_retrying"
  | "queue_paused_tpm"
  | "queue_resumed"
  | "queue_drained";

export interface QueueEvent {
  type: QueueEventType;
  jobId?: string;
  detail?: string;
  tokenUsage?: number;
  currentTPM?: number;
  retryCount?: number;
}

export type QueueEventListener = (event: QueueEvent) => void;

// ─── EditorialJobQueue ─────────────────────────────────────────────────

export class EditorialJobQueue {
  private queue: QueueEntry[] = [];
  private processing = false;
  private paused = false;
  private tokenTracker = new TokenRateTracker();
  private lastJobFinishedAt = 0;
  private processor: JobProcessor;
  private listeners: QueueEventListener[] = [];

  constructor(processor: JobProcessor) {
    this.processor = processor;
  }

  // ── Public API ─────────────────────────────────────────────────────

  /** Add one or more jobs to the queue (sorted by stage order). */
  enqueue(entries: QueueEntry[]): void {
    this.queue.push(...entries);
    this.sortQueue();
    // Start draining if not already running
    if (!this.processing) {
      this.drain().catch((err) =>
        console.error("[EditorialJobQueue] Drain error:", err)
      );
    }
  }

  /** Number of entries currently waiting. */
  get pending(): number {
    return this.queue.length;
  }

  /** Whether the queue is actively processing. */
  get isProcessing(): boolean {
    return this.processing;
  }

  /** Whether the queue is paused due to TPM limits. */
  get isPaused(): boolean {
    return this.paused;
  }

  /** Current rolling tokens-per-minute. */
  get currentTPM(): number {
    return this.tokenTracker.currentTPM();
  }

  /** Subscribe to queue lifecycle events. */
  on(listener: QueueEventListener): void {
    this.listeners.push(listener);
  }

  /** Get a snapshot of queue state for diagnostics / API responses. */
  snapshot(): {
    pending: number;
    processing: boolean;
    paused: boolean;
    currentTPM: number;
    tpmLimit: number;
    tpmThreshold: number;
    interJobDelayMs: number;
    entries: Array<{
      jobId: string;
      stageKey: string;
      taskKey: string;
      estimatedTokens: number;
      retryCount: number;
    }>;
  } {
    return {
      pending: this.queue.length,
      processing: this.processing,
      paused: this.paused,
      currentTPM: this.tokenTracker.currentTPM(),
      tpmLimit: OPENAI_TPM_LIMIT,
      tpmThreshold: OPENAI_TPM_LIMIT * TPM_PAUSE_THRESHOLD,
      interJobDelayMs: MIN_INTER_JOB_DELAY_MS,
      entries: this.queue.map((e) => ({
        jobId: e.jobId,
        stageKey: e.stageKey,
        taskKey: e.taskKey,
        estimatedTokens: e.estimatedTokens,
        retryCount: e.retryCount,
      })),
    };
  }

  // ── Internal ───────────────────────────────────────────────────────

  private emit(event: QueueEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the queue
      }
    }
  }

  /** Sort queue entries by pipeline stage order, then by enqueue time. */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const stageDiff = stageIndex(a.stageKey) - stageIndex(b.stageKey);
      if (stageDiff !== 0) return stageDiff;
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  /**
   * Main drain loop: processes entries one at a time, respecting delays,
   * TPM budgets, and retry logic.
   */
  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        // ── TPM gate ──
        if (this.tokenTracker.shouldPause()) {
          this.paused = true;
          const cooldown = this.tokenTracker.estimatedCooldownMs();
          this.emit({
            type: "queue_paused_tpm",
            detail: `TPM limit approaching (${this.tokenTracker.currentTPM()} tokens/min). Cooling down ${Math.round(cooldown / 1000)}s.`,
            currentTPM: this.tokenTracker.currentTPM(),
          });
          console.warn(
            `[EditorialJobQueue] TPM threshold reached (${this.tokenTracker.currentTPM()}). Pausing for ${Math.round(cooldown / 1000)}s.`
          );
          await sleep(cooldown);
          this.paused = false;
          this.emit({ type: "queue_resumed" });
        }

        // ── Inter-job delay ──
        const elapsed = Date.now() - this.lastJobFinishedAt;
        if (this.lastJobFinishedAt > 0 && elapsed < MIN_INTER_JOB_DELAY_MS) {
          const waitMs = MIN_INTER_JOB_DELAY_MS - elapsed;
          console.log(
            `[EditorialJobQueue] Inter-job delay: waiting ${Math.round(waitMs / 1000)}s before next job.`
          );
          await sleep(waitMs);
        }

        // ── Take next entry ──
        const entry = this.queue.shift();
        if (!entry) break;

        // ── Check if this single job would bust TPM ──
        const projectedTPM =
          this.tokenTracker.currentTPM() + entry.estimatedTokens;
        if (projectedTPM >= OPENAI_TPM_LIMIT * TPM_PAUSE_THRESHOLD) {
          // Re-enqueue and wait
          this.queue.unshift(entry);
          this.paused = true;
          const cooldown = this.tokenTracker.estimatedCooldownMs();
          this.emit({
            type: "queue_paused_tpm",
            detail: `Job ${entry.jobId} would push TPM to ${projectedTPM}. Waiting ${Math.round(cooldown / 1000)}s.`,
            jobId: entry.jobId,
            tokenUsage: entry.estimatedTokens,
            currentTPM: this.tokenTracker.currentTPM(),
          });
          await sleep(cooldown);
          this.paused = false;
          this.emit({ type: "queue_resumed" });
          continue;
        }

        // ── Execute job ──
        this.emit({
          type: "job_started",
          jobId: entry.jobId,
          tokenUsage: entry.estimatedTokens,
          currentTPM: this.tokenTracker.currentTPM(),
        });

        console.log(
          `[EditorialJobQueue] Processing job ${entry.jobId} (${entry.stageKey}/${entry.taskKey}) — est. ${entry.estimatedTokens} tokens, TPM ${this.tokenTracker.currentTPM()}`
        );

        try {
          await this.processor(entry);

          // Record token usage
          this.tokenTracker.record(entry.estimatedTokens);
          this.lastJobFinishedAt = Date.now();

          this.emit({
            type: "job_completed",
            jobId: entry.jobId,
            tokenUsage: entry.estimatedTokens,
            currentTPM: this.tokenTracker.currentTPM(),
          });

          console.log(
            `[EditorialJobQueue] Job ${entry.jobId} completed. TPM now: ${this.tokenTracker.currentTPM()}`
          );
        } catch (err) {
          this.lastJobFinishedAt = Date.now();

          if (entry.retryCount < MAX_RETRIES) {
            const retryDelay =
              RETRY_BASE_DELAY_MS * Math.pow(2, entry.retryCount);
            entry.retryCount += 1;

            this.emit({
              type: "job_retrying",
              jobId: entry.jobId,
              retryCount: entry.retryCount,
              detail: `Retry ${entry.retryCount}/${MAX_RETRIES} after ${Math.round(retryDelay / 1000)}s. Error: ${(err as Error).message}`,
            });

            console.warn(
              `[EditorialJobQueue] Job ${entry.jobId} failed (attempt ${entry.retryCount}/${MAX_RETRIES}). Retrying in ${Math.round(retryDelay / 1000)}s: ${(err as Error).message}`
            );

            await sleep(retryDelay);
            this.queue.unshift(entry); // re-enqueue at front
          } else {
            this.emit({
              type: "job_failed",
              jobId: entry.jobId,
              retryCount: entry.retryCount,
              detail: `All ${MAX_RETRIES} retries exhausted. Error: ${(err as Error).message}`,
            });

            console.error(
              `[EditorialJobQueue] Job ${entry.jobId} permanently failed after ${MAX_RETRIES} retries: ${(err as Error).message}`
            );
          }
        }
      }

      this.emit({ type: "queue_drained" });
      console.log("[EditorialJobQueue] Queue drained — all jobs processed.");
    } finally {
      this.processing = false;
    }
  }
}

// ─── Singleton instance ────────────────────────────────────────────────
// Lazily initialized when first imported with a processor.

let _instance: EditorialJobQueue | null = null;

/**
 * Get (or create) the global singleton queue.
 * The processor is only used on first call — subsequent calls return the
 * same instance regardless of the processor argument.
 */
export function getEditorialQueue(processor?: JobProcessor): EditorialJobQueue {
  if (!_instance) {
    if (!processor) {
      throw new Error(
        "[EditorialJobQueue] Cannot create queue without a processor. " +
          "Call getEditorialQueue(processor) first."
      );
    }
    _instance = new EditorialJobQueue(processor);
  }
  return _instance;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build QueueEntry objects from a list of jobs + shared manuscript text.
 * Convenience helper for the process-all route.
 */
export function buildQueueEntries(
  jobs: Array<{
    jobId: string;
    projectId: string;
    stageKey: EditorialStageKey;
    taskKey: EditorialAiTaskKey;
    context: EditorialAiJobContext;
  }>,
  manuscriptText: string,
  options?: { skipAutoAdvance?: boolean }
): QueueEntry[] {
  const charCount = manuscriptText.length;

  return jobs.map((job) => ({
    jobId: job.jobId,
    projectId: job.projectId,
    stageKey: job.stageKey,
    taskKey: job.taskKey,
    context: job.context,
    manuscriptText,
    skipAutoAdvance: options?.skipAutoAdvance ?? false,
    estimatedTokens: estimateJobTokens(charCount, job.taskKey).totalTokens,
    retryCount: 0,
    enqueuedAt: Date.now(),
  }));
}
