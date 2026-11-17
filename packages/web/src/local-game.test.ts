import { describe, expect, it } from "vitest";
import { beginGesture, canSelectAfterGesture, createLocalSession, selectEdge, updateGesture, validateLocalConfig, VIEWPORT_CHECKS } from "./local-game";

const players = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `P${i}`, color: (["blue", "yellow", "coral", "green"] as const)[i] }));

describe("local-game UI boundary", () => {
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
  });

  it("rejects occupied and outside edges without mutating the session", () => {
    const session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const first = selectEdge(session, session.state.board.edges[0].id);
    const snapshot = JSON.stringify(first.session);
    const duplicate = selectEdge(first.session, session.state.board.edges[0].id);
    expect(duplicate.feedback.kind).toBe("invalid");
    expect(JSON.stringify(duplicate.session)).toBe(snapshot);
    expect(selectEdge(session, "outside").feedback.kind).toBe("invalid");
  });

  it("distinguishes static taps from pan and pinch gestures", () => {
    const tap = beginGesture(10, 10);
    expect(canSelectAfterGesture(updateGesture(tap, 12, 12))).toBe(true);
    expect(canSelectAfterGesture(updateGesture(tap, 30, 10))).toBe(false);
    expect(canSelectAfterGesture(updateGesture(tap, 10, 10, 1.2, 2))).toBe(false);
    const pinch = beginGesture(50, 50, 2, 40);
    expect(updateGesture(pinch, 50, 50, 1.3, 2).moved).toBe(true);
    expect(canSelectAfterGesture(updateGesture(pinch, 50, 50, 1.3, 2))).toBe(false);
  });

  it("records the three required responsive viewport checks", () => {
    expect(VIEWPORT_CHECKS).toEqual([
      { width: 360, height: 640, label: "mobile" },
      { width: 768, height: 1024, label: "tablet" },
      { width: 1280, height: 800, label: "desktop" },
    ]);
    expect(VIEWPORT_CHECKS.every(({ width, height }) => width > 0 && height > 0)).toBe(true);
  });

  it("uses one canonical edge identity for a shared edge and awards a double capture", () => {
    let session = createLocalSession({ players: players(2), rows: 2, columns: 2 });
    const shared = session.state.board.cells[0].edges.find((id) => session.state.board.cells[1].edges.includes(id))!;
    for (const edge of session.state.board.edges.filter((candidate) => candidate.id !== shared)) session = selectEdge(session, edge.id).session;
    const beforeScore = Object.values(session.state.scores).reduce((sum, score) => sum + score, 0);
    const beforeTurn = session.state.currentPlayerId;
    const result = selectEdge(session, shared);
    expect(result.feedback.kind).toBe("multi");
    expect(Object.values(result.session.state.scores).reduce((sum, score) => sum + score, 0) - beforeScore).toBe(2);
    expect(result.session.state.currentPlayerId).toBe(beforeTurn);
  });
});
