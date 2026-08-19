"use client";

import { useEffect } from "react";
import type { VaultItem } from "@/lib/types";

export function Lightbox({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-bg/95 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="tracked-label absolute right-6 top-6 border border-border px-3 py-1.5 text-dim transition-colors duration-150 hover:text-text"
      >
        close ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/uploads/${item.filename}`}
        alt={item.title}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
