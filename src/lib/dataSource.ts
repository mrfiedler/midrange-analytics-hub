import { nbaStatsProxy } from "@/lib/nba-stats.functions";

export type SourceTag = "nba.com" | "balldontlie-derived" | null;

export interface SourcedResult<T> {
  source: SourceTag;
  available: boolean;
  data: T | null;
  notice?: string;
}

function seasonStr(season: number) {
  return `${season}-${String(season + 1).slice(2)}`;
}

/* ---------- League Leaders ---------- */

export interface LeaderRow {
  rank: number;
  playerId: number;
  playerName: string;
  teamAbbr: string;
  value: number;
  gp: number;
}

export async function fetchLeagueLeaders(
  season: number,
  statCategory: "PTS" | "REB" | "AST" | "STL" | "BLK" | "FG3M" = "PTS",
): Promise<SourcedResult<LeaderRow[]>> {
  const res = await nbaStatsProxy({
    data: {
      endpoint: "leagueleaders",
      params: {
        LeagueID: "00",
        Season: seasonStr(season),
        SeasonType: "Regular Season",
        StatCategory: statCategory,
        PerMode: "PerGame",
        Scope: "S",
      },
    },
  });

  if (res.ok && res.data?.resultSet) {
    const { headers, rowSet } = res.data.resultSet as {
      headers: string[];
      rowSet: any[][];
    };
    const idx = (k: string) => headers.indexOf(k);
    const rows: LeaderRow[] = rowSet.slice(0, 25).map((r) => ({
      rank: r[idx("RANK")] ?? 0,
      playerId: r[idx("PLAYER_ID")] ?? 0,
      playerName: r[idx("PLAYER")] ?? "-",
      teamAbbr: r[idx("TEAM")] ?? "-",
      value: Number(r[idx(statCategory)] ?? 0),
      gp: Number(r[idx("GP")] ?? 0),
    }));
    return { source: "nba.com", available: true, data: rows };
  }

  return {
    source: null,
    available: false,
    data: null,
    notice: "Líderes oficiais indisponíveis - stats.nba.com bloqueou esta requisição.",
  };
}

/* ---------- Standings ---------- */

export interface StandingsRow {
  teamId: number;
  teamCity: string;
  teamName: string;
  conference: "East" | "West";
  wins: number;
  losses: number;
  pct: number;
  rank: number;
}

export async function fetchStandings(season: number): Promise<SourcedResult<StandingsRow[]>> {
  const res = await nbaStatsProxy({
    data: {
      endpoint: "leaguestandingsv3",
      params: {
        LeagueID: "00",
        Season: seasonStr(season),
        SeasonType: "Regular Season",
      },
    },
  });

  if (res.ok && res.data?.resultSets?.[0]) {
    const { headers, rowSet } = res.data.resultSets[0] as {
      headers: string[];
      rowSet: any[][];
    };
    const idx = (k: string) => headers.indexOf(k);
    const rows: StandingsRow[] = rowSet.map((r) => ({
      teamId: r[idx("TeamID")] ?? 0,
      teamCity: r[idx("TeamCity")] ?? "",
      teamName: r[idx("TeamName")] ?? "",
      conference: (r[idx("Conference")] ?? "East") as "East" | "West",
      wins: Number(r[idx("WINS")] ?? 0),
      losses: Number(r[idx("LOSSES")] ?? 0),
      pct: Number(r[idx("WinPCT")] ?? 0),
      rank: Number(r[idx("PlayoffRank")] ?? 0),
    }));
    return { source: "nba.com", available: true, data: rows };
  }

  return {
    source: null,
    available: false,
    data: null,
    notice: "Classificação oficial indisponível - stats.nba.com bloqueou esta requisição.",
  };
}
