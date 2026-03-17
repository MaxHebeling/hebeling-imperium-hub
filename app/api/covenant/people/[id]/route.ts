import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get a single person with their connections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch person
    const { data: person, error } = await supabase
      .from("covenant_people")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[Covenant] Error fetching person:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Fetch business connections
    const { data: connections } = await supabase
      .from("covenant_business_connections")
      .select("*")
      .eq("person_id", id);

    // Fetch recent activities
    const { data: activities } = await supabase
      .from("covenant_activities")
      .select("*")
      .eq("person_id", id)
      .order("activity_date", { ascending: false })
      .limit(10);

    // Fetch opportunities
    const { data: opportunities } = await supabase
      .from("covenant_opportunities")
      .select("*")
      .eq("person_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      data: {
        ...person,
        business_connections: connections || [],
        activities: activities || [],
        opportunities: opportunities || [],
      },
    });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a person
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("covenant_people")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Covenant] Error updating person:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a person
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("covenant_people")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Covenant] Error deleting person:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
