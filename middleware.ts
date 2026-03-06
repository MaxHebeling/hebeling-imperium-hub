import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function normalizeHost(host: string) {
  return host.toLowerCase().split(":")[0];
}

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"];

export async function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const hostname = normalizeHost(hostHeader);
  const pathname = request.nextUrl.pathname;

  // Update Supabase session and get user + profile
  const { supabaseResponse, user, profile } = await updateSession(request);

  const isStaff = profile && STAFF_ROLES.includes(profile.role);
  const isClient = profile && profile.role === "client";

  // Helpers
  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".");

  // Local / preview routing hint
  const appHint = request.nextUrl.searchParams.get("app");
  const isLocal = hostname === "localhost";
  const isPreview = hostname.endsWith(".vercel.app");

  const isHubHost =
    hostname.startsWith("hub.") ||
    (isLocal && appHint !== "clients") ||
    (isPreview && appHint !== "clients");

  const isClientsHost =
    hostname.startsWith("clients.") ||
    (isLocal && appHint === "clients") ||
    (isPreview && appHint === "clients");

  // HUB (staff)
  if (isHubHost) {
    // Protected routes under /app/* require authentication AND staff role
    if (pathname.startsWith("/app")) {
      if (!user || !profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      if (!isStaff) {
        // User is logged in but not staff - sign them out and redirect
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }

    // If staff user is logged in and visits /login, redirect to dashboard
    if (pathname === "/login" && user && isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }

    const allowed =
      pathname === "/login" ||
      pathname === "/apply" ||
      pathname.startsWith("/apply") ||
      pathname.startsWith("/app") ||
      pathname === "/" ||
      isAsset;

    if (!allowed) return NextResponse.redirect(new URL("/login", request.url));
    if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
    
    return supabaseResponse;
  }

  // CLIENTS (portal)
  if (isClientsHost) {
    // Protected routes under /portal/* require authentication AND client role
    if (pathname.startsWith("/portal")) {
      if (!user || !profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/client-login";
        return NextResponse.redirect(url);
      }
      if (!isClient) {
        // User is logged in but not client - redirect
        const url = request.nextUrl.clone();
        url.pathname = "/client-login";
        return NextResponse.redirect(url);
      }
    }

    // If client user is logged in and visits /client-login, redirect to portal
    if (pathname === "/client-login" && user && isClient) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/overview";
      return NextResponse.redirect(url);
    }

    const allowed =
      pathname === "/client-login" ||
      pathname.startsWith("/portal") ||
      pathname === "/" ||
      isAsset;

    if (!allowed)
      return NextResponse.redirect(new URL("/client-login", request.url));
    if (pathname === "/")
      return NextResponse.redirect(new URL("/client-login", request.url));
    
    return supabaseResponse;
  }

  // Root domain -> redirect to hub
  if (hostname === "hebelingimperium.com" || hostname === "www.hebelingimperium.com") {
    return NextResponse.redirect("https://hub.hebelingimperium.com/login");
  }

  // Other hosts: redirect to hub for safety
  return NextResponse.redirect("https://hub.hebelingimperium.com/login");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
