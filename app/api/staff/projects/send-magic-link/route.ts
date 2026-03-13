import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/staff/projects/send-magic-link
 * Staff sends a magic link to a client so they can access their book portal.
 * Requires: { email: string, projectId?: string }
 */
export async function POST(request: Request) {
  try {
    await requireStaff();

    const body = await request.json();
    const { email } = body as { email: string; projectId?: string };

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

    const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey);

    // Check if user exists in profiles with client role
    const { data: existingProfiles } = await adminSupabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", email)
      .eq("role", "client");

    if (!existingProfiles || existingProfiles.length === 0) {
      // Create new user with client role via admin API
      const { data: newUser, error: createError } =
        await adminSupabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { role: "client" },
        });

      if (createError) {
        // User might already exist in auth but not in profiles as client
        if (createError.message?.includes("already been registered")) {
          // User exists in auth, just send the magic link
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Error creando usuario: ${createError.message}`,
            },
            { status: 500 }
          );
        }
      } else if (newUser?.user) {
        // Create profile for new user
        await adminSupabase.from("profiles").upsert({
          id: newUser.user.id,
          email,
          role: "client",
          org_id: "reino-editorial",
        });
      }
    }

    // Send magic link using Supabase OTP (magic link)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const { error: otpError } =
      await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=/portal/editorial/projects`,
        },
      });

    if (otpError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error enviando link: ${otpError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Link de acceso enviado a ${email}`,
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
