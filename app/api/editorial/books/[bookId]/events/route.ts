// ============================================================
// API: Workflow event feed for a book
// GET /api/editorial/books/[bookId]/events
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial } from "@/lib/editorial/permissions";
import { getBookEventFeed } from "@/lib/editorial/events";

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

  const { data: book } = await supabase
    .from("editorial_books")
    .select("id")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await getBookEventFeed(supabase, bookId);
  return NextResponse.json({ events });
}
