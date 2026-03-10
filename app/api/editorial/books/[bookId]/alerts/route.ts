// ============================================================
// API: Alerts for a book
// GET /api/editorial/books/[bookId]/alerts
// POST /api/editorial/books/[bookId]/alerts  — resolve alert
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial, canResolveAlerts } from "@/lib/editorial/permissions";
import { getBookAlerts, resolveAlert } from "@/lib/editorial/alerts";
import { logWorkflowEvent } from "@/lib/editorial/events";

interface Params {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { bookId } = await params;
  const includeResolved = request.nextUrl.searchParams.get("resolved") === "true";

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

  const alerts = await getBookAlerts(supabase, bookId, includeResolved);
  return NextResponse.json({ alerts });
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

  if (!profile || !canResolveAlerts(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: book } = await supabase
    .from("editorial_books")
    .select("id, current_stage")
    .eq("id", bookId)
    .eq("org_id", profile.org_id)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: { alert_id: string } = await request.json();

  if (!body.alert_id) {
    return NextResponse.json({ error: "alert_id required" }, { status: 400 });
  }

  const resolved = await resolveAlert(supabase, body.alert_id, profile.id);
  if (!resolved) {
    return NextResponse.json({ error: "Failed to resolve alert" }, { status: 500 });
  }

  await logWorkflowEvent({
    supabase,
    bookId,
    orgId: profile.org_id,
    eventType: "alert_resolved",
    performedBy: profile.id,
    stage: book.current_stage,
    payload: { alert_id: body.alert_id },
  });

  return NextResponse.json({ success: true });
}
