"use client";

import { useState } from "react";
import { ExcalidrawCanvas } from "@/components/excalidraw-canvas";
import { MarkdownLite } from "@/components/markdown-lite";
import { buildExportMarkdown } from "@/lib/export-markdown";

export function ReferenceSolution({
  title,
  description,
  solutionText,
  diagramSnapshot,
}: {
  title: string;
  description: string;
  solutionText: string;
  diagramSnapshot: unknown;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportMarkdown = buildExportMarkdown({ title, description, solutionText });

  async function handleCopy() {
    await navigator.clipboard.writeText(exportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([exportMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Reference solution</h2>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="self-start rounded-md border border-black/10 px-3 py-1.5 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 sm:self-auto dark:border-white/15"
        >
          {revealed ? "Hide reference solution" : "Reveal reference solution"}
        </button>
      </div>

      {revealed && (
        <div className="mt-5 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
            >
              Download .md
            </button>
          </div>

          <MarkdownLite content={solutionText} />
          {diagramSnapshot != null && (
            <div>
              <p className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">
                Reference diagram — view only, not saved to your submission
              </p>
              <ExcalidrawCanvas
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
