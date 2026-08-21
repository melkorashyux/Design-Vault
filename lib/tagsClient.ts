async function unwrap(res: Response): Promise<string[]> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body.tags as string[];
}

export async function fetchTags(): Promise<string[]> {
  const res = await fetch("/api/tags");
  return unwrap(res);
}

/** Registers new tag names (insert-or-ignore server-side) and returns the full updated list. */
export async function addTagsApi(names: string[]): Promise<string[]> {
  const res = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
  return unwrap(res);
}
