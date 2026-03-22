import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/companies";
  const hasSafeExplicitNext =
    searchParams.has("next") && next.startsWith("/") && !next.startsWith("//");
  const safeNext = hasSafeExplicitNext ? next : "/app/companies";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/staff-password?error=${encodeURIComponent(
          error.message
        )}&next=${encodeURIComponent(safeNext)}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/staff-password?next=${encodeURIComponent(safeNext)}`
  );
}
