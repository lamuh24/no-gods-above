export function normalizeSeed(seed: number): number {
  return (seed >>> 0) || 0x6d2b79f5;
}

export function nextRng(state: number): { state: number; value: number } {
  let t = (state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: t >>> 0, value };
}
