import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { requireStaff, type StaffSession } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { createClient } from "@/lib/supabase/server";

type IKingdomSessionAccess =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: User;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type IKingdomStaffAccess =
  | {
      ok: true;
      admin: ReturnType<typeof getAdminClient>;
      staff: StaffSession;
      orgId: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireIKingdomSessionAccess(): Promise<IKingdomSessionAccess> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    supabase,
    user,
  };
}

export async function requireIKingdomStaffAccess(): Promise<IKingdomStaffAccess> {
  try {
    const staff = await requireStaff();
    const admin = getAdminClient();

    const { data: profile, error } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", staff.userId)
      .single();

    if (error || !profile?.org_id) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "Organización de staff no disponible" },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true,
      admin,
      staff,
      orgId: profile.org_id as string,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "FORBIDDEN";
    const status = message === "UNAUTHORIZED" ? 401 : 403;

    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: status === 401 ? "No autorizado" : "Acceso denegado",
        },
        { status }
      ),
    };
  }
}
