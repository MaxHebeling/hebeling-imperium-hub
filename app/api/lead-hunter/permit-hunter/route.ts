import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getPermitHunterCommandCenterSnapshot,
  queuePermitHunterCommand,
} from "@/lib/lead-hunter/permit-hunter-service";

const commandSchema = z.object({
  commandType: z.enum(["daily_scan", "backfill_30", "contact_sweep"]),
});

export async function GET() {
  const snapshot = await getPermitHunterCommandCenterSnapshot();

  return NextResponse.json({
    success: true,
    snapshot,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = commandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid Permit Hunter command payload.",
      },
      { status: 400 }
    );
  }

  const { command, snapshot } = await queuePermitHunterCommand(parsed.data.commandType);

  return NextResponse.json({
    success: true,
    command,
    snapshot,
  });
}
