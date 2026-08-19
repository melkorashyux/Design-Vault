"use client";

import type { VaultItem } from "@/lib/types";

export function ItemCard({
  item,
  onClick,
  onExpand,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  item: VaultItem;
  onClick: () => void;
  onExpand?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const activate = selectMode ? onToggleSelect : onClick;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate?.();
        }
      }}
      className={`group relative flex cursor-pointer flex-col border bg-surface text-left transition-colors duration-150 hover:bg-surface-hover ${
        selected ? "border-accent" : "border-border"
      }`}
    >
      {selectMode && (
        <span
          className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center border text-[11px] leading-none ${
            selected
              ? "border-accent bg-accent text-bg"
              : "border-border bg-bg/80 text-transparent"
          }`}
        >
          ✓
        </span>
      )}

      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/uploads/${item.filename}`}
          alt={item.title}
          className="h-full w-full object-cover"
        />
        {!selectMode && onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            title="View full screen"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-border bg-bg/80 text-muted opacity-0 transition-opacity duration-150 hover:text-accent group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ExpandIcon />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title line-clamp-1">{item.title}</h3>
        </div>
        <p className="tracked-label text-dim">{item.category}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="tracked-label border border-border px-1.5 py-0.5 text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ExpandIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
    </svg>
  );
}
