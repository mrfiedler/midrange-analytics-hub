import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const ESPN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "application/json, text/plain, */*",
} as const;

const ProxyInput = z.object({
  endpoint: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_]+$/),
  params: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

const LeaderInput = z.object({
  cat: z.enum(["PTS", "REB", "AST", "STL", "BLK", "FG3M"]),
});

const LEADER_SORT: Record<z.infer<typeof LeaderInput>["cat"], string> = {
  PTS: "offensive.avgPoints:desc",
  AST: "offensive.avgAssists:desc",
  REB: "general.avgRebounds:desc",
  STL: "defensive.avgSteals:desc",
  BLK: "defensive.avgBlocks:desc",
  FG3M: "offensive.avgThreePointFieldGoalsMade:desc",
};

function statValue(row: any, category: string, name: string) {
  const cat = row.categories?.find((c: any) => c.name === category);
  const labels = cat?.names ?? [];
  const index = labels.indexOf(name);
  return Number(index >= 0 ? cat.values?.[index] ?? 0 : 0);
}

/**
 * Proxy para stats.nba.com.
 * A NBA bloqueia IPs de datacenter — esta função PODE falhar de forma intermitente.
 * Frontend deve sempre tratar { ok: false } como cenário esperado e cair em fallback.
 */
export const nbaStatsProxy = createServerFn({ method: "POST" })
  .inputValidator((d) => ProxyInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const url = new URL(`https://stats.nba.com/stats/${data.endpoint}`);
      Object.entries(data.params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v)),
      );

      const res = await fetch(url.toString(), {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return { ok: false as const, status: res.status, error: `stats.nba.com ${res.status}` };
      }
      const json = await res.json();
      return { ok: true as const, data: json };
    } catch (err) {
      return { ok: false as const, status: 0, error: (err as Error).message };
    }
  });

export const getPublicLeagueLeaders = createServerFn({ method: "GET" })
  .inputValidator((d) => LeaderInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const url = new URL("https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete");
      url.searchParams.set("region", "us");
      url.searchParams.set("lang", "en");
      url.searchParams.set("contentorigin", "espn");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10");
      url.searchParams.set("sort", LEADER_SORT[data.cat]);
      const res = await fetch(url.toString(), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return { ok: false as const, rows: [], error: `public leaders ${res.status}` };
      const json = await res.json();
      const rows = (json.athletes ?? []).map((row: any, index: number) => ({
        rank: index + 1,
        playerId: Number(row.athlete?.id ?? 0),
        playerName: row.athlete?.displayName ?? "—",
        teamAbbr: row.athlete?.team?.abbreviation ?? "—",
        value: data.cat === "PTS" ? statValue(row, "offensive", "avgPoints")
          : data.cat === "AST" ? statValue(row, "offensive", "avgAssists")
          : data.cat === "REB" ? statValue(row, "general", "avgRebounds")
          : data.cat === "STL" ? statValue(row, "defensive", "avgSteals")
          : data.cat === "BLK" ? statValue(row, "defensive", "avgBlocks")
          : statValue(row, "offensive", "avgThreePointFieldGoalsMade"),
        gp: statValue(row, "general", "gamesPlayed"),
      })).filter((row: any) => row.playerId && row.value > 0);
      return { ok: true as const, rows };
    } catch (err) {
      return { ok: false as const, rows: [], error: (err as Error).message };
    }
  });
