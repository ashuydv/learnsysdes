export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface ConceptDiagramData {
  nodes: DiagramNode[];
  edges: [string, string][];
  viewBoxWidth?: number;
  viewBoxHeight?: number;
}

export function ConceptDiagram({ data }: { data: ConceptDiagramData }) {
  const width = data.viewBoxWidth ?? 640;
  const height = data.viewBoxHeight ?? 220;
  const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" className="fill-black/50 dark:fill-white/50" />
        </marker>
      </defs>
      {data.edges.map(([fromId, toId], i) => {
        const from = byId[fromId];
        const to = byId[toId];
        if (!from || !to) return null;
        const fromW = from.w ?? 110;
        const fromH = from.h ?? 50;
        const toW = to.w ?? 110;
        const toH = to.h ?? 50;
        const x1 = from.x + fromW / 2;
        const y1 = from.y + fromH / 2;
        const x2 = to.x + toW / 2;
        const y2 = to.y + toH / 2;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={1.5}
            markerEnd="url(#arrowhead)"
            className="stroke-black/40 dark:stroke-white/40"
          />
        );
      })}
      {data.nodes.map((node) => {
        const w = node.w ?? 110;
        const h = node.h ?? 50;
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={w}
              height={h}
              rx={8}
              className="fill-white stroke-black/20 dark:fill-zinc-900 dark:stroke-white/20"
              strokeWidth={1.5}
            />
            <text
              x={node.x + w / 2}
              y={node.y + h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-black text-[11px] font-medium dark:fill-white"
            >
              {node.label.split("\n").map((line, i, lines) => (
                <tspan
                  key={i}
                  x={node.x + w / 2}
                  dy={i === 0 ? `${-(lines.length - 1) * 0.6}em` : "1.2em"}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
