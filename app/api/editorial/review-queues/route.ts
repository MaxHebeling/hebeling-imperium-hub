import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { CreateQueueItemInput } from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/editorial/review-queues — list queues and their pending item counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get("include_items") === "true";
    const queueId = searchParams.get("queue_id");

    const db = getAdminClient();

    // If a specific queue is requested, return its items
    if (queueId && includeItems) {
      const { data: items, error: itemsErr } = await db
        .from("editorial_ai_queue_items")
        .select("*")
        .eq("queue_id", queueId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (itemsErr) throw itemsErr;
      return NextResponse.json({ success: true, data: items });
    }

    // Otherwise list all queues for the org
    const { data: queues, error } = await db
      .from("editorial_ai_review_queues")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json({ success: true, data: queues });
  } catch (error) {
    console.error("[api/editorial/review-queues] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/review-queues — enqueue a new item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: CreateQueueItemInput = await request.json();

    if (!body.queue_id || !body.entity_type || !body.entity_id) {
      return NextResponse.json(
        { success: false, error: "queue_id, entity_type and entity_id are required" },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    const { data, error } = await db
      .from("editorial_ai_queue_items")
      .insert({
        queue_id: body.queue_id,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        project_id: body.project_id ?? null,
        priority: body.priority ?? "normal",
        assigned_to: body.assigned_to ?? null,
        due_at: body.due_at ?? null,
        context: body.context ?? {},
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/review-queues] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/review-queues — update a queue item status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: {
      item_id: string;
      status: string;
      assigned_to?: string;
    } = await request.json();

    if (!body.item_id || !body.status) {
      return NextResponse.json(
        { success: false, error: "item_id and status are required" },
        { status: 400 }
      );
    }

    const terminalStatuses = ["completed", "skipped", "escalated"];
    const isTerminal = terminalStatuses.includes(body.status);

    const db = getAdminClient();
    const updates: Record<string, unknown> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.assigned_to) updates.assigned_to = body.assigned_to;
    if (isTerminal) {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }

    const { data, error } = await db
      .from("editorial_ai_queue_items")
      .update(updates)
      .eq("id", body.item_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[api/editorial/review-queues] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
