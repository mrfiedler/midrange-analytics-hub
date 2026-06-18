/**
 * Map any value in a metric's typical range to a 0-100 score
 * for use in radar/visual comparisons. Tuned for NBA season averages.
 */
const RANGES: Record<string, [number, number]> = {
  // scoring
  PPG: [0, 35],
  // playmaking
  APG: [0, 11],
  // rebounding
  RPG: [0, 14],
  // defense
  SPG: [0, 2.5],
  BPG: [0, 3],
  // efficiency
  "TS%": [0.4, 0.7],
  "FG%": [0.35, 0.6],
  "3P%": [0.25, 0.45],
  // impact
  PER: [5, 32],
  USG: [10, 35],
};

export function scoreMetric(abbr: string, value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  const range = RANGES[abbr];
  if (!range) return 50;
  const [lo, hi] = range;
  const v = Math.max(lo, Math.min(hi, value));
  return Math.round(((v - lo) / (hi - lo)) * 100);
}
