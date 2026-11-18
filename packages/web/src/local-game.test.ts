import { describe, expect, it } from "vitest";
import {
  beginGesture,
  canSelectAfterGesture,
  createLocalSession,
  findEdgeBetween,
  runAutomaticTurns,
  selectEdge,
  silhouetteSelection,
  uniqueBoardVertices,
  updateGesture,
  validateLocalConfig,
  VIEWPORT_CHECKS,
  SILHOUETTE_CATALOG,
  celebrationForCaptureCount,
  shouldPlaySound,
} from "./local-game";

const players = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `P${i}`, color: (["blue", "yellow", "coral", "green"] as const)[i] }));

describe("local-game UI boundary", () => {
  it("centralizes normal and multiple non-blocking celebration decisions", () => {
    expect(celebrationForCaptureCount(0).kind).toBe("none");
    expect(celebrationForCaptureCount(1)).toMatchObject({ kind: "single", sound: "capture" });
    expect(celebrationForCaptureCount(2)).toMatchObject({ kind: "multiple", label: "¡Conquista múltiple! 2 cuadros", sound: "multi" });
    expect(() => celebrationForCaptureCount(-1)).toThrow();
  });

  it("honors mute before an audio context can be requested", () => {
    expect(shouldPlaySound({ soundEnabled: false, reducedMotion: false })).toBe(false);
    expect(shouldPlaySound({ soundEnabled: true, reducedMotion: true })).toBe(true);
  });

  it("keeps the next state interactive after a multiple capture", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const open = ["0,0-0,1", "0,0-1,0", "0,1-0,2", "0,1-1,1", "0,2-1,2", "1,0-1,1", "1,0-2,0", "1,1-2,1", "1,2-2,2", "2,1-2,2"];
    const shared = "1,1-1,2";
    let current = session;
    for (const edge of open) current = selectEdge(current, edge).session;
    const result = selectEdge(current, shared);
    expect(result.feedback.kind).toBe("multi");
    expect(result.session.state.status).toBe("active");
    expect(selectEdge(result.session, result.session.state.board.edges.find((edge) => !result.session.state.occupiedEdges.includes(edge.id))!.id).feedback.kind).not.toBe("invalid");
  });
  it("offers nine catalog boards and creates local sessions through the same engine", () => {
    expect(SILHOUETTE_CATALOG).toHaveLength(9);
    for (const template of SILHOUETTE_CATALOG) {
      const session = createLocalSession({ players: players(2), board: silhouetteSelection(template.id) });
      expect(session.state.board.cells.length).toBeGreaterThan(0);
      expect(session.state.board.edges.every((edge) => session.state.board.cells.some((cell) => cell.edges.includes(edge.id)))).toBe(true);
    }
  });

  it("rejects invalid board selection without mutating an existing session", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const snapshot = JSON.stringify(session);
    expect(() => createLocalSession({ players: players(2), board: { kind: "silhouette", id: "bad", cells: [] } })).toThrow();
    expect(JSON.stringify(session)).toBe(snapshot);
  });

  it("only accepts 2 to 4 distinct named players and never creates invalid state", () => {
    expect(validateLocalConfig({ players: players(1), rows: 2, columns: 2 })).toContain("2 y 4");
    expect(validateLocalConfig({ players: players(5) as never, rows: 2, columns: 2 })).toContain("2 y 4");
    expect(() => createLocalSession({ players: players(1), rows: 2, columns: 2 })).toThrow();
    expect(createLocalSession({ players: players(4), rows: 2, columns: 2 }).state.players).toHaveLength(4);
  });

  it("starts a serializable local game with coherent board, turn and scores", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    expect(JSON.parse(JSON.stringify(session.state))).toEqual(session.state);
    expect(session.state.currentPlayerId).toBe("p0");
    expect(Object.values(session.state.scores)).toEqual([0, 0]);
    expect(session.state.board.cells).toHaveLength(4);
    expect(session.edgeOwners).toEqual({});
  });

  it("rejects occupied and outside edges without mutating the session", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const first = selectEdge(session, session.state.board.edges[0].id);
    const snapshot = JSON.stringify(first.session);
    const duplicate = selectEdge(first.session, session.state.board.edges[0].id);
    expect(duplicate.feedback.kind).toBe("invalid");
    expect(JSON.stringify(duplicate.session)).toBe(snapshot);
    const outside = selectEdge(session, "not-an-edge");
    expect(outside.feedback.kind).toBe("invalid");
  });

  it("supports pan, zoom and ignores tiny drag movements as taps", () => {
    const initial = beginGesture(10, 10);
    const tiny = updateGesture(initial, 12, 11);
    expect(canSelectAfterGesture(tiny)).toBe(true);
    const moved = updateGesture(initial, 40, 10);
    expect(canSelectAfterGesture(moved)).toBe(false);
    const pinch = updateGesture(initial, 10, 10, 1.4, 2);
    expect(pinch.scale).toBe(1.4);
    expect(canSelectAfterGesture(pinch)).toBe(false);
  });

  it("exposes canonical responsive breakpoints for mobile, tablet, and desktop", () => {
    expect(VIEWPORT_CHECKS.map((item) => item.label)).toEqual(["mobile", "tablet", "desktop"]);
  });

  it("runs automatic bot turns deterministically via pure engine transitions", () => {
    const session = createLocalSession({
      mode: "machine",
      players: [
        { id: "human", name: "Tú", color: "blue" },
        { id: "bot-easy", name: "Bot", color: "yellow", kind: "automatic", difficulty: "easy", seed: 42 },
      ],
      rows: 2,
      columns: 2,
    });
    const humanMove = selectEdge(session, session.state.board.edges[0].id);
    const progressed = runAutomaticTurns(humanMove.session);
    expect(progressed.session.state.occupiedEdges.length).toBeGreaterThanOrEqual(1);
    expect(progressed.session.state.occupiedEdges.length).toBeLessThanOrEqual(session.state.board.edges.length);
    expect(JSON.stringify(progressed.session.state)).not.toContain("fetch");
  });

  it("tracks edge ownership by player for both human and automatic moves", () => {
    const session = createLocalSession({
      mode: "machine",
      players: [
        { id: "human", name: "Tú", color: "blue" },
        { id: "bot", name: "Bot", color: "yellow", kind: "automatic", difficulty: "easy", seed: 99 },
      ],
      rows: 2,
      columns: 2,
    });
    const edgeId = session.state.board.edges[0].id;
    const humanMove = selectEdge(session, edgeId);
    expect(humanMove.session.edgeOwners[edgeId]).toBe("human");

    const withBot = runAutomaticTurns(humanMove.session);
    for (const occupied of withBot.session.state.occupiedEdges) {
      expect(withBot.session.edgeOwners[occupied]).toBeDefined();
      expect(["human", "bot"]).toContain(withBot.session.edgeOwners[occupied]);
    }
  });

  it("supports drag-to-draw vertex connection helpers", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const vertices = uniqueBoardVertices(session.state.board);
    expect(vertices).toHaveLength(9); // (2+1) x (2+1) = 9 vertices

    const edge = findEdgeBetween(session.state.board, { row: 0, column: 0 }, { row: 0, column: 1 });
    expect(edge).toBeDefined();
    expect(edge?.id).toBe("0,0-0,1");

    const reversed = findEdgeBetween(session.state.board, { row: 0, column: 1 }, { row: 0, column: 0 });
    expect(reversed?.id).toBe("0,0-0,1");

    const nonAdjacent = findEdgeBetween(session.state.board, { row: 0, column: 0 }, { row: 1, column: 1 });
    expect(nonAdjacent).toBeUndefined();
  });
});
