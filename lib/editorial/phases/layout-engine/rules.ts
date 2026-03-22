import {
  buildChapterOpenerConfig,
  getFontCombinationForStyle,
  getLayoutStylePreset,
  inferLayoutStyle,
} from "@/lib/editorial/layout/layout-director";
import type { EditorialCoverConceptPackage } from "../cover-generation/types";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import type {
  EditorialLayoutChapter,
  EditorialLayoutTemplate,
  EditorialTypographySystem,
} from "./types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function buildLayoutChapters(
  validatedManuscript: EditorialValidatedManuscript
): EditorialLayoutChapter[] {
  if (validatedManuscript.chapter_revisions.length > 0) {
    return validatedManuscript.chapter_revisions.map((chapter, index) => ({
      id: chapter.id,
      order: index + 1,
      title:
        chapter.chapter_title.trim() || `Capítulo ${String(index + 1).padStart(2, "0")}`,
      anchor: `chapter-${String(index + 1).padStart(2, "0")}-${slugify(chapter.chapter_title || `capitulo-${index + 1}`)}`,
      text: chapter.validated_text.trim(),
      word_count: countWords(chapter.validated_text),
    }));
  }

  const fallbackText = validatedManuscript.full_validated_text.trim();
  return [
    {
      id: "chapter-01",
      order: 1,
      title: "Texto principal",
      anchor: "chapter-01-texto-principal",
      text: fallbackText,
      word_count: countWords(fallbackText),
    },
  ];
}

export function buildTypographySystem(options: {
  metadata: EditorialMetadataPackage;
  validatedManuscript: EditorialValidatedManuscript;
}): EditorialTypographySystem {
  const layoutStyle = inferLayoutStyle({
    genre: options.metadata.categories[0] ?? "general",
    tone: options.metadata.positioning_statement,
    audience: options.metadata.target_audience,
    wordCount: countWords(options.validatedManuscript.full_validated_text),
  });

  const preset = getLayoutStylePreset(layoutStyle);
  const fonts = getFontCombinationForStyle(layoutStyle);
  const chapterOpener = buildChapterOpenerConfig(
    preset?.chapterOpener ?? "centered_classic"
  );

  return {
    layout_style: layoutStyle,
    font_combination_id: fonts.id,
    body_font: preset?.typography.bodyFont ?? fonts.bodyFont,
    body_size: preset?.typography.bodySize ?? 11,
    body_line_height: preset?.typography.bodyLineHeight ?? 1.5,
    chapter_title_font: preset?.typography.chapterTitleFont ?? fonts.headingFont,
    chapter_title_size: preset?.typography.chapterTitleSize ?? 24,
    subtitle_font: preset?.typography.subtitleFont ?? fonts.accentFont,
    subtitle_size: preset?.typography.subtitleSize ?? 14,
    header_font: preset?.typography.headerFont ?? fonts.headingFont,
    header_size: preset?.typography.headerSize ?? 8,
    page_number_font: preset?.typography.pageNumberFont ?? fonts.bodyFont,
    page_number_size: preset?.typography.pageNumberSize ?? 9,
    paragraph_indent: preset?.typography.paragraphIndent ?? 7,
    chapter_opener: chapterOpener,
  };
}

export function buildLayoutTemplates(): {
  printTemplate: EditorialLayoutTemplate;
  digitalTemplate: EditorialLayoutTemplate;
} {
  return {
    printTemplate: {
      id: "trade_print",
      label: 'Trade Print 6" x 9"',
      description: "Plantilla de interior para impresion profesional trade paperback.",
      output_format: "pdf",
      page_preset_id: "trade_6x9",
      include_front_matter: true,
      include_table_of_contents: true,
      include_running_headers: true,
      reflowable: false,
    },
    digitalTemplate: {
      id: "reflowable_epub",
      label: "Reflowable EPUB",
      description: "Plantilla digital limpia y reflowable para EPUB de distribucion general.",
      output_format: "epub",
      page_preset_id: null,
      include_front_matter: true,
      include_table_of_contents: true,
      include_running_headers: false,
      reflowable: true,
    },
  };
}

export function selectCoverVariationKey(
  coverPackage: EditorialCoverConceptPackage | null
): string | null {
  return coverPackage?.variations[0]?.key ?? null;
}
