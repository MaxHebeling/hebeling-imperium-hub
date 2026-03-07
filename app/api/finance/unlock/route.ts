import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const FINANCE_COOKIE_NAME = "finance_module_unlocked";

// This path maps to the current Finance Vault module route.
const FINANCE_VAULT_PATH = "/app/finance-vault";

// Security baseline: session cookie expires after 5 minutes.
// This is the base required for auto-lock by inactivity.
// NOTE: true inactivity lock needs a future "session refresh on activity" endpoint
// (sliding expiration) and client heartbeat/user-action pings.
const FINANCE_INACTIVITY_TIMEOUT_SECONDS = 60 * 5;

type UnlockMethod = "password" | "passkey";

type PasswordUnlockPayload = {
  method?: "password";
  password?: string;
};

type PasskeyUnlockPayload = {
  method: "passkey";
  // Placeholder for future WebAuthn assertion data.
  assertion?: unknown;
};

type UnlockPayload = PasswordUnlockPayload | PasskeyUnlockPayload;

function getConfiguredFinancePassword() {
  const key = process.env.FINANCE_MODULE_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function safeEqual(secretA: string, secretB: string) {
  const a = Buffer.from(secretA, "utf8");
  const b = Buffer.from(secretB, "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isPasswordPayload(
  payload: UnlockPayload | null
): payload is PasswordUnlockPayload {
  return !payload || payload.method === undefined || payload.method === "password";
}

async function verifyPasskeyAssertion(_payload: PasskeyUnlockPayload) {
  // Future WebAuthn integration point:
  // 1) Load challenge by session/user
  // 2) Verify origin, rpId, challenge, signature, signCount
  // 3) Return true only for valid assertions
  return false;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as UnlockPayload | null;

  const financeKey = getConfiguredFinancePassword();
  if (!financeKey) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: FINANCE_MODULE_KEY is missing.",
      },
      { status: 500 }
    );
  }

  const method: UnlockMethod = payload?.method ?? "password";

  if (method === "passkey") {
    // Explicitly documented behavior:
    // this endpoint currently supports password auth only.
    // Passkeys/WebAuthn are not enabled yet.
    const verified = await verifyPasskeyAssertion(payload as PasskeyUnlockPayload);
    if (!verified) {
      return NextResponse.json(
        { error: "Passkeys/WebAuthn not enabled yet. Use password unlock." },
        { status: 501 }
      );
    }
  }

  // Current auth mode in production: password-based unlock.
  const submittedPassword =
    method === "password" && isPasswordPayload(payload)
      ? payload.password?.trim()
      : undefined;

  if (!submittedPassword) {
    return NextResponse.json(
      { error: "Password is required for unlock." },
      { status: 400 }
    );
  }

  if (!safeEqual(submittedPassword, financeKey)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, method: "password" });
  response.cookies.set({
    name: FINANCE_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: FINANCE_VAULT_PATH,
    maxAge: FINANCE_INACTIVITY_TIMEOUT_SECONDS,
  });

  return response;
}
