import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { startReceptionPhase } from "@/lib/editorial/phases/reception/service";
import { receptionValidationConstants } from "@/lib/editorial/phases/reception/validation";
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
    const result = await startReceptionPhase({
      ...body,
      actorId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
        constraints: receptionValidationConstants,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[editorial/workflow/reception/start] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reception start payload.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
