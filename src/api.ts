import type {
  OptimizeSmallWorldRequest,
  OptimizeSmallWorldResponse,
  ApiTarget,
  BenchmarkResult,
  ParsedGraph,
} from "./types.ts";
import { UNREACHABLE_SCORE } from "./types.ts";
import { clampEdgeWeight } from "./utils/edgeWeight.ts";

// 개발/프로덕션 모두 프록시 경로 사용 (CORS 우회)
// - 개발: Vite proxy (vite.config.ts)
// - 프로덕션: Vercel rewrites (vercel.json)
export const SMALL_WORLD_API_URL = "/api/v1/optimize/small-world";
export const NAOTO_API_URL = "/api/v1/optimize/naoto";

export function toApiRequest(graph: ParsedGraph): OptimizeSmallWorldRequest {
  return {
    edges: graph.edges.map(([u, v], i) => ({
      vertices: [u, v] as [number, number],
      weight: clampEdgeWeight(graph.weights[i]),
    })),
  };
}

export async function optimizeSmallWorld(
  graph: ParsedGraph,
  apiTarget: ApiTarget
): Promise<OptimizeSmallWorldResponse> {
  const url =
    apiTarget === "naoto" ? NAOTO_API_URL : SMALL_WORLD_API_URL;
  const request = toApiRequest(graph);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API 요청 실패 (${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as OptimizeSmallWorldResponse;
  return data;
}

const DEFAULT_BENCHMARK_WEIGHT = 10;

export const BENCHMARK_GRAPH: ParsedGraph = {
  vertices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  edges: [
    [1, 2], [1, 4], [1, 7], [2, 3], [2, 5], [2, 8], [3, 6], [3, 9],
    [4, 5], [4, 10], [5, 6], [5, 11], [6, 12], [7, 8], [7, 10],
    [8, 9], [8, 13], [9, 12], [9, 14], [10, 11], [10, 13], [11, 12],
    [11, 15], [12, 14], [13, 14], [14, 15], [15, 1],
  ],
  weights: Array(27).fill(DEFAULT_BENCHMARK_WEIGHT),
};

const BENCHMARK_ITERATIONS = 10;
const API_TARGETS: ApiTarget[] = ["small-world", "naoto"];

export async function runBenchmark(): Promise<BenchmarkResult> {
  const result = {} as BenchmarkResult;

  for (const target of API_TARGETS) {
    const scores: number[] = [];
    const durations: number[] = [];
    let failureCount = 0;

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const start = performance.now();
      try {
        const res = await optimizeSmallWorld(BENCHMARK_GRAPH, target);
        if (res.optimized_graph_score === UNREACHABLE_SCORE) {
          failureCount++;
        } else {
          scores.push(res.optimized_graph_score);
        }
      } catch {
        failureCount++;
      } finally {
        durations.push(performance.now() - start);
      }
    }

    result[target] = {
      max: scores.length > 0 ? Math.max(...scores) : UNREACHABLE_SCORE,
      min: scores.length > 0 ? Math.min(...scores) : UNREACHABLE_SCORE,
      average:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : UNREACHABLE_SCORE,
      averageTimeMs:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      failureCount,
    };
  }

  return result;
}
