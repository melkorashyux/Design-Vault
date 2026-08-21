import {
  USER_PROMPT,
  buildSystemPrompt,
  extractJson,
  normalizeResult,
  withAnalysisRetry,
} from "@/lib/analysis-shared";
import { listTags } from "@/lib/db";
import type { AnalysisResult } from "@/lib/types";

const HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

interface OllamaChatResponse {
  message?: { content?: string };
}

async function callOllama(
  imageBase64: string,
  allowedTags: string[],
): Promise<AnalysisResult | null> {
  const res = await fetch(`${HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: buildSystemPrompt(allowedTags) },
        { role: "user", content: USER_PROMPT, images: [imageBase64] },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as OllamaChatResponse;
  const content = data.message?.content;
  if (!content) return null;

  try {
    return normalizeResult(JSON.parse(extractJson(content)), allowedTags);
  } catch {
    return null;
  }
}

/**
 * Analyzes a screenshot with a local Ollama vision model. Retries once on
 * parse failure, then falls back to a minimal record — same contract as
 * the Claude path, so an upload never hard-fails just because Ollama isn't
 * running or the model returned unparseable JSON.
 */
export async function analyzeScreenshot(
  imageBase64: string,
  _mediaType: string,
  fallbackTitle: string,
): Promise<AnalysisResult> {
  const allowedTags = listTags();
  return withAnalysisRetry(fallbackTitle, () => callOllama(imageBase64, allowedTags));
}
