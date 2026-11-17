import test from "node:test";
import assert from "node:assert/strict";
import { createRectangularBoard } from "@boxio/engine";
import { PrivateRoom } from "./private-room.js";
import { PostgresRoomPersistence } from "./postgres-room-persistence.js";

test("PostgreSQL adapter persists a complete snapshot and command with parameters", async () => {
  const calls: Array<{ text: string; values: readonly unknown[] }> = [];
  const persistence = new PostgresRoomPersistence(async (text, values = []) => {
    calls.push({ text, values });
    return { rows: [] };
  });
  const room = PrivateRoom.create(createRectangularBoard(2, 2), "Host", Date.now, persistence);
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  await room.submit({ protocolVersion: 1, commandId: "pg-1", participantId: host.participantId, credential: host.reconnectCredential, version: room.getSnapshot().version, edgeId: room.getSnapshot().game!.board.edges[0].id });
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /WITH saved_room/);
  assert.match(calls[0].text, /private_room_commands/);
  assert.equal(JSON.stringify(calls).includes(host.reconnectCredential), false);
  void guest;
});

test("cleanup uses PostgreSQL retention atomically and exposes no availability promise", async () => {
  let statement = "";
  const persistence = new PostgresRoomPersistence(async (text) => {
    statement = text;
    return { rows: [] };
  });
  const removed = await persistence.cleanupFinished(new Date("2026-11-17T00:00:00.000Z"));
  assert.equal(removed, 0);
  assert.match(statement, /DELETE FROM private_rooms/);
  assert.match(statement, /24 hours/);
});

test("migration contains capacity, uniqueness, idempotency and credential-hash constraints", async () => {
  const fs = await import("node:fs/promises");
  const sql = await fs.readFile(new URL("../migrations/001_private_rooms.sql", import.meta.url), "utf8");
  assert.match(sql, /credential_hash/);
  assert.match(sql, /PRIMARY KEY \(room_id, command_id\)/);
  assert.match(sql, /UNIQUE INDEX .*one_host/);
  assert.match(sql, /private_room_capacity_trigger/);
  assert.match(sql, /ON DELETE CASCADE/);
});
