import test from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import { createRectangularBoard } from "@boxio/engine";
import { buildServer, PersistentRoomStore } from "./index.js";
import { PrivateRoom, type RoomPersistence } from "./private-room.js";

function recordingPersistence() {
  const saved: PrivateRoom[] = [];
  const persistence: RoomPersistence = { save: async (room) => { saved.push(room); } };
  return { persistence, saved };
}

test("join and lifecycle transitions are persisted before HTTP responses", async () => {
  const { persistence, saved } = recordingPersistence();
  const store = new PersistentRoomStore(persistence);
  const app = buildServer(store);

  const created = await app.inject({ method: "POST", url: "/rooms", payload: { name: "Host", rows: 2, columns: 2 } });
  const host = created.json();
  const joined = await app.inject({ method: "POST", url: `/rooms/${host.roomId}/join`, payload: { name: "Guest", invitationCode: host.invitationCode } });
  assert.equal(joined.statusCode, 201);
  assert.equal(saved.length, 2, "create and join must both be durable");

  const guest = joined.json();
  const lifecycle = await app.inject({ method: "POST", url: `/rooms/${host.roomId}/participants/${guest.participantId}/lifecycle`, payload: { action: "disconnect" } });
  assert.equal(lifecycle.statusCode, 200);
  assert.equal(saved.length, 3, "disconnect must be durable before the response");
  await app.close();
});

test("persistent store loads an invitation miss from its durable adapter", async () => {
  const room = PrivateRoom.create(createRectangularBoard(2, 2), "Host");
  const loadedByInvitation = async (invitationCode: string) => invitationCode === room.invitationCode ? room : undefined;
  const store = new PersistentRoomStore({ save: async () => {}, loadByInvitation: loadedByInvitation } as RoomPersistence & { loadByInvitation: typeof loadedByInvitation });
  const loaded = await store.getByInvitation(room.invitationCode);
  assert.equal(loaded?.roomId, room.roomId);
});

test("WebSocket reconnection is persisted before its snapshot is sent", { timeout: 5_000 }, async () => {
  const { persistence, saved } = recordingPersistence();
  const app = buildServer(new PersistentRoomStore(persistence));
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address === "object");
  const created = (await app.inject({ method: "POST", url: "/rooms", payload: { name: "Host", rows: 2, columns: 2 } })).json();
  const guest = (await app.inject({ method: "POST", url: `/rooms/${created.roomId}/join`, payload: { name: "Guest", invitationCode: created.invitationCode } })).json();
  await app.inject({ method: "POST", url: `/rooms/${created.roomId}/participants/${guest.participantId}/lifecycle`, payload: { action: "disconnect" } });

  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/rooms/${created.roomId}/ws`);
  const initial = new Promise<void>((resolve) => socket.once("message", () => resolve()));
  await new Promise<void>((resolve, reject) => { socket.once("open", () => resolve()); socket.once("error", reject); });
  await initial;
  const snapshot = new Promise<void>((resolve) => socket.once("message", () => resolve()));
  socket.send(JSON.stringify({ type: "reconnect", protocolVersion: 1, participantId: guest.participantId, credential: guest.reconnectCredential }));
  await snapshot;
  assert.equal(saved.length, 4, "reconnect must be durable before the snapshot");
  socket.terminate();
  await app.close();
});
