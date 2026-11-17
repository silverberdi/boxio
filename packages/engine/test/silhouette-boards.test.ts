import { describe, expect, it } from "vitest";
import { applyMove, chooseBotMove, createBoardFromSelection, createGame, prepareCellMask, type CellCoordinate } from "../src/index.js";
import catalog from "../../../assets/boards/silhouette-candidates.json";

const cells = (rows: readonly string[]): CellCoordinate[] => rows.flatMap((row, r) => [...row].flatMap((value, column) => value === "#" ? [{ row: r, column }] : []));

describe("silhouette catalog and topology", () => {
  it("contains exactly nine non-empty connected square masks", () => {
    expect(catalog.templates).toHaveLength(9);
    expect(catalog.templates.map(({ id }) => id).sort()).toEqual([
      "cross-large", "cross-medium", "cross-small",
      "heart-large", "heart-medium", "heart-small",
      "star-large", "star-medium", "star-small",
    ]);
    for (const template of catalog.templates) {
      const mask = cells(template.rows);
      expect(mask.length).toBeGreaterThan(0);
      expect(template.rows.every((row) => row.length === template.rows[0].length)).toBe(true);
      expect(template.rows.every((row) => /^[#.]+$/.test(row))).toBe(true);
      expect(() => prepareCellMask(mask)).not.toThrow();
      expect(mask.every(({ row, column }) => Number.isInteger(row) && Number.isInteger(column))).toBe(true);
    }
  });

  it("rejects invalid, duplicate and disconnected masks before state creation", () => {
    for (const invalid of [[], [{ row: 0.5, column: 0 }], [{ row: 0, column: 0 }, { row: 0, column: 0 }], [{ row: 0, column: 0 }, { row: 0, column: 2 }]]) {
      expect(() => prepareCellMask(invalid as CellCoordinate[])).toThrow();
    }
    const before = { marker: "unchanged" };
    expect(before).toEqual({ marker: "unchanged" });
  });

  it("accepts classic boundaries and rejects values outside 2..8", () => {
    expect(createBoardFromSelection({ kind: "classic", rows: 2, columns: 2 }).cells).toHaveLength(4);
    expect(createBoardFromSelection({ kind: "classic", rows: 8, columns: 8 }).cells).toHaveLength(64);
    for (const value of [1, 9, 2.5, Infinity, NaN, "2", null]) expect(() => createBoardFromSelection({ kind: "classic", rows: value, columns: 2 })).toThrow();
  });

  it("derives shared edges only from present cells", () => {
    const board = prepareCellMask([{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 1, column: 1 }]);
    expect(board.cells).toHaveLength(3);
    expect(board.edges).toHaveLength(10);
    expect(new Set(board.edges.map((edge) => edge.id)).size).toBe(board.edges.length);
    expect(createGame(board, [{ id: "a", name: "A" }, { id: "b", name: "B" }]).board).toEqual(board);
  });

  it("runs the same legal move and seeded bot contract on all nine variants", () => {
    for (const template of catalog.templates) {
      const board = prepareCellMask(cells(template.rows));
      const state = createGame(board, [{ id: "human", name: "Human" }, { id: "bot", name: "Bot", kind: "automatic", difficulty: "easy", seed: 7 }]);
      const first = board.edges[0].id;
      expect(applyMove(state, { playerId: state.currentPlayerId, edgeId: first }).accepted).toBe(true);
      expect(applyMove(state, { playerId: state.currentPlayerId, edgeId: "missing" }).state).toBe(state);
      for (const difficulty of ["easy", "medium", "hard"] as const) {
        const start = performance.now();
        const move = chooseBotMove(state, difficulty, 1234);
        expect(performance.now() - start, `${template.id}/${difficulty}`).toBeLessThan(100);
        expect(chooseBotMove(state, difficulty, 1234)).toBe(move);
        expect(board.edges.some((edge) => edge.id === move)).toBe(true);
      }
    }
  });

  it("rejects absent or occupied edges without mutating every catalog game", () => {
    for (const template of catalog.templates) {
      const board = prepareCellMask(cells(template.rows));
      const state = createGame(board, [{ id: "a", name: "A" }, { id: "b", name: "B" }]);
      const first = applyMove(state, { playerId: "a", edgeId: board.edges[0].id });
      expect(first.accepted).toBe(true);
      expect(applyMove(first.state, { playerId: first.state.currentPlayerId, edgeId: board.edges[0].id })).toMatchObject({ accepted: false, reason: "occupied-edge", state: first.state });
      expect(applyMove(state, { playerId: "a", edgeId: "0,0-1,1" })).toMatchObject({ accepted: false, reason: "unknown-edge", state });
    }
  });
});
