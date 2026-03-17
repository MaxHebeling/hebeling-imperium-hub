import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all activities
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const personId = searchParams.get("person_id");
    const organizationId = searchParams.get("organization_id");
    const activityType = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("covenant_activities")
      .select("*, person:covenant_people(first_name, last_name)", { count: "exact" })
      .order("activity_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (personId) {
      query = query.eq("person_id", personId);
    }

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (activityType) {
      query = query.eq("activity_type", activityType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Covenant] Error fetching activities:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("covenant_activities")
      .insert({
        ...body,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[Covenant] Error creating activity:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
