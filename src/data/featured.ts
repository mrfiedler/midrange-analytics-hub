/**
 * Static featured highlights for the Home dashboard. Acts as a curated
 * fallback so the dashboard always feels alive, even when the live API
 * is rate-limited or a team's daily numbers haven't been ingested yet.
 */

export const TOP_PLAYERS = [
  { name: "Nikola Jokić",        team: "DEN", pos: "C",  ppg: 29.6, rpg: 13.7, apg: 10.4, per: 32.1, ts: 0.658 },
  { name: "Luka Dončić",         team: "DAL", pos: "PG", ppg: 33.9, rpg: 9.2,  apg: 9.8,  per: 28.7, ts: 0.612 },
  { name: "Giannis Antetokounmpo", team: "MIL", pos: "PF", ppg: 30.4, rpg: 11.5, apg: 6.5, per: 30.4, ts: 0.638 },
  { name: "Shai Gilgeous-Alexander", team: "OKC", pos: "PG", ppg: 30.1, rpg: 5.5, apg: 6.2, per: 27.5, ts: 0.634 },
  { name: "Jayson Tatum",        team: "BOS", pos: "SF", ppg: 26.9, rpg: 8.1, apg: 4.9,  per: 24.0, ts: 0.591 },
];

export const TODAY_LEADERS = {
  points:    { name: "Devin Booker",       team: "PHX", value: 52, label: "pontos" },
  assists:   { name: "Tyrese Haliburton",  team: "IND", value: 16, label: "assistências" },
  rebounds:  { name: "Domantas Sabonis",   team: "SAC", value: 22, label: "rebotes" },
  blocks:    { name: "Victor Wembanyama",  team: "SAS", value: 7,  label: "tocos" },
};

export const RECENT_GAMES = [
  { home: "DEN", homeScore: 118, away: "LAL", awayScore: 110, status: "Final", note: "Jokić: 32 pts / 12 ast" },
  { home: "BOS", homeScore: 124, away: "MIA", awayScore: 102, status: "Final", note: "Tatum: 38 pts" },
  { home: "OKC", homeScore: 131, away: "PHX", awayScore: 127, status: "OT",    note: "SGA: 43 pts" },
  { home: "MIL", homeScore: 119, away: "NYK", awayScore: 121, status: "Final", note: "Brunson: 36 pts" },
];
