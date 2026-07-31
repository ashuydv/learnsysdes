"use client";

import { useRef, useState, useTransition } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ExcalidrawCanvas } from "@/components/excalidraw-canvas";
import { StarterPalette } from "@/components/starter-palette";
import {
  EstimationPanel,
  defaultEstimationInputs,
  type EstimationInputs,
} from "@/components/estimation-panel";
import { saveSubmission } from "@/lib/actions";

export function ProblemWorkspace({
  problemId,
  initialDiagram,
  initialEstimation,
}: {
  problemId: string;
  initialDiagram: unknown;
  initialEstimation: EstimationInputs | null;
}) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [estimation, setEstimation] = useState<EstimationInputs>(
    initialEstimation ?? defaultEstimationInputs
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function handleSave() {
    const api = apiRef.current;
    if (!api) return;
    const snapshot = { elements: api.getSceneElements() };
    startTransition(async () => {
      await saveSubmission(problemId, snapshot, estimation);
      setSavedAt(new Date());
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <EstimationPanel value={estimation} onChange={setEstimation} />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Design canvas</h2>
          <div className="flex items-center gap-3 text-sm">
            {savedAt && (
              <span className="text-black/40 dark:text-white/40">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="bg-brand text-white hover:brightness-110 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save diagram"}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <StarterPalette getApi={() => apiRef.current} />
        </div>

        <ExcalidrawCanvas
          initialSnapshot={initialDiagram}
          onMount={(api) => {
            apiRef.current = api;
          }}
        />
      </div>
    </div>
  );
}
