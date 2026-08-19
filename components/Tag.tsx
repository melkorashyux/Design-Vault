export function Tag({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={`tracked-label inline-flex items-center border px-2 py-1 transition-colors duration-150 ${
        active
          ? "border-accent text-accent bg-surface"
          : "border-border bg-surface text-muted hover:text-text"
      }`}
    >
      {children}
    </Comp>
  );
}
