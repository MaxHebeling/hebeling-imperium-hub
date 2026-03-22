import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { executeEditorialMarketingAutomation } from "@/lib/editorial/phases/marketing-automation/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await executeEditorialMarketingAutomation(body);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[editorial/workflow/marketing-automation] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid marketing automation payload.",
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
