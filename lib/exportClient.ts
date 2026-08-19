export interface ExportResult {
  exportDir: string;
  fileCount: number;
}

export async function exportForClaude(ids: string[]): Promise<ExportResult> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Export failed (${res.status})`);
  return body as ExportResult;
}
