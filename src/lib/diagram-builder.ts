import type {
	ExcalidrawArrowElement,
	ExcalidrawRectangleElement,
	ExcalidrawTextElement,
	FractionalIndex,
} from "@excalidraw/excalidraw/element/types";

export type DiagramNodeKind =
	| "client"
	| "cdn"
	| "lb"
	| "service"
	| "cache"
	| "db"
	| "queue"
	| "generic";

export interface DiagramNode {
	id: string;
	label: string;
	x: number;
	y: number;
	kind: DiagramNodeKind;
	w?: number;
	h?: number;
}

export interface DiagramEdge {
	from: string;
	to: string;
	label?: string;
}

const KIND_COLORS: Record<DiagramNodeKind, { stroke: string; background: string }> = {
	client: { stroke: "#1971c2", background: "#a5d8ff" },
	cdn: { stroke: "#0c8599", background: "#99e9f2" },
	lb: { stroke: "#e8590c", background: "#ffd8a8" },
	service: { stroke: "#2f9e44", background: "#b2f2bb" },
	cache: { stroke: "#6741d9", background: "#d0bfff" },
	db: { stroke: "#e03131", background: "#ffc9c9" },
	queue: { stroke: "#495057", background: "#e9ecef" },
	generic: { stroke: "#495057", background: "#e9ecef" },
};

const DEFAULT_W = 180;
const DEFAULT_H = 80;
const FONT_SIZE = 16;
const LINE_HEIGHT = 1.25;
const EXCALIFONT = 5; // FONT_FAMILY.Excalifont, hardcoded to avoid importing the runtime package

let idCounter = 0;
function nextId(prefix: string): string {
	idCounter += 1;
	return `${prefix}-${idCounter}`;
}

let indexCounter = 0;
function nextIndex(): FractionalIndex {
	indexCounter += 1;
	return `a${String(indexCounter).padStart(4, "0")}` as FractionalIndex;
}

function estimateTextSize(text: string): { width: number; height: number } {
	return {
		width: Math.max(20, text.length * FONT_SIZE * 0.55),
		height: FONT_SIZE * LINE_HEIGHT,
	};
}

// Fields shared by every element type, filled with inert defaults. Real values
// (seed, version, etc.) get normalized by Excalidraw's own `restore()` step
// when the scene loads, so these only need to be structurally valid.
function baseProps(id: string) {
	return {
		id,
		strokeWidth: 2 as const,
		strokeStyle: "solid" as const,
		roundness: null,
		roughness: 1,
		opacity: 100,
		angle: 0,
		seed: 1,
		version: 1,
		versionNonce: 1,
		index: nextIndex(),
		isDeleted: false,
		groupIds: [],
		frameId: null,
		updated: Date.now(),
		link: null,
		locked: false,
	};
}

// Pure data construction, deliberately with zero runtime import from
// `@excalidraw/excalidraw` (only `import type`s, erased at compile time).
// That package touches browser globals (e.g. `navigator`) at module-evaluation
// time, which breaks both server-side rendering of client components that
// import it at module scope, and plain Node/tsx scripts like prisma/seed.ts.
// Exported so client components (e.g. the starter palette) can build one-off
// shapes the same way, without ever importing the real package at runtime.
export function buildLabeledRectangle(opts: {
	id: string;
	label: string;
	x: number;
	y: number;
	w?: number;
	h?: number;
	strokeColor: string;
	backgroundColor: string;
}): { rect: ExcalidrawRectangleElement; text: ExcalidrawTextElement } {
	const w = opts.w ?? DEFAULT_W;
	const h = opts.h ?? DEFAULT_H;
	const textId = nextId("text");
	const textSize = estimateTextSize(opts.label);

	const rect = {
		...baseProps(opts.id),
		type: "rectangle",
		x: opts.x,
		y: opts.y,
		width: w,
		height: h,
		strokeColor: opts.strokeColor,
		backgroundColor: opts.backgroundColor,
		fillStyle: "solid",
		boundElements: [{ id: textId, type: "text" }],
	} as unknown as ExcalidrawRectangleElement;

	const text = {
		...baseProps(textId),
		type: "text",
		x: opts.x + w / 2 - textSize.width / 2,
		y: opts.y + h / 2 - textSize.height / 2,
		width: textSize.width,
		height: textSize.height,
		strokeColor: "#1e1e1e",
		backgroundColor: "transparent",
		fillStyle: "solid",
		fontSize: FONT_SIZE,
		fontFamily: EXCALIFONT,
		text: opts.label,
		textAlign: "center",
		verticalAlign: "middle",
		containerId: opts.id,
		originalText: opts.label,
		autoResize: true,
		lineHeight: LINE_HEIGHT,
		boundElements: null,
	} as unknown as ExcalidrawTextElement;

	return { rect, text };
}

function makeRectangle(node: DiagramNode): { rect: ExcalidrawRectangleElement; text: ExcalidrawTextElement } {
	const colors = KIND_COLORS[node.kind];
	return buildLabeledRectangle({
		id: node.id,
		label: node.label,
		x: node.x,
		y: node.y,
		w: node.w,
		h: node.h,
		strokeColor: colors.stroke,
		backgroundColor: colors.background,
	});
}

// Straight line from the edge of `from` to the edge of `to`, picking whichever
// axis (horizontal/vertical) separates the two boxes more, so the arrow starts
// and ends on a box boundary rather than at its (possibly interior) center.
function edgePoint(box: { x: number; y: number; w: number; h: number }, towards: { cx: number; cy: number }) {
	const cx = box.x + box.w / 2;
	const cy = box.y + box.h / 2;
	const dx = towards.cx - cx;
	const dy = towards.cy - cy;

	if (Math.abs(dx) >= Math.abs(dy)) {
		return { x: dx >= 0 ? box.x + box.w : box.x, y: cy };
	}
	return { x: cx, y: dy >= 0 ? box.y + box.h : box.y };
}

function makeArrow(
	edge: DiagramEdge,
	fromNode: DiagramNode,
	toNode: DiagramNode,
): { arrow: ExcalidrawArrowElement; text: ExcalidrawTextElement | null } {
	const fromBox = { x: fromNode.x, y: fromNode.y, w: fromNode.w ?? DEFAULT_W, h: fromNode.h ?? DEFAULT_H };
	const toBox = { x: toNode.x, y: toNode.y, w: toNode.w ?? DEFAULT_W, h: toNode.h ?? DEFAULT_H };
	const toCenter = { cx: toBox.x + toBox.w / 2, cy: toBox.y + toBox.h / 2 };
	const fromCenter = { cx: fromBox.x + fromBox.w / 2, cy: fromBox.y + fromBox.h / 2 };

	const start = edgePoint(fromBox, toCenter);
	const end = edgePoint(toBox, fromCenter);

	const arrowId = nextId("arrow");
	const textId = edge.label ? nextId("text") : null;

	const arrow = {
		...baseProps(arrowId),
		type: "arrow",
		elbowed: false,
		x: start.x,
		y: start.y,
		width: Math.abs(end.x - start.x),
		height: Math.abs(end.y - start.y),
		strokeColor: "#1e1e1e",
		backgroundColor: "transparent",
		fillStyle: "solid",
		points: [
			[0, 0],
			[end.x - start.x, end.y - start.y],
		],
		lastCommittedPoint: null,
		startBinding: { elementId: fromNode.id, focus: 0, gap: 4 },
		endBinding: { elementId: toNode.id, focus: 0, gap: 4 },
		startArrowhead: null,
		endArrowhead: "arrow",
		boundElements: textId ? [{ id: textId, type: "text" }] : null,
	} as unknown as ExcalidrawArrowElement;

	if (!edge.label || !textId) {
		return { arrow, text: null };
	}

	const textSize = estimateTextSize(edge.label);
	const midX = (start.x + end.x) / 2;
	const midY = (start.y + end.y) / 2;

	const text = {
		...baseProps(textId),
		type: "text",
		x: midX - textSize.width / 2,
		y: midY - textSize.height / 2,
		width: textSize.width,
		height: textSize.height,
		strokeColor: "#1e1e1e",
		backgroundColor: "transparent",
		fillStyle: "solid",
		fontSize: FONT_SIZE - 2,
		fontFamily: EXCALIFONT,
		text: edge.label,
		textAlign: "center",
		verticalAlign: "middle",
		containerId: arrowId,
		originalText: edge.label,
		autoResize: true,
		lineHeight: LINE_HEIGHT,
		boundElements: null,
	} as unknown as ExcalidrawTextElement;

	return { arrow, text };
}

export function buildDiagramSnapshot(
	nodes: DiagramNode[],
	edges: DiagramEdge[],
): unknown {
	const elements: unknown[] = [];

	for (const node of nodes) {
		const { rect, text } = makeRectangle(node);
		elements.push(rect, text);
	}

	for (const edge of edges) {
		const fromNode = nodes.find((n) => n.id === edge.from);
		const toNode = nodes.find((n) => n.id === edge.to);
		if (!fromNode || !toNode) {
			throw new Error(
				`buildDiagramSnapshot: edge references unknown node id ("${edge.from}" -> "${edge.to}")`,
			);
		}

		const { arrow, text } = makeArrow(edge, fromNode, toNode);
		elements.push(arrow);
		if (text) elements.push(text);
	}

	return { elements };
}
