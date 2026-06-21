import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function SourceBadge({
  source,
  notice,
}: {
  source: "nba.com" | "espn-public" | "balldontlie-derived" | null;
  notice?: string;
}) {
  if (source === "nba.com") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <CheckCircle2 className="size-3 text-emerald-400/80" />
        via stats.nba.com
      </span>
    );
  }
  if (source === "espn-public") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <CheckCircle2 className="size-3 text-emerald-400/80" />
        via API pública ESPN
      </span>
    );
  }
  if (source === "balldontlie-derived") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-amber">
        <AlertTriangle className="size-3" />
        estimado · cobertura parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground/80">
      <AlertTriangle className="size-3 text-amber/80" />
      {notice ?? "Fonte avançada indisponível no momento"}
    </span>
  );
}

export function UnavailableCard({ notice }: { notice?: string }) {
  return (
    <div className="mrf-card text-center py-6 px-4">
      <AlertTriangle className="size-5 text-amber mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">
        {notice ??
          "Esse dado depende de uma fonte externa que está indisponível agora. Tente novamente em alguns minutos."}
      </p>
    </div>
  );
}
