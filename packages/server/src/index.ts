import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { createBoardFromSelection, createRectangularBoard, type BoardSelection } from "@boxio/engine";
import { InMemoryRoomStore, type RoomCommand } from "./private-room.js";
import { parseMessage, serializeMessage, snapshotMessage } from "./private-protocol.js";

export function buildServer(store = new InMemoryRoomStore()) {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, engine: createRectangularBoard(2, 2).cells.length === 4 }));
  app.register(websocket);
  app.post<{ Body: { rows?: unknown; columns?: unknown; selection?: BoardSelection; name: string } }>("/rooms", async (request, reply) => {
    try {
      const board = request.body.selection ? createBoardFromSelection(request.body.selection) : createRectangularBoard(request.body.rows ?? 2, request.body.columns ?? 2);
      const room = store.create(board, request.body.name);
      const credentials = room.hostCredentials();
      return reply.code(201).send({ roomId: room.roomId, invitationCode: room.invitationCode, ...credentials });
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "invalid-room" }); }
  });
  app.post<{ Params: { roomId: string }; Body: { name: string; invitationCode?: string } }>("/rooms/:roomId/join", async (request, reply) => {
    const room = request.body.invitationCode ? store.getByInvitation(request.body.invitationCode) : store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    try { return reply.code(201).send(room.join(request.body.name)); } catch (error) { return reply.code(409).send({ error: error instanceof Error ? error.message : "room-full" }); }
  });
  app.get<{ Params: { roomId: string } }>("/rooms/:roomId/snapshot", async (request, reply) => {
    const room = store.get(request.params.roomId);
    return room ? room.getSnapshot() : reply.code(404).send({ error: "room-not-found" });
  });
  app.post<{ Params: { roomId: string }; Body: RoomCommand }>("/rooms/:roomId/commands", async (request, reply) => {
    const room = store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    const result = await room.submit(request.body);
    return result.accepted ? reply.send(result) : reply.code(409).send(result);
  });
  app.post<{ Params: { roomId: string; participantId: string }; Body: { action: "disconnect" | "leave" } }>("/rooms/:roomId/participants/:participantId/lifecycle", async (request, reply) => {
    const room = store.get(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "room-not-found" });
    return request.body.action === "disconnect" ? room.disconnect(request.params.participantId) : room.leave(request.params.participantId);
  });
  app.register(async (instance) => {
    instance.get<{ Params: { roomId: string } }>("/rooms/:roomId/ws", { websocket: true }, (socket, request) => {
      const room = store.get(request.params.roomId);
      if (!room) { socket.close(1008, "room-not-found"); return; }
      socket.send(serializeMessage(snapshotMessage(room.getSnapshot())));
      socket.on("message", async (raw: Buffer) => {
        try {
          const message = parseMessage(raw.toString());
          if (message.type !== "command") { socket.send(serializeMessage({ type: "reject", protocolVersion: 1, code: "unsupported-message", snapshot: room.getSnapshot() })); return; }
          const result = await room.submit(message.command);
          if (result.accepted) socket.send(serializeMessage({ type: "ack", protocolVersion: 1, commandId: result.commandId, eventSequence: result.eventSequence, snapshot: result.snapshot }));
          else socket.send(serializeMessage({ type: "reject", protocolVersion: 1, commandId: result.commandId, code: result.code, snapshot: result.snapshot }));
        } catch { socket.send(serializeMessage({ type: "reject", protocolVersion: 1, code: "invalid-message", snapshot: room.getSnapshot() })); }
      });
    });
  });
  return app;
}
