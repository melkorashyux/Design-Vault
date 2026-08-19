"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, UNSORTED_FOLDER_NAME, type Folder, type VaultItem } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { FolderSidebar } from "@/components/FolderSidebar";
import { ItemCard } from "@/components/ItemCard";
import { AnalyzingCard } from "@/components/AnalyzingCard";
import { DetailModal } from "@/components/DetailModal";
import { Lightbox } from "@/components/Lightbox";
import { ExportToast } from "@/components/ExportToast";
import { uploadFiles, type UploadTask } from "@/lib/uploadClient";
import { fetchFolders } from "@/lib/foldersClient";
import { exportForClaude, type ExportResult } from "@/lib/exportClient";

interface PendingUpload {
  tempId: string;
  previewUrl: string;
  status: "analyzing" | "error";
  message?: string;
}

export function LibraryClient({ initialItems }: { initialItems: VaultItem[] }) {
  const [items, setItems] = useState<VaultItem[]>(initialItems);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [lightboxItem, setLightboxItem] = useState<VaultItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFolderTarget, setBulkFolderTarget] = useState("");
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState("");
  const [bulkTagsInput, setBulkTagsInput] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadFolders = useCallback(() => {
    fetchFolders()
      .then(setFolders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    reloadFolders();
  }, [reloadFolders]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([tag]) => tag);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeFolderId && item.folder_id !== activeFolderId) return false;
      if (activeCategory && item.category !== activeCategory) return false;
      if (activeTags.length > 0 && !activeTags.every((t) => item.tags.includes(t))) return false;
      if (!q) return true;
      const haystack = [item.title, item.description, item.design_notes, ...item.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, activeCategory, activeTags, activeFolderId]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  }, [filtered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Applies a per-item PATCH to every selected item and merges the results
  // back into local state. Selection is left intact afterward so category,
  // tags, and folder can all be assigned in one pass over the same batch.
  const bulkPatch = useCallback(
    async (ids: string[], buildPayload: (item: VaultItem) => Record<string, unknown>) => {
      const targets = items.filter((i) => ids.includes(i.id));
      const results = await Promise.all(
        targets.map(async (item) => {
          const res = await fetch(`/api/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(item)),
          });
          if (!res.ok) return null;
          const { item: updated } = await res.json();
          return updated as VaultItem;
        }),
      );
      setItems((prev) => prev.map((item) => results.find((r) => r?.id === item.id) ?? item));
    },
    [items],
  );

  async function runBulkMove() {
    if (!bulkFolderTarget || selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await bulkPatch(Array.from(selectedIds), () => ({ folder_id: bulkFolderTarget }));
      reloadFolders();
      setBulkFolderTarget("");
    } finally {
      setBulkBusy(false);
    }
  }

  async function runBulkCategory() {
    if (!bulkCategoryTarget || selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await bulkPatch(Array.from(selectedIds), () => ({ category: bulkCategoryTarget }));
      setBulkCategoryTarget("");
    } finally {
      setBulkBusy(false);
    }
  }

  async function runBulkTags() {
    const newTags = bulkTagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (newTags.length === 0 || selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await bulkPatch(Array.from(selectedIds), (item) => ({
        tags: Array.from(new Set([...item.tags, ...newTags])),
      }));
      setBulkTagsInput("");
    } finally {
      setBulkBusy(false);
    }
  }

  async function runExport(ids: string[]) {
    if (ids.length === 0) return;
    setExportError(null);
    try {
      const result = await exportForClaude(ids);
      setExportResult(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    }
  }

  function handleExportFolder(folderId: string) {
    runExport(items.filter((i) => i.folder_id === folderId).map((i) => i.id));
  }

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      const tasks: UploadTask[] = imageFiles.map((file) => ({ file }));
      const tempIds = imageFiles.map(() => crypto.randomUUID());

      setPending((prev) => [
        ...imageFiles.map((file, i) => ({
          tempId: tempIds[i],
          previewUrl: URL.createObjectURL(file),
          status: "analyzing" as const,
        })),
        ...prev,
      ]);

      uploadFiles(tasks, {
        onDone: (_task, index, item) => {
          setPending((prev) => prev.filter((p) => p.tempId !== tempIds[index]));
          setItems((prev) => [item, ...prev]);
          reloadFolders();
        },
        onError: (_task, index, message) => {
          setPending((prev) =>
            prev.map((p) =>
              p.tempId === tempIds[index] ? { ...p, status: "error", message } : p,
            ),
          );
        },
      });
    },
    [reloadFolders],
  );

  return (
    <main
      className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-12"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <h1 className="hero-heading">
        Visual Vault
      </h1>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row">
        <FolderSidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onFolderChange={setActiveFolderId}
          onFoldersChanged={reloadFolders}
          onExportFolder={handleExportFolder}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-6">
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              tags={tags}
              activeTags={activeTags}
              onTagToggle={toggleTag}
            />
          </div>

          {items.length === 0 && pending.length === 0 ? (
            <div
              className={`mt-16 flex flex-col items-center justify-center gap-4 border border-dashed py-24 text-center transition-colors duration-150 ${
                dragOver ? "border-accent" : "border-border"
              }`}
            >
              <p className="tracked-label text-dim">Vault is empty</p>
              <p className="max-w-xs text-muted">
                Drop in screenshots of designs you like — Claude will title, tag, and explain
                each one.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="tracked-label mt-2 border border-border px-4 py-2 transition-colors duration-150 hover:bg-text hover:text-bg"
              >
                + Add Screenshots
              </button>
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <p className="tracked-label text-dim">
                    {filtered.length} item{filtered.length === 1 ? "" : "s"}
                  </p>
                  {selectMode && (
                    <>
                      <button
                        onClick={selectAllFiltered}
                        className="tracked-label text-muted hover:text-text"
                      >
                        select all
                      </button>
                      {selectedIds.size > 0 && (
                        <button
                          onClick={clearSelection}
                          className="tracked-label text-muted hover:text-text"
                        >
                          clear ({selectedIds.size})
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectMode}
                    className={`tracked-label border px-3 py-1.5 transition-colors duration-150 ${
                      selectMode
                        ? "border-accent text-accent"
                        : "border-border text-muted hover:text-text"
                    }`}
                  >
                    {selectMode ? "cancel" : "select"}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="tracked-label border border-border px-3 py-1.5 transition-colors duration-150 hover:bg-text hover:text-bg"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {selectMode && selectedIds.size > 0 && (
                <div className="mt-4 flex flex-col gap-3 border border-accent bg-surface px-4 py-3">
                  <p className="tracked-label text-accent">{selectedIds.size} selected</p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={bulkCategoryTarget}
                        onChange={(e) => setBulkCategoryTarget(e.target.value)}
                        disabled={bulkBusy}
                        className="border border-border bg-bg px-2 py-1 disabled:opacity-50"
                      >
                        <option value="">category…</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={runBulkCategory}
                        disabled={!bulkCategoryTarget || bulkBusy}
                        className="tracked-label border border-border px-3 py-1.5 transition-colors duration-150 hover:bg-text hover:text-bg disabled:opacity-50"
                      >
                        set
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        value={bulkTagsInput}
                        onChange={(e) => setBulkTagsInput(e.target.value)}
                        disabled={bulkBusy}
                        placeholder="tag, tag, tag"
                        className="w-36 border-b border-border pb-1 placeholder:text-dim disabled:opacity-50"
                      />
                      <button
                        onClick={runBulkTags}
                        disabled={!bulkTagsInput.trim() || bulkBusy}
                        className="tracked-label border border-border px-3 py-1.5 transition-colors duration-150 hover:bg-text hover:text-bg disabled:opacity-50"
                      >
                        add tags
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={bulkFolderTarget}
                        onChange={(e) => setBulkFolderTarget(e.target.value)}
                        disabled={bulkBusy}
                        className="border border-border bg-bg px-2 py-1 disabled:opacity-50"
                      >
                        <option value="">move to…</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name === UNSORTED_FOLDER_NAME ? "Unsorted" : folder.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={runBulkMove}
                        disabled={!bulkFolderTarget || bulkBusy}
                        className="tracked-label border border-accent bg-accent px-3 py-1.5 text-bg disabled:opacity-50"
                      >
                        {bulkBusy ? "…" : "move"}
                      </button>
                    </div>

                    <button
                      onClick={() => runExport(Array.from(selectedIds))}
                      className="tracked-label border border-border px-3 py-1.5 transition-colors duration-150 hover:bg-text hover:text-bg"
                    >
                      export for claude
                    </button>
                  </div>
                  {exportError && <p className="text-[11px] text-accent">{exportError}</p>}
                </div>
              )}

              <div
                className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
                  dragOver ? "outline outline-1 outline-dashed outline-accent" : ""
                }`}
              >
                {pending.map((p) => (
                  <AnalyzingCard key={p.tempId} previewUrl={p.previewUrl} status={p.status} />
                ))}
                {filtered.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelected(item)}
                    onExpand={() => setLightboxItem(item)}
                    selectMode={selectMode}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={() => toggleSelected(item.id)}
                  />
                ))}
              </div>

              {filtered.length === 0 && pending.length === 0 && (
                <p className="mt-16 text-center text-muted">No items match your filters.</p>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          key={selected.id}
          item={selected}
          folders={folders}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setSelected(updated);
            reloadFolders();
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            setSelected(null);
            reloadFolders();
          }}
        />
      )}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      {exportResult && (
        <ExportToast
          path={exportResult.exportDir}
          count={exportResult.fileCount}
          onDismiss={() => setExportResult(null)}
        />
      )}
    </main>
  );
}
