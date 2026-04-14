import type {
  OptimizeSmallWorldRequest,
  OptimizeSmallWorldResponse,
  ApiTarget,
  BenchmarkResult,
  BenchmarkStats,
} from "./types.ts";
import { UNREACHABLE_SCORE } from "./types.ts";

const API_URLS: Record<ApiTarget, string> = {
  "mr2s": "/api/v1/mr2s",
  "raw-sa": "/api/v1/raw-sa",
  "brute-force": "/api/v1/brute-force",
};

export class ApiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTimeoutError";
  }
}

export async function optimizeSmallWorld(
  request: OptimizeSmallWorldRequest,
  apiTarget: ApiTarget
): Promise<OptimizeSmallWorldResponse> {
  const url = API_URLS[apiTarget];

  const body = {
    vertices: request.vertices,
    edges: request.edges.map(([u, v]) => ({ vertices: [u, v], weight: 1 })),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 408) {
    throw new ApiTimeoutError("Request Timeout (408)");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API 요청 실패 (${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as OptimizeSmallWorldResponse;
  return data;
}

export const BENCHMARK_GRAPH: OptimizeSmallWorldRequest = {
  vertices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  edges: [
    [1, 2], [1, 4], [1, 7], [2, 3], [2, 5], [2, 8], [3, 6], [3, 9],
    [4, 5], [4, 10], [5, 6], [5, 11], [6, 12], [7, 8], [7, 10],
    [8, 9], [8, 13], [9, 12], [9, 14], [10, 11], [10, 13], [11, 12],
    [11, 15], [12, 14], [13, 14], [14, 15], [15, 1],
  ],
};

const BENCHMARK_ITERATIONS = 10;
const ALL_TARGETS: ApiTarget[] = ["mr2s", "raw-sa", "brute-force"];

function buildStats(scores: number[], durations: number[], failureCount: number): BenchmarkStats {
  return {
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

export async function runBenchmark(): Promise<BenchmarkResult> {
  const result = {} as BenchmarkResult;

  for (const target of ALL_TARGETS) {
    const scores: number[] = [];
    const durations: number[] = [];
    let failureCount = 0;

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const start = performance.now();
      try {
        const res = await optimizeSmallWorld(BENCHMARK_GRAPH, target);
        const elapsed = performance.now() - start;
        scores.push(res.optimized_graph_score);
        durations.push(elapsed);
      } catch {
        const elapsed = performance.now() - start;
        durations.push(elapsed);
        failureCount++;
      }
    }

    result[target] = buildStats(scores, durations, failureCount);
  }

  return result;
}
