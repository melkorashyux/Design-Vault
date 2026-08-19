import { getSettings, setSettings, fetchFolders, createFolder } from "./shared.js";

const vaultUrlInput = document.getElementById("vaultUrl");
const vaultTokenInput = document.getElementById("vaultToken");
const testBtn = document.getElementById("test");
const statusEl = document.getElementById("status");
const newFolderInput = document.getElementById("newFolder");
const createFolderBtn = document.getElementById("createFolder");
const folderStatusEl = document.getElementById("folderStatus");

async function init() {
  const { vaultUrl, vaultToken } = await getSettings();
  vaultUrlInput.value = vaultUrl;
  vaultTokenInput.value = vaultToken;
}
init();

async function persist() {
  await setSettings({
    vaultUrl: vaultUrlInput.value.trim() || "http://localhost:3000",
    vaultToken: vaultTokenInput.value.trim(),
  });
}

vaultUrlInput.addEventListener("change", persist);
vaultTokenInput.addEventListener("change", persist);

testBtn.addEventListener("click", async () => {
  await persist();
  statusEl.textContent = "Testing…";
  statusEl.className = "";
  try {
    const folders = await fetchFolders();
    statusEl.textContent = `Connected — ${folders.length} folder${folders.length === 1 ? "" : "s"} found`;
    statusEl.className = "ok";
  } catch (err) {
    statusEl.textContent = err instanceof Error ? err.message : "Connection failed";
    statusEl.className = "err";
  }
});

createFolderBtn.addEventListener("click", async () => {
  const name = newFolderInput.value.trim();
  if (!name) return;
  await persist();
  folderStatusEl.textContent = "Creating…";
  folderStatusEl.className = "";
  try {
    await createFolder(name);
    newFolderInput.value = "";
    folderStatusEl.textContent = `Created "${name}" — menu updated`;
    folderStatusEl.className = "ok";
    chrome.runtime.sendMessage({ type: "rebuild-menu" });
  } catch (err) {
    folderStatusEl.textContent = err instanceof Error ? err.message : "Could not create folder";
    folderStatusEl.className = "err";
  }
});
