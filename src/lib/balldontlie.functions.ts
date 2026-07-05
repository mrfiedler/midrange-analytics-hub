/**
 * NBA data layer.
 *
 * Fonte primária de identidade, roster e estatística: ESPN
 * (`sports.core.api.espn.com` / `site.api.espn.com` / `site.web.api.espn.com`).
 * Basketball-Reference é usada apenas para enriquecer o roster do time com
 * médias por jogo (PPG/RPG/APG).
 *
 * balldontlie NÃO é usada em nenhum fluxo (a API free não sustenta a
 * cadeia de identidade/roster e mistura de ID spaces gera bugs). A env var
 * pode continuar configurada, mas nenhum caminho do código a chama.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cached } from "@/lib/server-cache";
import { getCurrentSeason } from "@/lib/season";
import { deriveStatus, type PlayerStatus } from "@/data/player-status";



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
  const status = deriveStatus({
    hasTeam: !!team,
    espnStatusType: a.status?.type ?? null,
    espnStatusName: a.status?.name ?? a.status?.abbreviation ?? null,
    freeAgentTag: null,
  });
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
    status,
  };
}



/* ---------- Player Search (ESPN) ---------- */

const SearchInput = z.object({
  q: z.string().min(1).max(60),
});

type EspnSearchItem = {
  id: string;
  displayName?: string;
  shortName?: string;
  type?: string;
};

async function hydrateEspnPlayer(id: number) {
  try {
    const profile = await getEspnPlayerProfile(id, getCurrentSeason());
    return profile;
  } catch {
    return null;
  }
}

export const searchPlayers = createServerFn({ method: "GET" })
  .inputValidator((d) => SearchInput.parse(d))
  .handler(async ({ data }) => {
    // Fonte primária: ESPN search (`site.web.api.espn.com`). Retorna o ID
    // real da ESPN, que é o mesmo usado em `/players/:id`, no PlayerAvatar
    // e no roster do time (mesmo id space em todo o app).
    try {
      const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(data.q)}&type=player&sport=basketball&league=nba&limit=25`;
      const json = await fetchJson<{ items?: EspnSearchItem[] }>(url, 15 * 60_000);
      const items = (json.items ?? []).filter((it) => it.type === "player" && it.id);

      // Hidrata os primeiros 15 pra ter time/posição na listagem.
      const top = items.slice(0, 15);
      const hydrated = await Promise.all(top.map((it) => hydrateEspnPlayer(Number(it.id))));

      const players = top.map((it, idx) => {
        const h = hydrated[idx];
        const name = h?.fullName || it.displayName || "";
        const [firstName, ...rest] = name.split(" ");
        return {
          id: Number(it.id),
          firstName: h?.firstName ?? firstName ?? "",
          lastName: h?.lastName ?? rest.join(" "),
          fullName: name,
          position: h?.position ?? "-",
          height: h?.height ?? null,
          weight: h?.weight ?? null,
          jersey: h?.jersey ?? null,
          team: h?.team ?? null,
          status: h?.status ?? deriveStatus({ hasTeam: false }),
          active: (h?.team ? "active" : "inactive") as "active" | "inactive",
        };
      })
        .filter((p) => p.fullName)
        .sort((a, b) => (a.active === b.active ? 0 : a.active === "active" ? -1 : 1));

      return { ok: true as const, players };
    } catch (err) {
      console.error("searchPlayers", err);
      return { ok: false as const, players: [], error: (err as Error).message };
    }
  });

/* ---------- Trending players (ESPN news feed) ---------- */

type TrendingPlayer = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  team: { id: number; abbr: string; name: string } | null;
  status: PlayerStatus | null;
  reason?: string; // headline curta pra dar contexto
};

export const getTrendingPlayers = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const news = await fetchJson<any>(
        "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=50",
        30 * 60_000,
      );
      const articles: any[] = news?.articles ?? [];
      // Conta menções por atleta (id) e guarda a manchete mais recente.
      const counts = new Map<number, { count: number; headline: string }>();
      for (const art of articles) {
        const headline = art.headline ?? art.title ?? "";
        const cats: any[] = art.categories ?? [];
        for (const c of cats) {
          const ath = c.athlete ?? c.athleteId;
          const aid = Number(ath?.id ?? ath);
          if (!aid || !Number.isFinite(aid)) continue;
          const prev = counts.get(aid);
          if (prev) prev.count += 1;
          else counts.set(aid, { count: 1, headline });
        }
      }
      const ranked = [...counts.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 12);
      const hydrated = await Promise.all(ranked.map(async ([id, meta]) => {
        try {
          const p = await getEspnPlayerProfile(id, getCurrentSeason());
          return {
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            fullName: p.fullName,
            position: p.position,
            team: p.team,
            status: p.status,
            reason: meta.headline,
          } satisfies TrendingPlayer;
        } catch {
          return null;
        }
      }));
      const players = hydrated.filter(Boolean) as TrendingPlayer[];
      return { ok: true as const, players };
    } catch (err) {
      console.error("getTrendingPlayers", err);
      return { ok: false as const, players: [] as TrendingPlayer[], error: (err as Error).message };
    }
  });

/* ---------- Free Agents (ESPN FA tracker page) ---------- */

export const getFreeAgents = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const html = await cached("espn:freeagency", 6 * 60 * 60_000, async () => {
        const res = await fetch("https://www.espn.com/nba/freeagency", {
          headers: BBR_HEADERS,
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`espn freeagency ${res.status}`);
        return res.text();
      });
      // Extrai (id, tag) de blocos onde uma sigla UFA/RFA aparece perto do link.
      const linkRe = /\/nba\/player\/_\/id\/(\d+)\/[\w-]+/g;
      const ids = new Set<number>();
      const idTag = new Map<number, string>();
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const id = Number(m[1]);
        if (!id || ids.has(id)) continue;
        ids.add(id);
        // Olha uma janela ao redor do link procurando UFA/RFA/Player Option/Two-Way.
        const window = html.slice(Math.max(0, m.index - 400), m.index + 400);
        if (/\bUFA\b|Unrestricted/i.test(window)) idTag.set(id, "UFA");
        else if (/\bRFA\b|Restricted/i.test(window)) idTag.set(id, "RFA");
        else if (/Two-?Way/i.test(window)) idTag.set(id, "TW");
        else idTag.set(id, "FA");
      }
      const top = [...ids].slice(0, 24);
      const hydrated = await Promise.all(top.map(async (id) => {
        try {
          const p = await getEspnPlayerProfile(id, getCurrentSeason());
          const tag = idTag.get(id) ?? "FA";
          const status = deriveStatus({
            hasTeam: !!p.team,
            espnStatusType: null,
            espnStatusName: null,
            freeAgentTag: tag,
          });
          return {
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            fullName: p.fullName,
            position: p.position,
            team: p.team,
            status,
          };
        } catch { return null; }
      }));
      const players = (hydrated.filter(Boolean) as any[]).slice(0, 12);
      return { ok: true as const, players };
    } catch (err) {
      console.error("getFreeAgents", err);
      return { ok: false as const, players: [] as any[], error: (err as Error).message };
    }
  });

/* ---------- Player Detail + Season Averages (ESPN) ---------- */

const PlayerInput = z.object({
  id: z.number().int().positive(),
  season: z.number().int().min(1979).max(2100).optional(),
});

export const getPlayerProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => PlayerInput.parse(d))
  .handler(async ({ data }) => {
    const season = data.season ?? getCurrentSeason();
    const seasonLabel = (s: number) => `${s}-${String(s + 1).slice(2)}`;
    const buildMeta = (opts: { statSeason: number; gamesPlayed: number; source: "ESPN" | "none" }) => ({
      season: opts.statSeason,
      seasonLabel: seasonLabel(opts.statSeason),
      gamesPlayed: opts.gamesPlayed,
      sampleType:
        opts.gamesPlayed >= 10 ? ("season" as const)
        : opts.gamesPlayed > 0 ? ("partial" as const)
        : ("none" as const),
      source: opts.source,
    });

    let player: Awaited<ReturnType<typeof getEspnPlayerProfile>> | null = null;
    try {
      player = await getEspnPlayerProfile(data.id, season);
    } catch (err) {
      console.warn("getPlayerProfile espn identity failed", err);
    }

    if (!player) {
      return {
        ok: false as const,
        error: "Jogador não encontrado.",
        season,
        player: null,
        averages: null,
        meta: buildMeta({ statSeason: season, gamesPlayed: 0, source: "none" }),
      };
    }

    // Percorre a temporada solicitada + anteriores. Só aceita como "full
    // season" com >=10 jogos; caso contrário mantém como amostra parcial.
    type Averages = NonNullable<Awaited<ReturnType<typeof getEspnPlayerStats>>>;
    const seasonsToTry = [season, ...Array.from({ length: Math.min(20, season - 1979) }, (_, i) => season - i - 1)];
    let averages: Averages | null = null;
    let partial: Averages | null = null;
    let statSeason = season;
    let partialSeason = season;

    for (const candidate of seasonsToTry) {
      const row = await getEspnPlayerStats(data.id, candidate).catch(() => null);
      if (!row) continue;
      if ((row.games_played ?? 0) >= 10) {
        averages = row;
        statSeason = candidate;
        break;
      }
      if (!partial) { partial = row; partialSeason = candidate; }
    }

    if (!averages && partial) {
      averages = partial;
      statSeason = partialSeason;
    }

    return {
      ok: true as const,
      season: statSeason,
      player,
      averages,
      meta: buildMeta({
        statSeason,
        gamesPlayed: averages?.games_played ?? 0,
        source: averages ? "ESPN" : "none",
      }),
    };
  });

/* ---------- Team roster (ESPN primary, BBR enrichment) ---------- */

const RosterInput = z.object({
  teamId: z.number().int().positive(),
  season: z.number().int().min(1979).max(2100).optional(),
});

export const getTeamRoster = createServerFn({ method: "GET" })
  .inputValidator((d) => RosterInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const espn = BDL_TO_ESPN_TEAM[data.teamId];
      const season = data.season ?? getCurrentSeason();
      const current = getCurrentSeason();

      // Enriquecimento opcional: médias por jogo do BBR (PPG/RPG/APG).
      const bbrRoster = await getBasketballReferenceRoster(data.teamId, season).catch(() => null);
      const averageByName = new Map<string, any>();
      for (const p of bbrRoster ?? []) averageByName.set(normalizeName(p.fullName), p.average);

      if (espn) {
        const url = season >= current
          ? `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espn.abbr}/roster`
          : `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${espnSeason(season)}/teams/${espn.id}/athletes?limit=50`;
        const raw = await fetchJson<any>(url, 60 * 60_000);
        let athletes: any[] = [];
        if (Array.isArray(raw.athletes)) {
          athletes = raw.athletes[0]?.items ? raw.athletes.flatMap((g: any) => g.items ?? []) : raw.athletes;
        } else if (Array.isArray(raw.items)) {
          const refs = raw.items.map((x: any) => String(x.$ref ?? "")).filter(Boolean);
          athletes = (await Promise.all(refs.slice(0, 30).map((ref: string) => fetchJson<any>(ref, 60 * 60_000).catch(() => null)))).filter(Boolean);
        }
        const players = athletes
          .map((p: any) => {
            const firstName = p.firstName ?? "";
            const lastName = p.lastName ?? "";
            const fullName = p.displayName ?? p.fullName ?? `${firstName} ${lastName}`.trim();
            return {
              id: Number(p.id),
              firstName,
              lastName,
              fullName,
              position: p.position?.abbreviation ?? p.position?.displayName ?? "-",
              height: p.displayHeight ?? null,
              jersey: p.jersey ?? null,
              average: averageByName.get(normalizeName(fullName)) ?? null,
            };
          })
          .filter((p: any) => p.id && p.fullName);
        if (players.length) return { ok: true as const, players };
      }

      // Se ESPN falhar, fallback pro BBR (mantém alguma informação em tela).
      if (bbrRoster?.length) {
        return { ok: true as const, players: bbrRoster };
      }

      return { ok: true as const, players: [] };
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
      const rows = (await Promise.all(data.playerIds.map((id) => getEspnPlayerStats(id, data.season).catch(() => null))))
        .map((row, i) => (row ? { ...row, player_id: data.playerIds[i] } : null))
        .filter(Boolean) as any[];
      return { ok: true as const, averages: rows };
    } catch (err) {
      console.error("getSeasonAveragesBulk", err);
      return { ok: false as const, averages: [] as any[], error: (err as Error).message };
    }
  });


