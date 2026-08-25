export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" width={24} height={24} className="shrink-0" alt="" aria-hidden="true" />
      <span
        className="text-[14px]"
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        VISUAL BRAIN
      </span>
    </div>
  );
}
