import type {
  ParsedGraph,
  OptimizeSmallWorldResponse,
  OptimizedDirectedEdge,
} from "../types.ts";

/**
 * 서버 없이 그래프 시각화·간선 애니메이션을 테스트하기 위한 mock 응답.
 * 각 무방향 간선마다 방향을 무작위로 정한다.
 */
export function buildRandomMockResponse(
  graph: ParsedGraph
): OptimizeSmallWorldResponse {
  const edges: OptimizedDirectedEdge[] = graph.edges.map(([u, v]) =>
    Math.random() < 0.5
      ? { _from: u, to: v }
      : { _from: v, to: u }
  );

  const sumW = graph.weights.reduce((a, b) => a + b, 0);
  const base = Math.max(10, sumW);
  const bidirectional = base + Math.floor(Math.random() * base);
  const optimized = Math.floor(Math.random() * (bidirectional + 1));

  return {
    edges,
    optimized_graph_score: optimized,
    bidirectional_graph_score: bidirectional,
  };
}
