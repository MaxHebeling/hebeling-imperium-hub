import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function normalizeHost(host: string) {
  return host.toLowerCase().split(":")[0];
}

const STAFF_ROLES = ["superadmin", "admin", "sales", "ops"];

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/external/ikingdom-intake")) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/external/ikingdom-intake")) {
    return NextResponse.next();
  }

  const hostHeader = request.headers.get("host") || "";
  const hostname = normalizeHost(hostHeader);
  const pathname = request.nextUrl.pathname;

  // Brand domain routing - CHECK FIRST before other logic
  const BRAND_DOMAINS: Record<string, string> = {
    "ikingdom.org": "ikingdom",
    "www.ikingdom.org": "ikingdom",
    "editorialreino.com": "editorial-reino",
    "www.editorialreino.com": "editorial-reino",
    "imperiug.org": "imperiug",
    "www.imperiug.org": "imperiug",
    "maxhebeling.com": "max-hebeling",
    "www.maxhebeling.com": "max-hebeling",
  };

  const brandSlug = BRAND_DOMAINS[hostname];

  if (brandSlug) {
    // Special handling for iKingdom - redirect /apply to the diagnosis form
    if (brandSlug === "ikingdom") {
      if (pathname === "/apply") {
        const url = request.nextUrl.clone();
        url.pathname = "/apply/ikingdom-diagnosis";
        return NextResponse.redirect(url);
      }
      // Allow /apply routes for iKingdom
      if (pathname.startsWith("/apply")) {
        return NextResponse.next();
      }
    } else if (brandSlug === "editorial-reino") {
      // Editorial Reino: allow public pages and API routes
      if (
        pathname === "/apply" ||
        pathname.startsWith("/apply") ||
        pathname === "/publica-tu-libro" ||
        pathname === "/submit-manuscript" ||
        pathname.startsWith("/api/editorial/") ||
        pathname.startsWith("/api/leads")
      ) {
        return NextResponse.next();
      }
      // All other editorial routes redirect to editorial site
      return NextResponse.redirect("https://www.editorialreino.com");
    } else {
      // For other brands, allow /apply routes without auth
      if (pathname === "/apply" || pathname.startsWith("/apply")) {
        return NextResponse.next();
      }
    }
    // All other routes redirect to hub for now
    return NextResponse.redirect("https://www.hebeling.io/login");
  }

  // Public routes - no authentication required
  if (pathname === "/apply" || pathname.startsWith("/apply")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }
  if (pathname === "/submit-manuscript") {
    return NextResponse.next();
  }
  if (pathname === "/api/editorial/submit-manuscript") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/editorial/")) {
    return NextResponse.next();
  }
  if (pathname === "/publica-tu-libro") {
    return NextResponse.next();
  }

  // Update Supabase session and get user + profile
  const session = await updateSession(request);
  if (session.configError) {
    return new NextResponse(
      "Server misconfiguration: Supabase URL and Anon Key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (as a file, not a directory).",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  const { supabaseResponse, user, profile } = session;

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
    hostname === "hebeling.io" ||
    hostname === "www.hebeling.io" ||
    (isLocal && appHint !== "clients") ||
    (isPreview && appHint !== "clients");

  const isClientsHost =
    hostname.startsWith("clients.") ||
    (isLocal && appHint === "clients") ||
    (isPreview && appHint === "clients");

  /**
   * Apply author portal rules (/author/*) that are identical across all host
   * contexts. Returns a redirect Response when action is needed, otherwise null.
   */
  function applyAuthorPortalRules(): NextResponse | null {
    if (pathname.startsWith("/author") && !pathname.startsWith("/author/login")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/author/login";
        return NextResponse.redirect(url);
      }
    }
    if (pathname === "/author/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/author/projects";
      return NextResponse.redirect(url);
    }
    return null;
  }

  // HUB (staff)
  if (isHubHost) {
    // If staff user is logged in and visits /login, redirect to company-first OS
    if (pathname === "/login" && user && isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/companies";
      return NextResponse.redirect(url);
    }

    // Protected routes under /app/* require authentication AND staff role
    if (pathname.startsWith("/app")) {
      if (!user || !profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      if (!isStaff) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }

    // Client portal routes on hub host: /portal/* requires client auth, /client-login is public
    if (pathname.startsWith("/portal")) {
      if (!user || !profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/client-login";
        return NextResponse.redirect(url);
      }
      if (!isClient && !isStaff) {
        const url = request.nextUrl.clone();
        url.pathname = "/client-login";
        return NextResponse.redirect(url);
      }
    }
    if (pathname === "/client-login" && user && isClient) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/editorial/projects";
      return NextResponse.redirect(url);
    }

    // Author portal: /author/* requires any authenticated user.
    // /author/login is public (no auth needed).
    const authorRedirect = applyAuthorPortalRules();
    if (authorRedirect) return authorRedirect;

    // Staff dashboard: /staff/* (except login) requires auth AND staff role. Login is public.
    if (pathname.startsWith("/staff")) {
      if (pathname !== "/staff/login") {
        if (!user) {
          const url = request.nextUrl.clone();
          url.pathname = "/staff/login";
          return NextResponse.redirect(url);
        }
        if (!isStaff) {
          const url = request.nextUrl.clone();
          url.pathname = "/staff/login";
          url.searchParams.set("reason", "forbidden");
          return NextResponse.redirect(url);
        }
      } else if (user) {
        // Logged-in non-staff users should not be able to access /staff/*
        if (!isStaff) {
          return supabaseResponse;
        }
        // Staff already logged in visiting /staff/login → company-first OS
        const url = request.nextUrl.clone();
        url.pathname = "/app/companies";
        return NextResponse.redirect(url);
      }
    }

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
        const url = request.nextUrl.clone();
        url.pathname = "/client-login";
        return NextResponse.redirect(url);
      }
    }

    // Author portal: /author/* requires any authenticated user.
    // /author/login is public.
    const authorRedirect = applyAuthorPortalRules();
    if (authorRedirect) return authorRedirect;

    // If client user is logged in and visits /client-login, redirect to portal
    if (pathname === "/client-login" && user && isClient) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/overview";
      return NextResponse.redirect(url);
    }

    const allowed =
      pathname === "/client-login" ||
      pathname.startsWith("/portal") ||
      pathname.startsWith("/author") ||
      pathname === "/" ||
      isAsset;

    if (!allowed) {
      return NextResponse.redirect(new URL("/client-login", request.url));
    }
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/client-login", request.url));
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
