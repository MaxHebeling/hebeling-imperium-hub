import { NextRequest, NextResponse } from "next/server";
import {
  initializeEbookPipeline,
  advanceEbookStage,
  runEbookPipeline,
  analyzeEbookStructure,
  generateFrontMatter,
  createEbookExportPackage,
} from "@/lib/editorial/ebook/ebook-pipeline";
import { validateEbook } from "@/lib/editorial/ebook/ebook-validation";
import type {
  EbookProjectConfig,
  EbookStageKey,
  EbookChapter,
} from "@/lib/editorial/ebook/types";
import { DEFAULT_EBOOK_CONFIG, EBOOK_STAGE_KEYS } from "@/lib/editorial/ebook/types";

/**
 * POST /api/staff/projects/[projectId]/ebook
 *
 * Actions:
 *   - { action: "initialize", config }     → Initialize eBook pipeline
 *   - { action: "advance", stageKey }      → Advance to next stage
 *   - { action: "validate" }               → Run validation
 *   - { action: "export" }                 → Generate export package
 *   - { action: "run_full", config, chapters, title, author } → Run full pipeline
 *   - { action: "analyze", chapters }      → Analyze structure only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const action: string = body.action;

    if (!projectId) {
      return NextResponse.json({ error: "projectId requerido" }, { status: 400 });
    }

    switch (action) {
      case "initialize": {
        const config: EbookProjectConfig = {
          ...DEFAULT_EBOOK_CONFIG,
          ...(body.config ?? {}),
        };
        const state = initializeEbookPipeline(projectId, config);
        return NextResponse.json({ success: true, state });
      }

      case "advance": {
        const stageKey = body.stageKey as EbookStageKey;
        if (!stageKey || !EBOOK_STAGE_KEYS.includes(stageKey)) {
          return NextResponse.json(
            { error: `stageKey invalido. Valores validos: ${EBOOK_STAGE_KEYS.join(", ")}` },
            { status: 400 }
          );
        }
        const config: EbookProjectConfig = body.config ?? DEFAULT_EBOOK_CONFIG;
        let state = initializeEbookPipeline(projectId, config);
        state = advanceEbookStage(state, stageKey, body.approvedBy);
        return NextResponse.json({ success: true, state });
      }

      case "validate": {
        const chapters: EbookChapter[] = body.chapters ?? [];
        const config: EbookProjectConfig = body.config ?? DEFAULT_EBOOK_CONFIG;
        const structure = analyzeEbookStructure(projectId, chapters, config);
        const validation = validateEbook(projectId, structure, config);
        return NextResponse.json({ success: true, validation, structure });
      }

      case "export": {
        const config: EbookProjectConfig = body.config ?? DEFAULT_EBOOK_CONFIG;
        const validation = body.validation ?? null;
        const exportPackage = createEbookExportPackage(projectId, config, validation);
        return NextResponse.json({ success: true, exportPackage });
      }

      case "analyze": {
        const chapters: EbookChapter[] = body.chapters ?? [];
        const config: EbookProjectConfig = body.config ?? DEFAULT_EBOOK_CONFIG;
        const structure = analyzeEbookStructure(projectId, chapters, config);
        return NextResponse.json({ success: true, structure });
      }

      case "front_matter": {
        const config: EbookProjectConfig = body.config ?? DEFAULT_EBOOK_CONFIG;
        const chapters: EbookChapter[] = body.chapters ?? [];
        const structure = analyzeEbookStructure(projectId, chapters, config);
        const frontMatter = generateFrontMatter(
          body.title ?? "Untitled",
          body.author ?? "Unknown Author",
          config,
          structure
        );
        return NextResponse.json({ success: true, frontMatter });
      }

      case "run_full": {
        const config: EbookProjectConfig = {
          ...DEFAULT_EBOOK_CONFIG,
          ...(body.config ?? {}),
        };
        const chapters: EbookChapter[] = body.chapters ?? [];
        const title: string = body.title ?? "Untitled";
        const author: string = body.author ?? "Unknown Author";

        const result = runEbookPipeline(projectId, config, chapters, title, author);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json(
          {
            error: `Accion no reconocida: ${action}. Acciones validas: initialize, advance, validate, export, analyze, front_matter, run_full`,
          },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[ebook] Error:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
