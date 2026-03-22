import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { completeReceptionPhase } from "@/lib/editorial/phases/reception/service";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await completeReceptionPhase({
      ...body,
      actorId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[editorial/workflow/reception/complete] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reception completion payload.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
