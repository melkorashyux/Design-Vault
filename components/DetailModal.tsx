"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, UNSORTED_FOLDER_NAME, type Folder, type BrainItem } from "@/lib/types";
import { matchAllowed } from "@/lib/tags";
import { ColorSwatch } from "@/components/ColorSwatch";
import { ExportToast } from "@/components/ExportToast";
import { ExpandIcon } from "@/components/ItemCard";
import { Lightbox } from "@/components/Lightbox";
import { exportForClaude, type ExportResult } from "@/lib/exportClient";
import { addTagsApi } from "@/lib/tagsClient";

interface Draft {
  title: string;
  category: string;
  tags: string[];
  description: string;
  design_notes: string;
  colors: string[];
  typography: string;
  layout: string;
  source_url: string;
}

function toDraft(item: BrainItem): Draft {
  return {
    title: item.title,
    category: item.category,
    tags: [...item.tags],
    description: item.description,
    design_notes: item.design_notes,
    colors: [...item.colors],
    typography: item.typography,
    layout: item.layout,
    source_url: item.source_url ?? "",
  };
}

export function DetailModal({
  item,
  folders,
  tags,
  onTagsChanged,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: BrainItem;
  folders: Folder[];
  /** The full tag registry — used to snap a typed tag to its existing casing. */
  tags: string[];
  /** Called with the updated registry after a genuinely new tag is registered. */
  onTagsChanged: (tags: string[]) => void;
  onClose: () => void;
  onUpdated: (item: BrainItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(item));
  const [tagInput, setTagInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [movingFolder, setMovingFolder] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "pending" | "confirm">("idle");
  const [deleteLabel, setDeleteLabel] = useState("delete");
  const deleteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // When fullscreen is open, let Lightbox's own Escape handler close that
      // layer first instead of closing the whole modal underneath it too.
      if (e.key === "Escape" && !fullscreen) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, fullscreen]);

  // Clears the scramble interval if the modal unmounts mid-animation
  // (e.g. Escape closes it while "delete" is still decoding).
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          source_url: draft.source_url.trim() || null,
        }),
      });
      if (res.ok) {
        const { item: updated } = await res.json();
        onUpdated(updated);
        setEditing(false);
        // Idempotent — registers any tags typed here that aren't in the
        // registry yet (insert-or-ignore server-side), a no-op otherwise.
        if (draft.tags.length > 0) {
          addTagsApi(draft.tags).then(onTagsChanged).catch(() => {});
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function moveToFolder(folderId: string) {
    setMovingFolder(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (res.ok) {
        const { item: updated } = await res.json();
        onUpdated(updated);
      }
    } finally {
      setMovingFolder(false);
    }
  }

  async function handleExport() {
    setExportError(null);
    try {
      const result = await exportForClaude([item.id]);
      setExportResult(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function handleAnalyze() {
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/items/${item.id}/analyze`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Analysis failed");
      }
      const { item: updated } = await res.json();
      onUpdated(updated);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  const CONFIRM_LABEL = "confirm delete";
  const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const DELETE_HOLD_MS = 2000;

  function startDeleteHold() {
    setDeleteState("pending");

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      const start = performance.now();
      deleteTimerRef.current = setInterval(() => {
        const elapsed = performance.now() - start;
        const lockedCount = Math.floor((elapsed / DELETE_HOLD_MS) * CONFIRM_LABEL.length);
        let out = "";
        for (let i = 0; i < CONFIRM_LABEL.length; i++) {
          out +=
            i < lockedCount || CONFIRM_LABEL[i] === " "
              ? CONFIRM_LABEL[i]
              : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)].toLowerCase();
        }
        setDeleteLabel(out);
      }, 40);
    }

    setTimeout(() => {
      if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
      setDeleteLabel(CONFIRM_LABEL);
      setDeleteState("confirm");
    }, DELETE_HOLD_MS);
  }

  async function handleDelete() {
    if (deleteState === "idle") {
      startDeleteHold();
      return;
    }
    if (deleteState === "pending") return;
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(item.id);
  }

  function addTag() {
    const typed = tagInput.trim();
    // Snap to an existing tag's casing when one matches case-insensitively
    // (e.g. typing "dark" reuses "Dark"); otherwise this is a new tag, kept
    // as typed — it's registered with the server once the item is saved.
    const value = typed && (matchAllowed(typed, tags) ?? typed);
    if (value && !draft.tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft((d) => ({ ...d, tags: [...d.tags, value] }));
    }
    setTagInput("");
  }

  function addColor() {
    const value = colorInput.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(value) && !draft.colors.includes(value)) {
      setDraft((d) => ({ ...d, colors: [...d.colors, value] }));
    }
    setColorInput("");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl overflow-hidden border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="group relative hidden w-1/2 shrink-0 overflow-auto border-r border-border bg-bg sm:block">
          <button
            onClick={() => setFullscreen(true)}
            title="View full screen"
            aria-label="View full screen"
            className="block w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${item.filename}`}
              alt={item.title}
              className="w-full object-contain"
            />
          </button>
          <div className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-border bg-bg/80 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            <ExpandIcon />
          </div>
        </div>

        <div className="flex w-full flex-col overflow-hidden sm:w-1/2">
          <div className="flex items-center justify-between border-b border-border p-4">
            {editing ? (
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="page-heading w-full border-b border-border pb-1"
              />
            ) : (
              <h2 className="page-heading">{item.title}</h2>
            )}
            <div className="ml-4 flex shrink-0 items-center gap-4">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setDraft(toDraft(item));
                      setEditing(false);
                    }}
                    className="tracked-label text-dim hover:text-text"
                  >
                    cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="tracked-label border border-accent bg-accent px-3 py-1.5 text-bg disabled:opacity-50"
                  >
                    {saving ? "saving…" : "save"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="tracked-label text-dim hover:text-text"
                  >
                    edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteState === "pending"}
                    className={`tracked-label transition-colors duration-150 ${
                      deleteState === "idle"
                        ? "text-dim hover:text-red-500"
                        : deleteState === "confirm"
                          ? "text-red-500 hover:text-red-700"
                          : "text-red-500"
                    } disabled:cursor-default`}
                  >
                    {deleteState === "idle" ? "delete" : deleteLabel}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                title="Close"
                aria-label="Close"
                className="text-lg leading-none text-dim hover:text-text"
              >
                ×
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-6 p-4">
            <Field label="Category">
              {editing ? (
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className="border border-border bg-surface px-2 py-1"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="tracked-label text-muted">{item.category}</p>
              )}
            </Field>

            <Field label="Folder">
              <select
                value={item.folder_id ?? ""}
                onChange={(e) => moveToFolder(e.target.value)}
                disabled={movingFolder || folders.length === 0}
                className="border border-border bg-surface px-2 py-1 disabled:opacity-50"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name === UNSORTED_FOLDER_NAME ? "Unsorted" : folder.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {draft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="tracked-label inline-flex items-center gap-1.5 border border-border px-2 py-1 text-muted"
                  >
                    {tag}
                    {editing && (
                      <button
                        onClick={() =>
                          setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }))
                        }
                        title="Remove tag"
                        aria-label={`Remove tag ${tag}`}
                        className="text-dim hover:text-accent"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {editing && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="add tag + enter"
                  className="mt-2 w-full border-b border-border pb-1 placeholder:text-dim"
                />
              )}
            </Field>

            <Field label="Description">
              {editing ? (
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-none border border-border bg-surface p-2"
                />
              ) : (
                <p className="text-muted">{item.description || "—"}</p>
              )}
            </Field>

            <Field label="Design Notes">
              {editing ? (
                <textarea
                  value={draft.design_notes}
                  onChange={(e) => setDraft((d) => ({ ...d, design_notes: e.target.value }))}
                  rows={3}
                  className="w-full resize-none border border-border bg-surface p-2"
                />
              ) : (
                <p className="text-muted">{item.design_notes || "—"}</p>
              )}
            </Field>

            <Field label="Colors">
              <div className="flex flex-wrap gap-3">
                {draft.colors.map((hex) => (
                  <div key={hex} className="relative">
                    <ColorSwatch hex={hex} />
                    {editing && (
                      <button
                        onClick={() =>
                          setDraft((d) => ({ ...d, colors: d.colors.filter((c) => c !== hex) }))
                        }
                        title="Remove color"
                        aria-label={`Remove color ${hex}`}
                        className="absolute -right-1.5 -top-1.5 h-4 w-4 border border-border bg-surface text-[10px] leading-none text-dim hover:text-accent"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {editing && (
                <input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  placeholder="#hex + enter"
                  className="mt-2 w-full border-b border-border pb-1 placeholder:text-dim"
                />
              )}
            </Field>

            <Field label="Typography">
              {editing ? (
                <input
                  value={draft.typography}
                  onChange={(e) => setDraft((d) => ({ ...d, typography: e.target.value }))}
                  className="w-full border-b border-border pb-1"
                />
              ) : (
                <p className="text-muted">{item.typography || "—"}</p>
              )}
            </Field>

            <Field label="Layout">
              {editing ? (
                <input
                  value={draft.layout}
                  onChange={(e) => setDraft((d) => ({ ...d, layout: e.target.value }))}
                  className="w-full border-b border-border pb-1"
                />
              ) : (
                <p className="text-muted">{item.layout || "—"}</p>
              )}
            </Field>

            <Field label="Source URL">
              {editing ? (
                <input
                  value={draft.source_url}
                  onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border-b border-border pb-1 placeholder:text-dim"
                />
              ) : item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {item.source_url}
                </a>
              ) : (
                <p className="text-muted">—</p>
              )}
            </Field>

            <Field label="Added">
              <p className="text-dim">{new Date(item.created_at).toLocaleDateString()}</p>
            </Field>
            </div>
          </div>

          {!editing && (
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border p-4">
              <button
                onClick={handleExport}
                className="tracked-label border border-border px-3 py-2 text-dim transition-colors duration-150 hover:text-text"
              >
                export for claude
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="tracked-label border border-accent px-3 py-2 text-accent transition-colors duration-150 hover:bg-accent hover:text-bg disabled:opacity-50"
              >
                {analyzing
                  ? "analyzing…"
                  : item.analysis_status === "pending"
                    ? "analyze with ai"
                    : "re-analyze with ai"}
              </button>
            </div>
          )}
          {exportError && (
            <p className="border-t border-border px-4 py-2 text-[11px] text-accent">
              {exportError}
            </p>
          )}
          {analyzeError && (
            <p className="border-t border-border px-4 py-2 text-[11px] text-accent">
              {analyzeError}
            </p>
          )}
        </div>
      </div>

      {exportResult && (
        <ExportToast
          path={exportResult.exportDir}
          count={exportResult.fileCount}
          onDismiss={() => setExportResult(null)}
        />
      )}

      {fullscreen && <Lightbox item={item} onClose={() => setFullscreen(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="tracked-label text-dim">{label}</p>
      {children}
    </div>
  );
}
