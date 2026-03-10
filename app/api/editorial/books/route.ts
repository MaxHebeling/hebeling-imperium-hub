// ============================================================
// API: Editorial Books — List + Create
// GET /api/editorial/books
// POST /api/editorial/books
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial, canManageEditorialBooks } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/events";
import { getOrCreateChecklist } from "@/lib/editorial/checklists";
import { detectAndCreateAlerts } from "@/lib/editorial/alerts";
import type { CreateEditorialBookInput } from "@/types/editorial";

export async function GET(_request: NextRequest) {
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

  const { data: books, error } = await supabase
    .from("editorial_book_current_stage_view")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books });
}

export async function POST(request: NextRequest) {
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

  if (!profile || !canManageEditorialBooks(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: CreateEditorialBookInput = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data: book, error } = await supabase
    .from("editorial_books")
    .insert({
      org_id: profile.org_id,
      brand_id: body.brand_id ?? null,
      title: body.title.trim(),
      author: body.author?.trim() ?? null,
      isbn: body.isbn?.trim() ?? null,
      due_date: body.due_date ?? null,
      notes: body.notes?.trim() ?? null,
      created_by: profile.id,
      current_stage: "ingesta",
      overall_status: "pending",
    })
    .select("*")
    .single();

  if (error || !book) {
    return NextResponse.json({ error: error?.message ?? "Failed to create book" }, { status: 500 });
  }

  // Auto-create the first stage checklist
  await getOrCreateChecklist(supabase, book.id, "ingesta", profile.org_id);

  // Log creation event
  await logWorkflowEvent({
    supabase,
    bookId: book.id,
    orgId: profile.org_id,
    eventType: "book_created",
    performedBy: profile.id,
    stage: "ingesta",
    payload: { title: book.title },
  });

  // Detect initial alerts (e.g., no assignee)
  await detectAndCreateAlerts(supabase, book.id, profile.org_id, "ingesta");

  return NextResponse.json({ book }, { status: 201 });
}
