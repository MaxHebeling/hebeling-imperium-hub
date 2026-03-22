import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { executeEditorialIntake } from "@/lib/editorial/phases/intake/service";

function readOptionalString(
  value: FormDataEntryValue | null
): string | null | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readTags(value: FormDataEntryValue | null): string[] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const manuscript = formData.get("manuscript");

    if (!(manuscript instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A manuscript file is required." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await executeEditorialIntake({
      actorId: user?.id ?? null,
      manuscript,
      metadata: {
        author: typeof formData.get("author") === "string"
          ? (formData.get("author") as string)
          : typeof formData.get("authorName") === "string"
            ? (formData.get("authorName") as string)
            : "",
        title: typeof formData.get("title") === "string"
          ? (formData.get("title") as string)
          : typeof formData.get("bookTitle") === "string"
            ? (formData.get("bookTitle") as string)
            : "",
        subtitle:
          readOptionalString(formData.get("subtitle")) ??
          readOptionalString(formData.get("bookSubtitle")) ??
          undefined,
        language: readOptionalString(formData.get("language")) ?? "es",
        genre:
          readOptionalString(formData.get("genre")) ??
          readOptionalString(formData.get("category")) ??
          "",
        synopsis:
          readOptionalString(formData.get("synopsis")) ??
          readOptionalString(formData.get("shortDescription")) ??
          undefined,
        tags: readTags(formData.get("tags")),
        serviceType:
          (readOptionalString(formData.get("serviceType")) as
            | "full_pipeline"
            | "reedicion"
            | "rediseno_portada"
            | "reedicion_y_portada"
            | null
            | undefined) ?? undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[editorial/workflow/intake] POST error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid editorial intake payload.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
