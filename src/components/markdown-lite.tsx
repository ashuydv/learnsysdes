import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownLite({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-4 [&>*+*]:mt-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-black/80 dark:text-white/80">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-black/80 dark:text-white/80">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-black/80 dark:text-white/80">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-sm dark:bg-white/10">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-black/5 dark:bg-white/10">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-black/10 px-3 py-2 text-left font-semibold dark:border-white/10">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-black/10 px-3 py-2 align-top text-black/80 last:border-b-0 dark:border-white/10 dark:text-white/80">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
