import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/lib/editorial/ai/processor";

/**
 * POST /api/editorial/ai/process
 * Process pending AI jobs
 * 
 * This endpoint can be called by:
 * - A cron job to process jobs periodically
 * - The staff manually to trigger processing
 * - A webhook after a file upload
 * 
 * For security, you might want to add API key validation for cron jobs
 */
export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json(
      { success: false, error: "Error procesando trabajos de IA" },
      { status: 500 }
    );
  }
}
