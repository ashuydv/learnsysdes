export function MarkdownLite({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\n+/);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-black/80 dark:text-white/80">
              {lines.map((line, j) => (
                <li key={j}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        if (lines[0]?.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-semibold tracking-tight">
              {lines[0].slice(3)}
            </h2>
          );
        }

        return (
          <p key={i} className="leading-relaxed text-black/80 dark:text-white/80">
            {lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
}
