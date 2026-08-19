import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import {
  deleteFolder,
  renameFolder,
  DuplicateFolderError,
  ProtectedFolderError,
} from "@/lib/db";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireToken(req);
  if (unauthorized) return withCors(unauthorized, req);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return withCors(NextResponse.json({ error: "name is required" }, { status: 400 }), req);
  }

  try {
    const folder = renameFolder(id, name);
    if (!folder) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), req);
    return withCors(NextResponse.json({ folder }), req);
  } catch (err) {
    if (err instanceof DuplicateFolderError) {
      return withCors(NextResponse.json({ error: err.message }, { status: 409 }), req);
    }
    if (err instanceof ProtectedFolderError) {
      return withCors(NextResponse.json({ error: err.message }, { status: 400 }), req);
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireToken(req);
  if (unauthorized) return withCors(unauthorized, req);

  const { id } = await params;
  try {
    const ok = deleteFolder(id);
    if (!ok) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), req);
    return withCors(NextResponse.json({ ok: true }), req);
  } catch (err) {
    if (err instanceof ProtectedFolderError) {
      return withCors(NextResponse.json({ error: err.message }, { status: 400 }), req);
    }
    throw err;
  }
}
