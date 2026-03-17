import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all people
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get("search");
    const tier = searchParams.get("tier");
    const businessUnit = searchParams.get("business_unit");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("covenant_people")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (tier) {
      query = query.eq("relationship_tier", tier);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Covenant] Error fetching people:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If filtering by business unit, fetch connections
    if (businessUnit && data) {
      const personIds = data.map(p => p.id);
      const { data: connections } = await supabase
        .from("covenant_business_connections")
        .select("person_id")
        .in("person_id", personIds)
        .eq("business_unit", businessUnit);
      
      const connectedIds = new Set(connections?.map(c => c.person_id) || []);
      const filteredData = data.filter(p => connectedIds.has(p.id));
      return NextResponse.json({ data: filteredData, count: filteredData.length });
    }

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new person
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("covenant_people")
      .insert({
        ...body,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[Covenant] Error creating person:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[Covenant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
