import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { processPendingJobs } from "@/lib/editorial/ai/processor";

// Allow up to 5 minutes for AI job processing on Vercel Pro/Enterprise.
export const maxDuration = 300;

/**
 * POST /api/editorial/ai/process
 * Process pending AI jobs.
 *
 * Requires staff authentication. For cron jobs, use a service account
 * with a valid session cookie, or protect via Vercel cron secrets.
 */
export async function POST(req: NextRequest) {
  try {
    await requireStaff();

    // Optional: Get limit from body
    let limit = 5;
    try {
      const body = await req.json();
      if (body.limit && typeof body.limit === "number") {
        limit = Math.min(body.limit, 20); // Max 20 at a time
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const result = await processPendingJobs(limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API] Error processing AI jobs:", error);
    const message = error instanceof Error ? error.message : "Error procesando trabajos de IA";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: "Error procesando trabajos de IA" },
      { status: 500 }
    );
  }
}
