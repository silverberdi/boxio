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

export interface RoomStore {
  create(board: Board, hostName: string): Promise<PrivateRoom> | PrivateRoom;
  get(roomId: string): Promise<PrivateRoom | undefined> | PrivateRoom | undefined;
  getByInvitation(invitationCode: string): Promise<PrivateRoom | undefined> | PrivateRoom | undefined;
  cleanup(at?: number): Promise<string[] | number> | string[] | number;
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
    return undefined;
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
}

export function buildServer(store: RoomStore = new PersistentRoomStore()) {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, engine: createRectangularBoard(2, 2).cells.length === 4 }));
  app.register(websocket);

  const roomSockets = new Map<string, Set<WebSocket>>();

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

  app.post<{ Body: { rows?: unknown; columns?: unknown; selection?: BoardSelection; name: string } }>("/rooms", async (request, reply) => {
    try {
      const board = request.body.selection ? createBoardFromSelection(request.body.selection) : createRectangularBoard(request.body.rows ?? 2, request.body.columns ?? 2);
      const room = await store.create(board, request.body.name);
      const credentials = room.hostCredentials();
      return reply.code(201).send({ roomId: room.roomId, invitationCode: room.invitationCode, ...credentials });
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "invalid-room" }); }
  });

  app.post<{ Params: { roomId: string }; Body: { name: string; invitationCode?: string } }>("/rooms/:roomId/join", async (request, reply) => {
    const room = request.body.invitationCode ? await store.getByInvitation(request.body.invitationCode) : await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    try {
      const joined = room.join(request.body.name);
      broadcast(room.roomId, snapshotMessage(joined.snapshot));
      return reply.code(201).send(joined);
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : "room-full" });
    }
  });

  app.get<{ Params: { roomId: string } }>("/rooms/:roomId/snapshot", async (request, reply) => {
    const room = await store.get(request.params.roomId);
    return room ? room.getSnapshot() : reply.code(404).send({ error: "room-not-found" });
  });

  app.post<{ Params: { roomId: string }; Body: RoomCommand }>("/rooms/:roomId/commands", async (request, reply) => {
    const room = await store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
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
    broadcast(room.roomId, snapshotMessage(snapshot));
    return snapshot;
  });

  app.register(async (instance) => {
    instance.get<{ Params: { roomId: string } }>("/rooms/:roomId/ws", { websocket: true }, async (socket, request) => {
      const room = await store.get(request.params.roomId);
      if (!room) { socket.close(1008, "room-not-found"); return; }

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
