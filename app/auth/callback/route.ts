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

        // If `next` was explicitly set to a portal route, always respect it
        const hasExplicitPortalNext =
          searchParams.has("next") && next.startsWith("/portal");

        if (profile?.role === "client") {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // Staff users: if they came from client-login (portal next), send them to portal
        if (
          ["superadmin", "admin", "sales", "ops"].includes(
            profile?.role ?? ""
          )
        ) {
          if (hasExplicitPortalNext) {
            return NextResponse.redirect(`${origin}${next}`);
          }
          return NextResponse.redirect(`${origin}/app/companies`);
        }
      }

      // Default redirect
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed, redirect to client login with error
  return NextResponse.redirect(
    `${origin}/client-login?error=magic_link_expired`
  );
}
