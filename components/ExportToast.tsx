"use client";

import { useState } from "react";

export function ExportToast({
  path,
  count,
  onDismiss,
}: {
  path: string;
  count: number;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-[120] w-[min(560px,90vw)] -translate-x-1/2 border border-accent bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="tracked-label text-accent">
          Exported {count} item{count === 1 ? "" : "s"} for Claude
        </p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="tracked-label shrink-0 text-dim hover:text-text"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 break-all text-[12px] text-muted">{path}</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={copy}
          className="tracked-label border border-border px-3 py-1.5 transition-colors duration-150 hover:bg-text hover:text-bg"
        >
          {copied ? "copied ✓" : "copy path"}
        </button>
        <p className="text-[11px] text-dim">Paste this path into Claude Code as a reference.</p>
      </div>
    </div>
  );
}
