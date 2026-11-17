import { describe, expect, it } from "vitest";
import { applyMove, chooseBotMove, createGame, createRectangularBoard, isAutomaticParticipant, prepareCellMask, type BotDifficulty, type GameState } from "../src/index.js";

const players = [{ id: "human", name: "Human" }, { id: "bot", name: "Bot", kind: "automatic" as const, difficulty: "medium" as const, seed: 7 }];
const legal = (state: GameState, edge: string) => state.board.edges.some((candidate) => candidate.id === edge) && !state.occupiedEdges.includes(edge);

describe("automatic opponents", () => {
  it("serializes automatic participant configuration and exposes one pure decision boundary", () => {
    const state = createGame(prepareCellMask([{ row: 2, column: 4 }, { row: 2, column: 5 }]), players);
    expect(isAutomaticParticipant(state.players[1])).toBe(true);
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const first = chooseBotMove(restored, difficulty, 1234);
      expect(chooseBotMove(restored, difficulty, 1234)).toBe(first);
      expect(legal(restored, first)).toBe(true);
    }
  });

  it("keeps the same seeded decision independent of browser or external services", () => {
    const state = createGame(createRectangularBoard(2, 2), players);
    const decisions = (["easy", "medium", "hard"] as BotDifficulty[]).map((difficulty) => chooseBotMove(state, difficulty, 99));
    expect(decisions.every((edge) => legal(state, edge))).toBe(true);
    expect(JSON.parse(JSON.stringify(decisions))).toEqual(decisions);
  });

  it("prioritizes an immediate capture for medium and keeps every policy legal", () => {
    let state = createGame(prepareCellMask([{ row: 0, column: 0 }]), players);
    for (const edgeId of state.board.cells[0].edges.slice(0, 3)) state = applyMove(state, { playerId: state.currentPlayerId, edgeId }).state;
    const capture = state.board.cells[0].edges[3];
    expect(chooseBotMove(state, "medium", 4)).toBe(capture);
    for (const difficulty of ["easy", "medium", "hard"] as const) expect(legal(state, chooseBotMove(state, difficulty, 4))).toBe(true);
  });

  it("uses canonical tie-breaking for hard chain decisions", () => {
    const state = createGame(createRectangularBoard(2, 2), players);
    const decision = chooseBotMove(state, "hard", 1);
    expect(decision).toBe([...state.board.edges].map((edge) => edge.id).sort()[0]);
  });
});
