import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type {
  CoverVariationKey,
  EditorialCreativeDirection,
} from "./types";

type VariationBlueprint = {
  key: CoverVariationKey;
  title: string;
  rationale: string;
  marketAngle: string;
  compositionHint: string;
};

function getPaletteForGenre(genre: string): string[] {
  const value = genre.toLowerCase();

  if (value.includes("fantas")) return ["azul noche", "dorado viejo", "magenta profundo"];
  if (value.includes("terror")) return ["negro carbón", "rojo oscuro", "gris humo"];
  if (value.includes("romance")) return ["vino suave", "marfil", "rosa apagado"];
  if (value.includes("ensayo")) return ["azul petróleo", "marfil", "gris pizarra"];
  if (value.includes("ciencia")) return ["índigo", "cian eléctrico", "gris acero"];

  return ["azul profundo", "marfil", "dorado suave"];
}

function getSymbolsForGenre(genre: string, title: string): string[] {
  const value = genre.toLowerCase();
  const titleValue = title.toLowerCase();

  if (titleValue.includes("puente")) {
    return ["puente simbólico", "camino hacia la luz", "horizonte profundo"];
  }
  if (value.includes("fantas")) {
    return ["portal luminoso", "arquitectura mítica", "figura en tránsito"];
  }
  if (value.includes("ensayo")) {
    return ["símbolo central abstracto", "textura editorial limpia", "composición sobria"];
  }

  return ["símbolo central memorable", "atmósfera narrativa", "espacio negativo elegante"];
}

function getImageStyleForGenre(genre: string): string {
  const value = genre.toLowerCase();

  if (value.includes("fantas")) return "illustrated cinematic digital art";
  if (value.includes("terror")) return "cinematic dramatic illustration";
  if (value.includes("romance")) return "editorial romantic illustration";
  if (value.includes("ensayo")) return "premium typographic editorial design";

  return "premium editorial illustration";
}

function getMoodForMetadata(metadata: EditorialMetadataPackage): string {
  const positioning = metadata.positioning_statement.toLowerCase();
  if (positioning.includes("transform")) return "transformative and emotionally expansive";
  if (positioning.includes("oscura")) return "mysterious and intense";
  return "elevated, memorable, and commercially polished";
}

export function buildCreativeDirection(
  metadata: EditorialMetadataPackage
): EditorialCreativeDirection {
  return {
    version: 1,
    genre: metadata.categories[0] ?? "general",
    target_audience: metadata.target_audience,
    positioning_statement: metadata.positioning_statement,
    mood: getMoodForMetadata(metadata),
    palette: getPaletteForGenre(metadata.categories[0] ?? "general"),
    visual_symbols: getSymbolsForGenre(
      metadata.categories[0] ?? "general",
      metadata.optimized_title
    ),
    composition_notes: [
      "Composición vertical 2:3 lista para mercado editorial.",
      "Centro visual claro con foco instantáneo en miniatura.",
      "Espacio útil para integrar tipografía profesional después de la generación.",
    ],
    typography_direction:
      "Tipografía premium y legible, preparada para colocación posterior fuera de la imagen generada.",
    image_style: getImageStyleForGenre(metadata.categories[0] ?? "general"),
    negative_prompts: [
      "sin marcas de agua",
      "sin texto incrustado",
      "sin mockup de libro",
      "sin manos deformes",
      "sin composición amateur",
    ],
  };
}

export function getCoverVariationBlueprints(): VariationBlueprint[] {
  return [
    {
      key: "iconic",
      title: "Concepto icónico",
      rationale: "Busca una imagen-símbolo memorable que funcione bien en miniatura.",
      marketAngle: "Alta recordación visual para catálogo y e-commerce.",
      compositionHint: "Un solo símbolo dominante con fondo controlado y contraste alto.",
    },
    {
      key: "narrative",
      title: "Concepto narrativo",
      rationale: "Presenta escena, atmósfera y mundo de la historia.",
      marketAngle: "Conecta rápido con lectores del género mediante imaginario narrativo.",
      compositionHint: "Escena inmersiva con profundidad, personaje o recorrido visual claro.",
    },
    {
      key: "typographic",
      title: "Concepto tipográfico-editorial",
      rationale: "Se apoya en formas gráficas y composición editorial limpia.",
      marketAngle: "Apariencia premium y sofisticada para mercados editoriales selectos.",
      compositionHint: "Forma abstracta o símbolo refinado con estructura minimalista y gran espacio negativo.",
    },
  ];
}

export function buildVariationPrompt(input: {
  metadata: EditorialMetadataPackage;
  direction: EditorialCreativeDirection;
  blueprint: VariationBlueprint;
  validatedSummary: string;
}): string {
  return [
    `Create a premium vertical book cover concept for a professional publishing house.`,
    `Book title: ${input.metadata.optimized_title}.`,
    `Subtitle reference: ${input.metadata.subtitle}.`,
    `Genre: ${input.direction.genre}.`,
    `Audience: ${input.direction.target_audience}.`,
    `Positioning: ${input.direction.positioning_statement}.`,
    `Mood: ${input.direction.mood}.`,
    `Image style: ${input.direction.image_style}.`,
    `Palette: ${input.direction.palette.join(", ")}.`,
    `Key symbols: ${input.direction.visual_symbols.join(", ")}.`,
    `Concept type: ${input.blueprint.title}.`,
    `Concept rationale: ${input.blueprint.rationale}.`,
    `Market angle: ${input.blueprint.marketAngle}.`,
    `Composition hint: ${input.blueprint.compositionHint}.`,
    `Description: ${input.metadata.book_description}.`,
    `Validated manuscript summary: ${input.validatedSummary}.`,
    `Composition notes: ${input.direction.composition_notes.join(" ")}`,
    `Typography direction: ${input.direction.typography_direction}`,
    `Important: no visible title text, no visible author name, no mockup, no watermark.`,
    `Negative prompts: ${input.direction.negative_prompts.join(", ")}.`,
    `Output a single polished cover concept image, high-end editorial quality, 2:3 vertical format.`,
  ].join(" ");
}

export function createCoverVariationId(): string {
  return createFoundationId();
}
