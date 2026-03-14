import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { DEFAULT_PROMPTS } from "@/lib/editorial/ai/default-prompts";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

/**
 * GET /api/editorial/prompts?stageKey=ingesta
 * Returns the prompts for a given stage (custom overrides + defaults).
 */
export async function GET(request: NextRequest) {
  try {
    const stageKey = request.nextUrl.searchParams.get("stageKey") as EditorialStageKey | null;

    // Get default prompts, optionally filtered by stage
    const defaults = stageKey
      ? DEFAULT_PROMPTS.filter((p) => p.stageKey === stageKey)
      : DEFAULT_PROMPTS;

    // Get custom overrides from DB
    const supabase = getAdminClient();
    let query = supabase
      .from("editorial_custom_prompts")
      .select("*")
      .order("created_at", { ascending: false });

    if (stageKey) {
      query = query.eq("stage_key", stageKey);
    }

    const { data: customPrompts } = await query;

    // Merge: custom overrides take precedence over defaults
    const customMap = new Map(
      (customPrompts ?? []).map((cp: { stage_key: string; task_key: string; system_prompt: string; user_prompt_template: string; id: string; updated_at: string }) => [
        `${cp.stage_key}:${cp.task_key}`,
        cp,
      ])
    );

    const merged = defaults.map((d) => {
      const key = `${d.stageKey}:${d.taskKey}`;
      const custom = customMap.get(key);
      return {
        stageKey: d.stageKey,
        taskKey: d.taskKey,
        systemPrompt: custom ? (custom as { system_prompt: string }).system_prompt : d.systemPrompt,
        userPromptTemplate: custom ? (custom as { user_prompt_template: string }).user_prompt_template : d.userPromptTemplate,
        isCustom: !!custom,
        customId: custom ? (custom as { id: string }).id : null,
      };
    });

    return NextResponse.json({ success: true, prompts: merged });
  } catch (error) {
    // If the table doesn't exist yet, just return defaults
    const stageKey = request.nextUrl.searchParams.get("stageKey") as EditorialStageKey | null;
    const defaults = stageKey
      ? DEFAULT_PROMPTS.filter((p) => p.stageKey === stageKey)
      : DEFAULT_PROMPTS;

    const merged = defaults.map((d) => ({
      stageKey: d.stageKey,
      taskKey: d.taskKey,
      systemPrompt: d.systemPrompt,
      userPromptTemplate: d.userPromptTemplate,
      isCustom: false,
      customId: null,
    }));

    return NextResponse.json({ success: true, prompts: merged });
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

    const supabase = getAdminClient();

    // Try to upsert into custom_prompts table
    // First check if the table exists by trying to select
    const { error: tableCheck } = await supabase
      .from("editorial_custom_prompts")
      .select("id")
      .limit(1);

    if (tableCheck) {
      // Table doesn't exist - create it
      // For now, store in a simple approach using RPC or raw SQL
      // Since we can't create tables via supabase-js, we'll use a fallback
      return NextResponse.json(
        {
          success: false,
          error: "La tabla editorial_custom_prompts no existe. Se necesita crear la tabla en Supabase.",
          fallback: true,
        },
        { status: 500 }
      );
    }

    // Upsert the custom prompt
    const { data, error } = await supabase
      .from("editorial_custom_prompts")
      .upsert(
        {
          stage_key: stageKey,
          task_key: taskKey,
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stage_key,task_key" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, prompt: data });
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

    const supabase = getAdminClient();
    await supabase
      .from("editorial_custom_prompts")
      .delete()
      .eq("stage_key", stageKey)
      .eq("task_key", taskKey);

    return NextResponse.json({ success: true, message: "Prompt restaurado a valores por defecto" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
