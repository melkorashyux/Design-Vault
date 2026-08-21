/**
 * Case-insensitively resolves `value` against `allowed`, returning the
 * canonically-cased entry from `allowed` (e.g. matching a model's "dark" to
 * the registry's "Dark") — or null if nothing in the list matches.
 */
export function matchAllowed(value: string, allowed: readonly string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  return allowed.find((a) => a.toLowerCase() === lower) ?? null;
}
