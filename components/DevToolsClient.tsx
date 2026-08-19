"use client";

import { useEffect, useState } from "react";
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_FONT_ID,
  DEFAULT_HEADER_SIZE_ID,
  FONT_OPTIONS,
  FONT_STORAGE_KEY,
  HEADER_SIZE_OPTIONS,
  HEADER_SIZE_STORAGE_KEY,
  applyTheme,
  isValidHex,
} from "@/lib/theme";

export function DevToolsClient() {
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [hexInput, setHexInput] = useState(DEFAULT_ACCENT);
  const [headerSizeId, setHeaderSizeId] = useState(DEFAULT_HEADER_SIZE_ID);

  // localStorage isn't available during SSR, so state starts at the defaults
  // (matching what the server rendered) and is synced to the saved values
  // right after mount — the same reason the no-flash script in layout.tsx
  // exists, this just keeps the *highlighted* option in sync too.
  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY) || DEFAULT_FONT_ID;
    const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
    const savedHeaderSize =
      localStorage.getItem(HEADER_SIZE_STORAGE_KEY) || DEFAULT_HEADER_SIZE_ID;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontId(savedFont);
    setAccent(savedAccent);
    setHexInput(savedAccent);
    setHeaderSizeId(savedHeaderSize);
  }, []);

  function pickFont(id: string) {
    setFontId(id);
    localStorage.setItem(FONT_STORAGE_KEY, id);
    applyTheme(id, accent, headerSizeId);
  }

  function pickAccent(hex: string) {
    if (!isValidHex(hex)) return;
    setAccent(hex);
    setHexInput(hex);
    localStorage.setItem(ACCENT_STORAGE_KEY, hex);
    applyTheme(fontId, hex, headerSizeId);
  }

  function pickHeaderSize(id: string) {
    setHeaderSizeId(id);
    localStorage.setItem(HEADER_SIZE_STORAGE_KEY, id);
    applyTheme(fontId, accent, id);
  }

  function resetDefaults() {
    localStorage.removeItem(FONT_STORAGE_KEY);
    localStorage.removeItem(ACCENT_STORAGE_KEY);
    localStorage.removeItem(HEADER_SIZE_STORAGE_KEY);
    setFontId(DEFAULT_FONT_ID);
    setAccent(DEFAULT_ACCENT);
    setHexInput(DEFAULT_ACCENT);
    setHeaderSizeId(DEFAULT_HEADER_SIZE_ID);
    applyTheme(DEFAULT_FONT_ID, DEFAULT_ACCENT, DEFAULT_HEADER_SIZE_ID);
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-12">
      <h1 className="page-heading">Dev Tools</h1>
      <p className="mt-3 max-w-lg text-muted">
        Local UI preferences — font, accent color, and header size. Saved to this browser
        only, applied instantly across the app.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <section>
            <p className="tracked-label mb-3 text-dim">Font</p>
            <div className="flex flex-col gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => pickFont(font.id)}
                  className={`flex items-center justify-between border px-3 py-2.5 text-left transition-colors duration-150 ${
                    fontId === font.id
                      ? "border-accent bg-surface"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <span style={{ fontFamily: font.value }} className="text-[14px]">
                    {font.label} — Aa 0123
                  </span>
                  {fontId === font.id && (
                    <span className="tracked-label text-accent">active</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="tracked-label mb-3 text-dim">Accent Color</p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => pickAccent(preset.hex)}
                  title={preset.name}
                  className={`flex flex-col items-center gap-1.5 border p-1.5 transition-colors duration-150 ${
                    accent.toLowerCase() === preset.hex.toLowerCase()
                      ? "border-accent"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <span
                    className="block h-8 w-8 border border-border"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="tracked-label text-[9px] text-dim">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="color"
                value={isValidHex(hexInput) ? hexInput : DEFAULT_ACCENT}
                onChange={(e) => pickAccent(e.target.value)}
                className="h-9 w-9 cursor-pointer border border-border bg-transparent p-0"
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setHexInput(value);
                  if (isValidHex(value)) pickAccent(value);
                }}
                placeholder="#custom"
                className="w-28 border-b border-border pb-1 placeholder:text-dim"
              />
            </div>
          </section>

          <section>
            <p className="tracked-label mb-3 text-dim">Header Size</p>
            <p className="mb-3 text-[11px] text-dim">
              Controls the &ldquo;Visual Vault&rdquo; heading on the Library page.
            </p>
            <div className="flex flex-col gap-2">
              {HEADER_SIZE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => pickHeaderSize(option.id)}
                  className={`flex items-center justify-between border px-3 py-2.5 text-left transition-colors duration-150 ${
                    headerSizeId === option.id
                      ? "border-accent bg-surface"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <span
                    className="font-bold uppercase"
                    style={{ fontSize: `${14 * option.scale}px` }}
                  >
                    {option.label}
                  </span>
                  {headerSizeId === option.id && (
                    <span className="tracked-label text-accent">active</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={resetDefaults}
            className="tracked-label self-start border border-border px-4 py-2 text-dim transition-colors duration-150 hover:text-text"
          >
            Reset to defaults
          </button>
        </div>

        <section>
          <p className="tracked-label mb-3 text-dim">Live Preview</p>
          <div className="flex flex-col gap-4 border border-border bg-surface p-5">
            <p className="tracked-label text-dim">Card Title</p>
            <h2 className="card-title">Sample Design Reference</h2>
            <p className="text-muted">
              This preview updates instantly as you change font or accent — no reload
              needed.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["brutalist", "dark mode", "grid"].map((tag) => (
                <span
                  key={tag}
                  className="tracked-label border border-border px-1.5 py-0.5 text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button className="tracked-label border border-accent bg-accent px-4 py-2 text-bg">
                Primary Action
              </button>
              <button className="tracked-label border border-border px-4 py-2 transition-colors duration-150 hover:bg-text hover:text-bg">
                Secondary
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="text-dim">/</span>
              <span className="text-dim">search preview...</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
