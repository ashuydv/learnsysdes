"use client";

import { useCallback } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { buildLabeledRectangle } from "@/lib/diagram-builder";
import { starterPalette } from "@/lib/shape-palette";

export function StarterPalette({
  getApi,
}: {
  getApi: () => ExcalidrawImperativeAPI | null;
}) {
  const addShape = useCallback(
    (label: string, strokeColor: string, backgroundColor: string) => {
      const api = getApi();
      if (!api) return;

      const appState = api.getAppState();
      const w = 140;
      const h = 60;
      const viewCenterX = appState.scrollX * -1 + appState.width / 2 / appState.zoom.value;
      const viewCenterY = appState.scrollY * -1 + appState.height / 2 / appState.zoom.value;
      const x = viewCenterX - w / 2 + (Math.random() - 0.5) * 100;
      const y = viewCenterY - h / 2 + (Math.random() - 0.5) * 100;

      const { rect, text } = buildLabeledRectangle({
        id: crypto.randomUUID(),
        label,
        x,
        y,
        w,
        h,
        strokeColor,
        backgroundColor,
      });

      api.updateScene({
        elements: [...api.getSceneElements(), rect, text],
      });
    },
    [getApi]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {starterPalette.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => addShape(item.label, item.strokeColor, item.backgroundColor)}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm transition-colors hover:border-brand/40 hover:bg-brand-soft dark:border-white/15"
        >
          + {item.label}
        </button>
      ))}
    </div>
  );
}
