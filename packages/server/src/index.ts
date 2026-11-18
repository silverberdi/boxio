import Fastify from "fastify";
import websocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import { createBoardFromSelection, createRectangularBoard, type Board, type BoardSelection } from "@boxio/engine";
import {
  InMemoryRoomStore,
  PrivateRoom,
  RETENTION_MS,
  type PrivateRoomPersistence,
  type RoomCommand,
  type RoomPersistence,
} from "./private-room.js";
import { parseMessage, serializeMessage, snapshotMessage, type PrivateMessage } from "./private-protocol.js";
import { PostgresRoomPersistence, type PostgresQuery } from "./postgres-room-persistence.js";
import { createPostgresPublicMatchmakingPersistence } from "./postgres-public-matchmaking-persistence.js";
import { PublicMatchmaking, type PublicCommand } from "./public-matchmaking.js";

export interface RoomStore {
  create(board: Board, hostName: string): Promise<PrivateRoom> | PrivateRoom;
  get(roomId: string): Promise<PrivateRoom | undefined> | PrivateRoom | undefined;
  getByInvitation(invitationCode: string): Promise<PrivateRoom | undefined> | PrivateRoom | undefined;
  persist(room: PrivateRoom): Promise<void> | void;
  cleanup(at?: number): Promise<string[] | number> | string[] | number;
  expireReservations(at?: number): Promise<void> | void;
}

export class PersistentRoomStore implements RoomStore {
  private readonly memory = new Map<string, PrivateRoom>();

  constructor(private readonly persistence?: RoomPersistence) {}

  async create(board: Board, hostName: string): Promise<PrivateRoom> {
    const room = PrivateRoom.create(board, hostName, Date.now, this.persistence);
    this.memory.set(room.roomId, room);
    if (this.persistence) {
      await this.persistence.save(room);
    }
    return room;
  }

  async get(roomId: string): Promise<PrivateRoom | undefined> {
    const cached = this.memory.get(roomId);
    if (cached) return cached;
    if (this.persistence && "load" in this.persistence) {
      const loaded = await (this.persistence as PostgresRoomPersistence).load(roomId);
      if (loaded) {
        this.memory.set(loaded.roomId, loaded);
        return loaded;
      }
    }
    return undefined;
  }

  async getByInvitation(invitationCode: string): Promise<PrivateRoom | undefined> {
    for (const room of this.memory.values()) {
      if (room.invitationCode === invitationCode) return room;
    }
    if (this.persistence && "loadByInvitation" in this.persistence) {
      const loaded = await (this.persistence as PostgresRoomPersistence).loadByInvitation(invitationCode);
      if (loaded) {
        this.memory.set(loaded.roomId, loaded);
        return loaded;
      }
    }
    return undefined;
  }

  async persist(room: PrivateRoom): Promise<void> {
    if (this.persistence) await this.persistence.save(room);
  }

  async cleanup(at = Date.now()): Promise<string[] | number> {
    if (this.persistence && "cleanupFinished" in this.persistence) {
      return (this.persistence as PostgresRoomPersistence).cleanupFinished(new Date(at));
    }
    const removed: string[] = [];
    for (const [id, room] of this.memory) {
      const snapshot = room.getSnapshot();
      if ((snapshot.status === "complete" || snapshot.status === "closed") && snapshot.finishedAt && at - Date.parse(snapshot.finishedAt) >= RETENTION_MS) {
        this.memory.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  async expireReservations(at = Date.now()): Promise<void> {
    for (const room of this.memory.values()) {
      const before = room.getSnapshot().version;
      room.expireReservations(at);
      if (room.getSnapshot().version !== before) await this.persistence?.save(room);
    }
  }
}

export function buildServer(
  store: RoomStore = new PersistentRoomStore(),
  publicPersistence: ConstructorParameters<typeof PublicMatchmaking>[1] | undefined = undefined,
  publicClock: () => number = Date.now,
) {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, engine: createRectangularBoard(2, 2).cells.length === 4 }));
  app.register(websocket);

  const roomSockets = new Map<string, Set<WebSocket>>();
  // The only implicit runtime path is PostgreSQL. An in-memory adapter is accepted
  // only when a caller explicitly supplies one (the isolated test fixture does so).
  const productionPersistence = publicPersistence === undefined ? createPostgresPublicMatchmakingPersistence() : undefined;
  const durablePublicPersistence = publicPersistence ?? productionPersistence?.persistence;
  if (!durablePublicPersistence) throw new Error("Public matchmaking requires PostgreSQL persistence");
  const publicMatchmaking = new PublicMatchmaking(publicClock, durablePublicPersistence);
  const publicSockets = new Map<string, Set<WebSocket>>();

  const persistRoom = async (room: PrivateRoom) => { await store.persist(room); };
  const expirationTimer = setInterval(() => { void store.expireReservations(); }, 1_000);
  expirationTimer.unref();
  app.addHook("onClose", async () => { clearInterval(expirationTimer); });
  const publicExpirationTimer = setInterval(() => {
    void publicMatchmaking.expire(publicClock()).then((snapshots) => {
      for (const snap of snapshots) {
        if (snap.status === "abandoned" || snap.status === "complete") {
          publicBroadcast(snap.matchId, { type: "snapshot", snapshot: snap });
        }
      }
    });
  }, 1_000);
  publicExpirationTimer.unref();
  app.addHook("onClose", async () => { clearInterval(publicExpirationTimer); });
  app.addHook("onClose", async () => { await productionPersistence?.close(); });

  function broadcast(roomId: string, message: PrivateMessage) {
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;
    const raw = serializeMessage(message);
    for (const ws of sockets) {
      if (ws.readyState === 1 /* OPEN */) {
        try { ws.send(raw); } catch { /* ignore broken */ }
      }
    }
  }

  const publicBroadcast = (matchId: string, payload: unknown) => {
    const sockets = publicSockets.get(matchId);
    if (!sockets) return;
    const raw = JSON.stringify(payload);
    for (const socket of sockets) if (socket.readyState === 1) { try { socket.send(raw); } catch { /* closed concurrently */ } }
  };

  app.post<{ Body: { name: string; rows?: unknown; columns?: unknown; selection?: BoardSelection } }>("/public/search", async (request, reply) => {
    try {
      const board = request.body.selection ? createBoardFromSelection(request.body.selection) : createRectangularBoard(request.body.rows ?? 2, request.body.columns ?? 2);
      const entered = await publicMatchmaking.enter(board, request.body.name);
      return reply.code(201).send(entered);
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "invalid-search" }); }
  });
  app.get<{ Params: { searchId: string } }>("/public/search/:searchId", async (request, reply) => {
    const search = await publicMatchmaking.getSearch(request.params.searchId);
    return search ? reply.send(search) : reply.code(404).send({ error: "search-not-found" });
  });
  app.post<{ Params: { searchId: string } }>("/public/search/:searchId/cancel", async (request, reply) => {
    try { return reply.send(await publicMatchmaking.cancel(request.params.searchId)); }
    catch (error) { return reply.code(409).send({ error: error instanceof Error ? error.message : "search-not-available" }); }
  });
  app.post<{ Params: { searchId: string } }>("/public/search/:searchId/continue", async (request, reply) => {
    try { return reply.send(await publicMatchmaking.continue(request.params.searchId)); }
    catch (error) { return reply.code(409).send({ error: error instanceof Error ? error.message : "search-not-available" }); }
  });
  app.post<{ Params: { searchId: string } }>("/public/search/:searchId/machine", async (request, reply) => {
    try { return reply.send(await publicMatchmaking.machine(request.params.searchId)); }
    catch (error) { return reply.code(409).send({ error: error instanceof Error ? error.message : "search-not-available" }); }
  });
  app.get<{ Params: { matchId: string } }>("/public/matches/:matchId", async (request, reply) => {
    const match = await publicMatchmaking.getMatch(request.params.matchId);
    return match ? reply.send(match) : reply.code(404).send({ error: "match-not-found" });
  });
  app.post<{ Params: { matchId: string }; Body: PublicCommand }>("/public/matches/:matchId/commands", async (request, reply) => {
    const result = await publicMatchmaking.command(request.params.matchId, request.body);
    if (!result) return reply.code(404).send({ error: "match-not-found" });
    publicBroadcast(request.params.matchId, result);
    return result.accepted ? reply.send(result) : reply.code(409).send(result);
  });
  app.post<{ Params: { matchId: string; participantId: string }; Body: { action: "disconnect" | "reconnect"; credential?: string } }>("/public/matches/:matchId/participants/:participantId/lifecycle", async (request, reply) => {
    try {
      await publicMatchmaking.expire(publicClock());
      const result = request.body.action === "disconnect"
        ? await publicMatchmaking.disconnect(request.params.matchId, request.params.participantId)
        : await publicMatchmaking.reconnect(request.params.matchId, request.params.participantId, request.body.credential ?? "");
      if (!result) return reply.code(404).send({ error: "match-not-found" });
      publicBroadcast(request.params.matchId, result);
      return reply.send(result);
    } catch (error) { return reply.code(409).send({ error: error instanceof Error ? error.message : "invalid-reconnect" }); }
  });
  app.register(async (instance) => {
    instance.get<{ Params: { matchId: string } }>("/public/matches/:matchId/ws", { websocket: true }, async (socket, request) => {
      const match = await publicMatchmaking.getMatch(request.params.matchId);
      if (!match) { socket.close(1008, "match-not-found"); return; }
      let sockets = publicSockets.get(request.params.matchId);
      if (!sockets) { sockets = new Set(); publicSockets.set(request.params.matchId, sockets); }
      sockets.add(socket); socket.send(JSON.stringify({ type: "snapshot", snapshot: match }));
      socket.on("close", () => { sockets?.delete(socket); if (sockets?.size === 0) publicSockets.delete(request.params.matchId); });
      socket.on("message", async (raw: Buffer) => {
        try {
          const message = JSON.parse(raw.toString()) as { type?: string; command?: PublicCommand; participantId?: string; credential?: string };
          const result = message.type === "command" && message.command
            ? await publicMatchmaking.command(request.params.matchId, message.command)
            : message.type === "reconnect" && message.participantId
              ? await publicMatchmaking.reconnect(request.params.matchId, message.participantId, message.credential ?? "")
              : undefined;
          if (result) publicBroadcast(request.params.matchId, result); else socket.send(JSON.stringify({ type: "reject", code: "invalid-message", snapshot: await publicMatchmaking.getMatch(request.params.matchId) }));
        } catch { socket.send(JSON.stringify({ type: "reject", code: "invalid-message" })); }
      });
    });
  });

  app.post<{ Body: { rows?: unknown; columns?: unknown; selection?: BoardSelection; name: string } }>("/rooms", async (request, reply) => {
    try {
      const board = request.body.selection ? createBoardFromSelection(request.body.selection) : createRectangularBoard(request.body.rows ?? 2, request.body.columns ?? 2);
      const room = await store.create(board, request.body.name);
      const credentials = room.hostCredentials();
      await persistRoom(room);
      return reply.code(201).send({ roomId: room.roomId, invitationCode: room.invitationCode, ...credentials });
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "invalid-room" }); }
  });

  app.post<{ Params: { roomId: string }; Body: { name: string; invitationCode?: string } }>("/rooms/:roomId/join", async (request, reply) => {
    const room = request.body.invitationCode ? await store.getByInvitation(request.body.invitationCode) : await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    try {
      const before = room.getSnapshot().version;
      room.expireReservations();
      if (room.getSnapshot().version !== before) await persistRoom(room);
      const joined = room.join(request.body.name);
      await persistRoom(room);
      broadcast(room.roomId, snapshotMessage(joined.snapshot));
      return reply.code(201).send(joined);
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : "room-full" });
    }
  });

  app.get<{ Params: { roomId: string } }>("/rooms/:roomId/snapshot", async (request, reply) => {
    const room = await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    const before = room.getSnapshot().version;
    room.expireReservations();
    if (room.getSnapshot().version !== before) await persistRoom(room);
    return room.getSnapshot();
  });

  app.post<{ Params: { roomId: string }; Body: RoomCommand }>("/rooms/:roomId/commands", async (request, reply) => {
    const room = await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    const before = room.getSnapshot().version;
    room.expireReservations();
    if (room.getSnapshot().version !== before) await persistRoom(room);
    const result = await room.submit(request.body);
    if (result.accepted) {
      broadcast(room.roomId, {
        type: "ack",
        protocolVersion: 1,
        commandId: result.commandId,
        eventSequence: result.eventSequence,
        snapshot: result.snapshot,
      });
      return reply.send(result);
    }
    return reply.code(409).send(result);
  });

  app.post<{ Params: { roomId: string; participantId: string }; Body: { action: "disconnect" | "leave" } }>("/rooms/:roomId/participants/:participantId/lifecycle", async (request, reply) => {
    const room = await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    const snapshot = request.body.action === "disconnect" ? room.disconnect(request.params.participantId) : room.leave(request.params.participantId);
    await persistRoom(room);
    broadcast(room.roomId, snapshotMessage(snapshot));
    return snapshot;
  });

  app.register(async (instance) => {
    instance.get<{ Params: { roomId: string } }>("/rooms/:roomId/ws", { websocket: true }, async (socket, request) => {
      const room = await store.get(request.params.roomId);
      if (!room) { socket.close(1008, "room-not-found"); return; }
      const before = room.getSnapshot().version;
      room.expireReservations();
      if (room.getSnapshot().version !== before) await persistRoom(room);

      let sockets = roomSockets.get(room.roomId);
      if (!sockets) {
        sockets = new Set();
        roomSockets.set(room.roomId, sockets);
      }
      sockets.add(socket);

      socket.on("close", () => {
        sockets?.delete(socket);
        if (sockets && sockets.size === 0) roomSockets.delete(room.roomId);
      });

      socket.send(serializeMessage(snapshotMessage(room.getSnapshot())));

      socket.on("message", async (raw: Buffer) => {
        try {
          const message = parseMessage(raw.toString());
          if (message.type === "reconnect") {
            try {
              const reconnected = room.reconnect(message.participantId, message.credential);
              await persistRoom(room);
              socket.send(serializeMessage(snapshotMessage(reconnected.snapshot)));
              broadcast(room.roomId, snapshotMessage(reconnected.snapshot));
            } catch {
              socket.send(serializeMessage({
                type: "reject",
                protocolVersion: 1,
                code: "invalid-credential",
                snapshot: room.getSnapshot(),
              }));
            }
            return;
          }
          if (message.type !== "command") {
            socket.send(serializeMessage({ type: "reject", protocolVersion: 1, code: "unsupported-message", snapshot: room.getSnapshot() }));
            return;
          }
          const result = await room.submit(message.command);
          if (result.accepted) {
            broadcast(room.roomId, {
              type: "ack",
              protocolVersion: 1,
              commandId: result.commandId,
              eventSequence: result.eventSequence,
              snapshot: result.snapshot,
            });
          } else {
            socket.send(serializeMessage({
              type: "reject",
              protocolVersion: 1,
              commandId: result.commandId,
              code: result.code,
              snapshot: result.snapshot,
            }));
          }
        } catch {
          socket.send(serializeMessage({ type: "reject", protocolVersion: 1, code: "invalid-message", snapshot: room.getSnapshot() }));
        }
      });
    });
  });

  return app;
}
