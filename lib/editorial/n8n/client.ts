/**
 * n8n Cloud client for Reino Editorial pipeline integration.
 *
 * This module provides helpers to trigger n8n workflows from HEBELING OS.
 * The editorial pipeline is triggered via webhook to n8n Cloud.
 *
 * Required environment variable:
 *   N8N_WEBHOOK_URL=https://<instance>.app.n8n.cloud/webhook/editorial-ai-process
 *
 * Import the workflow from:
 *   n8n-workflows/editorial-ai-process.json
 */

/** Webhook path used by the n8n workflow (WF-02). */
export const N8N_WEBHOOK_PATH = "editorial-ai-process";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  `https://maxhebeling.app.n8n.cloud/webhook/${N8N_WEBHOOK_PATH}`;

export interface N8nTriggerPayload {
  action: string;
  project_id: string;
  manuscript_title: string;
  author_name: string | null;
  language: string;
  genre: string | null;
  current_stage: string;
  /** Pre-extracted manuscript text (up to 50,000 characters). */
  manuscript_text?: string;
  manuscript_file: {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    mime_type: string | null;
    version: number;
  } | null;
  triggered_by: string;
  triggered_at: string;
  supabase_url: string | undefined;
  supabase_anon_key?: string;
  supabase_service_key?: string;
}

export interface N8nTriggerResult {
  success: boolean;
  message: string;
  n8n_response?: Record<string, unknown>;
  error?: string;
}

/**
 * Trigger the editorial AI pipeline webhook in n8n Cloud.
 * Corresponds to WF-02 (editorial-ai-process.json).
 */
export async function triggerManuscriptIntake(
  payload: N8nTriggerPayload
): Promise<N8nTriggerResult> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `n8n webhook returned ${response.status}`,
        error: errorText,
      };
    }

    let n8nResult: Record<string, unknown>;
    try {
      n8nResult = await response.json();
    } catch {
      n8nResult = { status: "accepted" };
    }

    return {
      success: true,
      message: "Pipeline n8n activado exitosamente",
      n8n_response: n8nResult,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión con n8n",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the configured n8n webhook URL (for display purposes).
 */
export function getN8nWebhookUrl(): string {
  return N8N_WEBHOOK_URL;
}
