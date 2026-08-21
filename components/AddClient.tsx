"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Folder, VaultItem } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";
import { AnalyzingCard } from "@/components/AnalyzingCard";
import { DetailModal } from "@/components/DetailModal";
import { Lightbox } from "@/components/Lightbox";
import { uploadFiles, type UploadTask } from "@/lib/uploadClient";
import { fetchFolders } from "@/lib/foldersClient";
import { fetchTags } from "@/lib/tagsClient";

interface PendingUpload {
  tempId: string;
  previewUrl: string;
  status: "analyzing" | "error";
  message?: string;
}

export function AddClient() {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [done, setDone] = useState<VaultItem[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [lightboxItem, setLightboxItem] = useState<VaultItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFolders()
      .then(setFolders)
      .catch(() => {});
    fetchTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  function handleFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const tasks: UploadTask[] = imageFiles.map((file) => ({
      file,
      sourceUrl: sourceUrl.trim() || undefined,
    }));
    const tempIds = imageFiles.map(() => crypto.randomUUID());

    setPending((prev) => [
      ...prev,
      ...imageFiles.map((file, i) => ({
        tempId: tempIds[i],
        previewUrl: URL.createObjectURL(file),
        status: "analyzing" as const,
      })),
    ]);

    uploadFiles(tasks, {
      onDone: (_task, index, item) => {
        setPending((prev) => prev.filter((p) => p.tempId !== tempIds[index]));
        setDone((prev) => [item, ...prev]);
      },
      onError: (_task, index, message) => {
        setPending((prev) =>
          prev.map((p) =>
            p.tempId === tempIds[index] ? { ...p, status: "error", message } : p,
          ),
        );
      },
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-12">
      <h1 className="page-heading">Add Screenshots</h1>
      <p className="mt-3 max-w-lg text-muted">
        Drop in images of designs you want to save. Each one is sent to Claude for
        titling, categorizing, tagging, and a short design writeup — then lands here so
        you can tweak anything before it&apos;s final.
      </p>

      <div className="mt-6 flex items-center gap-2 border-b border-border pb-3">
        <span className="tracked-label text-dim shrink-0">source (optional)</span>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://where-you-found-this.com"
          className="w-full placeholder:text-dim"
        />
      </div>

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

      <div
        onClick={() => fileInputRef.current?.click()}
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
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed py-20 text-center transition-colors duration-150 ${
          dragOver ? "border-accent bg-surface" : "border-border hover:bg-surface"
        }`}
      >
        <p className="tracked-label text-muted">drag &amp; drop, or click to choose files</p>
        <p className="text-dim text-[11px]">jpg, png, gif, webp — multiple at once</p>
      </div>

      {(pending.length > 0 || done.length > 0) && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pending.map((p) => (
            <AnalyzingCard key={p.tempId} previewUrl={p.previewUrl} status={p.status} />
          ))}
          {done.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setSelected(item)}
              onExpand={() => setLightboxItem(item)}
            />
          ))}
        </div>
      )}

      {done.length > 0 && pending.length === 0 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="tracked-label border border-border px-4 py-2 transition-colors duration-150 hover:bg-text hover:text-bg"
          >
            View in Library →
          </Link>
        </div>
      )}

      {selected && (
        <DetailModal
          key={selected.id}
          item={selected}
          folders={folders}
          tags={tags}
          onTagsChanged={setTags}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setDone((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setSelected(updated);
          }}
          onDeleted={(id) => {
            setDone((prev) => prev.filter((i) => i.id !== id));
            setSelected(null);
          }}
        />
      )}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </main>
  );
}
