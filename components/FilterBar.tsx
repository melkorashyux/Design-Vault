"use client";

import { Tag } from "@/components/Tag";

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
          {tags.map((tag) => (
            <Tag key={tag} active={activeTags.includes(tag)} onClick={() => onTagToggle(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
