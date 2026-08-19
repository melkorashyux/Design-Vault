"use client";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 focus-within:border-accent">
      <span className="text-dim">/</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="search title, tags, notes..."
        className="w-full placeholder:text-dim"
      />
    </div>
  );
}
