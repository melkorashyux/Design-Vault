import { NextRequest, NextResponse } from "next/server";

/**
 * Gate for /api/ingest and /api/folders — routes the Chrome extension calls
 * cross-origin. Returns a 401/500 response to short-circuit with, or null if
 * the request is authorized.
 */
export function requireToken(req: NextRequest): NextResponse | null {
  const token = process.env.VISUAL_BRAIN_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server misconfigured: VISUAL_BRAIN_TOKEN is not set in .env.local" },
      { status: 500 },
    );
  }

  const header = req.headers.get("x-visual-brain-token");
  if (header !== token) {
    return NextResponse.json({ error: "Invalid or missing X-Visual-Brain-Token header" }, { status: 401 });
  }

  return null;
}
