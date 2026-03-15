import { NextResponse } from "next/server";
import { runDailyBirthdayCheck } from "@/lib/editorial/birthday/service";

/**
 * POST /api/editorial/birthday
 * Trigger the daily birthday check.
 * Can be called by a cron job (e.g., Vercel Cron) or manually by staff.
 *
 * Optional: pass header `x-cron-secret` for security in production.
 */
export async function POST(request: Request) {
  try {
    // Optional: verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const providedSecret = request.headers.get("x-cron-secret");
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const stats = await runDailyBirthdayCheck();

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[birthday-api] Error:", error);
    return NextResponse.json(
      {
        error: "Error ejecutando verificacion de cumpleanos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editorial/birthday
 * Check birthday status (for staff dashboard monitoring).
 */
export async function GET() {
  try {
    const { findTodayBirthdays } = await import(
      "@/lib/editorial/birthday/service"
    );
    const birthdayUsers = await findTodayBirthdays();

    return NextResponse.json({
      today: new Date().toISOString().split("T")[0],
      birthdayCount: birthdayUsers.length,
      users: birthdayUsers.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        locale: u.preferred_locale,
      })),
    });
  } catch (error) {
    console.error("[birthday-api] GET Error:", error);
    return NextResponse.json(
      { error: "Error checking birthdays" },
      { status: 500 }
    );
  }
}
