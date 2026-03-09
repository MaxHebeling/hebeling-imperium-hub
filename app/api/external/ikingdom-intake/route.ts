import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    console.error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return NextResponse.json(
      { error: "Server configuration error. Supabase credentials not set." },
      { status: 503 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()

    const full_name = body.full_name != null ? String(body.full_name).trim() : ""
    const email = body.email != null ? String(body.email).trim() : ""
    const company = body.company != null ? String(body.company).trim() || null : null
    const whatsapp = body.whatsapp != null ? String(body.whatsapp).trim() || null : null
    const project_description = body.project_description != null ? String(body.project_description).trim() : ""
    const country = body.country != null ? String(body.country).trim() || null : null
    const state_region = body.state_region != null ? String(body.state_region).trim() || null : null
    const city = body.city != null ? String(body.city).trim() || null : null
    const postal_code = body.postal_code != null ? String(body.postal_code).trim() || null : null
    const address_line_1 = body.address_line_1 != null ? String(body.address_line_1).trim() || null : null
    const address_line_2 = body.address_line_2 != null ? String(body.address_line_2).trim() || null : null

    if (!full_name || !email || !project_description) {
      return NextResponse.json(
        { error: "Missing required fields: full name, email, and project description are required." },
        { status: 400 }
      )
    }

    const row: Record<string, unknown> = {
      full_name,
      company,
      email,
      whatsapp,
      project_description,
      country,
      state_region,
      city,
      postal_code,
      address_line_1,
      address_line_2,
    }

    const { data, error } = await supabase
      .from("external_forms_ikingdom")
      .insert([row])
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    const resendTo = process.env.RESEND_IKINGDOM_TO?.trim()
    if (resendApiKey && resendTo) {
      try {
        const resend = new Resend(resendApiKey)
        const from = process.env.RESEND_FROM?.trim() || "Hebeling <onboarding@resend.dev>"
        console.info("[ikingdom-intake] Resend attempting send", { to: resendTo, from })
        const projectDescHtml = escapeHtml(project_description).replace(/\n/g, "<br />")
        const htmlParts = [
          "<h2>Nuevo formulario iKingdom Intake</h2>",
          "<p><strong>Contact & Location</strong></p>",
          `<p><strong>Nombre:</strong> ${escapeHtml(full_name)}</p>`,
          `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
          company ? `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p>` : "",
          whatsapp ? `<p><strong>Phone / WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>` : "",
          country ? `<p><strong>Country:</strong> ${escapeHtml(country)}</p>` : "",
          state_region ? `<p><strong>State / Region:</strong> ${escapeHtml(state_region)}</p>` : "",
          city ? `<p><strong>City:</strong> ${escapeHtml(city)}</p>` : "",
          postal_code ? `<p><strong>Postal Code:</strong> ${escapeHtml(postal_code)}</p>` : "",
          address_line_1 ? `<p><strong>Address Line 1:</strong> ${escapeHtml(address_line_1)}</p>` : "",
          address_line_2 ? `<p><strong>Address Line 2:</strong> ${escapeHtml(address_line_2)}</p>` : "",
          "<p><strong>Descripción del proyecto (intake completo):</strong></p>",
          `<p>${projectDescHtml}</p>`,
          `<p><small>Registro ID: ${data?.id ?? "—"}</small></p>`,
        ]
        const { error: sendError } = await resend.emails.send({
          from,
          to: [resendTo],
          subject: `[iKingdom Intake] Nuevo formulario: ${full_name}`,
          html: htmlParts.join(""),
        })
        if (sendError) {
          console.error("[ikingdom-intake] Resend send failed:", JSON.stringify(sendError, null, 2))
        } else {
          console.info("[ikingdom-intake] Resend send succeeded")
        }
      } catch (err) {
        console.error("[ikingdom-intake] Resend exception (email not sent):", err)
      }
    } else {
      const missing: string[] = []
      if (!resendApiKey) missing.push("RESEND_API_KEY")
      if (!resendTo) missing.push("RESEND_IKINGDOM_TO")
      console.warn("[ikingdom-intake] Resend skipped (missing env)", { missing })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
