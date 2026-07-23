"use client";

import "tldraw/tldraw.css";
import dynamic from "next/dynamic";
import type { Editor, TLEditorSnapshot } from "tldraw";

const Tldraw = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center text-sm text-black/40 dark:text-white/40">
      Loading canvas…
    </div>
  ),
});

export function TldrawCanvas({
  initialSnapshot,
  onMount,
  height = 520,
}: {
  initialSnapshot?: unknown;
  onMount: (editor: Editor) => void;
  height?: number;
}) {
  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
    >
      <Tldraw
        onMount={(editor) => {
          if (initialSnapshot) {
            editor.loadSnapshot(initialSnapshot as Partial<TLEditorSnapshot>);
          }
          onMount(editor);
        }}
      />
    </div>
  );
}
