export const DEFAULT_VISUAL_BRAIN_URL = "http://localhost:3000";

export async function getSettings() {
  const { brainUrl, brainToken } = await chrome.storage.local.get(["brainUrl", "brainToken"]);
  return {
    brainUrl: brainUrl || DEFAULT_VISUAL_BRAIN_URL,
    brainToken: brainToken || "",
  };
}

export async function setSettings(partial) {
  await chrome.storage.local.set(partial);
}

export async function apiFetch(path, options = {}) {
  const { brainUrl, brainToken } = await getSettings();
  return fetch(`${brainUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "X-Visual-Brain-Token": brainToken,
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
