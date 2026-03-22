import { NextResponse } from "next/server";

import { requireStaff, type StaffSession } from "@/lib/auth/staff";

type PermitHunterStaffAccess =
  | { ok: true; staff: StaffSession }
  | { ok: false; response: NextResponse };

export async function requirePermitHunterStaffAccess(): Promise<PermitHunterStaffAccess> {
  try {
    const staff = await requireStaff();
    return { ok: true, staff };
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
