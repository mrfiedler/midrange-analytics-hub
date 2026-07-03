/**
 * Multi-source NBA data layer.
 *
 * Fonte primária de estatísticas/médias: ESPN + Basketball-Reference (scraping).
 * balldontlie é usada apenas como fallback final.
 *
 * IMPORTANTE (limitação real do plano FREE da balldontlie):
 *   - Free: apenas /teams, /players, /games (5 req/min).
 *   - ALL-STAR ($9.99/mês): + /stats.
 *   - GOAT ($39.99/mês): + /season_averages, standings, box scores completos.
 * Ou seja, no free tier a balldontlie NÃO fornece médias de temporada nem
 * box scores. Só faz sentido promovê-la a fonte primária de stats no dia em
 * que o plano for pago; até lá ESPN + BBR são obrigatórios.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cached } from "@/lib/server-cache";
import { getCurrentSeason } from "@/lib/season";

const BASE = "https://api.balldontlie.io/v1";

const ESPN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "application/json, text/plain, */*",
} as const;

const BBR_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.basketball-reference.com/",
  "Upgrade-Insecure-Requests": "1",
} as const;

const BDL_TO_ESPN_TEAM: Record<number, { id: number; abbr: string }> = {
  1: { id: 1, abbr: "atl" }, 2: { id: 2, abbr: "bos" }, 3: { id: 17, abbr: "bkn" }, 4: { id: 30, abbr: "cha" },
  5: { id: 4, abbr: "chi" }, 6: { id: 5, abbr: "cle" }, 7: { id: 6, abbr: "dal" }, 8: { id: 7, abbr: "den" },
  9: { id: 8, abbr: "det" }, 10: { id: 9, abbr: "gs" }, 11: { id: 10, abbr: "hou" }, 12: { id: 11, abbr: "ind" },
  13: { id: 12, abbr: "lac" }, 14: { id: 13, abbr: "lal" }, 15: { id: 29, abbr: "mem" }, 16: { id: 14, abbr: "mia" },
  17: { id: 15, abbr: "mil" }, 18: { id: 16, abbr: "min" }, 19: { id: 3, abbr: "no" }, 20: { id: 18, abbr: "ny" },
  21: { id: 25, abbr: "okc" }, 22: { id: 19, abbr: "orl" }, 23: { id: 20, abbr: "phi" }, 24: { id: 21, abbr: "phx" },
  25: { id: 22, abbr: "por" }, 26: { id: 23, abbr: "sac" }, 27: { id: 24, abbr: "sa" }, 28: { id: 28, abbr: "tor" },
  29: { id: 26, abbr: "utah" }, 30: { id: 27, abbr: "wsh" },
};
const ESPN_TO_BDL_TEAM = Object.fromEntries(Object.entries(BDL_TO_ESPN_TEAM).map(([bdl, espn]) => [String(espn.id), Number(bdl)]));

const BDL_TO_BBR_TEAM: Record<number, string> = {
  1: "ATL", 2: "BOS", 3: "BRK", 4: "CHO", 5: "CHI", 6: "CLE", 7: "DAL", 8: "DEN", 9: "DET", 10: "GSW",
  11: "HOU", 12: "IND", 13: "LAC", 14: "LAL", 15: "MEM", 16: "MIA", 17: "MIL", 18: "MIN", 19: "NOP", 20: "NYK",
  21: "OKC", 22: "ORL", 23: "PHI", 24: "PHO", 25: "POR", 26: "SAC", 27: "SAS", 28: "TOR", 29: "UTA", 30: "WAS",
};

async function fetchJson<T>(url: string, ttlMs = 30 * 60_000): Promise<T> {
  return cached(`public:${url}`, ttlMs, async () => {
    const res = await fetch(url.replace(/^http:\/\//, "https://"), { headers: ESPN_HEADERS, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`public API ${res.status}`);
    return (await res.json()) as T;
  });
}

function espnSeason(startYear: number) {
  return startYear + 1;
}

function collectStats(json: any) {
  const out: Record<string, number> = {};
  for (const cat of json?.splits?.categories ?? []) {
    for (const stat of cat.stats ?? []) out[stat.name] = Number(stat.value ?? 0);
  }
  return out;
}

function toAverageRow(json: any) {
  const s = collectStats(json);
  const gp = s.gamesPlayed || 0;
  const pct = (v: number) => (v > 1 ? v / 100 : v || 0);
  return {
    games_played: gp,
    min: (s.avgMinutes || 0).toFixed(1),
    pts: s.avgPoints || (gp ? (s.points || 0) / gp : 0),
    reb: s.avgRebounds || (gp ? (s.rebounds || 0) / gp : 0),
    ast: s.avgAssists || (gp ? (s.assists || 0) / gp : 0),
    stl: s.avgSteals || (gp ? (s.steals || 0) / gp : 0),
    blk: s.avgBlocks || (gp ? (s.blocks || 0) / gp : 0),
    turnover: s.avgTurnovers || (gp ? (s.turnovers || 0) / gp : 0),
    pf: s.avgFouls || 0,
    fgm: s.avgFieldGoalsMade || (gp ? (s.fieldGoalsMade || 0) / gp : 0),
    fga: s.avgFieldGoalsAttempted || (gp ? (s.fieldGoalsAttempted || 0) / gp : 0),
    fg_pct: pct(s.fieldGoalPct),
    fg3m: s.avgThreePointFieldGoalsMade || (gp ? (s.threePointFieldGoalsMade || 0) / gp : 0),
    fg3a: s.avgThreePointFieldGoalsAttempted || (gp ? (s.threePointFieldGoalsAttempted || 0) / gp : 0),
    fg3_pct: pct(s.threePointFieldGoalPct || s.threePointPct),
    ftm: s.avgFreeThrowsMade || (gp ? (s.freeThrowsMade || 0) / gp : 0),
    fta: s.avgFreeThrowsAttempted || (gp ? (s.freeThrowsAttempted || 0) / gp : 0),
    ft_pct: pct(s.freeThrowPct),
    oreb: s.avgOffensiveRebounds || (gp ? (s.offensiveRebounds || 0) / gp : 0),
    dreb: s.avgDefensiveRebounds || (gp ? (s.defensiveRebounds || 0) / gp : 0),
    season: json?.season?.year ? Number(json.season.year) - 1 : undefined,
  };
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&eacute;/g, "é")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&iacute;/g, "í")
    .replace(/&aacute;/g, "á");
}

function cell(row: string, stat: string) {
  const match = row.match(new RegExp(`data-stat="${stat}"[^>]*>([\\s\\S]*?)<\\/(?:td|th)>`));
  return match ? decodeHtml(match[1].replace(/<[^>]*>/g, "").trim()) : "";
}

function num(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getBasketballReferenceRoster(teamId: number, season: number) {
  const abbr = BDL_TO_BBR_TEAM[teamId];
  if (!abbr) return null;
  const endYear = season + 1;
  const html = await cached(`bbr:team:${abbr}:${endYear}`, 6 * 60 * 60_000, async () => {
    const res = await fetch(`https://www.basketball-reference.com/teams/${abbr}/${endYear}.html`, {
      headers: BBR_HEADERS,
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`basketball-reference ${res.status}`);
    return res.text();
  });
  const cleaned = html.replace(/<!--/g, "").replace(/-->/g, "");
  const table = cleaned.match(/<table[^>]*id="per_game_stats"[\s\S]*?<\/table>/)?.[0];
  if (!table) return null;
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => m[1])
    .filter((row) => row.includes('data-stat="name_display"'));
  const players = rows.map((row, i) => {
    const name = cell(row, "name_display");
    const id = Number(`9${teamId}${endYear}${String(i + 1).padStart(2, "0")}`);
    return {
      id,
      firstName: name.split(" ")[0] ?? "",
      lastName: name.split(" ").slice(1).join(" "),
      fullName: name,
      position: cell(row, "pos") || "-",
      height: null as string | null,
      jersey: null as string | null,
      average: {
        player_id: id,
        games_played: num(cell(row, "games")),
        min: cell(row, "mp_per_g") || "0.0",
        pts: num(cell(row, "pts_per_g")),
        reb: num(cell(row, "trb_per_g")),
        ast: num(cell(row, "ast_per_g")),
        stl: num(cell(row, "stl_per_g")),
        blk: num(cell(row, "blk_per_g")),
        turnover: num(cell(row, "tov_per_g")),
        pf: num(cell(row, "pf_per_g")),
        fgm: num(cell(row, "fg_per_g")),
        fga: num(cell(row, "fga_per_g")),
        fg_pct: num(cell(row, "fg_pct")),
        fg3m: num(cell(row, "fg3_per_g")),
        fg3a: num(cell(row, "fg3a_per_g")),
        fg3_pct: num(cell(row, "fg3_pct")),
        ftm: num(cell(row, "ft_per_g")),
        fta: num(cell(row, "fta_per_g")),
        ft_pct: num(cell(row, "ft_pct")),
        oreb: num(cell(row, "orb_per_g")),
        dreb: num(cell(row, "drb_per_g")),
        season,
      },
    };
  }).filter((p) => p.fullName && p.fullName !== "Player");
  return players.length ? players : null;
}

/**
 * Reusable per-player season stats via Basketball-Reference team page.
 * Cached by team+season via getBasketballReferenceRoster; matching one
 * player = at most one HTTP roundtrip per (team, season) tuple.
 */
async function getPlayerSeasonStats(
  firstName: string,
  lastName: string,
  teamId: number,
  season: number,
) {
  const roster = await getBasketballReferenceRoster(teamId, season).catch(() => null);
  if (!roster?.length) return null;
  const target = normalizeName(`${firstName} ${lastName}`);
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const exact = roster.find((p) => normalizeName(p.fullName) === target);
  if (exact) return exact.average;
  const fuzzy = roster.find((p) => {
    const n = normalizeName(p.fullName);
    return n.endsWith(` ${last}`) && (first ? n.startsWith(first[0]) : true);
  });
  return fuzzy?.average ?? null;
}

async function getEspnPlayerStats(id: number, season: number) {
  const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${espnSeason(season)}/types/2/athletes/${id}/statistics/0?lang=en&region=us`;
  const json = await fetchJson<any>(url, 60 * 60_000);
  const avg = toAverageRow(json);
  return avg.games_played > 0 ? avg : null;
}

async function getEspnPlayerProfile(id: number, season: number) {
  const json = await fetchJson<any>(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}`, 60 * 60_000);
  const a = json.athlete?.id ? json.athlete : await fetchJson<any>(`https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes/${id}`, 60 * 60_000);
  const team = a.team;
  const teamId = team?.id ? ESPN_TO_BDL_TEAM[String(team.id)] : undefined;
  return {
    id: Number(a.id),
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    fullName: a.displayName ?? a.fullName ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim(),
    position: a.position?.abbreviation ?? a.position?.displayName ?? "-",
    height: a.displayHeight ?? null,
    weight: a.displayWeight ? String(a.displayWeight).replace(/\s*lbs?$/i, "") : a.weight ? String(a.weight) : null,
    jersey: a.jersey ?? null,
    college: a.college?.name ?? null,
    country: a.birthPlace?.country ?? null,
    draftYear: a.draft?.year ?? a.debutYear ?? null,
    draftRound: a.draft?.round ?? null,
    draftNumber: a.draft?.selection ?? null,
    team: team ? { id: teamId ?? Number(team.id), abbr: team.abbreviation ?? "-", name: team.displayName ?? team.name ?? "-" } : null,
  };
}

async function bdl<T>(path: string, params: Record<string, string | number | undefined> = {}, ttlMs = 5 * 60_000): Promise<T> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY não configurada no servidor.");
  }
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });

  return cached(`bdl:${url.toString()}`, ttlMs, async () => {
    const res = await fetch(url.toString(), { headers: { Authorization: apiKey } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`balldontlie ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  });
}


/* ---------- Player Search ---------- */

const SearchInput = z.object({
  q: z.string().min(1).max(60),
});

export const searchPlayers = createServerFn({ method: "GET" })
  .inputValidator((d) => SearchInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const all = await fetchJson<{ items: any[] }>("https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=1000", 6 * 60 * 60_000);
      const terms = data.q.toLowerCase().split(/\s+/).filter(Boolean);
      const players = all.items
        .filter((p) => terms.every((term) => String(p.displayName ?? p.fullName ?? "").toLowerCase().includes(term)))
        .slice(0, 30)
        .map((p) => ({
          id: Number(p.id),
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          fullName: p.displayName ?? p.fullName ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
          position: p.position?.abbreviation ?? p.position?.displayName ?? "-",
          height: p.displayHeight ?? null,
          weight: p.displayWeight ? String(p.displayWeight).replace(/\s*lbs?$/i, "") : p.weight ? String(p.weight) : null,
          jersey: p.jersey ?? null,
          team: p.team ? { id: ESPN_TO_BDL_TEAM[String(p.team.id)] ?? Number(p.team.id), abbr: p.team.abbreviation, name: p.team.displayName } : null,
          // "active" quando tem time atual atribuído na ESPN (rostered). Caso
          // contrário tratamos como "inactive" (aposentado, agente livre, staff
          // sem carreira de jogador etc). Mantemos ambos na lista - a UI
          // diferencia visualmente via badge.
          status: p.team ? ("active" as const) : ("inactive" as const),
        }))
        // Ordena ativos primeiro, mantendo aposentados/históricos visíveis.
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1))
        .slice(0, 25);
      if (players.length > 0) return { ok: true as const, players };

      const res = await bdl<{ data: Array<{ id: number; first_name: string; last_name: string; position: string | null; height: string | null; weight: string | null; jersey_number: string | null; team: { id: number; abbreviation: string; full_name: string } | null; }>; }>(`/players`, { search: data.q, per_page: 25 });
      return {
        ok: true as const,
        players: res.data.map((p) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          fullName: `${p.first_name} ${p.last_name}`.trim(),
          position: p.position || "-",
          height: p.height || null,
          weight: p.weight || null,
          jersey: p.jersey_number || null,
          team: p.team ? { id: p.team.id, abbr: p.team.abbreviation, name: p.team.full_name } : null,
          status: (p.team ? "active" : "inactive") as "active" | "inactive",
        })),
      };
    } catch (err) {
      console.error("searchPlayers", err);
      return { ok: false as const, players: [], error: (err as Error).message };
    }
  });

/* ---------- Player Detail + Season Averages ---------- */

const PlayerInput = z.object({
  id: z.number().int().positive(),
  season: z.number().int().min(1979).max(2100).optional(),
});

export const getPlayerProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => PlayerInput.parse(d))
  .handler(async ({ data }) => {
    const season = data.season ?? getCurrentSeason();
    const seasonLabel = (s: number) => `${s}-${String(s + 1).slice(2)}`;
    const buildMeta = (opts: {
      statSeason: number;
      gamesPlayed: number;
      source: "ESPN" | "Basketball-Reference" | "balldontlie" | "none";
    }) => ({
      season: opts.statSeason,
      seasonLabel: seasonLabel(opts.statSeason),
      gamesPlayed: opts.gamesPlayed,
      // "season"  = amostra completa/representativa (>= 10 jogos)
      // "partial" = temporada em andamento com poucos jogos - avisar na UI
      // "none"    = sem dados
      sampleType:
        opts.gamesPlayed >= 10 ? "season" as const
        : opts.gamesPlayed > 0 ? "partial" as const
        : "none" as const,
      source: opts.source,
    });

    try {
      const player = await getEspnPlayerProfile(data.id, season);
      const seasonsToTry = [season, ...Array.from({ length: Math.min(20, season - 1979) }, (_, i) => season - i - 1)];
      type Averages = NonNullable<Awaited<ReturnType<typeof getEspnPlayerStats>>>;
      let averages: Averages | null = null;
      let partial: Averages | null = null;
      let statSeason = season;
      let partialSeason = season;
      for (const candidate of seasonsToTry) {
        const row = await getEspnPlayerStats(data.id, candidate).catch(() => null);
        if (!row) continue;
        // Só aceita como "temporada válida" com >= 10 jogos. Se vier menos,
        // guarda como fallback partial mas continua tentando temporada anterior
        // com amostra maior.
        if ((row.games_played ?? 0) >= 10) {
          averages = row;
          statSeason = candidate;
          break;
        }
        if (!partial) {
          partial = row;
          partialSeason = candidate;
        }
      }
      if (!averages && partial) {
        averages = partial;
        statSeason = partialSeason;
      }
      const meta = buildMeta({
        statSeason,
        gamesPlayed: averages?.games_played ?? 0,
        source: averages ? "ESPN" : "none",
      });
      return { ok: true as const, season: statSeason, player, averages, meta };
    } catch (espnErr) {
      console.warn("getPlayerProfile ESPN fallback", espnErr);
    }

    try {
      const player = await bdl<{
        data: {
          id: number;
          first_name: string;
          last_name: string;
          position: string | null;
          height: string | null;
          weight: string | null;
          jersey_number: string | null;
          college: string | null;
          country: string | null;
          draft_year: number | null;
          draft_round: number | null;
          draft_number: number | null;
          team: { id: number; abbreviation: string; full_name: string } | null;
        };
      }>(`/players/${data.id}`);

      let averages: any = null;
      try {
        const avg = await bdl<{
          data: Array<{
            games_played: number; min: string;
            pts: number; reb: number; ast: number; stl: number; blk: number;
            turnover: number; pf: number;
            fgm: number; fga: number; fg_pct: number;
            fg3m: number; fg3a: number; fg3_pct: number;
            ftm: number; fta: number; ft_pct: number;
            oreb: number; dreb: number;
            season: number;
          }>;
        }>(`/season_averages`, { "season": season, "player_ids[]": data.id });
        averages = avg.data[0] ?? null;
      } catch {
        averages = null;
      }

      const p = player.data;
      return {
        ok: true as const,
        season,
        player: {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          fullName: `${p.first_name} ${p.last_name}`.trim(),
          position: p.position || "-",
          height: p.height || null,
          weight: p.weight || null,
          jersey: p.jersey_number || null,
          college: p.college,
          country: p.country,
          draftYear: p.draft_year,
          draftRound: p.draft_round,
          draftNumber: p.draft_number,
          team: p.team ? { id: p.team.id, abbr: p.team.abbreviation, name: p.team.full_name } : null,
        },
        averages,
        meta: buildMeta({
          statSeason: season,
          gamesPlayed: averages?.games_played ?? 0,
          source: averages ? "balldontlie" : "none",
        }),
      };
    } catch (err) {
      console.error("getPlayerProfile", err);
      return {
        ok: false as const,
        error: (err as Error).message,
        season: data.season ?? getCurrentSeason(),
        player: null,
        averages: null,
        meta: buildMeta({ statSeason: data.season ?? getCurrentSeason(), gamesPlayed: 0, source: "none" }),
      };
    }
  });

/* ---------- Team roster ---------- */

const RosterInput = z.object({
  teamId: z.number().int().positive(),
  season: z.number().int().min(1979).max(2100).optional(),
});

export const getTeamRoster = createServerFn({ method: "GET" })
  .inputValidator((d) => RosterInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const espn = BDL_TO_ESPN_TEAM[data.teamId];
      const season = data.season ?? 2025;
      const bbrRoster = season < getCurrentSeason() ? await getBasketballReferenceRoster(data.teamId, season).catch(() => null) : null;
      if (bbrRoster?.length) {
        return { ok: true as const, players: bbrRoster };
      }
      if (espn) {
        const url = season >= 2025
          ? `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espn.abbr}/roster`
          : `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${espnSeason(season)}/teams/${espn.id}/athletes?limit=50`;
        const raw = await fetchJson<any>(url, 60 * 60_000);
        const refs = raw.items?.map((x: any) => String(x.$ref ?? "")) ?? [];
        const athletes = raw.athletes ?? (await Promise.all(refs.slice(0, 30).map((ref: string) => fetchJson<any>(ref, 60 * 60_000).catch(() => null)))).filter(Boolean);
        return {
          ok: true as const,
          players: athletes.map((p: any) => ({
            id: Number(p.id),
            firstName: p.firstName ?? "",
            lastName: p.lastName ?? "",
            fullName: p.displayName ?? p.fullName ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
            position: p.position?.abbreviation ?? p.position?.displayName ?? "-",
            height: p.displayHeight ?? null,
            jersey: p.jersey ?? null,
          })).filter((p: any) => p.id && p.fullName),
        };
      }

      const params: Record<string, string | number> = { "team_ids[]": data.teamId, per_page: 30 };
      if (data.season) params.seasons = data.season;
      const res = await bdl<{
        data: Array<{
          id: number;
          first_name: string;
          last_name: string;
          position: string | null;
          height: string | null;
          weight: string | null;
          jersey_number: string | null;
          team: { id: number; abbreviation: string; full_name: string } | null;
        }>;
      }>(`/players`, params);
      return {
        ok: true as const,
        players: res.data.map((p) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          fullName: `${p.first_name} ${p.last_name}`.trim(),
          position: p.position || "-",
          height: p.height,
          jersey: p.jersey_number,
        })),
      };
    } catch (err) {
      console.error("getTeamRoster", err);
      return { ok: false as const, players: [], error: (err as Error).message };
    }
  });

/* ---------- Bulk season averages ---------- */

const BulkAvgInput = z.object({
  season: z.number().int().min(1979).max(2100),
  playerIds: z.array(z.number().int().positive()).min(1).max(25),
});

export const getSeasonAveragesBulk = createServerFn({ method: "GET" })
  .inputValidator((d) => BulkAvgInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const embeddedRows = data.playerIds
        .filter((id) => String(id).startsWith("9"))
        .map((id) => {
          const raw = String(id);
          const teamId = Number(raw.slice(1, raw.length - 6));
          const endYear = Number(raw.slice(-6, -2));
          return { id, teamId, season: endYear - 1 };
        });
      if (embeddedRows.length > 0) {
        const groups = await Promise.all(
          [...new Map(embeddedRows.map((r) => [`${r.teamId}:${r.season}`, r])).values()]
            .map((r) => getBasketballReferenceRoster(r.teamId, r.season).catch(() => null)),
        );
        const averages = groups.flatMap((players) => players?.map((p) => p.average) ?? [])
          .filter((avg) => data.playerIds.includes(avg.player_id));
        if (averages.length > 0) return { ok: true as const, averages };
      }

      const rows = (await Promise.all(data.playerIds.map((id) => getEspnPlayerStats(id, data.season).catch(() => null))))
        .map((row, i) => row ? { ...row, player_id: data.playerIds[i] } : null)
        .filter(Boolean);
      if (rows.length > 0) return { ok: true as const, averages: rows };

      const url = new URL(`${BASE}/season_averages`);
      url.searchParams.set("season", String(data.season));
      [...data.playerIds].sort((a, b) => a - b).forEach((id) =>
        url.searchParams.append("player_ids[]", String(id)),
      );
      const apiKey = process.env.BALLDONTLIE_API_KEY;
      if (!apiKey) throw new Error("BALLDONTLIE_API_KEY missing");

      const json = await cached(`bdl:${url.toString()}`, 10 * 60_000, async () => {
        const res = await fetch(url.toString(), { headers: { Authorization: apiKey } });
        if (!res.ok) throw new Error(`balldontlie ${res.status}`);
        return (await res.json()) as { data: any[] };
      });
      return { ok: true as const, averages: json.data };
    } catch (err) {
      console.error("getSeasonAveragesBulk", err);
      return { ok: false as const, averages: [] as any[], error: (err as Error).message };
    }
  });


