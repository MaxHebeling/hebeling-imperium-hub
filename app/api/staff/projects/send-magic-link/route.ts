import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/staff/projects/send-magic-link
 * Staff invites a client to the portal. Creates their account if needed,
 * links the project to them, and sends an invite email where they set a password.
 * Requires: { email: string, projectId?: string, clientName?: string }
 */
export async function POST(request: Request) {
  try {
    await requireStaff();

    const body = await request.json();
    const { email, projectId, clientName } = body as {
      email: string;
      projectId?: string;
      clientName?: string;
    };

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email es requerido" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuración de Supabase incompleta (service role key)",
        },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Anon client with implicit flow (no PKCE) so the magic link works.
    // PKCE fails because the code verifier is created server-side and lost
    // before the client clicks the link. Implicit flow avoids this entirely.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const anonSupabase = anonKey
      ? createClient(supabaseUrl, anonKey, {
          auth: { flowType: "implicit" },
        })
      : null;

    // Determine the redirect URL – send client directly to their project if available
    // Always use the canonical production URL so Supabase redirect allowlist matches
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.hebeling.io";
    const portalPath = projectId
      ? `/portal/editorial/projects/${projectId}`
      : "/portal/editorial/projects";
    // Use /auth/magic-callback (a client-side page) that reads hash-fragment
    // tokens from the implicit flow and establishes the session in the browser.
    const redirectTo = `${siteUrl}/auth/magic-callback?next=${encodeURIComponent(portalPath)}`;

    // Check if user already exists in profiles
    const { data: existingProfiles } = await adminSupabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", email);

    let userId: string | null = null;

    if (existingProfiles && existingProfiles.length > 0) {
      // User already exists - get their ID
      userId = existingProfiles[0].id;

      // Ensure they have client role
      if (existingProfiles[0].role !== "client") {
        await adminSupabase
          .from("profiles")
          .update({ role: "client" })
          .eq("id", userId);
      }

      // Send magic link for existing users
      // Use signInWithOtp (anon client) which actually sends the email.
      // admin.generateLink only generates the link without sending it.
      if (anonSupabase) {
        const { error: otpError } = await anonSupabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (otpError) {
          return NextResponse.json(
            { success: false, error: `Error enviando link: ${otpError.message}` },
            { status: 500 }
          );
        }
      } else {
        // Fallback: use admin generateLink (won't send email but at least won't crash)
        const { error: linkError } = await adminSupabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo },
        });
        if (linkError) {
          return NextResponse.json(
            { success: false, error: `Error enviando link: ${linkError.message}` },
            { status: 500 }
          );
        }
      }
    } else {
      // New user - invite them so they set their own password
      const { data: inviteData, error: inviteError } =
        await adminSupabase.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            role: "client",
            full_name: clientName || undefined,
          },
        });

      if (inviteError) {
        // User might exist in auth but not in profiles
        if (inviteError.message?.includes("already been registered")) {
          // Try to get user from auth and create profile
          const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users?.find(
            (u) => u.email === email
          );
          if (existingAuthUser) {
            userId = existingAuthUser.id;
            await adminSupabase.from("profiles").upsert({
              id: userId,
              email,
              role: "client",
              full_name: clientName || existingAuthUser.user_metadata?.full_name || null,
              org_id: "reino-editorial",
            });
            // Send magic link since they already have an account
            if (anonSupabase) {
              await anonSupabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: redirectTo },
              });
            } else {
              await adminSupabase.auth.admin.generateLink({
                type: "magiclink",
                email,
                options: { redirectTo },
              });
            }
          } else {
            return NextResponse.json(
              { success: false, error: "Error: usuario registrado pero no encontrado" },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: `Error invitando usuario: ${inviteError.message}` },
            { status: 500 }
          );
        }
      } else if (inviteData?.user) {
        userId = inviteData.user.id;
        // Create profile for new user
        await adminSupabase.from("profiles").upsert({
          id: userId,
          email,
          role: "client",
          full_name: clientName || null,
          org_id: "reino-editorial",
        });
      }
    }

    // Link the project to the client if projectId was provided
    if (projectId && userId) {
      await adminSupabase
        .from("editorial_projects")
        .update({ client_id: userId })
        .eq("id", projectId);
    }

    return NextResponse.json({
      success: true,
      message: `Invitaci\u00f3n enviada a ${email}`,
      userId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
