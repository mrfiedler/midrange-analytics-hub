import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getBoxLeaders } from "./game-leaders";

const UA = { Accept: "application/json" };

export interface GameTeam {
  id: string;
  abbr: string;
  name: string;
  logo: string;
  score: number;
  record?: string;
  winner?: boolean;
  linescores: number[];
}
export interface GameCard {
  id: string;
  date: string;
  state: "pre" | "in" | "post";
  statusText: string;
  home: GameTeam;
  away: GameTeam;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function team(c: any): GameTeam {
  return {
    id: String(c?.team?.id ?? c?.id ?? ""),
    abbr: c?.team?.abbreviation ?? "",
    name: c?.team?.displayName ?? "",
    logo: c?.team?.logo ?? c?.team?.logos?.[0]?.href ?? "",
    score: Number(c?.score ?? 0) || 0,
    record: c?.records?.[0]?.summary ?? c?.record?.[0]?.summary,
    winner: !!c?.winner,
    linescores: (c?.linescores ?? []).map((l: any) => Number(l?.value ?? l?.displayValue ?? 0) || 0),
  };
}

export const getScoreboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{8}$/) }).parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean; games: GameCard[] }> => {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${data.date}`,
        { headers: UA, signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) throw new Error(String(res.status));
      const json: any = await res.json();
      const games: GameCard[] = (json.events ?? []).map((e: any) => {
        const comp = e.competitions?.[0];
        const cs = comp?.competitors ?? [];
        return {
          id: String(e.id),
          date: e.date,
          state: e.status?.type?.state ?? "pre",
          statusText: e.status?.type?.shortDetail ?? "",
          home: team(cs.find((c: any) => c.homeAway === "home")),
          away: team(cs.find((c: any) => c.homeAway === "away")),
        };
      });
      return { ok: true, games };
    } catch (err) {
      console.error("scoreboard", err);
      return { ok: false, games: [] };
    }
  });

export interface BoxPlayer {
  id: string;
  name: string;
  pos: string;
  starter: boolean;
  dnp: boolean;
  stats: string[];
}
export interface GamePlay {
  id: string;
  period: number;
  clock: string;
  text: string;
  home: number;
  away: number;
  teamId?: string;
  scoring: boolean;
  shot?: { x: number; y: number; made: boolean };
}
export interface GameSummary {
  ok: boolean;
  game?: GameCard & { venue?: string };
  teamStats: { label: string; home: string; away: string }[];
  box: { teamId: string; labels: string[]; players: BoxPlayer[] }[];
  plays: GamePlay[];
  leaders: { teamId: string; category: string; name: string; value: string; athleteId: string; pos: string }[];
}

export const getGameSummary = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ data }): Promise<GameSummary> => {
    const empty: GameSummary = { ok: false, teamStats: [], box: [], plays: [], leaders: [] };
    try {
      const res = await fetch(
        `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${data.id}`,
        { headers: UA, signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) throw new Error(String(res.status));
      const j: any = await res.json();
      const comp = j.header?.competitions?.[0];
      const cs = comp?.competitors ?? [];
      const home = team(cs.find((c: any) => c.homeAway === "home"));
      const away = team(cs.find((c: any) => c.homeAway === "away"));
      const game = {
        id: data.id,
        date: comp?.date,
        state: comp?.status?.type?.state ?? "pre",
        statusText: comp?.status?.type?.shortDetail ?? "",
        home,
        away,
        venue: j.gameInfo?.venue?.fullName,
      };
      const bt = j.boxscore?.teams ?? [];
      const ht = bt.find((t: any) => String(t.team?.id) === home.id);
      const at = bt.find((t: any) => String(t.team?.id) === away.id);
      const teamStats = (game.state === "pre" ? [] : ht?.statistics ?? []).map((s: any) => ({
        label: s.label ?? s.abbreviation ?? s.name,
        home: s.displayValue,
        away: at?.statistics?.find((x: any) => x.name === s.name)?.displayValue ?? "-",
      }));
      const box = (j.boxscore?.players ?? []).map((p: any) => {
        const st = p.statistics?.[0] ?? {};
        return {
          teamId: String(p.team?.id),
          labels: st.labels ?? [],
          players: (st.athletes ?? []).map((a: any) => ({
            id: String(a.athlete?.id),
            name: a.athlete?.displayName ?? "",
            pos: a.athlete?.position?.abbreviation ?? "",
            starter: !!a.starter,
            dnp: !!a.didNotPlay || !(a.stats ?? []).length,
            stats: a.stats ?? [],
          })),
        };
      });
      const plays: GamePlay[] = (j.plays ?? []).map((p: any) => {
        const x = p.coordinate?.x, y = p.coordinate?.y;
        const valid = p.shootingPlay && x >= 0 && x <= 50 && y >= 0 && y <= 94;
        return {
          id: String(p.id),
          period: p.period?.number ?? 0,
          clock: p.clock?.displayValue ?? "",
          text: p.text ?? "",
          home: p.homeScore ?? 0,
          away: p.awayScore ?? 0,
          teamId: p.team?.id ? String(p.team.id) : undefined,
          scoring: !!p.scoringPlay,
          shot: valid ? { x, y, made: !!p.scoringPlay } : undefined,
        };
      });
      const leaders = getBoxLeaders(game.state, box);
      return { ok: true, game, teamStats, box, plays, leaders };
    } catch (err) {
      console.error("summary", err);
      return empty;
    }
  });
