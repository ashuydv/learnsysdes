import {
	createBindingId,
	createShapeId,
	createTLSchema,
	DocumentRecordType,
	getIndices,
	PageRecordType,
	TLDOCUMENT_ID,
	toRichText,
	type IndexKey,
	type TLArrowBinding,
	type TLArrowShape,
	type TLDefaultColorStyle,
	type TLGeoShape,
	type TLPageId,
	type TLRecord,
	type TLShapeId,
} from "@tldraw/editor";

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

const KIND_COLORS: Record<DiagramNodeKind, TLDefaultColorStyle> = {
	client: "blue",
	cdn: "light-blue",
	lb: "orange",
	service: "green",
	cache: "violet",
	db: "red",
	queue: "grey",
	generic: "grey",
};

const DEFAULT_W = 180;
const DEFAULT_H = 80;
const PAGE_ID = PageRecordType.createId("page") as TLPageId;

// normalizedAnchor 0.5/0.5 + isPrecise:false binds to the shape's center and lets
// tldraw route the arrow to the nearest edge automatically as shapes move.
const CENTER_BINDING = {
	normalizedAnchor: { x: 0.5, y: 0.5 },
	isExact: false,
	isPrecise: false,
	snap: "none" as const,
};

export function buildDiagramSnapshot(
	nodes: DiagramNode[],
	edges: DiagramEdge[],
): unknown {
	const schema = createTLSchema();

	const document = DocumentRecordType.create({
		id: TLDOCUMENT_ID,
		name: "",
	});

	const page = PageRecordType.create({
		id: PAGE_ID,
		name: "Page 1",
		index: "a1" as IndexKey,
	});

	const shapeIndices = getIndices(nodes.length);
	const shapeIdByNodeId = new Map<string, TLShapeId>();
	for (const node of nodes) {
		shapeIdByNodeId.set(node.id, createShapeId(node.id));
	}

	const shapes: TLGeoShape[] = nodes.map((node, i) => ({
		id: shapeIdByNodeId.get(node.id)!,
		typeName: "shape",
		type: "geo",
		x: node.x,
		y: node.y,
		rotation: 0,
		index: shapeIndices[i],
		parentId: PAGE_ID,
		isLocked: false,
		opacity: 1,
		props: {
			geo: "rectangle",
			w: node.w ?? DEFAULT_W,
			h: node.h ?? DEFAULT_H,
			color: KIND_COLORS[node.kind],
			labelColor: "black",
			fill: "solid",
			dash: "solid",
			size: "m",
			font: "sans",
			align: "middle",
			verticalAlign: "middle",
			richText: toRichText(node.label),
			url: "",
			growY: 0,
			scale: 1,
		},
		meta: {},
	}));

	const lastShapeIndex = shapeIndices[shapeIndices.length - 1] ?? ("a1" as IndexKey);
	const arrowIndices = getIndices(edges.length, lastShapeIndex);
	const arrows: TLArrowShape[] = [];
	const bindings: TLArrowBinding[] = [];

	edges.forEach((edge, i) => {
		const fromShapeId = shapeIdByNodeId.get(edge.from);
		const toShapeId = shapeIdByNodeId.get(edge.to);
		if (!fromShapeId || !toShapeId) {
			throw new Error(
				`buildDiagramSnapshot: edge references unknown node id ("${edge.from}" -> "${edge.to}")`,
			);
		}

		const fromNode = nodes.find((n) => n.id === edge.from)!;
		const toNode = nodes.find((n) => n.id === edge.to)!;
		const arrowId = createShapeId();

		arrows.push({
			id: arrowId,
			typeName: "shape",
			type: "arrow",
			x: 0,
			y: 0,
			rotation: 0,
			index: arrowIndices[i],
			parentId: PAGE_ID,
			isLocked: false,
			opacity: 1,
			props: {
				kind: "arc",
				color: "black",
				labelColor: "black",
				fill: "none",
				dash: "solid",
				size: "m",
				arrowheadStart: "none",
				arrowheadEnd: "arrow",
				font: "sans",
				// Overwritten visually once the bindings below resolve against the
				// bound shapes; tldraw still requires concrete start/end points.
				start: { x: fromNode.x + (fromNode.w ?? DEFAULT_W) / 2, y: fromNode.y + (fromNode.h ?? DEFAULT_H) / 2 },
				end: { x: toNode.x + (toNode.w ?? DEFAULT_W) / 2, y: toNode.y + (toNode.h ?? DEFAULT_H) / 2 },
				bend: 0,
				richText: toRichText(edge.label ?? ""),
				labelPosition: 0.5,
				scale: 1,
				elbowMidPoint: 0.5,
			},
			meta: {},
		});

		bindings.push({
			id: createBindingId(),
			typeName: "binding",
			type: "arrow",
			fromId: arrowId,
			toId: fromShapeId,
			props: { terminal: "start", ...CENTER_BINDING },
			meta: {},
		});

		bindings.push({
			id: createBindingId(),
			typeName: "binding",
			type: "arrow",
			fromId: arrowId,
			toId: toShapeId,
			props: { terminal: "end", ...CENTER_BINDING },
			meta: {},
		});
	});

	const records: TLRecord[] = [document, page, ...shapes, ...arrows, ...bindings];

	const store: Record<string, TLRecord> = {};
	for (const record of records) {
		store[record.id] = record;
	}

	return {
		document: {
			store,
			schema: schema.serialize(),
		},
	};
}
