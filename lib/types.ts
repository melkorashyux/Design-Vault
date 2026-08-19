export const CATEGORIES = [
  "Landing Page",
  "Marketing Site",
  "Dashboard / App UI",
  "Portfolio",
  "E-commerce",
  "Editorial / Blog",
  "Mobile App",
  "Email / Newsletter",
  "Branding / Identity",
  "Component / UI Detail",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

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
