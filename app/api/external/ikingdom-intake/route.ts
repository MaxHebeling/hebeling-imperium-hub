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

    const { full_name, company, email, whatsapp, project_description } = body

    if (!full_name || !email || !project_description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("external_forms_ikingdom")
      .insert([
        {
          full_name,
          company,
          email,
          whatsapp,
          project_description,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 }
      )
    }

    // Envío de correo encima del flujo (opcional; si falla solo se registra, no se rompe)
    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    const resendTo = process.env.RESEND_IKINGDOM_TO?.trim()
    if (resendApiKey && resendTo) {
      try {
        const resend = new Resend(resendApiKey)
        const from = process.env.RESEND_FROM?.trim() || "Hebeling <onboarding@resend.dev>"
        const { error: sendError } = await resend.emails.send({
          from,
          to: [resendTo],
          subject: `[iKingdom Intake] Nuevo formulario: ${full_name}`,
          html: [
            "<h2>Nuevo formulario iKingdom Intake</h2>",
            `<p><strong>Nombre:</strong> ${escapeHtml(full_name)}</p>`,
            `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
            company ? `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p>` : "",
            whatsapp ? `<p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>` : "",
            `<p><strong>Descripción del proyecto:</strong></p><p>${escapeHtml(project_description)}</p>`,
            `<p><small>Registro ID: ${data?.id ?? "—"}</small></p>`,
          ].join(""),
        })
        if (sendError) {
          console.error("[ikingdom-intake] Resend send failed:", JSON.stringify(sendError, null, 2))
        }
      } catch (err) {
        console.error("[ikingdom-intake] Resend exception (email not sent):", err)
      }
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
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
