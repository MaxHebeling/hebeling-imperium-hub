import { getAdminClient } from "@/lib/leads/helpers";

/**
 * Fetch manuscript content from storage.
 * Shared utility to avoid circular dependencies between processor and agents.
 */
export async function fetchManuscriptContent(projectId: string, fileId?: string | null): Promise<string> {
  const supabase = getAdminClient();

  // Get the file record
  let fileQuery = supabase
    .from("editorial_files")
    .select("storage_path")
    .eq("project_id", projectId);

  if (fileId) {
    fileQuery = fileQuery.eq("id", fileId);
  } else {
    fileQuery = fileQuery.order("version", { ascending: false }).limit(1);
  }

  const { data: fileRecord, error: fileError } = await fileQuery.single();

  if (fileError || !fileRecord) {
    throw new Error(`No se encontro el archivo del manuscrito: ${fileError?.message}`);
  }

  // Download from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("editorial-manuscripts")
    .download(fileRecord.storage_path);

  if (downloadError || !fileData) {
    throw new Error(`Error al descargar el manuscrito: ${downloadError?.message}`);
  }

  // Convert to text - handle different file types based on storage path
  const fileName = fileRecord.storage_path.toLowerCase();
  
  if (fileName.endsWith(".txt")) {
    return await fileData.text();
  }
  
  if (fileName.endsWith(".docx")) {
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const { parseDocxToText } = await import("@/lib/editorial/docx");
      const buffer = Buffer.from(arrayBuffer);
      return await parseDocxToText(buffer);
    } catch (err) {
      console.error("[manuscript-loader] DOCX parse error", (err as Error).message);
      throw new Error("No se pudo extraer texto del DOCX.");
    }
  }

  if (fileName.endsWith(".pdf")) {
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as Record<string, unknown>).default
        ? (pdfParseModule as Record<string, unknown>).default as (buf: Buffer) => Promise<{ text: string }>
        : pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      const text = result.text ?? "";
      if (!text.trim()) {
        console.warn("[manuscript-loader] PDF extracted but text is empty (scanned PDF?)");
        return "[Contenido PDF - el documento parece ser un PDF escaneado sin texto extraible]";
      }
      return text;
    } catch (err) {
      console.error("[manuscript-loader] PDF parse error", (err as Error).message);
      throw new Error("No se pudo extraer texto del PDF.");
    }
  }

  // Default: try to read as text
  return await fileData.text();
}
