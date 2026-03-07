import { NextResponse } from "next/server";

const FINANCE_COOKIE_NAME = "finance_module_unlocked";
const DEFAULT_FINANCE_KEY = "hebeling-finanzas";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;

  const submittedPassword = payload?.password?.trim();
  const financeKey = process.env.FINANCE_MODULE_KEY || DEFAULT_FINANCE_KEY;

  if (!submittedPassword) {
    return NextResponse.json(
      { error: "Debes ingresar una clave." },
      { status: 400 }
    );
  }

  if (submittedPassword !== financeKey) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: FINANCE_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/app/payments",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
