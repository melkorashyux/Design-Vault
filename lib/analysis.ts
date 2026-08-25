import { analyzeScreenshot as analyzeWithClaude } from "@/lib/anthropic";
import { analyzeScreenshot as analyzeWithOllama } from "@/lib/ollama";
import { getSettings } from "@/lib/settings";
import type { AnalysisResult } from "@/lib/types";

/** Routes to the configured analysis provider (settings screen or ANALYSIS_PROVIDER env). */
export function analyzeScreenshot(
  imageBase64: string,
  mediaType: string,
  fallbackTitle: string,
): Promise<AnalysisResult> {
  const analyze =
    getSettings().analysisProvider === "ollama" ? analyzeWithOllama : analyzeWithClaude;
  return analyze(imageBase64, mediaType, fallbackTitle);
}
