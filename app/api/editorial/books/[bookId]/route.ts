// ============================================================
// API: Single Editorial Book — Get + Update
// GET /api/editorial/books/[bookId]
// PATCH /api/editorial/books/[bookId]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial, canManageEditorialBooks } from "@/lib/editorial/permissions";
import { getBookChecklists } from "@/lib/editorial/checklists";
import { getBookAlerts } from "@/lib/editorial/alerts";
import type { UpdateEditorialBookInput } from "@/types/editorial";

interface Params {
  params: Promise<{ bookId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
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

  if (!profile || !canViewEditorial(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: book, error } = await supabase
    .from("editorial_books")
    .select(
      `*,
      members:editorial_book_members(
        *,
        profile:profiles(full_name, email)
      )`
    )
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [checklists, alerts] = await Promise.all([
    getBookChecklists(supabase, bookId),
    getBookAlerts(supabase, bookId),
  ]);

  return NextResponse.json({ book, checklists, alerts });
}

export async function PATCH(request: NextRequest, { params }: Params) {
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

  if (!profile || !canManageEditorialBooks(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify book belongs to org
  const { data: existing } = await supabase
    .from("editorial_books")
    .select("id, org_id")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: UpdateEditorialBookInput = await request.json();

  const { data: updated, error } = await supabase
    .from("editorial_books")
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.author !== undefined && { author: body.author }),
      ...(body.isbn !== undefined && { isbn: body.isbn }),
      ...(body.due_date !== undefined && { due_date: body.due_date }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.brand_id !== undefined && { brand_id: body.brand_id }),
    })
    .eq("id", bookId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ book: updated });
}
