import type { ParsedGraph } from "../types.ts";

/**
 * Generates a random planar graph using Delaunay triangulation.
 * Points are placed randomly in a 2D plane, then triangulated
 * to guarantee planarity and connectivity.
 */
export function generateRandomPlanarGraph(nodeCount: number): ParsedGraph {
  if (nodeCount < 3) {
    throw new Error("At least 3 nodes are required");
  }

  const points = generatePoints(nodeCount);
  const edgeSet = new Set<string>();
  const triangles = delaunayTriangulate(points);

  for (const [a, b, c] of triangles) {
    addEdge(edgeSet, a, b);
    addEdge(edgeSet, b, c);
    addEdge(edgeSet, a, c);
  }

  const vertices = Array.from({ length: nodeCount }, (_, i) => i + 1);
  const edges: [number, number][] = [];
  for (const key of edgeSet) {
    const [u, v] = key.split(",").map(Number);
    edges.push([u + 1, v + 1]);
  }

  return { vertices, edges };
}

function addEdge(set: Set<string>, a: number, b: number) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  set.add(`${lo},${hi}`);
}

function generatePoints(n: number): [number, number][] {
  const points: [number, number][] = [];
  const gridSize = Math.ceil(Math.sqrt(n)) * 10;
  const minDist = gridSize / (Math.sqrt(n) * 1.5);

  for (let i = 0; i < n; i++) {
    let attempts = 0;
    while (attempts < 200) {
      const x = Math.random() * gridSize;
      const y = Math.random() * gridSize;
      let valid = true;
      for (const [px, py] of points) {
        if (Math.hypot(x - px, y - py) < minDist) {
          valid = false;
          break;
        }
      }
      if (valid) {
        points.push([x, y]);
        break;
      }
      attempts++;
    }
    if (points.length <= i) {
      points.push([Math.random() * gridSize, Math.random() * gridSize]);
    }
  }
  return points;
}

// ----- Bowyer-Watson Delaunay Triangulation -----

type Triangle = [number, number, number];

function delaunayTriangulate(points: [number, number][]): Triangle[] {
  const n = points.length;
  const superSize = 10000;
  const allPoints: [number, number][] = [
    ...points,
    [-superSize, -superSize],
    [2 * superSize, -superSize],
    [0, 2 * superSize],
  ];
  const s0 = n, s1 = n + 1, s2 = n + 2;

  let triangles: Triangle[] = [[s0, s1, s2]];

  for (let i = 0; i < n; i++) {
    const [px, py] = allPoints[i];
    const bad: Triangle[] = [];
    const good: Triangle[] = [];

    for (const tri of triangles) {
      if (inCircumcircle(allPoints, tri, px, py)) {
        bad.push(tri);
      } else {
        good.push(tri);
      }
    }

    const boundary: [number, number][] = [];
    for (const tri of bad) {
      const edges: [number, number][] = [
        [tri[0], tri[1]],
        [tri[1], tri[2]],
        [tri[2], tri[0]],
      ];
      for (const [ea, eb] of edges) {
        let shared = false;
        for (const other of bad) {
          if (other === tri) continue;
          if (triHasEdge(other, ea, eb)) {
            shared = true;
            break;
          }
        }
        if (!shared) boundary.push([ea, eb]);
      }
    }

    triangles = good;
    for (const [ea, eb] of boundary) {
      triangles.push([i, ea, eb]);
    }
  }

  return triangles.filter(
    ([a, b, c]) => a < n && b < n && c < n
  );
}

function triHasEdge(tri: Triangle, a: number, b: number): boolean {
  const has = (v: number) => tri[0] === v || tri[1] === v || tri[2] === v;
  return has(a) && has(b);
}

function inCircumcircle(
  pts: [number, number][],
  tri: Triangle,
  px: number,
  py: number
): boolean {
  const [ax, ay] = pts[tri[0]];
  const [bx, by] = pts[tri[1]];
  const [cx, cy] = pts[tri[2]];

  const dax = ax - px, day = ay - py;
  const dbx = bx - px, dby = by - py;
  const dcx = cx - px, dcy = cy - py;

  const det =
    (dax * dax + day * day) * (dbx * dcy - dcx * dby) -
    (dbx * dbx + dby * dby) * (dax * dcy - dcx * day) +
    (dcx * dcx + dcy * dcy) * (dax * dby - dbx * day);

  return det > 0;
}
