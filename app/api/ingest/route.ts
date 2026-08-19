import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import { saveAndAnalyze, SUPPORTED_MIME_TYPES } from "@/lib/ingest";

interface IngestBody {
  imageBase64?: string;
  mediaType?: string;
  folderId?: string | null;
  sourceUrl?: string;
  pageUrl?: string;
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const unauthorized = requireToken(req);
  if (unauthorized) return withCors(unauthorized, req);

  const body = (await req.json().catch(() => null)) as IngestBody | null;
  if (!body) {
    return withCors(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }), req);
  }

  let buffer: Buffer;
  let mediaType: string;

  if (body.imageBase64) {
    mediaType = body.mediaType ?? "";
    if (!SUPPORTED_MIME_TYPES.includes(mediaType)) {
      return withCors(
        NextResponse.json(
          { error: `mediaType must be one of ${SUPPORTED_MIME_TYPES.join(", ")}` },
          { status: 400 },
        ),
        req,
      );
    }
    try {
      buffer = Buffer.from(body.imageBase64, "base64");
    } catch {
      return withCors(NextResponse.json({ error: "imageBase64 is not valid base64" }, { status: 400 }), req);
    }
  } else if (body.sourceUrl) {
    try {
      const fetched = await fetch(body.sourceUrl);
      if (!fetched.ok) throw new Error(`Fetch responded ${fetched.status}`);
      mediaType = (fetched.headers.get("content-type") ?? "").split(";")[0].trim();
      if (!SUPPORTED_MIME_TYPES.includes(mediaType)) {
        return withCors(
          NextResponse.json({ error: `Fetched image had unsupported type: ${mediaType}` }, { status: 400 }),
          req,
        );
      }
      buffer = Buffer.from(await fetched.arrayBuffer());
    } catch (err) {
      return withCors(
        NextResponse.json(
          { error: `Could not fetch sourceUrl: ${err instanceof Error ? err.message : "unknown error"}` },
          { status: 400 },
        ),
        req,
      );
    }
  } else {
    return withCors(
      NextResponse.json({ error: "Provide imageBase64 + mediaType, or sourceUrl" }, { status: 400 }),
      req,
    );
  }

  const item = await saveAndAnalyze({
    buffer,
    mediaType,
    fallbackTitle: deriveFallbackTitle(body.sourceUrl, body.pageUrl),
    sourceUrl: body.pageUrl?.trim() || null,
    folderId: body.folderId?.trim() || null,
  });

  return withCors(NextResponse.json({ item }, { status: 201 }), req);
}

function deriveFallbackTitle(sourceUrl?: string, pageUrl?: string): string {
  try {
    if (sourceUrl) {
      const base = new URL(sourceUrl).pathname.split("/").filter(Boolean).pop();
      if (base) return decodeURIComponent(base.replace(/\.[^.]+$/, ""));
    }
  } catch {
    // fall through
  }
  try {
    if (pageUrl) return new URL(pageUrl).hostname;
  } catch {
    // fall through
  }
  return "Saved image";
}
