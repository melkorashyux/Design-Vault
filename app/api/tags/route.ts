import { NextRequest, NextResponse } from "next/server";
import { addTags, listTags } from "@/lib/db";

// Same-origin only (no token/CORS) — mirrors /api/items. Unlike /api/folders
// and /api/ingest, nothing in the Chrome extension reads or writes tags.
export async function GET() {
  return NextResponse.json({ tags: listTags() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const names = Array.isArray(body?.names)
    ? body.names.filter((n: unknown): n is string => typeof n === "string")
    : typeof body?.name === "string"
      ? [body.name]
      : [];

  if (names.length === 0) {
    return NextResponse.json({ error: "name or names is required" }, { status: 400 });
  }

  return NextResponse.json({ tags: addTags(names) }, { status: 201 });
}
