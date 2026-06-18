import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/seasons")({
  head: () => ({
    meta: [
      { title: "Temporadas & Histórico — Midrange Frenzy" },
      { name: "description", content: "Linha do tempo de temporadas da NBA com campeões, MVPs e líderes estatísticos." },
    ],
  }),
  component: SeasonsPage,
});

const SEASONS = [
  { year: "2023–24", champion: "Boston Celtics",     mvp: "Nikola Jokić",            scoringLeader: "Luka Dončić (33.9)" },
  { year: "2022–23", champion: "Denver Nuggets",     mvp: "Joel Embiid",             scoringLeader: "Joel Embiid (33.1)" },
  { year: "2021–22", champion: "Golden State Warriors", mvp: "Nikola Jokić",         scoringLeader: "Joel Embiid (30.6)" },
  { year: "2020–21", champion: "Milwaukee Bucks",    mvp: "Nikola Jokić",            scoringLeader: "Stephen Curry (32.0)" },
  { year: "2019–20", champion: "Los Angeles Lakers", mvp: "Giannis Antetokounmpo",   scoringLeader: "James Harden (34.3)" },
  { year: "2018–19", champion: "Toronto Raptors",    mvp: "Giannis Antetokounmpo",   scoringLeader: "James Harden (36.1)" },
];

function SeasonsPage() {
  return (
    <div className="space-y-6 fade-up">
      <header>
        <div className="eyebrow">Histórico</div>
        <h1 className="font-display text-4xl md:text-5xl">Temporadas</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Campeões, MVPs e líderes em pontuação das últimas temporadas. Em breve: filtros e estatísticas completas.</p>
      </header>

      <div className="mrf-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Temporada</th>
              <th className="px-4 py-3">Campeão</th>
              <th className="px-4 py-3">MVP</th>
              <th className="px-4 py-3 hidden sm:table-cell">Cestinha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {SEASONS.map((s) => (
              <tr key={s.year} className="hover:bg-surface-2/60">
                <td className="px-4 py-3 font-display text-flame">{s.year}</td>
                <td className="px-4 py-3">{s.champion}</td>
                <td className="px-4 py-3">{s.mvp}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.scoringLeader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Quer explorar os melhores quintetos da história? <Link to="/lineups" className="text-flame hover:underline">Veja composições históricas →</Link>
      </div>
    </div>
  );
}
