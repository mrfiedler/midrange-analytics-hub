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

export interface ChampionRecord {
  season: number;
  team: string;
  finalsMVP: string;
}

/** Compact champions history (season start year). */
export const CHAMPIONS_HISTORY: ChampionRecord[] = [
  { season: 2024, team: "Oklahoma City Thunder", finalsMVP: "Shai Gilgeous-Alexander" },
  { season: 2023, team: "Boston Celtics", finalsMVP: "Jaylen Brown" },
  { season: 2022, team: "Denver Nuggets", finalsMVP: "Nikola Jokić" },
  { season: 2021, team: "Golden State Warriors", finalsMVP: "Stephen Curry" },
  { season: 2020, team: "Milwaukee Bucks", finalsMVP: "Giannis Antetokounmpo" },
  { season: 2019, team: "Los Angeles Lakers", finalsMVP: "LeBron James" },
  { season: 2018, team: "Toronto Raptors", finalsMVP: "Kawhi Leonard" },
  { season: 2017, team: "Golden State Warriors", finalsMVP: "Kevin Durant" },
  { season: 2016, team: "Golden State Warriors", finalsMVP: "Kevin Durant" },
  { season: 2015, team: "Cleveland Cavaliers", finalsMVP: "LeBron James" },
  { season: 2014, team: "Golden State Warriors", finalsMVP: "Andre Iguodala" },
  { season: 2013, team: "San Antonio Spurs", finalsMVP: "Kawhi Leonard" },
  { season: 2012, team: "Miami Heat", finalsMVP: "LeBron James" },
  { season: 2011, team: "Miami Heat", finalsMVP: "LeBron James" },
  { season: 2010, team: "Dallas Mavericks", finalsMVP: "Dirk Nowitzki" },
  { season: 2009, team: "Los Angeles Lakers", finalsMVP: "Kobe Bryant" },
  { season: 2008, team: "Los Angeles Lakers", finalsMVP: "Kobe Bryant" },
  { season: 2007, team: "Boston Celtics", finalsMVP: "Paul Pierce" },
  { season: 2006, team: "San Antonio Spurs", finalsMVP: "Tony Parker" },
  { season: 2005, team: "Miami Heat", finalsMVP: "Dwyane Wade" },
  { season: 2004, team: "San Antonio Spurs", finalsMVP: "Tim Duncan" },
  { season: 2003, team: "Detroit Pistons", finalsMVP: "Chauncey Billups" },
  { season: 2002, team: "San Antonio Spurs", finalsMVP: "Tim Duncan" },
  { season: 2001, team: "Los Angeles Lakers", finalsMVP: "Shaquille O'Neal" },
  { season: 2000, team: "Los Angeles Lakers", finalsMVP: "Shaquille O'Neal" },
  { season: 1999, team: "Los Angeles Lakers", finalsMVP: "Shaquille O'Neal" },
  { season: 1998, team: "San Antonio Spurs", finalsMVP: "Tim Duncan" },
  { season: 1997, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1996, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1995, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1994, team: "Houston Rockets", finalsMVP: "Hakeem Olajuwon" },
  { season: 1993, team: "Houston Rockets", finalsMVP: "Hakeem Olajuwon" },
  { season: 1992, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1991, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1990, team: "Chicago Bulls", finalsMVP: "Michael Jordan" },
  { season: 1989, team: "Detroit Pistons", finalsMVP: "Isiah Thomas" },
  { season: 1988, team: "Detroit Pistons", finalsMVP: "Joe Dumars" },
  { season: 1987, team: "Los Angeles Lakers", finalsMVP: "James Worthy" },
  { season: 1986, team: "Los Angeles Lakers", finalsMVP: "Magic Johnson" },
  { season: 1985, team: "Boston Celtics", finalsMVP: "Larry Bird" },
  { season: 1984, team: "Los Angeles Lakers", finalsMVP: "Kareem Abdul-Jabbar" },
  { season: 1983, team: "Boston Celtics", finalsMVP: "Larry Bird" },
  { season: 1982, team: "Philadelphia 76ers", finalsMVP: "Moses Malone" },
  { season: 1981, team: "Los Angeles Lakers", finalsMVP: "Magic Johnson" },
  { season: 1980, team: "Boston Celtics", finalsMVP: "Cedric Maxwell" },
];

export function getChampionForSeason(season: number): Champion | undefined {
  return CHAMPIONS.find((c) => c.season === season) ?? CHAMPIONS[0];
}
