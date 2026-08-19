import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import { createFolder, listFolders, DuplicateFolderError } from "@/lib/db";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest) {
  const unauthorized = requireToken(req);
  if (unauthorized) return withCors(unauthorized, req);

  return withCors(NextResponse.json({ folders: listFolders() }), req);
}

export async function POST(req: NextRequest) {
  const unauthorized = requireToken(req);
  if (unauthorized) return withCors(unauthorized, req);

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return withCors(NextResponse.json({ error: "name is required" }, { status: 400 }), req);
  }

  try {
    const folder = createFolder(name);
    return withCors(NextResponse.json({ folder }, { status: 201 }), req);
  } catch (err) {
    if (err instanceof DuplicateFolderError) {
      return withCors(NextResponse.json({ error: err.message }, { status: 409 }), req);
    }
    throw err;
  }
}
