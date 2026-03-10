// ============================================================
// API: Checklist management for a book stage
// GET /api/editorial/books/[bookId]/checklist?stage=ingesta
// POST /api/editorial/books/[bookId]/checklist  — toggle item / assign responsible
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial, canManageChecklist } from "@/lib/editorial/permissions";
import {
  getOrCreateChecklist,
  toggleChecklistItem,
  assignStageResponsible,
  startStageChecklist,
} from "@/lib/editorial/checklists";
import { logWorkflowEvent } from "@/lib/editorial/events";
import { autoResolveAlerts, detectAndCreateAlerts } from "@/lib/editorial/alerts";
import type { EditorialStage } from "@/types/editorial";

interface Params {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { bookId } = await params;
  const stage = request.nextUrl.searchParams.get("stage") as EditorialStage | null;

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

  if (!profile || !canViewEditorial(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify book ownership
  const { data: book } = await supabase
    .from("editorial_books")
    .select("id")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!stage) {
    return NextResponse.json({ error: "stage query param required" }, { status: 400 });
  }

  const checklist = await getOrCreateChecklist(supabase, bookId, stage, profile.org_id);

  return NextResponse.json({ checklist });
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
    action: "toggle_item" | "assign" | "start";
    stage?: EditorialStage;
    item_id?: string;
    is_checked?: boolean;
    assignee_id?: string;
  } = await request.json();

  if (!body.stage) {
    return NextResponse.json({ error: "stage is required" }, { status: 400 });
  }

  // Verify book ownership
  const { data: book } = await supabase
    .from("editorial_books")
    .select("id")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const permCtx = { userId: profile.id, orgRole: profile.role, supabase };

  if (body.action === "toggle_item") {
    const permitted = await canManageChecklist(permCtx, bookId, body.stage);
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!body.item_id) {
      return NextResponse.json({ error: "item_id required" }, { status: 400 });
    }

    const item = await toggleChecklistItem(
      supabase,
      body.item_id,
      body.is_checked ?? false,
      profile.id
    );

    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: body.is_checked ? "checklist_item_checked" : "checklist_item_unchecked",
      performedBy: profile.id,
      stage: body.stage,
      payload: { item_id: body.item_id },
    });

    // Re-evaluate incomplete_checklist alert
    await detectAndCreateAlerts(supabase, bookId, profile.org_id, body.stage);

    return NextResponse.json({ item });
  }

  if (body.action === "assign") {
    const assignPermitted = await canManageChecklist(permCtx, bookId, body.stage);
    if (!assignPermitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!body.assignee_id) {
      return NextResponse.json({ error: "assignee_id required" }, { status: 400 });
    }

    await assignStageResponsible(supabase, bookId, body.stage, body.assignee_id);

    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: "member_assigned",
      performedBy: profile.id,
      stage: body.stage,
      targetUserId: body.assignee_id,
    });

    // Auto-resolve no_assignee alert
    await autoResolveAlerts(supabase, bookId, "no_assignee", body.stage);

    return NextResponse.json({ success: true });
  }

  if (body.action === "start") {
    const permitted = await canManageChecklist(permCtx, bookId, body.stage);
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await startStageChecklist(supabase, bookId, body.stage);
    await logWorkflowEvent({
      supabase,
      bookId,
      orgId: profile.org_id,
      eventType: "stage_started",
      performedBy: profile.id,
      stage: body.stage,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
