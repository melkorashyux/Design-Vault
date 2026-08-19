import { NextRequest, NextResponse } from "next/server";
import { saveAndAnalyze, SUPPORTED_MIME_TYPES } from "@/lib/ingest";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const sourceUrl = form.get("source_url");
  const folderId = form.get("folder_id");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type}` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fallbackTitle = file.name.replace(/\.[^.]+$/, "");

  const item = await saveAndAnalyze({
    buffer,
    mediaType: file.type,
    fallbackTitle,
    sourceUrl: typeof sourceUrl === "string" && sourceUrl.trim() ? sourceUrl.trim() : null,
    folderId: typeof folderId === "string" && folderId.trim() ? folderId.trim() : null,
  });

  return NextResponse.json({ item });
}
