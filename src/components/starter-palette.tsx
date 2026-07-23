"use client";

import { useCallback } from "react";
import { toRichText } from "tldraw";
import type { Editor, TLDefaultColorStyle } from "tldraw";
import { starterPalette } from "@/lib/shape-palette";

export function StarterPalette({ getEditor }: { getEditor: () => Editor | null }) {
  const addShape = useCallback((label: string, color: string) => {
    const editor = getEditor();
    if (!editor) return;

    const bounds = editor.getViewportPageBounds();
    const w = 140;
    const h = 60;
    const x = bounds.x + bounds.w / 2 - w / 2 + (Math.random() - 0.5) * 100;
    const y = bounds.y + bounds.h / 2 - h / 2 + (Math.random() - 0.5) * 100;

    editor.createShapes([
      {
        type: "geo",
        x,
        y,
        props: {
          geo: "rectangle",
          w,
          h,
          color: color as TLDefaultColorStyle,
          fill: "solid",
          richText: toRichText(label),
        },
      },
    ]);
  }, [getEditor]);

  return (
    <div className="flex flex-wrap gap-2">
      {starterPalette.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => addShape(item.label, item.color)}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          + {item.label}
        </button>
      ))}
    </div>
  );
}
