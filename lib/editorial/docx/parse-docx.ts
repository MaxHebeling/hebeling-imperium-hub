import mammoth from "mammoth";

/**
 * Parsea un buffer DOCX y extrae el texto plano usando mammoth.
 * Usado para: pipeline editorial (aplicar sugerencias y regenerar DOCX).
 */
export async function parseDocxToText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value ?? "";
}

/**
 * Parsea DOCX a texto y lo devuelve como array de párrafos (separados por doble salto).
 * Útil para generar un nuevo DOCX conservando estructura de párrafos.
 */
export async function parseDocxToParagraphs(buffer: Buffer): Promise<string[]> {
  const text = await parseDocxToText(buffer);
  if (!text.trim()) return [];
  return text.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);
}
