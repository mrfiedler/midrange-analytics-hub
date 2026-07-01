import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CHAMPIONS_HISTORY } from "@/data/champions";
import { LeagueLeadersLive } from "@/components/LeagueLeadersLive";
import { getCurrentSeason } from "@/lib/season";

export const Route = createFileRoute("/seasons")({
  head: () => ({
    meta: [
      { title: "Temporadas & Histórico - Midrange Frenzy" },
      { name: "description", content: "Linha do tempo de temporadas da NBA com campeões e líderes estatísticos atualizados." },
    ],
  }),
  component: SeasonsPage,
});

function SeasonsPage() {
  const currentSeason = getCurrentSeason();
  const years = useMemo(() => CHAMPIONS_HISTORY.map((c) => c.season), []);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const latestChampionSeason = Math.min(currentSeason, maxYear);
  const [from, setFrom] = useState<number>(latestChampionSeason);
  const [to, setTo] = useState<number>(latestChampionSeason);

  const filtered = useMemo(
    () =>
      [...CHAMPIONS_HISTORY]
        .filter((c) => c.season >= Math.min(from, to) && c.season <= Math.max(from, to))
        .sort((a, b) => b.season - a.season),
    [from, to],
  );

  return (
    <div className="space-y-8 fade-up">
      <header>
        <div className="eyebrow">Histórico</div>
        <h1 className="font-display text-4xl md:text-5xl">Temporadas</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Campeões por temporada e líderes estatísticos, atualizados automaticamente das APIs públicas.
        </p>
      </header>

      <LeagueLeadersLive />

      <section>
        <div className="mb-3 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="eyebrow text-amber">Galeria</div>
            <h2 className="font-display text-2xl">Campeões por temporada</h2>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="eyebrow">De</span>
              <select
                value={from}
                onChange={(e) => setFrom(Number(e.target.value))}
                className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}–{(y + 1).toString().slice(2)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Até</span>
              <select
                value={to}
                onChange={(e) => setTo(Number(e.target.value))}
                className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}–{(y + 1).toString().slice(2)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                setFrom(minYear);
                setTo(maxYear);
              }}
              className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Tudo
            </button>
          </div>
        </div>

        <div className="mrf-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Temporada</th>
                <th className="px-4 py-3">Campeão</th>
                <th className="px-4 py-3">Finals MVP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((c) => (
                <tr key={c.season} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-display text-flame">
                    {c.season}–{(c.season + 1).toString().slice(2)}
                  </td>
                  <td className="px-4 py-3">{c.team}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.finalsMVP}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhuma temporada nesse intervalo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-sm text-muted-foreground">
        Quer explorar os melhores quintetos da história?{" "}
        <Link to="/lineups" className="text-flame hover:underline">Veja composições históricas →</Link>
      </div>
    </div>
  );
}
