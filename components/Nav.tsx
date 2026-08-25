"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

export function Nav() {
  const pathname = usePathname();
  const settingsActive = pathname === "/settings";

  return (
    <header className="border-b border-border">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/settings"
            className={`tracked-label transition-colors duration-150 ${
              settingsActive ? "text-accent" : "text-muted hover:text-text"
            }`}
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
