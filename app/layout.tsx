import type { Metadata } from "next";
import { IBM_Plex_Mono, JetBrains_Mono, Space_Mono, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/GrainOverlay";
import {
  ACCENT_STORAGE_KEY,
  FONT_STORAGE_KEY,
  HEADER_SIZE_OPTIONS,
  HEADER_SIZE_STORAGE_KEY,
} from "@/lib/theme";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Visual Vault",
  description: "A local-first library of design references, auto-categorized by Claude.",
};

// Mirrors FONT_OPTIONS / HEADER_SIZE_OPTIONS in lib/theme.ts — inlined so the saved
// font/accent/header-size can be applied before first paint, avoiding a flash of
// the default theme.
const NO_FLASH_SCRIPT = `
(function () {
  try {
    var fontMap = {
      "plex-mono": "var(--font-plex-mono)",
      "jetbrains-mono": "var(--font-jetbrains-mono)",
      "space-mono": "var(--font-space-mono)",
      "roboto-mono": "var(--font-roboto-mono)",
      "system-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    };
    var scaleMap = ${JSON.stringify(
      Object.fromEntries(HEADER_SIZE_OPTIONS.map((o) => [o.id, o.scale])),
    )};
    var font = localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)});
    var accent = localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});
    var headerSize = localStorage.getItem(${JSON.stringify(HEADER_SIZE_STORAGE_KEY)});
    var root = document.documentElement;
    if (font && fontMap[font]) root.style.setProperty("--font-mono", fontMap[font]);
    if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) root.style.setProperty("--color-accent", accent);
    if (headerSize && scaleMap[headerSize] != null) root.style.setProperty("--hero-scale", String(scaleMap[headerSize]));
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexMono.variable} ${jetbrainsMono.variable} ${spaceMono.variable} ${robotoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <GrainOverlay />
        {children}
      </body>
    </html>
  );
}
