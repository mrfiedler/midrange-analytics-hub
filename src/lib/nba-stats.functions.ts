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

const ChampionMetricsInput = z.object({
  season: z.number().int().min(1979).max(2100),
  teamAbbr: z.string().min(2).max(4),
  teamName: z.string().min(2).max(80),
});

export interface ChampionMetricsResult {
  ok: boolean;
  record?: string;
  ppg?: number;
  ortg?: number;
  drtg?: number;
  netRtg?: number;
  leadingScorer?: { name: string; ppg: number };
  source?: string;
  error?: string;
}


const LEADER_SORT: Record<z.infer<typeof LeaderInput>["cat"], string> = {
  PTS: "offensive.avgPoints:desc",
  AST: "offensive.avgAssists:desc",
  REB: "general.avgRebounds:desc",
  STL: "defensive.avgSteals:desc",
  BLK: "defensive.avgBlocks:desc",
  FG3M: "offensive.avgThreePointFieldGoalsMade:desc",
};

const ESPN_TEAM_ABBR: Record<string, string> = {
  NYK: "NY",
  GSW: "GS",
  SAS: "SA",
  NOP: "NO",
  UTA: "UTAH",
};

const BBR_TEAM_ABBR: Record<string, string> = {
  ATL: "ATL", BOS: "BOS", BKN: "BRK", CHA: "CHO", CHI: "CHI", CLE: "CLE",
  DAL: "DAL", DEN: "DEN", DET: "DET", GSW: "GSW", HOU: "HOU", IND: "IND",
  LAC: "LAC", LAL: "LAL", MEM: "MEM", MIA: "MIA", MIL: "MIL", MIN: "MIN",
  NOP: "NOP", NYK: "NYK", OKC: "OKC", ORL: "ORL", PHI: "PHI", PHX: "PHO",
  POR: "POR", SAC: "SAC", SAS: "SAS", TOR: "TOR", UTA: "UTA", WAS: "WAS",
};

function seasonParam(season: number) {
  return season + 1;
}

function seasonStr(season: number) {
  return `${season}-${String(season + 1).slice(2)}`;
}

function round1(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(value * 10) / 10;
}

function statFromEspnEntry(entry: any, name: string) {
  const value = entry?.stats?.find((s: any) => s.name === name)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sameTeam(team: any, teamAbbr: string, teamName: string) {
  const wanted = teamAbbr.toUpperCase();
  const espn = ESPN_TEAM_ABBR[wanted] ?? wanted;
  const abbr = String(team?.abbreviation ?? "").toUpperCase();
  const displayName = String(team?.displayName ?? team?.name ?? "").toLowerCase();
  return abbr === wanted || abbr === espn || displayName === teamName.toLowerCase();
}

function statValueByName(row: any, allCategories: any[], category: string, name: string, splitId = "0") {
  const rowCategories = row?.categories ?? [];
  const index = rowCategories.findIndex((c: any) => c.name === category && String(c.splitId ?? "0") === splitId);
  if (index < 0) return 0;
  const labels = allCategories[index]?.names ?? [];
  const statIndex = labels.indexOf(name);
  return Number(statIndex >= 0 ? rowCategories[index].values?.[statIndex] ?? 0 : 0);
}

function numberFromText(text: string, label: string) {
  const match = text.match(new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*([+-]?\\d+(?:\\.\\d+)?)`, "i"));
  return match ? Number(match[1]) : undefined;
}

async function getEspnTeamRegularSeason(data: z.infer<typeof ChampionMetricsInput>) {
  const url = new URL("https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings");
  url.searchParams.set("season", String(seasonParam(data.season)));
  url.searchParams.set("seasontype", "2");

  const json = await cached(`espn:standings:${data.season}`, 30 * 60_000, async () => {
    const res = await fetch(url.toString(), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`espn standings ${res.status}`);
    return res.json();
  });

  const entries = (json.children ?? []).flatMap((child: any) => child?.standings?.entries ?? []);
  const entry = entries.find((item: any) => sameTeam(item.team, data.teamAbbr, data.teamName));
  if (!entry) return {};

  const wins = statFromEspnEntry(entry, "wins");
  const losses = statFromEspnEntry(entry, "losses");
  return {
    record: typeof wins === "number" && typeof losses === "number" ? `${wins}-${losses}` : undefined,
    ppg: round1(statFromEspnEntry(entry, "avgPointsFor")),
  };
}

async function getEspnTeamLeadingScorer(data: z.infer<typeof ChampionMetricsInput>) {
  const url = new URL("https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete");
  url.searchParams.set("region", "us");
  url.searchParams.set("lang", "en");
  url.searchParams.set("contentorigin", "espn");
  url.searchParams.set("season", String(seasonParam(data.season)));
  url.searchParams.set("seasontype", "2");
  url.searchParams.set("limit", "500");
  url.searchParams.set("sort", "offensive.avgPoints:desc");

  const json = await cached(`espn:team-scorer:${data.season}:${data.teamAbbr}`, 30 * 60_000, async () => {
    const res = await fetch(url.toString(), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`espn scorers ${res.status}`);
    return res.json();
  });

  const categories = json.categories ?? [];
  const row = (json.athletes ?? []).find((item: any) => {
    const team = item?.athlete?.teams?.[0] ?? { abbreviation: item?.athlete?.teamShortName };
    return sameTeam(team, data.teamAbbr, data.teamName);
  });
  if (!row) return undefined;
  const ppg = round1(statValueByName(row, categories, "offensive", "avgPoints"));
  const name = String(row.athlete?.displayName ?? "");
  return name && typeof ppg === "number" ? { name, ppg } : undefined;
}

async function getNbaAdvancedTeamMetrics(data: z.infer<typeof ChampionMetricsInput>) {
  const url = new URL("https://stats.nba.com/stats/leaguedashteamstats");
  const params = {
    Conference: "", DateFrom: "", DateTo: "", Division: "", GameScope: "", GameSegment: "",
    LastNGames: "0", LeagueID: "00", Location: "", MeasureType: "Advanced", Month: "0",
    OpponentTeamID: "0", Outcome: "", PORound: "0", PaceAdjust: "N", PerMode: "PerGame",
    Period: "0", PlusMinus: "N", Rank: "N", Season: seasonStr(data.season), SeasonSegment: "",
    SeasonType: "Regular Season", ShotClockRange: "", TeamID: "0", TwoWay: "0", VsConference: "", VsDivision: "",
  };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const json = await cached(`nba:champion-advanced:${data.season}`, 30 * 60_000, async () => {
    const res = await fetch(url.toString(), { headers: NBA_HEADERS, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`stats.nba.com ${res.status}`);
    return (await res.json()) as { resultSets: Array<{ headers: string[]; rowSet: any[][] }> };
  });

  const rs = json.resultSets?.[0];
  if (!rs) return {};
  const idx = (name: string) => rs.headers.indexOf(name);
  const teamAbbrIndex = idx("TEAM_ABBREVIATION");
  const teamNameIndex = idx("TEAM_NAME");
  const row = rs.rowSet.find((r) => sameTeam({ abbreviation: r[teamAbbrIndex], displayName: r[teamNameIndex] }, data.teamAbbr, data.teamName));
  if (!row) return {};
  return {
    ortg: round1(Number(row[idx("OFF_RATING")])),
    drtg: round1(Number(row[idx("DEF_RATING")])),
    netRtg: round1(Number(row[idx("NET_RATING")])),
    source: "stats.nba.com",
  };
}

async function getBasketballReferenceTeamMetrics(data: z.infer<typeof ChampionMetricsInput>) {
  const team = BBR_TEAM_ABBR[data.teamAbbr.toUpperCase()];
  if (!team) return {};
  const url = `https://www.basketball-reference.com/teams/${team}/${seasonParam(data.season)}.html`;
  const html = await cached(`bbr:team:${data.season}:${team}`, 12 * 60 * 60_000, async () => {
    const res = await fetch(url, { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`basketball-reference ${res.status}`);
    return res.text();
  });
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const record = text.match(/Record:\s*(\d+-\d+)/i)?.[1];
  return {
    record,
    ppg: round1(numberFromText(text, "PTS/G")),
    ortg: round1(numberFromText(text, "Off Rtg")),
    drtg: round1(numberFromText(text, "Def Rtg")),
    netRtg: round1(numberFromText(text, "Net Rtg")),
    source: "Basketball Reference",
  };
}

function statValue(row: any, allCategories: any[], category: string, name: string) {
  const cat = row.categories?.find((c: any) => c.name === category);
  const labels = cat?.names ?? allCategories.find((c: any) => c.name === category)?.names ?? [];
  const index = labels.indexOf(name);
  return Number(index >= 0 ? cat.values?.[index] ?? 0 : 0);
}

/**
 * Proxy para stats.nba.com.
 * A NBA bloqueia IPs de datacenter - esta função PODE falhar de forma intermitente.
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
      url.searchParams.set("seasontype", "2");
      // ESPN season param uses END year: season=2025 ⇒ 2024–25
      if (data.season) url.searchParams.set("season", String(data.season + 1));
      const json = await cached(`espn:leaders:${data.season ?? "current"}:${data.cat}`, 15 * 60_000, async () => {
        const res = await fetch(url.toString(), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(10_000) });
        if (!res.ok) throw new Error(`public leaders ${res.status}`);
        return res.json();
      });
      const categories = json.categories ?? [];
      const all = (json.athletes ?? []).map((row: any) => ({
        playerId: Number(row.athlete?.id ?? 0),
        playerName: row.athlete?.displayName ?? "-",
        teamAbbr: row.athlete?.teams?.[0]?.abbreviation ?? row.athlete?.teamShortName ?? "-",
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
