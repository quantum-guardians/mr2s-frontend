import type { ParsedGraph } from "../types.ts";
import {
  EDGE_WEIGHT_MIN,
  EDGE_WEIGHT_MAX,
  clampEdgeWeight,
} from "./edgeWeight.ts";

export type ValidationErrorKey =
  | { key: "validation.verticesEmpty" }
  | { key: "validation.invalidVertex"; value: string }
  | { key: "validation.duplicateVertices" }
  | { key: "validation.invalidEdgeFormat"; line: number; value: string }
  | { key: "validation.invalidEdgeValue"; line: number; value: string }
  | { key: "validation.selfLoop"; line: number; u: number; v: number }
  | { key: "validation.vertexNotFound"; vertex: number; line: number }
  | {
      key: "validation.weightOutOfRange";
      line: number;
      value: string;
      min: number;
      max: number;
    };

export type ValidationResult =
  | { valid: true; graph: ParsedGraph }
  | { valid: false; error: ValidationErrorKey };

function parseVertices(raw: string): number[] | { error: ValidationErrorKey } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: { key: "validation.verticesEmpty" } };
  }
  const parts = trimmed.split(/[,\s]+/).filter(Boolean);
  const nums: number[] = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n)) {
      return { error: { key: "validation.invalidVertex", value: p } };
    }
    nums.push(n);
  }
  const unique = new Set(nums);
  if (unique.size !== nums.length) {
    return { error: { key: "validation.duplicateVertices" } };
  }
  return nums;
}

type ParsedEdges = {
  edges: [number, number][];
  weights: number[];
};

function parseEdges(
  raw: string,
  vertices: Set<number>,
  defaultWeight: number
): ParsedEdges | { error: ValidationErrorKey } {
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  const edges: [number, number][] = [];
  const weights: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 3) {
      return {
        error: {
          key: "validation.invalidEdgeFormat",
          line: i + 1,
          value: line,
        },
      };
    }
    const u = parseInt(parts[0], 10);
    const v = parseInt(parts[1], 10);
    if (isNaN(u) || isNaN(v)) {
      return {
        error: { key: "validation.invalidEdgeValue", line: i + 1, value: line },
      };
    }
    let w = clampEdgeWeight(defaultWeight);
    if (parts.length === 3) {
      const ws = parts[2].trim();
      const wNum = Number(ws);
      if (
        !Number.isFinite(wNum) ||
        !Number.isInteger(wNum) ||
        wNum < EDGE_WEIGHT_MIN ||
        wNum > EDGE_WEIGHT_MAX
      ) {
        return {
          error: {
            key: "validation.weightOutOfRange",
            line: i + 1,
            value: line,
            min: EDGE_WEIGHT_MIN,
            max: EDGE_WEIGHT_MAX,
          },
        };
      }
      w = wNum;
    }
    if (u === v) {
      return {
        error: { key: "validation.selfLoop", line: i + 1, u, v },
      };
    }
    if (!vertices.has(u)) {
      return {
        error: { key: "validation.vertexNotFound", vertex: u, line: i + 1 },
      };
    }
    if (!vertices.has(v)) {
      return {
        error: { key: "validation.vertexNotFound", vertex: v, line: i + 1 },
      };
    }
    edges.push([u, v]);
    weights.push(w);
  }
  return { edges, weights };
}

export function validateAndParse(
  verticesRaw: string,
  edgesRaw: string,
  defaultWeight: number = EDGE_WEIGHT_MAX
): ValidationResult {
  const dw = clampEdgeWeight(defaultWeight);
  const vertResult = parseVertices(verticesRaw);
  if (typeof vertResult === "object" && "error" in vertResult) {
    return { valid: false, error: vertResult.error };
  }
  const vertices = vertResult as number[];
  const vertSet = new Set(vertices);

  const edgeResult = parseEdges(edgesRaw, vertSet, dw);
  if ("error" in edgeResult) {
    return { valid: false, error: edgeResult.error };
  }

  return {
    valid: true,
    graph: { vertices, edges: edgeResult.edges, weights: edgeResult.weights },
  };
}
