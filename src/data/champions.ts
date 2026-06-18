export interface Champion {
  season: number; // start year (2025 = 2025–26)
  seasonLabel: string;
  team: string;
  teamAbbr: string;
  teamColors: { primary: string; secondary: string };
  finalsMVP: string;
  seriesResult: string; // e.g. "4-1 vs San Antonio Spurs"
  record: string;
  ppg: number;
  ortg: number;
  drtg: number;
  netRtg: number;
  leadingScorer: { name: string; ppg: number };
}

/**
 * Champions roster — fallback when Wikipedia API fails.
 * Update as new seasons end.
 */
export const CHAMPIONS: Champion[] = [
  {
    season: 2025,
    seasonLabel: "2025–26",
    team: "New York Knicks",
    teamAbbr: "NYK",
    teamColors: { primary: "#006BB6", secondary: "#F58426" },
    finalsMVP: "Jalen Brunson",
    seriesResult: "4-1 vs San Antonio Spurs",
    record: "58–24",
    ppg: 116.8,
    ortg: 119.2,
    drtg: 110.4,
    netRtg: 8.8,
    leadingScorer: { name: "Jalen Brunson", ppg: 28.6 },
  },
  {
    season: 2024,
    seasonLabel: "2024–25",
    team: "Oklahoma City Thunder",
    teamAbbr: "OKC",
    teamColors: { primary: "#007AC1", secondary: "#EF3B24" },
    finalsMVP: "Shai Gilgeous-Alexander",
    seriesResult: "4-3 vs Indiana Pacers",
    record: "68–14",
    ppg: 120.5,
    ortg: 119.8,
    drtg: 106.6,
    netRtg: 13.2,
    leadingScorer: { name: "Shai Gilgeous-Alexander", ppg: 32.7 },
  },
  {
    season: 2023,
    seasonLabel: "2023–24",
    team: "Boston Celtics",
    teamAbbr: "BOS",
    teamColors: { primary: "#007A33", secondary: "#BA9653" },
    finalsMVP: "Jaylen Brown",
    seriesResult: "4-1 vs Dallas Mavericks",
    record: "64–18",
    ppg: 120.6,
    ortg: 122.2,
    drtg: 110.6,
    netRtg: 11.6,
    leadingScorer: { name: "Jayson Tatum", ppg: 26.9 },
  },
];

export function getChampionForSeason(season: number): Champion | undefined {
  return CHAMPIONS.find((c) => c.season === season) ?? CHAMPIONS[0];
}
