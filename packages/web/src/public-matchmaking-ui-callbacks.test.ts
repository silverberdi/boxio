import { describe, expect, it, afterEach, vi } from "vitest";
import "@angular/compiler";
import { AppComponent } from "./app";

class FakePublicSocket {
  static last: FakePublicSocket | undefined;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor() { FakePublicSocket.last = this; }
  close() { this.onclose?.(); }
  emitOpen() { this.onopen?.(); }
  emitMessage(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
  emitClose() { this.onclose?.(); }
}

function createComponent() {
  const detectChanges = vi.fn();
  const component = new AppComponent(
    { isEnabled: false } as never,
    { detectChanges } as never,
  );
  return { component, detectChanges };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { WebSocket?: unknown }).WebSocket;
});

describe("public matchmaking view callbacks", () => {
  it("renders the 201 search response and the received match without a nickname event", async () => {
    const { component, detectChanges } = createComponent();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      search: { searchId: "search-1", status: "searching" },
      participantId: "participant-1",
      reconnectCredential: "credential-1",
    }), { status: 201 })).mockResolvedValueOnce(new Response(JSON.stringify({
      searchId: "search-1", status: "matched", matchId: "match-1",
    }))).mockResolvedValueOnce(new Response(JSON.stringify({
      matchId: "match-1", status: "active", version: 1, participants: [], game: { board: { edges: [] }, occupiedEdges: [] },
    })));

    component.onlineName = "Jugador original";
    await component.startPublicSearch();
    expect(component.publicStatus).toBe("Buscando rival…");
    expect(detectChanges).toHaveBeenCalled();

    await vi.waitFor(() => expect(component.publicMatch?.matchId).toBe("match-1"));
    expect(component.publicMatch?.matchId).toBe("match-1");
    expect(component.onlineName).toBe("Jugador original");
    expect(detectChanges.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/public/search/search-1");
  });

  it("renders every WebSocket lifecycle state and authoritative snapshot immediately", () => {
    const { component, detectChanges } = createComponent();
    (globalThis as any).window = { location: { protocol: "http:", host: "boxio.test" } };
    (globalThis as any).WebSocket = FakePublicSocket;
    component.publicMatchId = "match-1";
    component.publicParticipantId = "participant-1";

    component.connectPublicSocket();
    const socket = FakePublicSocket.last!;
    socket.emitOpen();
    expect(component.publicConnection).toBe("Conectado");

    const snapshot = {
      matchId: "match-1", status: "active", version: 2,
      participants: [{ id: "participant-1", status: "connected" }],
      game: { board: { edges: [{ id: "edge-1" }] }, occupiedEdges: ["edge-1"] },
    };
    socket.emitMessage({ type: "snapshot", snapshot });
    expect(component.publicMatch).toEqual(snapshot);
    expect(component.publicMatch.game.occupiedEdges).toContain("edge-1");

    socket.emitClose();
    expect(component.publicConnection).toBe("Desconectado");
    expect(component.publicDisconnected).toBe(true);
    expect(detectChanges.mock.calls.length).toBe(3);
  });

  it("renders cancellation and command responses without a compensating Angular event", async () => {
    const { component, detectChanges } = createComponent();
    component.publicSearchId = "search-1";
    component.publicMatchId = "match-1";
    component.publicParticipantId = "participant-1";
    component.publicCredential = "credential-1";
    component.publicMatch = { matchId: "match-1", version: 1, game: { board: { edges: [] }, occupiedEdges: [] } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ searchId: "search-1", status: "cancelled" }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ snapshot: { ...component.publicMatch, version: 2 } }), { status: 200 }));

    await component.cancelPublicSearch();
    expect(component.publicStatus).toBe("Búsqueda cancelada por el servidor");
    await component.publicMove("edge-1");
    expect(component.publicMatch.version).toBe(2);
    expect(detectChanges).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/public/search/search-1/cancel", { method: "POST" });
  });
});
