import { describe, expect, it } from "vitest";
import { applyMove, createGame, createRectangularBoard, prepareCellMask } from "../src/index.js";

const players = [{ id: "red", name: "Red" }, { id: "blue", name: "Blue" }];

function play(state: ReturnType<typeof createGame>, edgeIds: readonly string[]) {
  return edgeIds.reduce((current, edgeId) => applyMove(current, { playerId: current.currentPlayerId, edgeId }).state, state);
}

describe("engine public boundary", () => {
  it("runs a complete serialized 2x2 game without browser or service dependencies", () => {
    const board = createRectangularBoard(2, 2);
    let state = createGame(board, players);
    for (const edge of board.edges) {
      const result = applyMove(state, { playerId: state.currentPlayerId, edgeId: edge.id });
      expect(result.accepted).toBe(true);
      state = result.state;
    }

    expect(state.status).toBe("complete");
    expect(Object.values(state.scores).reduce((sum, score) => sum + score, 0)).toBe(4);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("produces equivalent semantics for a rectangle and a valid square mask", () => {
    const rectangle = createRectangularBoard(2, 2);
    const mask = prepareCellMask([
      { row: 4, column: 7 }, { row: 4, column: 8 },
      { row: 5, column: 7 }, { row: 5, column: 8 },
    ]);
    const rectangleState = play(createGame(rectangle, players), rectangle.edges.map((edge) => edge.id));
    const maskState = play(createGame(mask, players), mask.edges.map((edge) => edge.id));
    expect(rectangleState.scores).toEqual(maskState.scores);
    expect(rectangleState.winners).toEqual(maskState.winners);
    expect(rectangleState.status).toBe(maskState.status);
  });
});
