import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/types";
import type { AnalysisResult } from "@/lib/types";

const MODEL = process.env.ANALYSIS_MODEL || "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a design librarian. You are shown an image saved as a design
reference (a UI screenshot, a photo, an illustration, a piece of branding, etc.).
Analyze it as a design reference and return ONLY a JSON object — no prose, no
markdown, no code fences — matching exactly this shape:

{
  "title": string,            // short, specific name for this design, max 6 words
  "category": string,         // EXACTLY one of the allowed categories provided below
  "tags": string[],           // 5-10 lowercase style + UI-pattern tags
  "description": string,      // 2-3 sentences: what this design is and does
  "design_notes": string,     // 2-4 sentences: what makes it distinctive and worth saving
  "colors": string[],         // 3-6 dominant colors as hex, most dominant first
  "typography": string,       // short phrase describing the type treatment
  "layout": string            // short phrase describing the layout structure
}

Allowed categories: Landing Page, Marketing Site, Dashboard / App UI, Portfolio,
E-commerce, Editorial / Blog, Mobile App, Email / Newsletter, Branding / Identity,
Component / UI Detail, Other.

Be precise and specific about visual style — name the aesthetic movement if there is
one (brutalist, swiss/international, editorial, glassmorphism, etc.). Return valid JSON only.`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

function normalizeResult(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const title = typeof r.title === "string" && r.title.trim() ? r.title.trim() : null;
  if (!title) return null;

  const category =
    typeof r.category === "string" && (CATEGORIES as readonly string[]).includes(r.category)
      ? r.category
      : "Other";

  const tags = Array.isArray(r.tags)
    ? r.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase())
    : [];

  const colors = Array.isArray(r.colors)
    ? r.colors.filter((c): c is string => typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c))
    : [];

  return {
    title,
    category,
    tags,
    description: typeof r.description === "string" ? r.description : "",
    design_notes: typeof r.design_notes === "string" ? r.design_notes : "",
    colors,
    typography: typeof r.typography === "string" ? r.typography : "",
    layout: typeof r.layout === "string" ? r.layout : "",
  };
}

async function callClaude(
  imageBase64: string,
  mediaType: string,
): Promise<AnalysisResult | null> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze this design reference image and return the JSON object described in the system prompt.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(extractJson(textBlock.text));
    return normalizeResult(parsed);
  } catch {
    return null;
  }
}

/**
 * Analyzes a screenshot with Claude vision. Retries once on parse failure,
 * then falls back to a minimal record so an upload never hard-fails.
 */
export async function analyzeScreenshot(
  imageBase64: string,
  mediaType: string,
  fallbackTitle: string,
): Promise<AnalysisResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callClaude(imageBase64, mediaType);
      if (result) return result;
    } catch (err) {
      console.error(`analyzeScreenshot attempt ${attempt + 1} failed:`, err);
    }
  }

  return {
    title: fallbackTitle,
    category: "Other",
    tags: [],
    description: "",
    design_notes: "",
    colors: [],
    typography: "",
    layout: "",
  };
}
