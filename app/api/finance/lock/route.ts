import { NextResponse } from "next/server";

const FINANCE_COOKIE_NAME = "finance_module_unlocked";
const FINANCE_VAULT_PATH = "/app/finance-vault";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: FINANCE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: FINANCE_VAULT_PATH,
    maxAge: 0,
  });
  return response;
}
