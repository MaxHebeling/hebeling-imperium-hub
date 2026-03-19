import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { storeLeadBrief, type LeadBriefPayload } from "@/lib/leads/briefs";

function safeEqual(secretA: string, secretB: string) {
  const a = Buffer.from(secretA, "utf8");
  const b = Buffer.from(secretB, "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(request: Request) {
  const configuredSecret = process.env.IKINGDOM_BRIEF_INGEST_SECRET?.trim();
  if (!configuredSecret) {
    return {
      ok: false,
      status: 500,
      error: "Server misconfigured: IKINGDOM_BRIEF_INGEST_SECRET is missing.",
    };
  }

  const providedSecret = request.headers.get("x-ikingdom-secret")?.trim();
  if (!providedSecret || !safeEqual(providedSecret, configuredSecret)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized.",
    };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const payload = (await request.json()) as LeadBriefPayload;

    if (!payload.companyName || !payload.email || !payload.phone) {
      return NextResponse.json(
        { success: false, error: "companyName, email and phone are required." },
        { status: 400 }
      );
    }

    const result = await storeLeadBrief(payload);

    return NextResponse.json({
      success: true,
      briefId: result.brief.id,
      leadId: result.lead.id,
      leadCode: result.lead.lead_code,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
