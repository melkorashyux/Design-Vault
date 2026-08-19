import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createItem } from "@/lib/db";
import { analyzeScreenshot } from "@/lib/anthropic";
import type { VaultItem } from "@/lib/types";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

export const SUPPORTED_MIME_TYPES = Object.keys(EXT_BY_MIME);

export interface SaveAndAnalyzeInput {
  buffer: Buffer;
  mediaType: string;
  fallbackTitle: string;
  sourceUrl?: string | null;
  folderId?: string | null;
}

/** Saves image bytes to disk, runs the Claude analysis pipeline, and stores the row. */
export async function saveAndAnalyze(input: SaveAndAnalyzeInput): Promise<VaultItem> {
  const ext = EXT_BY_MIME[input.mediaType];
  if (!ext) throw new Error(`Unsupported image type: ${input.mediaType}`);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), input.buffer);

  const analysis = await analyzeScreenshot(
    input.buffer.toString("base64"),
    input.mediaType,
    input.fallbackTitle,
  );

  return createItem({
    filename,
    title: analysis.title,
    category: analysis.category,
    tags: analysis.tags,
    description: analysis.description,
    design_notes: analysis.design_notes,
    colors: analysis.colors,
    typography: analysis.typography,
    layout: analysis.layout,
    source_url: input.sourceUrl ?? null,
    folder_id: input.folderId ?? null,
  });
}
