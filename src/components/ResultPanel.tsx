import type { OptimizeSmallWorldResponse } from "../types.ts";

type ResultPanelProps = {
  result: OptimizeSmallWorldResponse | null;
};

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) return null;

  const scoreDiff =
    result.optimized_graph_score === -1 ||
    result.bidirectional_graph_score === -1
      ? "N/A"
      : result.optimized_graph_score - result.bidirectional_graph_score;

  return (
    <div className="result-panel">
      <h3>최적화 결과</h3>
      <div className="score-cards">
        <div className="card">
          <span className="label">Optimized Graph Score</span>
          <span className="value">{result.optimized_graph_score}</span>
          {result.optimized_graph_score === -1 && (
            <p className="unreachable-node-notice">
              (도달할 수 없는 노드 존재)
            </p>
          )}
        </div>
        <div className="card">
          <span className="label">Bidirectional Graph Score</span>
          <span className="value">{result.bidirectional_graph_score}</span>
          {result.bidirectional_graph_score === -1 && (
            <p className="unreachable-node-notice">
              (도달할 수 없는 노드 존재)
            </p>
          )}
        </div>
        <div className="card highlight">
          <span className="label">점수 차이</span>
          <span className="value">{scoreDiff}</span>
        </div>
        <div className="card">
          <span className="label">최적화된 방향 간선 개수</span>
          <span className="value">{result.edges.length}</span>
        </div>
      </div>
    </div>
  );
}
