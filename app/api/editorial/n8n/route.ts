import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "https://maxhebeling.app.n8n.cloud/webhook/editorial-ai-process";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, action } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId es requerido" },
        { status: 400 }
      );
    }

    // Fetch project data from Supabase
    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Fetch the latest manuscript file
    const { data: manuscriptFile } = await supabase
      .from("editorial_files")
      .select("*")
      .eq("project_id", projectId)
      .eq("file_type", "manuscript")
      .order("version", { ascending: false })
      .limit(1)
      .single();

    // Extract manuscript text from storage
    let manuscriptText = "";
    if (manuscriptFile?.file_path) {
      try {
        const { data: fileData } = await supabase.storage
          .from("editorial-manuscripts")
          .download(manuscriptFile.file_path);
        if (fileData) {
          const ext = manuscriptFile.file_name?.split(".").pop()?.toLowerCase();
          if (ext === "txt") {
            manuscriptText = await fileData.text();
          } else if (ext === "docx" || ext === "doc") {
            // For DOCX, send as base64 and let n8n handle extraction
            const buffer = Buffer.from(await fileData.arrayBuffer());
            try {
              const mammoth = await import("mammoth");
              const result = await mammoth.extractRawText({ buffer });
              manuscriptText = result.value;
            } catch {
              manuscriptText = buffer.toString("utf-8").substring(0, 50000);
            }
          } else if (ext === "pdf") {
            try {
              const pdfParse = (await import("pdf-parse")).default;
              const buffer = Buffer.from(await fileData.arrayBuffer());
              const pdfData = await pdfParse(buffer);
              manuscriptText = pdfData.text;
            } catch {
              manuscriptText = "[Contenido PDF - requiere extracción manual]";
            }
          }
          // Truncate to avoid exceeding API limits
          if (manuscriptText.length > 50000) {
            manuscriptText = manuscriptText.substring(0, 50000) + "\n\n[Texto truncado a 50,000 caracteres]";
          }
        }
      } catch (e) {
        console.error("[n8n-trigger] Error extracting manuscript text:", e);
        manuscriptText = "[Error al extraer texto del manuscrito]";
      }
    }

    // Build the payload for n8n webhook
    const webhookPayload = {
      action: action || "run_pipeline",
      project_id: projectId,
      manuscript_title: project.title,
      author_name: project.author_name,
      language: project.language || "es",
      genre: project.genre,
      current_stage: project.current_stage,
      manuscript_text: manuscriptText,
      manuscript_file: manuscriptFile
        ? {
            id: manuscriptFile.id,
            file_name: manuscriptFile.file_name,
            file_path: manuscriptFile.file_path,
            file_type: manuscriptFile.file_type,
            mime_type: manuscriptFile.mime_type,
            version: manuscriptFile.version,
          }
        : null,
      triggered_by: user.id,
      triggered_at: new Date().toISOString(),
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Call n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("[n8n-trigger] n8n webhook failed:", n8nResponse.status, errorText);
      return NextResponse.json(
        {
          error: "Error al comunicarse con n8n",
          details: `Status ${n8nResponse.status}`,
        },
        { status: 502 }
      );
    }

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch {
      n8nResult = { status: "accepted" };
    }

    // Log the trigger event in activity log
    await supabase.from("editorial_activity_log").insert({
      project_id: projectId,
      actor_id: user.id,
      action: "n8n_pipeline_triggered",
      details: JSON.stringify({
        action: action || "run_pipeline",
        webhook_url: N8N_WEBHOOK_URL,
        n8n_response: n8nResult,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Pipeline n8n activado exitosamente",
      n8n_response: n8nResult,
      project: {
        id: project.id,
        title: project.title,
        current_stage: project.current_stage,
      },
    });
  } catch (error) {
    console.error("[n8n-trigger] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook_url: N8N_WEBHOOK_URL,
    description: "POST to trigger n8n editorial pipeline for a project",
    required_body: {
      projectId: "string (UUID)",
      action: "string (optional: run_pipeline | run_analysis | run_correction)",
    },
  });
}
