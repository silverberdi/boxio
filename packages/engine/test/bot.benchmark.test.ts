import { describe, expect, it } from "vitest";
import { chooseBotMove, createGame, createRectangularBoard } from "../src/index.js";

describe("bot benchmark (documented D4 target)", () => {
  it("keeps one decision under 100ms for each difficulty on an 8x8 board", () => {
    const state = createGame(createRectangularBoard(8, 8), [{ id: "human", name: "Human" }, { id: "bot", name: "Bot" }]);
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const start = performance.now();
      chooseBotMove(state, difficulty, 42);
      expect(performance.now() - start, difficulty).toBeLessThan(100);
    }
  });
});
