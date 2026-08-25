import Anthropic from "@anthropic-ai/sdk";
import {
  USER_PROMPT,
  buildSystemPrompt,
  extractJson,
  normalizeResult,
  withAnalysisRetry,
} from "@/lib/analysis-shared";
import { listTags } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import type { AnalysisResult } from "@/lib/types";

let client: Anthropic | null = null;
let clientKey: string | null = null;
function getClient(apiKey: string): Anthropic {
  if (!client || clientKey !== apiKey) {
    client = new Anthropic({ apiKey });
    clientKey = apiKey;
  }
  return client;
}

async function callClaude(
  imageBase64: string,
  mediaType: string,
  allowedTags: string[],
): Promise<AnalysisResult | null> {
  const { anthropicApiKey, analysisModel } = getSettings();
  const message = await getClient(anthropicApiKey).messages.create({
    model: analysisModel,
    max_tokens: 1024,
    system: buildSystemPrompt(allowedTags),
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
            text: USER_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(extractJson(textBlock.text));
    return normalizeResult(parsed, allowedTags);
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
  const allowedTags = listTags();
  return withAnalysisRetry(fallbackTitle, () => callClaude(imageBase64, mediaType, allowedTags));
}
