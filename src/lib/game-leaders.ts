type BoxTeam = {
  teamId: string;
  labels: string[];
  players: { id: string; name: string; pos: string; dnp: boolean; stats: string[] }[];
};

/** ESPN's summary leaders can be season averages; only use this game's box. */
export function getBoxLeaders(state: string, box: BoxTeam[]) {
  if (state === "pre") return [];
  const categories = [
    { label: "PTS", name: "Points" },
    { label: "REB", name: "Rebounds" },
    { label: "AST", name: "Assists" },
  ];
  return box.flatMap((team) => categories.flatMap((category) => {
    const index = team.labels.indexOf(category.label);
    if (index < 0) return [];
    const candidates = team.players.filter((p) => !p.dnp && Number.isFinite(Number(p.stats[index])));
    const leader = candidates.reduce<(typeof candidates)[number] | undefined>((best, p) =>
      !best || Number(p.stats[index]) > Number(best.stats[index]) ? p : best, undefined);
    if (!leader || Number(leader.stats[index]) <= 0) return [];
    return [{ teamId: team.teamId, category: category.name, name: leader.name,
      value: leader.stats[index], athleteId: leader.id, pos: leader.pos }];
  }));
}