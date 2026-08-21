"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/", label: "Library" },
  { href: "/add", label: "Add" },
  { href: "/devtools", label: "Dev Tools" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-8">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`tracked-label transition-colors duration-150 ${
                  active ? "text-accent" : "text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
