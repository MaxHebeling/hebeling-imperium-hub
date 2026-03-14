import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * GET /api/staff/oficina/clients?q=searchTerm
 * Search/list editorial client accounts for autocomplete.
 * Returns clients matching the search query (by name, email, or tax ID).
 * If no query, returns all active clients (limited to 50).
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const supabase = getAdminClient();

    let query = supabase
      .from("editorial_client_accounts")
      .select(
        "id, display_name, legal_name, billing_email, billing_phone, billing_country, billing_state, billing_city, billing_address_line1, billing_address_line2, postal_code, tax_id, preferred_currency, active"
      )
      .eq("active", true)
      .order("display_name", { ascending: true })
      .limit(50);

    if (q) {
      query = query.or(
        `display_name.ilike.%${q}%,legal_name.ilike.%${q}%,billing_email.ilike.%${q}%,tax_id.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet — return empty list gracefully
      console.error("[oficina/clients] Query error:", error.message);
      return NextResponse.json({ success: true, clients: [] });
    }

    const clients = (data ?? []).map((c) => ({
      id: c.id,
      fullName: c.display_name,
      legalName: c.legal_name ?? null,
      email: c.billing_email ?? "",
      phone: c.billing_phone ?? "",
      country: c.billing_country ?? "",
      state: c.billing_state ?? "",
      city: c.billing_city ?? "",
      address: [c.billing_address_line1, c.billing_address_line2, c.billing_city, c.billing_state, c.billing_country]
        .filter(Boolean)
        .join(", "),
      taxId: c.tax_id ?? "",
      currency: c.preferred_currency ?? "USD",
    }));

    return NextResponse.json({ success: true, clients });
  } catch (err) {
    console.error("[oficina/clients] Error:", err);
    return NextResponse.json({ success: true, clients: [] });
  }
}

/**
 * POST /api/staff/oficina/clients
 * Register a new client account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, address, taxId, country, currency } = body;

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: "Nombre completo es requerido" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Generate unique account code
    const code = `RE-${Date.now().toString(36).toUpperCase()}`;

    // Determine billing country from provided data
    const billingCountry = country || null;

    const { data, error } = await supabase
      .from("editorial_client_accounts")
      .insert({
        account_code: code,
        display_name: fullName,
        billing_email: email || null,
        billing_phone: phone || null,
        billing_address_line1: address || null,
        billing_country: billingCountry,
        tax_id: taxId || null,
        preferred_currency: currency || "USD",
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[oficina/clients] Insert error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        id: data.id,
        fullName: data.display_name,
        email: data.billing_email ?? "",
        phone: data.billing_phone ?? "",
        address: data.billing_address_line1 ?? "",
        taxId: data.tax_id ?? "",
        country: data.billing_country ?? "",
        currency: data.preferred_currency ?? "USD",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
