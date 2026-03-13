import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { extractManuscriptText } from "@/lib/editorial/files/extract-text";
import { getAdminClient } from "@/lib/leads/helpers";

const MAX_SUMMARY_CHARS = 4000;

/**
 * POST /api/staff/projects/[projectId]/ai/generate-cover
 * Body: { userPrompt?: string }
 *
 * 1. Lee el manuscrito más reciente del proyecto.
 * 2. Genera un resumen editorial con OpenAI (gpt-4.1-mini).
 * 3. Combina el resumen + prompt del usuario para DALL-E 3.
 * 4. Genera la portada y la guarda en Supabase Storage (editorial-covers).
 * 5. Registra la portada como editorial_file con file_type "cover".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado." },
        { status: 404 }
      );
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });

    if (!decision.allowed && staff.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: missing ai:run capability" },
        { status: 403 }
      );
    }

    // Parse user prompt
    const body = await request.json().catch(() => ({}));
    const userPrompt = typeof body?.userPrompt === "string" ? body.userPrompt.trim() : "";

    // 1. Get manuscript text
    const latest = await getLatestManuscriptForProject(projectId);
    if (!latest) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún manuscrito para generar la portada." },
        { status: 404 }
      );
    }

    const extracted = await extractManuscriptText(latest.file);
    const manuscriptSnippet = extracted.text.slice(0, MAX_SUMMARY_CHARS);

    // 2. Generate editorial summary for cover context using OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Configuración de OpenAI ausente (OPENAI_API_KEY)." },
        { status: 500 }
      );
    }

    console.info("[editorial-ai][cover] generating summary for cover", {
      projectId,
      titleProject: project.title,
      manuscriptChars: manuscriptSnippet.length,
    });

    const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un director de arte editorial. Analiza el contenido del manuscrito y genera una descripción visual concisa para la portada de un libro. Responde SOLO con JSON válido.",
          },
          {
            role: "user",
            content: `Analiza este manuscrito y genera una propuesta visual para la portada.

Título del libro: ${project.title}
Autor: ${project.author_name ?? "Desconocido"}
Género: ${project.genre ?? "No especificado"}

Fragmento del manuscrito:
${manuscriptSnippet}

Responde con este JSON exacto:
{
  "theme": "tema principal del libro en 1 frase",
  "mood": "estado de ánimo/tono visual (ej: esperanzador, dramático, sereno)",
  "colors": "paleta de colores sugerida (ej: tonos cálidos dorados y tierra)",
  "elements": "elementos visuales clave para la portada (ej: montaña al atardecer, silueta de persona)",
  "style": "estilo artístico sugerido (ej: ilustración acuarela, fotografía minimalista, arte digital)",
  "cover_prompt": "prompt completo optimizado para generar la portada con DALL-E 3"
}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!summaryRes.ok) {
      const errText = await summaryRes.text();
      console.error("[editorial-ai][cover] OpenAI summary error", { status: summaryRes.status, body: errText });
      return NextResponse.json(
        { success: false, error: `Error al generar concepto visual (HTTP ${summaryRes.status}).` },
        { status: 500 }
      );
    }

    const summaryJson = (await summaryRes.json()) as Record<string, unknown>;
    const summaryContent = (summaryJson as any)?.choices?.[0]?.message?.content ?? "{}";
    let coverConcept: {
      theme?: string;
      mood?: string;
      colors?: string;
      elements?: string;
      style?: string;
      cover_prompt?: string;
    };
    try {
      coverConcept = JSON.parse(summaryContent);
    } catch {
      coverConcept = {};
    }

    // 3. Build DALL-E prompt
    const baseDallePrompt = coverConcept.cover_prompt ?? `Book cover for "${project.title}"`;
    const dallePrompt = userPrompt
      ? `${baseDallePrompt}. Indicaciones adicionales del editor: ${userPrompt}. Formato: portada de libro vertical, profesional, alta calidad, sin texto ni letras visibles en la imagen.`
      : `${baseDallePrompt}. Formato: portada de libro vertical, profesional, alta calidad, sin texto ni letras visibles en la imagen.`;

    console.info("[editorial-ai][cover] generating image with DALL-E 3", {
      projectId,
      promptLength: dallePrompt.length,
    });

    // 4. Generate cover with DALL-E 3
    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt.slice(0, 4000),
        n: 1,
        size: "1024x1792",
        quality: "hd",
        response_format: "b64_json",
      }),
    });

    if (!dalleRes.ok) {
      const errText = await dalleRes.text();
      console.error("[editorial-ai][cover] DALL-E error", { status: dalleRes.status, body: errText });
      return NextResponse.json(
        { success: false, error: `Error al generar la portada con DALL-E (HTTP ${dalleRes.status}).` },
        { status: 500 }
      );
    }

    const dalleJson = (await dalleRes.json()) as Record<string, unknown>;
    const imageB64 = (dalleJson as any)?.data?.[0]?.b64_json;
    const revisedPrompt = (dalleJson as any)?.data?.[0]?.revised_prompt ?? dallePrompt;

    if (!imageB64) {
      return NextResponse.json(
        { success: false, error: "DALL-E no devolvió imagen." },
        { status: 500 }
      );
    }

    // 5. Upload to Supabase Storage
    const supabase = getAdminClient();
    const imageBuffer = Buffer.from(imageB64, "base64");
    const timestamp = Date.now();
    const storagePath = `${projectId}/cover-${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from("editorial-covers")
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[editorial-ai][cover] storage upload error", { message: uploadError.message });
      return NextResponse.json(
        { success: false, error: `Error al guardar la portada: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("editorial-covers")
      .getPublicUrl(storagePath);

    // 7. Get next version number for cover files
    const { data: existingCovers } = await supabase
      .from("editorial_files")
      .select("version")
      .eq("project_id", projectId)
      .eq("file_type", "cover")
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existingCovers?.[0]?.version ?? 0) + 1;

    // 8. Register in editorial_files
    const { data: fileRecord, error: fileError } = await supabase
      .from("editorial_files")
      .insert({
        project_id: projectId,
        stage_key: "maquetacion",
        file_type: "cover",
        version: nextVersion,
        storage_path: storagePath,
        mime_type: "image/png",
        size_bytes: imageBuffer.byteLength,
        uploaded_by: staff.userId,
        visibility: "internal",
      })
      .select("id")
      .single();

    if (fileError) {
      console.error("[editorial-ai][cover] file record error", { message: fileError.message });
    }

    console.info("[editorial-ai][cover] cover generated successfully", {
      projectId,
      storagePath,
      version: nextVersion,
      fileId: fileRecord?.id,
    });

    return NextResponse.json({
      success: true,
      cover: {
        fileId: fileRecord?.id ?? null,
        storagePath,
        publicUrl: publicUrlData?.publicUrl ?? null,
        version: nextVersion,
        concept: coverConcept,
        revisedPrompt,
      },
    });
  } catch (error) {
    console.error("[editorial-ai][cover] endpoint error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * GET /api/staff/projects/[projectId]/ai/generate-cover
 *
 * Devuelve las portadas generadas para el proyecto.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireStaff();
    const { projectId } = await params;

    const supabase = getAdminClient();

    const { data: covers, error } = await supabase
      .from("editorial_files")
      .select("id, version, storage_path, size_bytes, created_at")
      .eq("project_id", projectId)
      .eq("file_type", "cover")
      .order("version", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const coversWithUrls = (covers ?? []).map((cover) => {
      const { data: urlData } = supabase.storage
        .from("editorial-covers")
        .getPublicUrl(cover.storage_path);
      return {
        ...cover,
        publicUrl: urlData?.publicUrl ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      covers: coversWithUrls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
