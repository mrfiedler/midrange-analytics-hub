import { describe, expect, test } from "bun:test";
import { getBoxLeaders } from "./game-leaders";

const box = [{ teamId: "8", labels: ["PTS", "REB", "AST"], players: [
  { id: "4432166", name: "Cade Cunningham", pos: "PG", dnp: false, stats: ["12", "3", "5"] },
  { id: "2", name: "Other player", pos: "C", dnp: false, stats: ["6", "8", "1"] },
  { id: "3", name: "Did not play", pos: "C", dnp: true, stats: ["99", "99", "99"] },
] }];

describe("game-only leaders", () => {
  test("scheduled games have no leaders even if the feed contains stats", () => {
    expect(getBoxLeaders("pre", box)).toEqual([]);
  });
  test("live leaders use actual box points, rebounds and assists", () => {
    expect(getBoxLeaders("in", box).map((l) => [l.category, l.athleteId, l.value])).toEqual([
      ["Points", "4432166", "12"], ["Rebounds", "2", "8"], ["Assists", "4432166", "5"],
    ]);
  });
  test("completed games retain their final box leaders", () => {
    expect(getBoxLeaders("post", box)[0]?.value).toBe("12");
  });
  test("no box score means no season-average fallback", () => {
    expect(getBoxLeaders("in", [])).toEqual([]);
  });
});