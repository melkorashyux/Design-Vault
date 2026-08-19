import type { Folder } from "@/lib/types";

function authHeaders(): HeadersInit {
  const token = process.env.NEXT_PUBLIC_VAULT_TOKEN;
  return token ? { "X-Vault-Token": token } : {};
}

async function unwrap<T>(res: Response, key: string): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body[key] as T;
}

export async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch("/api/folders", { headers: authHeaders() });
  return unwrap<Folder[]>(res, "folders");
}

export async function createFolderApi(name: string): Promise<Folder> {
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return unwrap<Folder>(res, "folder");
}

export async function renameFolderApi(id: string, name: string): Promise<Folder> {
  const res = await fetch(`/api/folders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return unwrap<Folder>(res, "folder");
}

export async function deleteFolderApi(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}
