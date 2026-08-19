"use client";

export function AnalyzingCard({
  previewUrl,
  status,
}: {
  previewUrl: string;
  status: "analyzing" | "error";
}) {
  return (
    <div className="flex flex-col border border-border bg-surface">
      <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Uploading"
          className={`h-full w-full object-cover ${status === "analyzing" ? "opacity-50" : "opacity-30"}`}
        />
      </div>
      <div className="flex items-center gap-2 p-3">
        {status === "analyzing" ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
            <p className="tracked-label text-accent">Analyzing…</p>
          </>
        ) : (
          <p className="tracked-label text-dim">Failed — retry from Add</p>
        )}
      </div>
    </div>
  );
}
