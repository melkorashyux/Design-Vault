"use client";

import { useState } from "react";

export function ColorSwatch({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      onClick={copy}
      className="group flex flex-col items-start gap-1.5"
      title={`Copy ${hex}`}
    >
      <span
        className="block h-10 w-10 border border-border transition-transform duration-150 group-hover:scale-105"
        style={{ backgroundColor: hex }}
      />
      <span className="text-[10px] text-dim group-hover:text-muted">
        {copied ? "copied" : hex}
      </span>
    </button>
  );
}
