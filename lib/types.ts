// Fixed set of 10 — every item gets exactly one. Not user-extensible: unlike
// tags, there is no UI path to add a category, and the model prompt (see
// lib/analysis-shared.ts) is instructed to pick the closest of these rather
// than invent one.
export const CATEGORIES = [
  "Landing Pages & Marketing Sites",
  "SaaS & Dashboards",
  "Mobile Apps",
  "E-commerce & Retail",
  "Portfolios & Personal Sites",
  "Editorial, Blog & Publishing",
  "Fintech & Crypto",
  "AI & Developer Tools",
  "Onboarding & Auth Flows",
  "Components & UI Kits",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Starting tag vocabulary, seeded into the `tags` table on first run (see
// lib/db.ts). Unlike categories, tags are user-extensible from here on — the
// `tags` table, not this constant, is the live source of truth read by both
// the UI and the model prompt. This only seeds it once.
export const SEED_TAGS = [
  "Dark",
  "Light",
  "Colorful",
  "Monochrome",
  "Pastel",
  "Playful",
  "Elegant",
  "Bold",
  "Minimal",
  "Retro",
  "Grid-heavy",
  "Asymmetric",
  "Bento",
  "Card-based",
  "Full-bleed",
  "3D",
  "Animated",
  "Typography-led",
  "Illustrated",
  "Gradient",
] as const;

// "pending" means the row exists (image saved, placeholder metadata) but the
// vision model hasn't written real title/tags/etc. yet — see lib/ingest.ts.
export type AnalysisStatus = "pending" | "complete";

export interface VaultItem {
  id: string;
  filename: string;
  title: string;
  category: Category | string;
  tags: string[];
  description: string;
  design_notes: string;
  colors: string[];
  typography: string;
  layout: string;
  source_url: string | null;
  folder_id: string | null;
  analysis_status: AnalysisStatus;
  created_at: string;
}

// Raw shape as stored in SQLite (tags/colors as JSON strings)
export interface VaultItemRow {
  id: string;
  filename: string;
  title: string;
  category: string;
  tags: string;
  description: string;
  design_notes: string;
  colors: string;
  typography: string;
  layout: string;
  source_url: string | null;
  folder_id: string | null;
  analysis_status: AnalysisStatus;
  created_at: string;
}

export const UNSORTED_FOLDER_NAME = "Unsorted";

export interface Folder {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

export function rowToItem(row: VaultItemRow): VaultItem {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
    colors: JSON.parse(row.colors || "[]"),
  };
}

export interface AnalysisResult {
  title: string;
  category: string;
  tags: string[];
  description: string;
  design_notes: string;
  colors: string[];
  typography: string;
  layout: string;
}
