import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const supabase = getAdminClient();

    // Get file record
    const { data: file, error: fileError } = await supabase
      .from("editorial_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Generate signed URL for viewing (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("editorial-files")
      .createSignedUrl(file.storage_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[editorial-files] Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Could not generate file URL" },
        { status: 500 }
      );
    }

    // Redirect to signed URL for viewing
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (err) {
    console.error("[editorial-files] View error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
