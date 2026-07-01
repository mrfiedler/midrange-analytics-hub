import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchPlayers } from "@/lib/balldontlie.functions";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

export const Route = createFileRoute("/players/")({
  head: () => ({
    meta: [
      { title: "Jogadores - Midrange Frenzy" },
      { name: "description", content: "Busque qualquer jogador da NBA e veja suas estatísticas básicas e avançadas." },
    ],
  }),
  component: PlayersSearch,
});

function PlayersSearch() {
  const [q, setQ] = useState("");
  const search = useServerFn(searchPlayers);

  const mutation = useMutation({
    mutationFn: (query: string) => search({ data: { q: query } }),
  });

  useEffect(() => {
    const q2 = q.trim();
    if (q2.length < 2) return;
    const t = setTimeout(() => mutation.mutate(q2), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const results = mutation.data?.players ?? [];
  const apiOk = mutation.data?.ok ?? true;
  const isLoading = mutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-up">
      <div>
        <div className="eyebrow">Buscar</div>
        <h1 className="font-display text-4xl md:text-5xl">Jogadores</h1>
        <p className="text-muted-foreground mt-2">Procure por nome (ex.: <em>jokic</em>, <em>luka</em>, <em>tatum</em>). Clique para ver o perfil completo.</p>
      </div>

      <div className="mrf-card flex items-center gap-3 px-4 py-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jogador da NBA…"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {isLoading && <Loader2 className="size-4 animate-spin text-flame" />}
      </div>

      {!apiOk && mutation.data && (
        <div className="mrf-card p-4 text-sm text-amber">
          Não foi possível buscar agora. {mutation.data.error}
        </div>
      )}

      {q.trim().length >= 2 && isLoading && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="mrf-card p-3 flex items-center gap-3 animate-pulse">
              <div className="size-10 rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-surface-2" />
                <div className="h-2 w-20 rounded bg-surface-2" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {q.trim().length >= 2 && results.length === 0 && !isLoading && (
        <div className="mrf-card p-6 text-center text-muted-foreground">
          Nenhum jogador encontrado para "<span className="text-foreground">{q}</span>".
        </div>
      )}

      {!isLoading && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                to="/players/$id"
                params={{ id: String(p.id) }}
                className="mrf-card mrf-card-hover flex items-center gap-3 p-3"
              >
                <PlayerAvatar id={p.id} firstName={p.firstName} lastName={p.lastName} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.position && p.position !== "-" ? p.position : "-"}
                    {p.team && ` · ${p.team.abbr} ${p.team.name}`}
                  </div>
                </div>
                {p.jersey && <span className="font-display text-amber text-lg">#{p.jersey}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {q.trim().length < 2 && (
        <div className="mrf-card p-6">
          <div className="eyebrow mb-3">Sugestões</div>
          <div className="flex flex-wrap gap-2">
            {["Jokic", "Luka", "Tatum", "Giannis", "SGA", "Wembanyama", "Booker", "Haliburton"].map((name) => (
              <button
                key={name}
                onClick={() => setQ(name)}
                className="rounded-full border border-hairline px-3 py-1 text-xs hover:border-flame/60 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
