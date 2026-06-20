import { useServerFn } from "@tanstack/react-start";
import { getLiveScoreboard } from "@/lib/cdn-nba";
import { nbaStatsProxy } from "@/lib/nba-stats.functions";
import {
  searchPlayers,
  getPlayerProfile,
  getTeamRoster,
  getSeasonAveragesBulk,
} from "@/lib/balldontlie.functions";
import type { CdnGame } from "@/lib/cdn-nba";
import type { LeaderRow, StandingsRow } from "@/lib/dataSource";

/* ---------- CDN NBA (live scoreboard) ---------- */

export function useLiveScoreboard() {
  const fn = useServerFn(getLiveScoreboard);
  return () => fn({});
}

/* ---------- balldontlie ---------- */

export function useSearchPlayers() {
  return useServerFn(searchPlayers);
}

export function usePlayerProfile() {
  return useServerFn(getPlayerProfile);
}

export function useTeamRoster() {
  return useServerFn(getTeamRoster);
}

export function useSeasonAveragesBulk() {
  return useServerFn(getSeasonAveragesBulk);
}

/* ---------- NBA Stats (proxy) ---------- */

export function useNbaStatsProxy() {
  return useServerFn(nbaStatsProxy);
}

/* ---------- Re-export types ---------- */

export type { CdnGame, LeaderRow, StandingsRow };
