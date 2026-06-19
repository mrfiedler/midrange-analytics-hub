/**
 * cdn.nba.com — fonte pública, sem bloqueio CORS, sem proxy necessário.
 * Use para jogos ao vivo, scoreboard e box scores em tempo real.
 */

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

export async function getTodaysScoreboard(): Promise<{
  ok: boolean;
  gameDate?: string;
  games: CdnGame[];
  error?: string;
}> {
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
}
