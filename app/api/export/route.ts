import { NextRequest, NextResponse } from "next/server";
import { exportItems } from "@/lib/export";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  try {
    const { exportDir, fileCount } = await exportItems(ids);
    return NextResponse.json({ exportDir, fileCount });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 },
    );
  }
}
