import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for the routes the Chrome extension calls (/api/ingest, /api/folders).
 * The vault's own web UI is same-origin and never needs these headers.
 */
function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && origin.startsWith("chrome-extension://");
}

export function applyCors(res: NextResponse, origin: string | null): NextResponse {
  if (isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin!);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Vault-Token");
  return res;
}

export function withCors(res: NextResponse, req: NextRequest): NextResponse {
  return applyCors(res, req.headers.get("origin"));
}

export function corsPreflight(req: NextRequest): NextResponse {
  return applyCors(new NextResponse(null, { status: 204 }), req.headers.get("origin"));
}
