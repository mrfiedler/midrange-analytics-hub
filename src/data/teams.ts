export interface TeamRow {
  id: number;        // matches balldontlie team id
  abbr: string;
  name: string;
  city: string;
  conference: "East" | "West";
  division: string;
  // sample current-season profile for UI fallbacks
  record: string;
  ortg: number;
  drtg: number;
  pace: number;
  efg: number;
}

export const TEAMS: TeamRow[] = [
  { id: 1,  abbr: "ATL", name: "Hawks",          city: "Atlanta",       conference: "East", division: "Southeast", record: "36–46", ortg: 115.4, drtg: 117.8, pace: 101.2, efg: 0.541 },
  { id: 2,  abbr: "BOS", name: "Celtics",        city: "Boston",        conference: "East", division: "Atlantic",  record: "64–18", ortg: 122.2, drtg: 110.6, pace: 98.7,  efg: 0.583 },
  { id: 3,  abbr: "BKN", name: "Nets",           city: "Brooklyn",      conference: "East", division: "Atlantic",  record: "32–50", ortg: 113.8, drtg: 116.6, pace: 99.4,  efg: 0.535 },
  { id: 4,  abbr: "CHA", name: "Hornets",        city: "Charlotte",     conference: "East", division: "Southeast", record: "21–61", ortg: 109.2, drtg: 117.4, pace: 99.0,  efg: 0.519 },
  { id: 5,  abbr: "CHI", name: "Bulls",          city: "Chicago",       conference: "East", division: "Central",   record: "39–43", ortg: 113.0, drtg: 114.2, pace: 99.6,  efg: 0.543 },
  { id: 6,  abbr: "CLE", name: "Cavaliers",      city: "Cleveland",     conference: "East", division: "Central",   record: "48–34", ortg: 117.2, drtg: 113.9, pace: 96.8,  efg: 0.552 },
  { id: 7,  abbr: "DAL", name: "Mavericks",      city: "Dallas",        conference: "West", division: "Southwest", record: "50–32", ortg: 118.4, drtg: 115.1, pace: 99.3,  efg: 0.555 },
  { id: 8,  abbr: "DEN", name: "Nuggets",        city: "Denver",        conference: "West", division: "Northwest", record: "57–25", ortg: 118.9, drtg: 114.8, pace: 98.5,  efg: 0.564 },
  { id: 9,  abbr: "DET", name: "Pistons",        city: "Detroit",       conference: "East", division: "Central",   record: "14–68", ortg: 110.7, drtg: 118.3, pace: 100.4, efg: 0.519 },
  { id: 10, abbr: "GSW", name: "Warriors",       city: "Golden State",  conference: "West", division: "Pacific",   record: "46–36", ortg: 116.9, drtg: 115.2, pace: 102.1, efg: 0.558 },
  { id: 11, abbr: "HOU", name: "Rockets",        city: "Houston",       conference: "West", division: "Southwest", record: "41–41", ortg: 113.6, drtg: 113.0, pace: 99.7,  efg: 0.532 },
  { id: 12, abbr: "IND", name: "Pacers",         city: "Indiana",       conference: "East", division: "Central",   record: "47–35", ortg: 121.0, drtg: 117.5, pace: 103.4, efg: 0.567 },
  { id: 13, abbr: "LAC", name: "Clippers",       city: "LA",            conference: "West", division: "Pacific",   record: "51–31", ortg: 117.2, drtg: 113.6, pace: 97.9,  efg: 0.561 },
  { id: 14, abbr: "LAL", name: "Lakers",         city: "Los Angeles",   conference: "West", division: "Pacific",   record: "47–35", ortg: 116.5, drtg: 115.0, pace: 100.6, efg: 0.555 },
  { id: 15, abbr: "MEM", name: "Grizzlies",      city: "Memphis",       conference: "West", division: "Southwest", record: "27–55", ortg: 110.4, drtg: 116.0, pace: 101.0, efg: 0.523 },
  { id: 16, abbr: "MIA", name: "Heat",           city: "Miami",         conference: "East", division: "Southeast", record: "46–36", ortg: 113.5, drtg: 113.1, pace: 96.4,  efg: 0.547 },
  { id: 17, abbr: "MIL", name: "Bucks",          city: "Milwaukee",     conference: "East", division: "Central",   record: "49–33", ortg: 118.8, drtg: 116.4, pace: 100.2, efg: 0.563 },
  { id: 18, abbr: "MIN", name: "Timberwolves",   city: "Minnesota",     conference: "West", division: "Northwest", record: "56–26", ortg: 115.7, drtg: 110.6, pace: 98.2,  efg: 0.549 },
  { id: 19, abbr: "NOP", name: "Pelicans",       city: "New Orleans",   conference: "West", division: "Southwest", record: "49–33", ortg: 117.5, drtg: 114.5, pace: 99.7,  efg: 0.555 },
  { id: 20, abbr: "NYK", name: "Knicks",         city: "New York",      conference: "East", division: "Atlantic",  record: "50–32", ortg: 117.4, drtg: 113.4, pace: 97.6,  efg: 0.546 },
  { id: 21, abbr: "OKC", name: "Thunder",        city: "Oklahoma City", conference: "West", division: "Northwest", record: "57–25", ortg: 119.4, drtg: 112.0, pace: 99.8,  efg: 0.563 },
  { id: 22, abbr: "ORL", name: "Magic",          city: "Orlando",       conference: "East", division: "Southeast", record: "47–35", ortg: 113.3, drtg: 111.4, pace: 98.3,  efg: 0.536 },
  { id: 23, abbr: "PHI", name: "76ers",          city: "Philadelphia",  conference: "East", division: "Atlantic",  record: "47–35", ortg: 117.0, drtg: 115.4, pace: 97.7,  efg: 0.555 },
  { id: 24, abbr: "PHX", name: "Suns",           city: "Phoenix",       conference: "West", division: "Pacific",   record: "49–33", ortg: 117.6, drtg: 115.0, pace: 98.8,  efg: 0.560 },
  { id: 25, abbr: "POR", name: "Trail Blazers",  city: "Portland",      conference: "West", division: "Northwest", record: "21–61", ortg: 108.9, drtg: 117.6, pace: 99.5,  efg: 0.516 },
  { id: 26, abbr: "SAC", name: "Kings",          city: "Sacramento",    conference: "West", division: "Pacific",   record: "46–36", ortg: 116.7, drtg: 115.4, pace: 100.4, efg: 0.557 },
  { id: 27, abbr: "SAS", name: "Spurs",          city: "San Antonio",   conference: "West", division: "Southwest", record: "22–60", ortg: 111.5, drtg: 118.1, pace: 102.9, efg: 0.531 },
  { id: 28, abbr: "TOR", name: "Raptors",        city: "Toronto",       conference: "East", division: "Atlantic",  record: "25–57", ortg: 112.4, drtg: 117.0, pace: 100.0, efg: 0.532 },
  { id: 29, abbr: "UTA", name: "Jazz",           city: "Utah",          conference: "West", division: "Northwest", record: "31–51", ortg: 113.6, drtg: 117.8, pace: 99.5,  efg: 0.543 },
  { id: 30, abbr: "WAS", name: "Wizards",        city: "Washington",    conference: "East", division: "Southeast", record: "15–67", ortg: 113.1, drtg: 120.7, pace: 99.7,  efg: 0.539 },
];
