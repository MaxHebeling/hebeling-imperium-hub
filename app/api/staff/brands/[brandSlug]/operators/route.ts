import { NextRequest, NextResponse } from "next/server";
import { requireStaffScope } from "@/lib/auth/staff-scope";
import { getAdminClient } from "@/lib/leads/helpers";
import { getStaffBrandScope } from "@/lib/staff-brand-access";
import {
  buildOperatorAccessShareMessage,
  sendOperatorAccessEmail,
} from "@/lib/staff/operator-access-email";

const OPERATOR_ROLES = ["sales", "ops"] as const;
type OperatorRole = (typeof OPERATOR_ROLES)[number];

type BrandContext = {
  id: string;
  name: string;
  slug: string;
};

function isAdminRole(role: string) {
  return role === "superadmin" || role === "admin";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isOperatorRole(role: string): role is OperatorRole {
  return OPERATOR_ROLES.includes(role as OperatorRole);
}

async function resolveBrandContext(
  brandSlug: string,
  orgId: string
): Promise<BrandContext | null> {
  const admin = getAdminClient();
  const scope = getStaffBrandScope(brandSlug);

  if (!scope) {
    return null;
  }

  const possibleSlugs = Array.from(
    new Set([brandSlug.toLowerCase(), scope.slug, scope.crmBrand])
  );

  const { data: brands, error } = await admin
    .from("brands")
    .select("id, name, slug, org_id")
    .eq("org_id", orgId)
    .in("slug", possibleSlugs)
    .limit(5);

  if (error || !brands?.length) {
    return null;
  }

  const brand =
    brands.find((item) => item.slug === scope.slug) ??
    brands.find((item) => item.slug === brandSlug.toLowerCase()) ??
    brands[0];

  if (!brand) {
    return null;
  }

  return {
    id: brand.id as string,
    name: brand.name as string,
    slug: brand.slug as string,
  };
}

async function findAuthUserByEmail(email: string) {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (
    data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

function getRedirectTo(path: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return `${siteUrl}/auth/staff-callback?next=${encodeURIComponent(path)}`;
}

function getPasswordSetupRedirectTo(path: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return `${siteUrl}/auth/staff-password-callback?next=${encodeURIComponent(path)}`;
}

function getInvitedByLabel() {
  return process.env.OPERATOR_ACCESS_INVITER_NAME || "HEBELING OS Administration";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const { brandSlug } = await params;
    const session = await requireStaffScope();
    const brand = await resolveBrandContext(brandSlug, session.orgId);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    if (session.brandScope && session.brandScope.slug !== brand.slug) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = getAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, email, role, created_at, updated_at")
      .eq("org_id", session.orgId)
      .eq("brand_id", brand.id)
      .in("role", [...OPERATOR_ROLES])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const authUsers = await getAdminClient().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const authUserMap = new Map(
      (authUsers.data?.users ?? []).map((user) => [user.id, user])
    );

    const operators = (profiles ?? []).map((profile) => {
      const authUser = authUserMap.get(profile.id as string);
      const hasAccess =
        !!authUser?.last_sign_in_at || !!authUser?.email_confirmed_at;

      return {
        id: profile.id,
        fullName:
          (profile.full_name as string | null) ??
          (authUser?.user_metadata?.full_name as string | undefined) ??
          null,
        email:
          (profile.email as string | null) ??
          authUser?.email ??
          "",
        role: profile.role,
        status: hasAccess ? "active" : "invited",
        invitedAt:
          (profile.created_at as string | null) ??
          authUser?.created_at ??
          null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      brand,
      canInvite: isAdminRole(session.role),
      operators,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const { brandSlug } = await params;
    const session = await requireStaffScope();

    if (!isAdminRole(session.role)) {
      return NextResponse.json(
        { success: false, error: "Only admins can invite operators" },
        { status: 403 }
      );
    }

    const brand = await resolveBrandContext(brandSlug, session.orgId);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      role?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const fullName = body.fullName?.trim() || null;
    const role = body.role?.trim().toLowerCase() ?? "ops";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isOperatorRole(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid operator role" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id, email, full_name, role, org_id, brand_id")
      .eq("email", email)
      .limit(5);

    const existingProfile =
      existingProfiles?.find((profile) => profile.org_id === session.orgId) ??
      existingProfiles?.[0] ??
      null;

    if (existingProfile) {
      if (existingProfile.org_id && existingProfile.org_id !== session.orgId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email already belongs to a user in another organization.",
          },
          { status: 409 }
        );
      }

      if (existingProfile.role === "client") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email is already attached to a client portal user. Use a different email or migrate that account manually.",
          },
          { status: 409 }
        );
      }

      if (
        existingProfile.brand_id &&
        existingProfile.brand_id !== brand.id &&
        isOperatorRole(existingProfile.role as string)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This operator is already assigned to another business unit.",
          },
          { status: 409 }
        );
      }

      if (
        existingProfile.role === "superadmin" ||
        existingProfile.role === "admin"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email already belongs to an administrative user. Use a dedicated operator account instead.",
          },
          { status: 409 }
        );
      }
    }

    const homePath =
      getStaffBrandScope(brand.slug)?.homePath ?? "/app/companies";
    const redirectTo = getRedirectTo(homePath);
    const passwordSetupRedirectTo = getPasswordSetupRedirectTo(homePath);

    const authUser = await findAuthUserByEmail(email);
    let userId: string | null = authUser?.id ?? existingProfile?.id ?? null;
    const delivery: "invite" | "recovery" = authUser ? "recovery" : "invite";
    let accessUrl: string | null = null;

    if (authUser) {
      userId = authUser.id;

      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        email,
        full_name: fullName ?? existingProfile?.full_name ?? null,
        role,
        org_id: session.orgId,
        brand_id: brand.id,
        tenant_id: null,
      });

      if (profileError) {
        return NextResponse.json(
          { success: false, error: profileError.message },
          { status: 500 }
        );
      }

      const { error: metadataError } = await admin.auth.admin.updateUserById(
        authUser.id,
        {
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            full_name:
              fullName ??
              (authUser.user_metadata?.full_name as string | undefined) ??
              existingProfile?.full_name ??
              undefined,
            role,
            brand_slug: brand.slug,
          },
        }
      );

      if (metadataError) {
        console.error("[brand operators] metadata update failed", metadataError);
      }

      const { data: linkData, error: linkError } =
        await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: passwordSetupRedirectTo },
        });

      if (linkError || !linkData?.properties?.action_link) {
        return NextResponse.json(
          {
            success: false,
            error: linkError?.message ?? "Unable to generate secure access link",
          },
          { status: 500 }
        );
      }

      accessUrl = linkData.properties.action_link;
    } else {
      const { data: inviteData, error: inviteError } =
        await admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: {
            redirectTo,
            data: {
              full_name: fullName ?? undefined,
              role,
              brand_slug: brand.slug,
            },
          },
        });

      if (
        inviteError ||
        !inviteData?.user ||
        !inviteData.properties?.action_link
      ) {
        return NextResponse.json(
          {
            success: false,
            error: inviteError?.message ?? "Unable to create invite",
          },
          { status: 500 }
        );
      }

      userId = inviteData.user.id;
      accessUrl = inviteData.properties.action_link;

      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        email,
        full_name: fullName,
        role,
        org_id: session.orgId,
        brand_id: brand.id,
        tenant_id: null,
      });

      if (profileError) {
        return NextResponse.json(
          { success: false, error: profileError.message },
          { status: 500 }
        );
      }
    }

    if (!accessUrl) {
      return NextResponse.json(
        { success: false, error: "Unable to prepare operator access link" },
        { status: 500 }
      );
    }

    const share = buildOperatorAccessShareMessage({
      accessUrl,
      brandLabel: brand.name,
      delivery,
      email,
      fullName,
      role,
    });

    const emailSent = await sendOperatorAccessEmail({
      accessUrl,
      brandLabel: brand.name,
      delivery,
      email,
      fullName,
      role,
      invitedBy: getInvitedByLabel(),
    });

    return NextResponse.json({
      success: true,
      message: `Access invitation sent to ${email}`,
      delivery,
      userId,
      emailSent,
      share: {
        subject: share.subject,
        message: share.message,
        accessUrl,
        ctaLabel: share.ctaLabel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
