import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback handler for Supabase magic links and OAuth.
 * Supabase redirects here after the user clicks a magic link email.
 * We exchange the code for a session, then redirect based on the user's role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal/editorial/projects";
  const hasSafeExplicitNext =
    searchParams.has("next") && next.startsWith("/") && !next.startsWith("//");
  const safeNext = hasSafeExplicitNext ? next : "/portal/editorial/projects";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check user role to redirect appropriately
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "client") {
          return NextResponse.redirect(
            `${origin}${safeNext}`
          );
        }

        // Staff users can land on an explicit safe destination after invite/magic link.
        if (
          ["superadmin", "admin", "sales", "ops"].includes(
            profile?.role ?? ""
          )
        ) {
          if (safeNext) {
            return NextResponse.redirect(`${origin}${safeNext}`);
          }
          return NextResponse.redirect(`${origin}/app/companies`);
        }
      }

      // Default redirect
      return NextResponse.redirect(
        `${origin}${safeNext}`
      );
    }
  }

  // No code means the auth provider likely returned tokens in the URL hash.
  return NextResponse.redirect(
    `${origin}/auth/magic-callback?next=${encodeURIComponent(safeNext)}`
  );
}
