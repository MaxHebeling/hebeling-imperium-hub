import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { executeEditorialProofreading } from "@/lib/editorial/phases/proofreading/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await executeEditorialProofreading(body);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[editorial/workflow/proofreading] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid proofreading payload.",
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
