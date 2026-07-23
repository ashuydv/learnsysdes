"use client";

import { useState } from "react";
import { TldrawCanvas } from "@/components/tldraw-canvas";
import { MarkdownLite } from "@/components/markdown-lite";

export function ReferenceSolution({
  solutionText,
  diagramSnapshot,
}: {
  solutionText: string;
  diagramSnapshot: unknown;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Reference solution</h2>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          {revealed ? "Hide reference solution" : "Reveal reference solution"}
        </button>
      </div>

      {revealed && (
        <div className="mt-5 flex flex-col gap-6">
          <MarkdownLite content={solutionText} />
          {diagramSnapshot != null && (
            <div>
              <p className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">
                Reference diagram — view only, not saved to your submission
              </p>
              <TldrawCanvas
                key="reference"
                initialSnapshot={diagramSnapshot}
                onMount={() => {}}
                height={420}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
