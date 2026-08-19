import { NextResponse } from "next/server";
import { listItems } from "@/lib/db";

export async function GET() {
  const items = listItems();
  return NextResponse.json({ items });
}
