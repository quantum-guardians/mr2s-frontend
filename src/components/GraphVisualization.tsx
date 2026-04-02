import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import type { ParsedGraph } from "../types.ts";
import type { OptimizedDirectedEdge } from "../types.ts";
import { clampEdgeWeight, EDGE_WEIGHT_MAX } from "../utils/edgeWeight.ts";
import { CircleNode } from "./CircleNode.tsx";

const DEFAULT_LAYOUT = {
  direction: "TB" as const,
  nodeSpacing: 60,
  rankSpacing: 80,
};

type GraphVisualizationProps = {
  parsedGraph: ParsedGraph | null;
  directedEdges: OptimizedDirectedEdge[] | null;
  hasDrawn: boolean;
};

const NODE_WIDTH = 40;
const NODE_HEIGHT = 40;

const nodeTypes = { circle: CircleNode };

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

function findEdgeWeight(
  graph: ParsedGraph,
  _from: number,
  to: number
): number {
  for (let i = 0; i < graph.edges.length; i++) {
    const [u, v] = graph.edges[i];
    if ((u === _from && v === to) || (u === to && v === _from)) {
      return clampEdgeWeight(graph.weights[i] ?? EDGE_WEIGHT_MAX);
    }
  }
  return EDGE_WEIGHT_MAX;
}

/** 군중 점(둥근 cap) 직경에 해당 — weight와 무관하게 동일 */
const CROWD_DOT_STROKE_WIDTH = 8;

/** weight 정수 1~10 각각에 고정 gap(px). 1=매우 희박, 10=매우 촘촘 (단계 간 대비 크게) */
const CROWD_GAP_BY_WEIGHT: readonly number[] = [
  58, 42, 30, 22, 16, 11, 7, 5, 3, 2,
];

function weightToCrowdDotPattern(weight: number): { dotSpan: number; gap: number } {
  const level = clampEdgeWeight(weight);
  const gap = CROWD_GAP_BY_WEIGHT[level - 1];
  return { dotSpan: 1, gap };
}

function getHandleForDirection(
  dx: number,
  dy: number,
  isSource: boolean
): string {
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const deg = (angle + 360) % 360;
  const suffix = isSource ? "src" : "tgt";
  if (deg >= 337.5 || deg < 22.5) return `right-${suffix}`;
  if (deg >= 22.5 && deg < 67.5) return `bottom-right-${suffix}`;
  if (deg >= 67.5 && deg < 112.5) return `bottom-${suffix}`;
  if (deg >= 112.5 && deg < 157.5) return `bottom-left-${suffix}`;
  if (deg >= 157.5 && deg < 202.5) return `left-${suffix}`;
  if (deg >= 202.5 && deg < 247.5) return `top-left-${suffix}`;
  if (deg >= 247.5 && deg < 292.5) return `top-${suffix}`;
  return `top-right-${suffix}`;
}

function getLayoutedNodes(nodes: Node[], edges: Edge[]): Node[] {
  dagreGraph.setGraph({
    rankdir: DEFAULT_LAYOUT.direction,
    nodesep: DEFAULT_LAYOUT.nodeSpacing,
    ranksep: DEFAULT_LAYOUT.rankSpacing,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function buildNodesAndEdges(
  graph: ParsedGraph,
  directedEdges: OptimizedDirectedEdge[] | null,
  existingNodes: Node[] | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.vertices.map((v) => ({
    id: String(v),
    type: "circle",
    position: { x: 0, y: 0 },
    data: { label: String(v) },
  }));

  const layoutEdges: Edge[] = graph.edges.map(([u, v]) => ({
    id: `layout-${u}-${v}`,
    source: String(u),
    target: String(v),
  }));
  const layoutedNodes = getLayoutedNodes(nodes, layoutEdges);

  const existingIds = new Set(existingNodes?.map((n) => n.id) ?? []);
  const sameGraph =
    existingNodes &&
    existingNodes.length === layoutedNodes.length &&
    layoutedNodes.every((n) => existingIds.has(n.id));

  const nodesToUse = sameGraph
    ? layoutedNodes.map((n) => {
        const existing = existingNodes!.find((e) => e.id === n.id);
        return {
          ...n,
          position: existing?.position ?? n.position,
        };
      })
    : layoutedNodes;

  const posMap = new Map<string, { x: number; y: number }>();
  nodesToUse.forEach((n) => {
    posMap.set(n.id, {
      x: n.position.x + NODE_WIDTH / 2,
      y: n.position.y + NODE_HEIGHT / 2,
    });
  });

  const addEdgeWithHandles = (
    id: string,
    source: string,
    target: string,
    opts: Partial<Edge>
  ): Edge => {
    const srcPos = posMap.get(source);
    const tgtPos = posMap.get(target);
    if (!srcPos || !tgtPos) {
      return { id, source, target, ...opts } as Edge;
    }
    const dx = tgtPos.x - srcPos.x;
    const dy = tgtPos.y - srcPos.y;
    return {
      ...opts,
      id,
      source,
      target,
      sourceHandle: getHandleForDirection(dx, dy, true),
      targetHandle: getHandleForDirection(-dx, -dy, false),
    } as Edge;
  };

  const edges: Edge[] = [];
  if (directedEdges && directedEdges.length > 0) {
    for (const [u, v] of graph.edges) {
      edges.push(
        addEdgeWithHandles(`bg-${u}-${v}`, String(u), String(v), {
          type: "default",
          markerEnd: undefined,
          markerStart: undefined,
          style: { stroke: "var(--edge-bg)", strokeWidth: 1 },
          zIndex: 0,
        })
      );
    }
    for (const e of directedEdges) {
      const w = findEdgeWeight(graph, e._from, e.to);
      const { dotSpan, gap } = weightToCrowdDotPattern(w);
      const period = Math.max(1, dotSpan + gap);
      const basePeriod = 14;
      const durationSec = Math.min(
        1.15,
        Math.max(0.32, 0.5 * (period / basePeriod))
      );
      edges.push(
        addEdgeWithHandles(`dir-${e._from}-${e.to}`, String(e._from), String(e.to), {
          type: "default",
          animated: true,
          className: "edge-directed-crowd",
          markerEnd: undefined,
          markerStart: undefined,
          style: {
            stroke: "#dc2626",
            strokeWidth: CROWD_DOT_STROKE_WIDTH,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeDasharray: `${dotSpan} ${gap}`,
            ["--edge-dash-offset" as string]: String(-period),
            ["--edge-dash-duration" as string]: `${durationSec}s`,
          },
          zIndex: 1,
        })
      );
    }
  } else {
    for (const [u, v] of graph.edges) {
      edges.push(
        addEdgeWithHandles(`undir-${u}-${v}`, String(u), String(v), {
          type: "default",
          markerEnd: undefined,
          markerStart: undefined,
          style: { stroke: "var(--edge-undir)", strokeWidth: 2 },
        })
      );
    }
  }

  return { nodes: nodesToUse, edges };
}

export function GraphVisualization({
  parsedGraph,
  directedEdges,
  hasDrawn,
}: GraphVisualizationProps) {
  const { t } = useTranslation();
  const { nodes: initialNodes, edges: initialEdges } = parsedGraph
    ? buildNodesAndEdges(parsedGraph, directedEdges, null)
    : { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    if (parsedGraph) {
      const { nodes: n, edges: e } = buildNodesAndEdges(
        parsedGraph,
        directedEdges,
        nodesRef.current
      );
      setNodes(n);
      setEdges(e);
    }
  }, [parsedGraph, directedEdges]);

  if (!hasDrawn) {
    return (
      <div className="graph-placeholder">
        <p>{t("graphVisualization.placeholder")}</p>
      </div>
    );
  }

  if (!parsedGraph) {
    return null;
  }

  return (
    <div className="graph-viz">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.01}
        maxZoom={100}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
