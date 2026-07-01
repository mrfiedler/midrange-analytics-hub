import { createServerFn } from "@tanstack/react-start";

export interface CdnGame {
  gameId: string;
  gameStatus: number; // 1=scheduled, 2=in progress, 3=final
  gameStatusText: string;
  gameTimeUTC: string;
  period: number;
  gameClock: string;
  homeTeam: {
    teamId: number;
    teamCity: string;
    teamName: string;
    teamTricode: string;
    score: number;
    wins: number;
    losses: number;
  };
  awayTeam: {
    teamId: number;
    teamCity: string;
    teamName: string;
    teamTricode: string;
    score: number;
    wins: number;
    losses: number;
  };
}

export interface ScoreboardResult {
  ok: boolean;
  gameDate?: string;
  games: CdnGame[];
  error?: string;
}

/**
 * Server-side proxy for cdn.nba.com - avoids CORS in the browser.
 */
export const getLiveScoreboard = createServerFn({ method: "GET" })
  .handler(async (): Promise<ScoreboardResult> => {
    try {
      const res = await fetch(
        "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) throw new Error(`cdn.nba.com ${res.status}`);
      const json = await res.json();
      return {
        ok: true,
        gameDate: json?.scoreboard?.gameDate,
        games: (json?.scoreboard?.games ?? []) as CdnGame[],
      };
    } catch (err) {
      return { ok: false, games: [], error: (err as Error).message };
    }
  });

/**
 * Server-side proxy for Wikipedia NBA Finals page.
 */
export const fetchWikipediaChampion = createServerFn({ method: "GET" })
  .handler(async (): Promise<string | null> => {
    try {
      const res = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/NBA_Finals", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { extract?: string };
      const text = json.extract ?? "";
      const m =
        text.match(/won by the ([A-Z][A-Za-z. ]+?)(?:[,.]| in| defeating)/) ||
        text.match(/([A-Z][A-Za-z. ]+?) defeated/);
      return m?.[1]?.trim() ?? null;
    } catch {
      return null;
    }
  });
