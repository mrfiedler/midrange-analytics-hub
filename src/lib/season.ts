/**
 * NBA season helpers.
 * NBA season runs from October to June.
 * - Months Jul-Sep (offseason): return previous season (the one that just ended).
 * - Months Oct-Dec: return the current calendar year.
 * - Months Jan-Jun: return previous calendar year (season started in the previous Oct).
 *
 * Returned number is the "start year" of the season (the value the balldontlie
 * `season` param expects). e.g. season 2024 = 2024–25.
 */
export function getCurrentSeason(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  if (month >= 10) return year; // Oct-Dec: current year season
  if (month <= 6) return year - 1; // Jan-Jun: still last fall's season
  return year - 1; // Jul-Sep offseason: the season that just ended
}

export function formatSeason(startYear: number): string {
  const end = (startYear + 1).toString().slice(2);
  return `${startYear}–${end}`;
}
