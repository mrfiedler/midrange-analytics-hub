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
  season: z.number().int().min(2002).max(2100).optional(),
});


const LEADER_SORT: Record<z.infer<typeof LeaderInput>["cat"], string> = {
  PTS: "offensive.avgPoints:desc",
  AST: "offensive.avgAssists:desc",
  REB: "general.avgRebounds:desc",
  STL: "defensive.avgSteals:desc",
  BLK: "defensive.avgBlocks:desc",
  FG3M: "offensive.avgThreePointFieldGoalsMade:desc",
};

function statValue(row: any, allCategories: any[], category: string, name: string) {
  const cat = row.categories?.find((c: any) => c.name === category);
  const labels = cat?.names ?? allCategories.find((c: any) => c.name === category)?.names ?? [];
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
      url.searchParams.set("limit", "60");
      url.searchParams.set("sort", LEADER_SORT[data.cat]);
      // ESPN season param uses END year: season=2025 ⇒ 2024–25
      if (data.season) url.searchParams.set("season", String(data.season + 1));
      const res = await fetch(url.toString(), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });

      if (!res.ok) return { ok: false as const, rows: [], error: `public leaders ${res.status}` };
      const json = await res.json();
      const categories = json.categories ?? [];
      const all = (json.athletes ?? []).map((row: any) => ({
        playerId: Number(row.athlete?.id ?? 0),
        playerName: row.athlete?.displayName ?? "—",
        teamAbbr: row.athlete?.team?.abbreviation ?? row.athlete?.teamShortName ?? "—",
        value: data.cat === "PTS" ? statValue(row, categories, "offensive", "avgPoints")
          : data.cat === "AST" ? statValue(row, categories, "offensive", "avgAssists")
          : data.cat === "REB" ? statValue(row, categories, "general", "avgRebounds")
          : data.cat === "STL" ? statValue(row, categories, "defensive", "avgSteals")
          : data.cat === "BLK" ? statValue(row, categories, "defensive", "avgBlocks")
          : statValue(row, categories, "offensive", "avgThreePointFieldGoalsMade"),
        gp: statValue(row, categories, "general", "gamesPlayed"),
      })).filter((r: any) => r.playerId && r.value > 0);

      // NBA "qualified leader" rule: ≥58 GP for completed seasons.
      // For in-progress seasons, require ≥40% of max GP in the pool.
      const maxGp = all.reduce((m: number, r: any) => Math.max(m, r.gp), 0);
      const threshold = maxGp >= 70 ? 58 : Math.max(1, Math.floor(maxGp * 0.4));
      let qualified = all.filter((r: any) => r.gp >= threshold);
      if (qualified.length < 10) qualified = all;
      const rows = qualified
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10)
        .map((r: any, i: number) => ({ rank: i + 1, ...r }));
      return { ok: true as const, rows };

    } catch (err) {
      return { ok: false as const, rows: [], error: (err as Error).message };
    }
  });
