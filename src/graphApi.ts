import type { ParsedGraph } from "./types";

const GRAPH_API_BASE = "/graph-api";

type BackendEdge = { source: number; target: number };
type BackendPositions = Record<string, { x: number; y: number }>;
type BackendResponse = {
  num_vertices: number;
  num_edges: number;
  edges: BackendEdge[];
  positions: BackendPositions;
};

const POSITION_SCALE = 120;

export async function generateGraphFromBackend(
  numVertices: number,
  numEdges?: number,
  seed?: number,
): Promise<ParsedGraph> {
  const body: Record<string, unknown> = { num_vertices: numVertices };
  if (numEdges != null) body.num_edges = numEdges;
  if (seed != null) body.seed = seed;

  const res = await fetch(`${GRAPH_API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Graph API error: ${res.status}`);
  }

  const data: BackendResponse = await res.json();

  // Backend is 0-indexed, frontend is 1-indexed
  const vertices = Array.from({ length: data.num_vertices }, (_, i) => i + 1);
  const edges: [number, number][] = data.edges.map((e) => [
    e.source + 1,
    e.target + 1,
  ]);
  const positions: Record<number, { x: number; y: number }> = {};
  for (const [key, pos] of Object.entries(data.positions)) {
    positions[Number(key) + 1] = {
      x: pos.x * POSITION_SCALE,
      y: pos.y * POSITION_SCALE,
    };
  }

  return { vertices, edges, positions };
}
