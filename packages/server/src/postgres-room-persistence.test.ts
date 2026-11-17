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
  assert.match(sql, /pg_advisory_xact_lock/);
  const migration = await fs.readFile(new URL("../migrations/001_private_rooms.py", import.meta.url), "utf8");
  assert.match(migration, /def downgrade\(\)/);
  assert.match(migration, /DROP TABLE IF EXISTS private_room_commands/);
});

test("PostgreSQL snapshot round-trip restores the last confirmed move after restart", async () => {
  let storedSnapshot: unknown;
  let storedCommand: string | undefined;
  const query = async (text: string, values: readonly unknown[] = []) => {
    if (text.startsWith("SELECT snapshot")) return { rows: storedSnapshot ? [{ snapshot: storedSnapshot }] : [] };
    if (text.includes("WITH saved_room")) {
      storedSnapshot = JSON.parse(String(values[5]));
      storedCommand = String(values[7]);
    }
    return { rows: [] };
  };
  const persistence = new PostgresRoomPersistence(query);
  const room = PrivateRoom.create(createRectangularBoard(2, 2), "Host", Date.now, persistence);
  const host = room.hostCredentials();
  room.join("Guest");
  const edge = room.getSnapshot().game!.board.edges[0].id;
  const result = await room.submit({ protocolVersion: 1, commandId: "restart-1", participantId: host.participantId, credential: host.reconnectCredential, version: room.getSnapshot().version, edgeId: edge });
  assert.equal(result.accepted, true);
  assert.equal(storedCommand, "restart-1");

  const restored = await persistence.load(room.roomId);
  assert.ok(restored);
  assert.equal(restored!.getSnapshot().eventSequence, 1);
  assert.deepEqual(restored!.getSnapshot().game!.occupiedEdges, [edge]);
  const duplicate = await restored!.submit({ protocolVersion: 1, commandId: "restart-1", participantId: host.participantId, credential: host.reconnectCredential, version: result.accepted ? result.snapshot.version : 0, edgeId: edge });
  assert.equal(duplicate.accepted, true);
  assert.equal(duplicate.eventSequence, 1);
  assert.equal(restored!.getSnapshot().eventSequence, 1);
});
