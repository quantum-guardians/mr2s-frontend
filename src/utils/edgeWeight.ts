/** API·시각화 밀도 모두 동일 스케일: 정수 1(희박) ~ 10(촘촘) */
export const EDGE_WEIGHT_MIN = 1;
export const EDGE_WEIGHT_MAX = 10;

export function clampEdgeWeight(n: number): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return EDGE_WEIGHT_MAX;
  return Math.min(EDGE_WEIGHT_MAX, Math.max(EDGE_WEIGHT_MIN, x));
}
