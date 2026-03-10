// ============================================================
// API: Stage Transitions
// POST /api/editorial/books/[bookId]/stage
//   body: { action: "advance" | "reopen", reason?: string, is_override?: boolean, override_reason?: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  canAdvanceStage,
  canReopenStage,
  canOverrideRules,
} from "@/lib/editorial/permissions";
import { validateStageAdvance } from "@/lib/editorial/rules";
import {
  completeStageChecklist,
  reopenStageChecklist,
  startStageChecklist,
  getOrCreateChecklist,
} from "@/lib/editorial/checklists";
import { logWorkflowEvent } from "@/lib/editorial/events";
import { detectAndCreateAlerts, autoResolveAlerts } from "@/lib/editorial/alerts";
import { EDITORIAL_STAGES } from "@/types/editorial";
import type { EditorialStage } from "@/types/editorial";

interface Params {
  params: Promise<{ bookId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: {
    action: "advance" | "reopen";
    reason?: string;
    is_override?: boolean;
    override_reason?: string;
  } = await request.json();

  // Fetch current book state
  const { data: book } = await supabase
    .from("editorial_books")
    .select("id, current_stage, overall_status, org_id")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const currentStage = book.current_stage as EditorialStage;

  if (body.action === "advance") {
    const currentIndex = EDITORIAL_STAGES.indexOf(currentStage);
    if (currentIndex === EDITORIAL_STAGES.length - 1) {
      // Last stage: mark book as completed
      const permitted = await canAdvanceStage(
        { userId: profile.id, orgRole: profile.role, supabase },
        bookId,
        currentStage
      );
      if (!permitted) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Validate rules
      const validation = await validateStageAdvance(supabase, bookId, currentStage);
      if (!validation.can_advance && !body.is_override) {
        return NextResponse.json(
          { error: "Stage cannot be completed", violations: validation.violations },
          { status: 422 }
        );
      }

      if (!validation.can_advance && body.is_override) {
        const canOverride = await canOverrideRules(
          { userId: profile.id, orgRole: profile.role, supabase },
          bookId
        );
        if (!canOverride) {
          return NextResponse.json(
            { error: "Override not permitted for your role" },
            { status: 403 }
          );
        }
        if (!body.override_reason?.trim()) {
          return NextResponse.json(
            { error: "override_reason is required when applying override" },
            { status: 400 }
          );
        }
      }

      await completeStageChecklist(supabase, bookId, currentStage);
      await supabase
        .from("editorial_books")
        .update({ overall_status: "completed" })
        .eq("id", bookId);

      await logWorkflowEvent({
        supabase,
        bookId,
        orgId: profile.org_id,
        eventType: "stage_completed",
        performedBy: profile.id,
        stage: currentStage,
        isOverride: body.is_override ?? false,
        overrideReason: body.override_reason,
        payload: { final: true },
      });

      return NextResponse.json({ success: true, completed: true });
    }

    const nextStage = EDITORIAL_STAGES[currentIndex + 1];

    const permitted = await canAdvanceStage(
      { userId: profile.id, orgRole: profile.role, supabase },
      bookId,
      currentStage
    );
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate rules
    const validation = await validateStageAdvance(supabase, bookId, currentStage);
    if (!validation.can_advance && !body.is_override) {
      return NextResponse.json(
        { error: "Stage cannot be advanced", violations: validation.violations },
        { status: 422 }
      );
    }

    if (!validation.can_advance && body.is_override) {
      const canOverride = await canOverrideRules(
        { userId: profile.id, orgRole: profile.role, supabase },
        bookId
      );
      if (!canOverride) {
        return NextResponse.json(
          { error: "Override not permitted for your role" },
          { status: 403 }
        );
      }
      if (!body.override_reason?.trim()) {
        return NextResponse.json(
          { error: "override_reason is required when applying override" },
          { status: 400 }
        );
      }

      await logWorkflowEvent({
        supabase,
        bookId,
        orgId: profile.org_id,
        eventType: "override_applied",
        performedBy: profile.id,
        stage: currentStage,
        isOverride: true,
        overrideReason: body.override_reason,
        payload: { violations: validation.violations.map((v) => v.rule_key) },
      });
    }

    // Complete current stage checklist
    await completeStageChecklist(supabase, bookId, currentStage);

    // Advance book stage
    await supabase
      .from("editorial_books")
      .update({ current_stage: nextStage, overall_status: "in_progress" })
      .eq("id", bookId);

    // Create next stage checklist
    await getOrCreateChecklist(supabase, bookId, nextStage, profile.org_id);

    // Start next checklist
    await startStageChecklist(supabase, bookId, nextStage);

    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: "stage_completed",
      performedBy: profile.id,
      stage: currentStage,
      isOverride: body.is_override ?? false,
      overrideReason: body.override_reason,
    });

    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: "stage_started",
      performedBy: profile.id,
      stage: nextStage,
    });

    // Detect alerts for new stage
    await detectAndCreateAlerts(supabase, bookId, profile.org_id, nextStage);
    await autoResolveAlerts(supabase, bookId, "incomplete_checklist", currentStage);

    return NextResponse.json({ success: true, new_stage: nextStage });
  }

  if (body.action === "reopen") {
    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: "reason is required to reopen a stage" },
        { status: 400 }
      );
    }

    const permitted = await canReopenStage(
      { userId: profile.id, orgRole: profile.role, supabase },
      bookId
    );
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await reopenStageChecklist(supabase, bookId, currentStage);
    await supabase
      .from("editorial_books")
      .update({ overall_status: "reopened" })
      .eq("id", bookId);

    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: "stage_reopened",
      performedBy: profile.id,
      stage: currentStage,
      reason: body.reason,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
