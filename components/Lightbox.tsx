"use client";

import { useRef, useState } from "react";
import type { VaultItem } from "@/lib/types";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.5;
const DOUBLE_CLICK_SCALE = 2.5;
const WHEEL_SENSITIVITY = 0.01;
// Below this many pixels of pointer movement, a drag is treated as a click
// so a small hand tremor while releasing doesn't get read as a pan.
const DRAG_THRESHOLD = 4;

type Offset = { x: number; y: number };

export function Lightbox({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ startX: number; startY: number; offset: Offset } | null>(null);
  // True once a pointer move during a drag has crossed DRAG_THRESHOLD — lets
  // the backdrop's click-to-close handler tell "released after panning" apart
  // from "released after a plain click" once the pointer ends up over it.
  const didPan = useRef(false);

  // getBoundingClientRect reflects the *current* CSS transform, so divide out
  // the active scale to recover the image's untransformed rendered size —
  // that's what panning limits need to be computed against.
  function clampOffset(next: Offset, atScale: number): Offset {
    const img = imgRef.current;
    if (!img || atScale <= 1) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    const naturalWidth = rect.width / scale;
    const naturalHeight = rect.height / scale;
    const maxX = Math.max(0, (naturalWidth * atScale - window.innerWidth) / 2);
    const maxY = Math.max(0, (naturalHeight * atScale - window.innerHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function zoomBy(delta: number) {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    setScale(next);
    setOffset((prev) => clampOffset(prev, next));
  }

  function resetZoom() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function handleClose() {
    if (didPan.current) {
      didPan.current = false;
      return;
    }
    onClose();
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(-e.deltaY * WHEEL_SENSITIVITY);
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (scale > 1) resetZoom();
    else {
      setScale(DOUBLE_CLICK_SCALE);
      setOffset({ x: 0, y: 0 });
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, offset };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const origin = dragOrigin.current;
    if (!origin) return;
    const dx = e.clientX - origin.startX;
    const dy = e.clientY - origin.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) didPan.current = true;
    setOffset(clampOffset({ x: origin.offset.x + dx, y: origin.offset.y + dy }, scale));
  }

  function handlePointerUp() {
    dragOrigin.current = null;
    setDragging(false);
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-bg/95 p-6 backdrop-blur-sm outline-none"
      onClick={handleClose}
      onWheel={handleWheel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        else if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
        else if (e.key === "-") zoomBy(-ZOOM_STEP);
        else if (e.key === "0") resetZoom();
      }}
      tabIndex={-1}
      autoFocus
    >
      <button
        onClick={onClose}
        className="tracked-label absolute right-6 top-6 z-10 border border-border px-3 py-1.5 text-dim transition-colors duration-150 hover:text-text"
      >
        close ✕
      </button>

      <div
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-px border border-border bg-bg/80"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => zoomBy(-ZOOM_STEP)}
          disabled={scale <= MIN_SCALE}
          title="Zoom out"
          className="tracked-label w-9 px-2 py-1.5 text-dim transition-colors duration-150 hover:text-text disabled:opacity-30"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          title="Reset zoom"
          className="tracked-label w-14 px-2 py-1.5 text-dim transition-colors duration-150 hover:text-text"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={scale >= MAX_SCALE}
          title="Zoom in"
          className="tracked-label w-9 px-2 py-1.5 text-dim transition-colors duration-150 hover:text-text disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={`/api/uploads/${item.filename}`}
        alt={item.title}
        draggable={false}
        className={`max-h-full max-w-full select-none object-contain ${
          scale > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
        }`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: dragging ? "none" : "transform 120ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
