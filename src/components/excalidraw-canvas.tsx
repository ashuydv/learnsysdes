"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center text-sm text-black/40 dark:text-white/40">
        Loading canvas…
      </div>
    ),
  }
);

export function ExcalidrawCanvas({
  initialSnapshot,
  onMount,
  height = 520,
}: {
  initialSnapshot?: unknown;
  onMount: (api: ExcalidrawImperativeAPI) => void;
  height?: number;
}) {
  const initialData = initialSnapshot as ExcalidrawInitialDataState | undefined;

  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
    >
      <Excalidraw
        initialData={initialData ? { ...initialData, scrollToContent: true } : undefined}
        excalidrawAPI={onMount}
      />
    </div>
  );
}
