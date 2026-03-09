import { NextResponse } from "next/server";
import { listEditorialProjects } from "@/lib/editorial/db/queries";
import { ORG_ID } from "@/lib/leads/helpers";

export async function GET() {
  try {
    const projects = await listEditorialProjects(ORG_ID);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("[editorial/list] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
