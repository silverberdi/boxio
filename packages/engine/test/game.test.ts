import { describe, expect, it } from "vitest";
import { applyMove, createBoard, createGame, createRectangularBoard, prepareCellMask, validateDimensions } from "../src/index.js";

const players = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
const board = createBoard([{ row: 0, column: 0 }]);
const moves = (state: ReturnType<typeof createGame>, ids: string[]) => ids.reduce((s, edgeId) => applyMove(s, { playerId: s.currentPlayerId, edgeId }).state, state);

describe("game contracts", () => {
  it("validates rectangular boundaries and rejects invalid dimensions", () => {
    expect(validateDimensions(2, 2)).toEqual({ rows: 2, columns: 2 });
    expect(createRectangularBoard(2, 2).cells).toHaveLength(4);
    expect(createRectangularBoard(8, 8).cells).toHaveLength(64);
    for (const value of [1, 9, 2.5, Infinity, NaN, "2", null]) {
      expect(() => createRectangularBoard(value, 2)).toThrow();
      expect(() => createRectangularBoard(2, value)).toThrow();
    }
  });

  it("builds deterministic rectangular topology with deduplicated edges", () => {
    const board = createRectangularBoard(2, 3);
    expect(board.cells).toHaveLength(6);
    expect(board.edges).toHaveLength(17);
    expect(new Set(board.edges.map((edge) => edge.id)).size).toBe(17);
    expect(board.cells.every((cell) => cell.edges.length === 4)).toBe(true);
    expect(createRectangularBoard(2, 3)).toEqual(createRectangularBoard(2, 3));
  });

  it("prepares square masks, including holes, with the same topology algorithm", () => {
    const mask = prepareCellMask([{ row: 0, column: 0 }, { row: 0, column: 2 }, { row: 1, column: 0 }, { row: 1, column: 2 }]);
    expect(mask.cells.map((cell) => cell.id)).toEqual(["0,0", "0,2", "1,0", "1,2"]);
    expect(mask.cells.every((cell) => cell.edges.length === 4)).toBe(true);
    expect(() => prepareCellMask([])).toThrow();
    expect(() => prepareCellMask([{ row: 0.5, column: 0 }])).toThrow();
    expect(() => prepareCellMask([{ row: 0, column: 0 }, { row: 0, column: 0 }])).toThrow();
  });

  it("rejects unknown and duplicate edges without mutation", () => {
    const state = createGame(board, players);
    expect(applyMove(state, { playerId: "a", edgeId: "missing" }).accepted).toBe(false);
    const first = applyMove(state, { playerId: "a", edgeId: board.edges[0].id });
    const duplicate = applyMove(first.state, { playerId: first.state.currentPlayerId, edgeId: board.edges[0].id });
    expect(duplicate.accepted).toBe(false); expect(duplicate.state).toBe(first.state);
  });

  it("rejects a move from the wrong participant without mutation", () => {
    const state = createGame(board, players);
    const before = JSON.stringify(state);
    const result = applyMove(state, { playerId: "b", edgeId: board.edges[0].id });
    expect(result).toMatchObject({ accepted: false, reason: "wrong-turn" });
    expect(JSON.stringify(result.state)).toBe(before);
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
    expect(applyMove(state, { playerId: state.currentPlayerId, edgeId: tiedBoard.edges[0].id }).reason).toBe("game-complete");
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
