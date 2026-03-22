import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { executeEditorialSemanticValidation } from "@/lib/editorial/phases/semantic-validation/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await executeEditorialSemanticValidation(body);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[editorial/workflow/semantic-validation] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid semantic validation payload.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
