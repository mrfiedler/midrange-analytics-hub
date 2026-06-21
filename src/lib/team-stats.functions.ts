import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cached } from "@/lib/server-cache";

const NBA_HEADERS = {
  Host: "stats.nba.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  Connection: "keep-alive",
} as const;

function seasonStr(season: number) {
  return `${season}-${String(season + 1).slice(2)}`;
}

export interface TeamLiveStats {
  abbr: string;
  teamName: string;
  wins: number;
  losses: number;
  ortg: number;
  drtg: number;
  netRtg: number;
  pace: number;
  efg: number;
}

const TeamStatsInput = z.object({
  season: z.number().int().min(2000).max(2100),
});

export const getLeagueTeamStats = createServerFn({ method: "GET" })
  .inputValidator((d) => TeamStatsInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean; rows: TeamLiveStats[]; error?: string }> => {
    const url = new URL("https://stats.nba.com/stats/leaguedashteamstats");
    const params = {
      Conference: "",
      DateFrom: "",
      DateTo: "",
      Division: "",
      GameScope: "",
      GameSegment: "",
      LastNGames: "0",
      LeagueID: "00",
      Location: "",
      MeasureType: "Advanced",
      Month: "0",
      OpponentTeamID: "0",
      Outcome: "",
      PORound: "0",
      PaceAdjust: "N",
      PerMode: "PerGame",
      Period: "0",
      PlusMinus: "N",
      Rank: "N",
      Season: seasonStr(data.season),
      SeasonSegment: "",
      SeasonType: "Regular Season",
      ShotClockRange: "",
      TeamID: "0",
      TwoWay: "0",
      VsConference: "",
      VsDivision: "",
    };
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    try {
      const json = await cached(`nba:teamstats:${data.season}`, 30 * 60_000, async () => {
        const res = await fetch(url.toString(), {
          headers: NBA_HEADERS,
          signal: AbortSignal.timeout(9000),
        });
        if (!res.ok) throw new Error(`stats.nba.com ${res.status}`);
        return (await res.json()) as { resultSets: Array<{ headers: string[]; rowSet: any[][] }> };
      });

      const rs = json.resultSets?.[0];
      if (!rs) return { ok: false, rows: [], error: "no resultSet" };
      const idx = (k: string) => rs.headers.indexOf(k);
      const rows: TeamLiveStats[] = rs.rowSet.map((r) => ({
        abbr: String(r[idx("TEAM_ABBREVIATION")] ?? r[idx("TEAM_NAME")] ?? ""),
        teamName: String(r[idx("TEAM_NAME")] ?? ""),
        wins: Number(r[idx("W")] ?? 0),
        losses: Number(r[idx("L")] ?? 0),
        ortg: Number(r[idx("OFF_RATING")] ?? 0),
        drtg: Number(r[idx("DEF_RATING")] ?? 0),
        netRtg: Number(r[idx("NET_RATING")] ?? 0),
        pace: Number(r[idx("PACE")] ?? 0),
        efg: Number(r[idx("EFG_PCT")] ?? 0),
      }));
      return { ok: true, rows };
    } catch (err) {
      return { ok: false, rows: [], error: (err as Error).message };
    }
  });
