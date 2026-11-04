import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { getBoxLeaders } from "./game-leaders";

const box = [{ teamId: "8", labels: ["PTS", "REB", "AST"], players: [
  { id: "4432166", name: "Cade Cunningham", pos: "PG", dnp: false, stats: ["12", "3", "5"] },
  { id: "2", name: "Other player", pos: "C", dnp: false, stats: ["6", "8", "1"] },
  { id: "3", name: "Did not play", pos: "C", dnp: true, stats: ["99", "99", "99"] },
] }];

describe("game-only leaders", () => {
  test("scheduled games have no leaders even if the feed contains stats", () => {
    deepStrictEqual(getBoxLeaders("pre", box), []);
  });
  test("live leaders use actual box points, rebounds and assists", () => {
    deepStrictEqual(getBoxLeaders("in", box).map((l) => [l.category, l.athleteId, l.value]), [
      ["Points", "4432166", "12"], ["Rebounds", "2", "8"], ["Assists", "4432166", "5"],
    ]);
  });
  test("completed games retain their final box leaders", () => {
    strictEqual(getBoxLeaders("post", box)[0]?.value, "12");
  });
  test("no box score means no season-average fallback", () => {
    deepStrictEqual(getBoxLeaders("in", []), []);
  });
});