export interface HistoricLineup {
  id: string;
  team: string;
  season: string;
  nickname: string;
  blurb: string;
  netRating: number;
  record: string;
  result: string;
  starters: { pos: string; name: string }[];
  stats: { ppg: number; rpg: number; apg: number };
  accent: "flame" | "court" | "amber";
}

export const HISTORIC_LINEUPS: HistoricLineup[] = [
  {
    id: "warriors-2016",
    team: "Golden State Warriors",
    season: "2015-16",
    nickname: "Lineup of Death (versão regular)",
    blurb: "73 vitórias na temporada regular, ritmo absurdo e arremesso de 3 que mudou a liga.",
    netRating: 11.8,
    record: "73–9",
    result: "Vice-campeão NBA",
    starters: [
      { pos: "PG", name: "Stephen Curry" },
      { pos: "SG", name: "Klay Thompson" },
      { pos: "SF", name: "Harrison Barnes" },
      { pos: "PF", name: "Draymond Green" },
      { pos: "C",  name: "Andrew Bogut" },
    ],
    stats: { ppg: 114.9, rpg: 46.9, apg: 28.9 },
    accent: "flame",
  },
  {
    id: "bulls-1996",
    team: "Chicago Bulls",
    season: "1995-96",
    nickname: "The Repeat Three-peat",
    blurb: "72 vitórias, defesa sufocante e o auge de Jordan + Pippen + Rodman.",
    netRating: 13.4,
    record: "72–10",
    result: "Campeão NBA",
    starters: [
      { pos: "PG", name: "Ron Harper" },
      { pos: "SG", name: "Michael Jordan" },
      { pos: "SF", name: "Scottie Pippen" },
      { pos: "PF", name: "Dennis Rodman" },
      { pos: "C",  name: "Luc Longley" },
    ],
    stats: { ppg: 105.2, rpg: 44.4, apg: 24.8 },
    accent: "court",
  },
  {
    id: "lakers-1987",
    team: "Los Angeles Lakers",
    season: "1986-87",
    nickname: "Showtime",
    blurb: "Magic Johnson conduzindo o transition game mais bonito da história.",
    netRating: 9.3,
    record: "65–17",
    result: "Campeão NBA",
    starters: [
      { pos: "PG", name: "Magic Johnson" },
      { pos: "SG", name: "Byron Scott" },
      { pos: "SF", name: "James Worthy" },
      { pos: "PF", name: "A.C. Green" },
      { pos: "C",  name: "Kareem Abdul-Jabbar" },
    ],
    stats: { ppg: 117.8, rpg: 43.6, apg: 28.0 },
    accent: "amber",
  },
  {
    id: "spurs-2014",
    team: "San Antonio Spurs",
    season: "2013-14",
    nickname: "The Beautiful Game",
    blurb: "Movimentação de bola perfeita. Maior ORtg de finais até então.",
    netRating: 7.8,
    record: "62–20",
    result: "Campeão NBA",
    starters: [
      { pos: "PG", name: "Tony Parker" },
      { pos: "SG", name: "Danny Green" },
      { pos: "SF", name: "Kawhi Leonard" },
      { pos: "PF", name: "Tim Duncan" },
      { pos: "C",  name: "Tiago Splitter" },
    ],
    stats: { ppg: 105.4, rpg: 43.6, apg: 25.2 },
    accent: "court",
  },
  {
    id: "celtics-2008",
    team: "Boston Celtics",
    season: "2007-08",
    nickname: "The Big Three",
    blurb: "Garnett, Pierce e Allen formaram uma das melhores defesas dos anos 2000.",
    netRating: 11.3,
    record: "66–16",
    result: "Campeão NBA",
    starters: [
      { pos: "PG", name: "Rajon Rondo" },
      { pos: "SG", name: "Ray Allen" },
      { pos: "SF", name: "Paul Pierce" },
      { pos: "PF", name: "Kevin Garnett" },
      { pos: "C",  name: "Kendrick Perkins" },
    ],
    stats: { ppg: 100.5, rpg: 41.9, apg: 22.1 },
    accent: "flame",
  },
  {
    id: "heat-2013",
    team: "Miami Heat",
    season: "2012-13",
    nickname: "Heatles",
    blurb: "27 vitórias seguidas. Small-ball com LeBron de 4 redefiniu o jogo moderno.",
    netRating: 7.9,
    record: "66–16",
    result: "Campeão NBA",
    starters: [
      { pos: "PG", name: "Mario Chalmers" },
      { pos: "SG", name: "Dwyane Wade" },
      { pos: "SF", name: "LeBron James" },
      { pos: "PF", name: "Shane Battier" },
      { pos: "C",  name: "Chris Bosh" },
    ],
    stats: { ppg: 102.9, rpg: 41.5, apg: 22.9 },
    accent: "flame",
  },
];
