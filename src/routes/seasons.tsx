import { createFileRoute, Link } from "@tanstack/react-router";
import { CHAMPIONS } from "@/data/champions";
import { LeagueLeadersLive } from "@/components/LeagueLeadersLive";

export const Route = createFileRoute("/seasons")({
  head: () => ({
    meta: [
      { title: "Temporadas & Histórico — Midrange Frenzy" },
      { name: "description", content: "Linha do tempo de temporadas da NBA com campeões e líderes estatísticos atualizados." },
    ],
  }),
  component: SeasonsPage,
});

function SeasonsPage() {
  return (
    <div className="space-y-8 fade-up">
      <header>
        <div className="eyebrow">Histórico</div>
        <h1 className="font-display text-4xl md:text-5xl">Temporadas</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Campeões por temporada e líderes estatísticos da temporada atual, atualizados automaticamente.
        </p>
      </header>

      <LeagueLeadersLive />

      {/* Campeões por temporada */}
      <section>
        <div className="mb-3">
          <div className="eyebrow text-amber">Galeria</div>
          <h2 className="font-display text-2xl">Campeões por temporada</h2>
        </div>
        <div className="mrf-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Temporada</th>
                <th className="px-4 py-3">Campeão</th>
                <th className="px-4 py-3 hidden md:table-cell">Finals MVP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[...CHAMPIONS].sort((a, b) => b.season - a.season).map((c) => (
                <tr key={c.season} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-display text-flame">{c.season}–{(c.season + 1).toString().slice(2)}</td>
                  <td className="px-4 py-3">{c.team}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.finalsMVP ?? "—"}</td>
                </tr>
              ))}
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
