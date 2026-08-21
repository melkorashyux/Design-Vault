import { analyzeScreenshot as analyzeWithClaude } from "@/lib/anthropic";
import { analyzeScreenshot as analyzeWithOllama } from "@/lib/ollama";
import type { AnalysisResult } from "@/lib/types";

const PROVIDER = process.env.ANALYSIS_PROVIDER === "ollama" ? "ollama" : "anthropic";

/** Routes to the configured analysis provider (ANALYSIS_PROVIDER=ollama|anthropic). */
export function analyzeScreenshot(
  imageBase64: string,
  mediaType: string,
  fallbackTitle: string,
): Promise<AnalysisResult> {
  const analyze = PROVIDER === "ollama" ? analyzeWithOllama : analyzeWithClaude;
  return analyze(imageBase64, mediaType, fallbackTitle);
}
