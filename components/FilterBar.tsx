"use client";

import { useState } from "react";
import { Tag } from "@/components/Tag";

const VISIBLE_TAG_COUNT = 10;

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  tags,
  activeTags,
  onTagToggle,
}: {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  tags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
}) {
  const [showAllTags, setShowAllTags] = useState(false);

  // `tags` arrives sorted by number of items tied to each tag, most first, so
  // the visible slice is always the most-used tags.
  const hiddenCount = tags.length - VISIBLE_TAG_COUNT;
  const visibleTags = showAllTags || hiddenCount <= 0 ? tags : tags.slice(0, VISIBLE_TAG_COUNT);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag active={activeCategory === null} onClick={() => onCategoryChange(null)}>
          All
        </Tag>
        {categories.map((cat) => (
          <Tag
            key={cat}
            active={activeCategory === cat}
            onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
          >
            {cat}
          </Tag>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleTags.map((tag) => (
            <Tag key={tag} active={activeTags.includes(tag)} onClick={() => onTagToggle(tag)}>
              {tag}
            </Tag>
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags((prev) => !prev)}
              className="tracked-label text-dim hover:text-text"
            >
              {showAllTags ? "See less" : `See more (${hiddenCount})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
