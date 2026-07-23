"use client";

import { useRef, useState, useTransition } from "react";
import type { Editor } from "tldraw";
import { TldrawCanvas } from "@/components/tldraw-canvas";
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
  const editorRef = useRef<Editor | null>(null);
  const [estimation, setEstimation] = useState<EstimationInputs>(
    initialEstimation ?? defaultEstimationInputs
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function handleSave() {
    const editor = editorRef.current;
    if (!editor) return;
    const snapshot = editor.getSnapshot();
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
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {pending ? "Saving…" : "Save diagram"}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <StarterPalette getEditor={() => editorRef.current} />
        </div>

        <TldrawCanvas
          initialSnapshot={initialDiagram}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
