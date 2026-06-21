import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cached } from "@/lib/server-cache";

const BASE = "https://api.balldontlie.io/v1";

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
      }>(`/players`, { search: data.q, per_page: 25 });
      return {
        ok: true as const,
        players: res.data.map((p) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          fullName: `${p.first_name} ${p.last_name}`.trim(),
          position: p.position || "—",
          height: p.height || null,
          weight: p.weight || null,
          jersey: p.jersey_number || null,
          team: p.team ? { id: p.team.id, abbr: p.team.abbreviation, name: p.team.full_name } : null,
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

      const season = data.season ?? 2024;
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
          position: p.position || "—",
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
      };
    } catch (err) {
      console.error("getPlayerProfile", err);
      return { ok: false as const, error: (err as Error).message, season: data.season ?? 2024, player: null, averages: null };
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
          position: p.position || "—",
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


