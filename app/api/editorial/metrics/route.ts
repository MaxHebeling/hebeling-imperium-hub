// ============================================================
// API: Editorial Pipeline Metrics
// GET /api/editorial/metrics
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial } from "@/lib/editorial/permissions";
import { getEditorialMetrics } from "@/lib/editorial/metrics";

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

  const metrics = await getEditorialMetrics(supabase, profile.org_id);
  return NextResponse.json({ metrics });
}
