import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { DEFAULT_PROMPTS } from "@/lib/editorial/ai/default-prompts";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";
import { isPipelineStageKey } from "@/lib/editorial/pipeline/stage-compat";

/** Build a fallback response from defaults (used when DB is unavailable). */
function buildDefaultResponse(stageKey: EditorialPipelineStageKey | null) {
  const defaults = stageKey
    ? DEFAULT_PROMPTS.filter((p) => p.stageKey === stageKey)
    : DEFAULT_PROMPTS;

  return defaults.map((d) => ({
    stageKey: d.stageKey,
    taskKey: d.taskKey,
    systemPrompt: d.systemPrompt,
    userPromptTemplate: d.userPromptTemplate,
    isCustom: false,
    customId: null,
  }));
}

/**
 * GET /api/editorial/prompts?stageKey=ingesta
 * Returns the prompts for a given stage (custom overrides + defaults).
 */
export async function GET(request: NextRequest) {
  const rawStageKey = request.nextUrl.searchParams.get("stageKey");
  const stageKey =
    rawStageKey && isPipelineStageKey(rawStageKey)
      ? rawStageKey
      : null;

  try {
    const defaults = stageKey
      ? DEFAULT_PROMPTS.filter((p) => p.stageKey === stageKey)
      : DEFAULT_PROMPTS;

    const supabase = getAdminClient();
    let query = supabase
      .from("editorial_custom_prompts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (stageKey) {
      query = query.eq("stage_key", stageKey);
    }

    const { data: customPrompts, error } = await query;

    // If any DB error, gracefully fall back to defaults
    if (error) {
      return NextResponse.json({ success: true, prompts: buildDefaultResponse(stageKey) });
    }

    // Merge: custom overrides take precedence over defaults
    const customMap = new Map(
      (customPrompts ?? []).map((cp: Record<string, unknown>) => [
        `${cp.stage_key}:${cp.task_key}`,
        cp,
      ])
    );

    const merged = defaults.map((d) => {
      const key = `${d.stageKey}:${d.taskKey}`;
      const custom = customMap.get(key) as Record<string, unknown> | undefined;
      return {
        stageKey: d.stageKey,
        taskKey: d.taskKey,
        systemPrompt: custom?.system_prompt
          ? String(custom.system_prompt)
          : d.systemPrompt,
        userPromptTemplate: custom?.user_prompt_template
          ? String(custom.user_prompt_template)
          : d.userPromptTemplate,
        isCustom: !!custom,
        customId: custom ? String(custom.id) : null,
      };
    });

    return NextResponse.json({ success: true, prompts: merged });
  } catch {
    // If anything fails, return defaults so the UI never breaks
    return NextResponse.json({ success: true, prompts: buildDefaultResponse(stageKey) });
  }
}

/**
 * POST /api/editorial/prompts
 * Save a custom prompt override for a stage/task combination.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stageKey, taskKey, systemPrompt, userPromptTemplate } = body;

    if (!stageKey || !taskKey) {
      return NextResponse.json(
        { success: false, error: "stageKey y taskKey son requeridos" },
        { status: 400 }
      );
    }
    if (!isPipelineStageKey(stageKey)) {
      return NextResponse.json(
        { success: false, error: "stageKey invalido para prompts editoriales" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if a custom prompt already exists for this stage/task
    const { data: existing } = await supabase
      .from("editorial_custom_prompts")
      .select("id")
      .eq("stage_key", stageKey)
      .eq("task_key", taskKey)
      .eq("is_active", true)
      .is("project_id", null)
      .maybeSingle();

    if (existing) {
      // Update existing prompt
      const { data, error } = await supabase
        .from("editorial_custom_prompts")
        .update({
          system_prompt: systemPrompt ?? null,
          user_prompt_template: userPromptTemplate ?? null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, prompt: data });
    } else {
      // Insert new prompt
      const { data, error } = await supabase
        .from("editorial_custom_prompts")
        .insert({
          stage_key: stageKey,
          task_key: taskKey,
          prompt_type: "system",
          system_prompt: systemPrompt ?? null,
          user_prompt_template: userPromptTemplate ?? null,
          is_active: true,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, prompt: data });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/editorial/prompts?stageKey=ingesta&taskKey=manuscript_analysis
 * Reset a prompt to its default (delete custom override).
 */
export async function DELETE(request: NextRequest) {
  try {
    const stageKey = request.nextUrl.searchParams.get("stageKey");
    const taskKey = request.nextUrl.searchParams.get("taskKey");

    if (!stageKey || !taskKey) {
      return NextResponse.json(
        { success: false, error: "stageKey y taskKey son requeridos" },
        { status: 400 }
      );
    }
    if (!isPipelineStageKey(stageKey)) {
      return NextResponse.json(
        { success: false, error: "stageKey invalido para prompts editoriales" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from("editorial_custom_prompts")
      .delete()
      .eq("stage_key", stageKey)
      .eq("task_key", taskKey);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Prompt restaurado a valores por defecto" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
