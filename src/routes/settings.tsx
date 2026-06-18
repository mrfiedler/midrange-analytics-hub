import { createFileRoute } from "@tanstack/react-router";
import { useMode } from "@/lib/mode-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Midrange Frenzy" },
      { name: "description", content: "Personalize o modo de exibição (Newbie / Pro) e preferências da plataforma." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, setMode } = useMode();
  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-up">
      <header>
        <div className="eyebrow">Preferências</div>
        <h1 className="font-display text-4xl md:text-5xl">Configurações</h1>
      </header>

      <section className="mrf-card p-5">
        <div className="eyebrow">Exibição</div>
        <h2 className="font-display text-xl mt-1">Nível de detalhe</h2>
        <p className="text-sm text-muted-foreground mt-1">Newbie mostra explicações simples. Pro libera métricas avançadas e fórmulas.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["newbie", "pro"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md border p-4 text-left transition-colors ${mode === m ? "border-flame bg-flame/10" : "border-hairline hover:border-flame/40"}`}
            >
              <div className="font-display text-lg capitalize">{m === "newbie" ? "Newbie" : "Pro"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {m === "newbie"
                  ? "Métricas básicas, explicações curtas e tooltips amigáveis."
                  : "Métricas avançadas (PER, TS%, BPM, VORP) e fórmulas completas."}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mrf-card p-5">
        <div className="eyebrow">Sobre</div>
        <h2 className="font-display text-xl mt-1">Midrange Frenzy</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plataforma open-source de análise NBA em português. Dados via balldontlie.io.
        </p>
      </section>
    </div>
  );
}
