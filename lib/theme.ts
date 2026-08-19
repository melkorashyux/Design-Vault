export interface FontOption {
  id: string;
  label: string;
  /** CSS font-family value — either a next/font CSS variable or a raw stack. */
  value: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "plex-mono", label: "IBM Plex Mono", value: "var(--font-plex-mono)" },
  { id: "jetbrains-mono", label: "JetBrains Mono", value: "var(--font-jetbrains-mono)" },
  { id: "space-mono", label: "Space Mono", value: "var(--font-space-mono)" },
  { id: "roboto-mono", label: "Roboto Mono", value: "var(--font-roboto-mono)" },
  {
    id: "system-mono",
    label: "System Mono",
    value: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
];

export const DEFAULT_FONT_ID = "plex-mono";

export interface AccentPreset {
  name: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Terminal Green", hex: "#B9F73E" },
  { name: "Amber", hex: "#F5C542" },
  { name: "White", hex: "#EDEDED" },
  { name: "Signal Blue", hex: "#3B82F6" },
  { name: "Coral", hex: "#FF6B57" },
  { name: "Violet", hex: "#A78BFA" },
];

export const DEFAULT_ACCENT = "#B9F73E";

export interface HeaderSizeOption {
  id: string;
  label: string;
  /** Multiplier applied to the hero heading's clamp() via --hero-scale. */
  scale: number;
}

export const HEADER_SIZE_OPTIONS: HeaderSizeOption[] = [
  { id: "compact", label: "Compact", scale: 0.7 },
  { id: "default", label: "Default", scale: 1 },
  { id: "large", label: "Large", scale: 1.3 },
  { id: "huge", label: "Huge", scale: 1.6 },
];

export const DEFAULT_HEADER_SIZE_ID = "default";

export const FONT_STORAGE_KEY = "vault-font";
export const ACCENT_STORAGE_KEY = "vault-accent";
export const HEADER_SIZE_STORAGE_KEY = "vault-header-size";

export function getFontById(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

export function getHeaderSizeById(id: string): HeaderSizeOption {
  return HEADER_SIZE_OPTIONS.find((o) => o.id === id) ?? HEADER_SIZE_OPTIONS[1];
}

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Applies theme values to the document root's CSS custom properties. */
export function applyTheme(fontId: string, accentHex: string, headerSizeId: string) {
  const root = document.documentElement;
  root.style.setProperty("--font-mono", getFontById(fontId).value);
  if (isValidHex(accentHex)) root.style.setProperty("--color-accent", accentHex);
  root.style.setProperty("--hero-scale", String(getHeaderSizeById(headerSizeId).scale));
}
