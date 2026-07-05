/**
 * Códigos de status de jogador NBA e derivação a partir dos dados públicos
 * da ESPN. As descrições completas ficam no glossário (categoria "Status")
 * pra que MetricTooltip reaproveite o mesmo tooltip com "?" das métricas.
 */
export type PlayerStatusCode = "ACT" | "FA" | "UFA" | "RFA" | "INJ" | "SUS" | "TW" | "GL" | "INA" | "RET";

export interface PlayerStatus {
  code: PlayerStatusCode;
  label: string; // rótulo curto pra exibir no badge
}

/** Deriva o status a partir do payload cru do atleta na ESPN + hints extras. */
export function deriveStatus(input: {
  hasTeam: boolean;
  espnStatusType?: string | null;   // athlete.status.type
  espnStatusName?: string | null;   // athlete.status.name / abbreviation
  freeAgentTag?: string | null;     // "UFA" | "RFA" | ... vindo do FA tracker
}): PlayerStatus | null {
  const tag = (input.freeAgentTag ?? "").toUpperCase();
  if (tag === "UFA") return { code: "UFA", label: "UFA" };
  if (tag === "RFA") return { code: "RFA", label: "RFA" };
  if (tag === "TW" || tag === "TWO-WAY") return { code: "TW", label: "Two-way" };
  if (tag === "GL" || tag === "G-LEAGUE") return { code: "GL", label: "G League" };

  const type = (input.espnStatusType ?? "").toLowerCase();
  const name = (input.espnStatusName ?? "").toLowerCase();
  if (type.includes("injur") || name.includes("injur")) return { code: "INJ", label: "Lesionado" };
  if (type.includes("suspend") || name.includes("suspend")) return { code: "SUS", label: "Suspenso" };
  if (type.includes("retire") || name.includes("retire")) return { code: "RET", label: "Aposentado" };
  if (type.includes("inactive") || name.includes("inactive")) return { code: "INA", label: "Inativo" };

  if (!input.hasTeam) return { code: "FA", label: "Free agent" };
  return { code: "ACT", label: "Ativo" };
}
