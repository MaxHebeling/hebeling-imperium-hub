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

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (
          ["superadmin", "admin", "sales", "ops"].includes(
            profile?.role ?? ""
          )
        ) {
          return NextResponse.redirect(`${origin}${safeNext}`);
        }
      }

      return NextResponse.redirect(`${origin}/login`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/staff-magic-callback?next=${encodeURIComponent(safeNext)}`
  );
}
