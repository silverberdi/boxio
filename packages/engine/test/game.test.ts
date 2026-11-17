import { describe, expect, it } from "vitest";
import { applyMove, createBoard, createGame } from "../src/index.js";

const players = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
const board = createBoard([{ row: 0, column: 0 }]);
const moves = (state: ReturnType<typeof createGame>, ids: string[]) => ids.reduce((s, edgeId) => applyMove(s, { playerId: s.currentPlayerId, edgeId }).state, state);

describe("game contracts", () => {
  it("rejects unknown and duplicate edges without mutation", () => {
    const state = createGame(board, players);
    expect(applyMove(state, { playerId: "a", edgeId: "missing" }).accepted).toBe(false);
    const first = applyMove(state, { playerId: "a", edgeId: board.edges[0].id });
    const duplicate = applyMove(first.state, { playerId: first.state.currentPlayerId, edgeId: board.edges[0].id });
    expect(duplicate.accepted).toBe(false); expect(duplicate.state).toBe(first.state);
  });
  it("awards one square and preserves the capturing turn", () => {
    const state = moves(createGame(board, players), board.edges.slice(0, 3).map((e) => e.id));
    const result = applyMove(state, { playerId: state.currentPlayerId, edgeId: board.edges[3].id });
    expect(result.completedCells).toEqual(["0,0"]); expect(result.state.scores.a + result.state.scores.b).toBe(1); expect(result.state.currentPlayerId).toBe(state.currentPlayerId);
  });
  it("supports a shared edge closing two square cells", () => {
    const two = createBoard([{ row: 0, column: 0 }, { row: 0, column: 1 }]);
    const shared = two.cells[0].edges.find((id) => two.cells[1].edges.includes(id))!;
    const edgeSet = two.edges.map((edge) => edge.id).filter((id) => id !== shared);
    const state = createGame(two, players);
    const before = edgeSet.reduce((s, edgeId) => applyMove(s, { playerId: s.currentPlayerId, edgeId }).state, state);
    const result = applyMove(before, { playerId: before.currentPlayerId, edgeId: shared });
    expect(result.completedCells.length).toBe(2); expect(result.state.scores.a + result.state.scores.b).toBe(2);
  });
  it("reports completion and all tied winners", () => {
    const tiedBoard = createBoard([{ row: 0, column: 0 }, { row: 2, column: 0 }]);
    let state = createGame(tiedBoard, players);
    const first = tiedBoard.cells[0].edges;
    for (const edgeId of first) state = applyMove(state, { playerId: state.currentPlayerId, edgeId }).state;
    const second = tiedBoard.cells[1].edges;
    for (const edgeId of second) state = applyMove(state, { playerId: state.currentPlayerId, edgeId }).state;
    expect(state.status).toBe("complete"); expect(state.winners).toEqual(["a", "b"]); expect(Object.values(state.scores).reduce((a, b) => a + b, 0)).toBe(2);
  });
  it("rejects duplicate cells and retains square-only topology", () => {
    expect(() => createBoard([{ row: 0, column: 0 }, { row: 0, column: 0 }])).toThrow();
    expect(board.cells[0].edges).toHaveLength(4);
  });
  it("preserves equivalent move semantics across rectangular and custom silhouettes", () => {
    const rectangular = createBoard([
      { row: 0, column: 0 }, { row: 0, column: 1 },
      { row: 1, column: 0 }, { row: 1, column: 1 },
    ]);
    const silhouette = createBoard([
      { row: 0, column: 0 },
      { row: 1, column: 0 }, { row: 1, column: 1 },
    ]);

    const targetCellEdges = rectangular.cells[0].edges;
    let rectState = createGame(rectangular, players);
    let silState = createGame(silhouette, players);

    for (let i = 0; i < 3; i++) {
      const edge = targetCellEdges[i];
      const rMove = applyMove(rectState, { playerId: rectState.currentPlayerId, edgeId: edge });
      const sMove = applyMove(silState, { playerId: silState.currentPlayerId, edgeId: edge });
      expect(rMove.accepted).toBe(true);
      expect(sMove.accepted).toBe(true);
      expect(rMove.completedCells).toEqual([]);
      expect(sMove.completedCells).toEqual([]);
      expect(rMove.state.currentPlayerId).toBe(sMove.state.currentPlayerId);
      expect(rMove.state.scores).toEqual(sMove.state.scores);
      rectState = rMove.state;
      silState = sMove.state;
    }

    const closingEdge = targetCellEdges[3];
    const rFinal = applyMove(rectState, { playerId: rectState.currentPlayerId, edgeId: closingEdge });
    const sFinal = applyMove(silState, { playerId: silState.currentPlayerId, edgeId: closingEdge });

    expect(rFinal.accepted).toBe(true);
    expect(sFinal.accepted).toBe(true);
    expect(rFinal.completedCells).toEqual(["0,0"]);
    expect(sFinal.completedCells).toEqual(["0,0"]);
    expect(rFinal.state.currentPlayerId).toBe(sFinal.state.currentPlayerId);
    expect(rFinal.state.scores).toEqual(sFinal.state.scores);
    expect(rFinal.state.scores[rFinal.state.currentPlayerId]).toBe(1);
    expect(rFinal.state.status).toBe("active");
    expect(sFinal.state.status).toBe("active");
  });
});
