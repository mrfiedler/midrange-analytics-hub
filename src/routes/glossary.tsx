import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES, METRICS } from "@/data/glossary";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Glossário de métricas - Midrange Frenzy" },
      { name: "description", content: "Todas as siglas e métricas do basquete explicadas em linguagem simples e técnica, com fórmula e escala de referência." },
    ],
  }),
  component: GlossaryPage,
});

const LEVELS = [
  { key: "ruim",  label: "Ruim",  color: "oklch(0.4 0.12 25)" },
  { key: "medio", label: "Médio", color: "oklch(0.45 0.08 60)" },
  { key: "bom",   label: "Bom",   color: "oklch(0.5 0.13 145)" },
  { key: "elite", label: "Elite", color: "oklch(0.55 0.2 305)" },
] as const;

function GlossaryPage() {
  const [cat, setCat] = useState<string>("Todas");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const Q = q.trim().toLowerCase();
    return METRICS.filter((m) =>
      (cat === "Todas" || m.category === cat) &&
      (Q.length === 0 || m.abbr.toLowerCase().includes(Q) || m.name.toLowerCase().includes(Q) || m.newbie.toLowerCase().includes(Q))
    );
  }, [cat, q]);

  return (
    <div className="space-y-6 fade-up">
      <header className="max-w-3xl">
        <div className="eyebrow">Aprenda</div>
        <h1 className="font-display text-4xl md:text-5xl">Glossário de métricas</h1>
        <p className="text-muted-foreground mt-2">
          Toda a sopa de letrinhas do basquete explicada em duas camadas: <span className="text-flame">newbie</span> pra quem está começando, <span className="text-accent">técnica</span> pra quem quer fundo.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="mrf-card flex items-center gap-2 px-3 py-2 flex-1">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar (ex.: TS%, eficiência…)" className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Todas", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-widest border transition-colors ${cat === c ? "bg-flame border-flame text-white" : "border-hairline text-muted-foreground hover:text-foreground hover:border-flame/50"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {filtered.map((m) => (
          <li key={m.abbr} className="mrf-card mrf-card-hover p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-3xl text-flame leading-none">{m.abbr}</div>
                <div className="text-sm text-foreground mt-1">{m.name}</div>
              </div>
              <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground border border-hairline rounded px-2 py-1">{m.category}</span>
            </div>

            <p className="mt-3 text-sm text-foreground/90">{m.newbie}</p>

            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs font-display uppercase tracking-widest text-accent hover:underline list-none">
                Definição técnica ▾
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{m.technical}</p>
              {m.formula && <div className="mt-2 rounded-md bg-background/60 border border-hairline p-2 font-mono text-xs">{m.formula}</div>}
              {m.example && <p className="mt-2 text-xs text-muted-foreground italic">"{m.example}"</p>}
            </details>

            {m.scale && (
              <div className="mt-4 grid grid-cols-4 gap-1 text-center text-[10px] font-display uppercase tracking-widest">
                {LEVELS.map((l) => (
                  <div key={l.key} className="rounded p-1.5 text-white/90" style={{ background: l.color }}>
                    <div>{l.label}</div>
                    <div className="opacity-80 normal-case tracking-normal mt-0.5">{(m.scale as any)[l.key]}</div>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mrf-card p-10 text-center text-muted-foreground">Nenhuma métrica encontrada.</div>
      )}
    </div>
  );
}
