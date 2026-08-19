export const DEFAULT_VAULT_URL = "http://localhost:3000";

export async function getSettings() {
  const { vaultUrl, vaultToken } = await chrome.storage.local.get(["vaultUrl", "vaultToken"]);
  return {
    vaultUrl: vaultUrl || DEFAULT_VAULT_URL,
    vaultToken: vaultToken || "",
  };
}

export async function setSettings(partial) {
  await chrome.storage.local.set(partial);
}

export async function apiFetch(path, options = {}) {
  const { vaultUrl, vaultToken } = await getSettings();
  return fetch(`${vaultUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "X-Vault-Token": vaultToken,
    },
  });
}

export async function fetchFolders() {
  const res = await apiFetch("/api/folders");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load folders (${res.status})`);
  }
  const { folders } = await res.json();
  return folders;
}

export async function createFolder(name) {
  const res = await apiFetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to create folder (${res.status})`);
  return body.folder;
}
