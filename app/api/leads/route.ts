import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pega aquí el id de tu organización de Supabase
const ORG_ID = "4059832a-ff39-43e6-984f-d9e866dfb8a4";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const full_name = body.full_name;
    const email = body.email;
    const phone = body.phone;
    const message = body.message;
    const source = body.source || "landing";

    if (!full_name) {
      return NextResponse.json(
        { error: "full_name is required" },
        { status: 400 }
      );
    }

    // Crear contacto
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        org_id: ORG_ID,
        full_name,
        email,
        phone,
        notes: message,
        source,
      })
      .select()
      .single();

    if (contactError) {
      return NextResponse.json(
        { error: contactError.message },
        { status: 500 }
      );
    }

    // Crear deal
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        contact_id: contact.id,
        title: `${full_name} — Landing Lead`,
        status: "open",
      })
      .select()
      .single();

    if (dealError) {
      return NextResponse.json(
        { error: dealError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contact,
      deal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
