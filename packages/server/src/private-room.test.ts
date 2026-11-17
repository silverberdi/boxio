import test from "node:test";
import assert from "node:assert/strict";
import { createRectangularBoard } from "@boxio/engine";
import { InMemoryRoomStore, PrivateRoom, RESERVATION_MS } from "./private-room.js";

const board = () => createRectangularBoard(2, 2);
const command = (room: PrivateRoom, participantId: string, credential: string, edgeId: string, commandId: string, version = room.getSnapshot().version) => room.submit({ protocolVersion: 1, participantId, credential, edgeId, commandId, version });

test("invitation is a locator and capacity is four participants", () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const one = room.join("One");
  const two = room.join("Two");
  const three = room.join("Three");
  assert.notEqual(host.participantId, one.participantId);
  assert.notEqual(host.reconnectCredential, one.reconnectCredential);
  assert.equal(room.getSnapshot().participants.length, 4);
  assert.throws(() => room.join("Five"), /full/);
  assert.equal(room.getSnapshot().participants.length, 4);
  assert.equal(room.getSnapshot().status, "active");
  void two; void three;
});

test("server validates identity, version, turn and command idempotency without mutation", async () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  const edge = room.getSnapshot().game!.board.edges[0].id;
  const forged = await command(room, guest.participantId, host.reconnectCredential, edge, "forged");
  assert.equal(forged.accepted, false);
  assert.equal(forged.code, "invalid-credential");
  const accepted = await command(room, host.participantId, host.reconnectCredential, edge, "move-1");
  assert.equal(accepted.accepted, true);
  const duplicate = await command(room, host.participantId, host.reconnectCredential, edge, "move-1", 1);
  assert.equal(duplicate.accepted, true);
  if (accepted.accepted && duplicate.accepted) assert.equal(duplicate.eventSequence, accepted.eventSequence);
  const stale = await command(room, guest.participantId, guest.reconnectCredential, room.getSnapshot().game!.board.edges[1].id, "stale", 0);
  assert.equal(stale.accepted, false);
  assert.equal(stale.code, "stale-version");
});

test("late entry waits for the current turn chain and starts with zero", async () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  const first = room.getSnapshot().game!.board.edges[0].id;
  const result = await command(room, host.participantId, host.reconnectCredential, first, "first");
  assert.equal(result.accepted, true);
  const late = room.join("Late");
  assert.equal(late.snapshot.participants.find((p) => p.id === late.participantId)?.score, 0);
  assert.deepEqual(late.snapshot.game!.players.map((p) => p.id), [host.participantId, guest.participantId]);
  const next = late.snapshot.game!.board.edges.find((edge) => !late.snapshot.game!.occupiedEdges.includes(edge.id))!.id;
  const nextResult = await command(room, guest.participantId, guest.reconnectCredential, next, "second", late.snapshot.version);
  assert.equal(nextResult.accepted, true);
  assert.ok(nextResult.accepted && nextResult.snapshot.game!.players.some((p) => p.id === late.participantId));
});

test("late entry during a capture chain joins only after the extra turn ends", async () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  const cellEdges = room.getSnapshot().game!.board.cells[0].edges;
  let version = room.getSnapshot().version;
  assert.equal((await command(room, host.participantId, host.reconnectCredential, cellEdges[0], "chain-1", version)).accepted, true);
  version = room.getSnapshot().version;
  assert.equal((await command(room, guest.participantId, guest.reconnectCredential, cellEdges[1], "chain-2", version)).accepted, true);
  version = room.getSnapshot().version;
  assert.equal((await command(room, host.participantId, host.reconnectCredential, cellEdges[2], "chain-3", version)).accepted, true);

  const late = room.join("Late");
  version = room.getSnapshot().version;
  const capture = await command(room, guest.participantId, guest.reconnectCredential, cellEdges[3], "chain-4", version);
  assert.equal(capture.accepted, true);
  assert.equal(capture.accepted && capture.completedCells.length, 1);
  assert.ok(capture.accepted && !capture.snapshot.game!.players.some((player) => player.id === late.participantId));

  const nextEdge = room.getSnapshot().game!.board.edges.find((edge) => !room.getSnapshot().game!.occupiedEdges.includes(edge.id))!;
  const integrated = await command(room, guest.participantId, guest.reconnectCredential, nextEdge.id, "chain-5");
  assert.equal(integrated.accepted, true);
  assert.ok(integrated.accepted && integrated.snapshot.game!.players.some((player) => player.id === late.participantId));
  assert.equal(integrated.accepted && integrated.snapshot.participants.find((participant) => participant.id === late.participantId)?.score, 0);
});

test("reconnect rotates private credential and expiration retires identity for replacement", () => {
  let now = 1_000;
  const room = PrivateRoom.create(board(), "Host", () => now);
  const host = room.hostCredentials();
  room.join("Guest");
  room.disconnect(host.participantId, now);
  assert.throws(() => room.reconnect(host.participantId, host.reconnectCredential, now + RESERVATION_MS), /Invalid/);
  room.expireReservations(now + RESERVATION_MS);
  const replacement = room.join("Replacement");
  const original = replacement.snapshot.participants.find((p) => p.id === host.participantId)!;
  assert.equal(original.status, "retired");
  assert.equal(replacement.snapshot.participants.find((p) => p.id === replacement.participantId)?.score, 0);
});

test("replacement remains independent while a scored retired participant stays eligible", async () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  const credentials = new Map([[host.participantId, host.reconnectCredential], [guest.participantId, guest.reconnectCredential]]);
  let scored: string | undefined;
  let guard = 0;
  while (!scored && guard++ < 100) {
    const state = room.getSnapshot();
    const playerId = state.game!.currentPlayerId;
    const edgeId = state.game!.board.edges.find((edge) => !state.game!.occupiedEdges.includes(edge.id))!.id;
    const result = await command(room, playerId, credentials.get(playerId)!, edgeId, `score-${guard}`);
    assert.equal(result.accepted, true);
    scored = room.getSnapshot().participants.find((participant) => participant.score > 0)?.id;
  }
  assert.ok(scored);
  const scoredCredential = credentials.get(scored!)!;
  room.disconnect(scored!);
  room.expireReservations(Date.now() + RESERVATION_MS);
  const replacement = room.join("Replacement");
  assert.equal(replacement.snapshot.participants.find((participant) => participant.id === scored)?.status, "retired");
  assert.equal(replacement.snapshot.participants.find((participant) => participant.id === replacement.participantId)?.score, 0);
  assert.throws(() => room.reconnect(scored!, scoredCredential), /Invalid/);

  credentials.set(replacement.participantId, replacement.reconnectCredential);
  while (room.getSnapshot().status === "active" && guard++ < 200) {
    const state = room.getSnapshot();
    const playerId = state.game!.currentPlayerId;
    const credential = credentials.get(playerId);
    if (!credential) break;
    const edge = state.game!.board.edges.find((candidate) => !state.game!.occupiedEdges.includes(candidate.id));
    if (!edge) break;
    assert.equal((await command(room, playerId, credential, edge.id, `finish-${guard}`)).accepted, true);
  }
  const result = room.getSnapshot().result!;
  assert.ok(result.participants.includes(scored!));
  assert.ok(result.participants.includes(replacement.participantId));
  void scoredCredential;
});

test("restore uses the last confirmed snapshot and does not replay a command", async () => {
  const original = PrivateRoom.create(board(), "Host");
  const host = original.hostCredentials();
  const guest = original.join("Guest");
  const edge = original.getSnapshot().game!.board.edges[0].id;
  const accepted = await command(original, host.participantId, host.reconnectCredential, edge, "durable-1");
  assert.equal(accepted.accepted, true);
  const restored = PrivateRoom.restore(original.toPersistence());
  const duplicate = await command(restored, host.participantId, host.reconnectCredential, edge, "durable-1", original.getSnapshot().version);
  assert.equal(duplicate.accepted, true);
  assert.equal(duplicate.accepted && duplicate.eventSequence, 1);
  const next = restored.getSnapshot().game!.board.edges.find((candidate) => !restored.getSnapshot().game!.occupiedEdges.includes(candidate.id))!;
  const nextResult = await command(restored, guest.participantId, guest.reconnectCredential, next.id, "durable-2");
  assert.equal(nextResult.accepted, true);
  assert.equal(restored.getSnapshot().eventSequence, 2);
});

test("host departure does not transfer state and empty rooms close", () => {
  const room = PrivateRoom.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  const afterHost = room.leave(host.participantId);
  assert.equal(afterHost.status, "active");
  assert.equal(afterHost.participants.find((p) => p.id === guest.participantId)?.host, false);
  assert.equal(room.leave(guest.participantId).status, "closed");
});

test("finished rooms are removed idempotently at the 24 hour retention boundary", () => {
  const store = new InMemoryRoomStore();
  const room = store.create(board(), "Host");
  const host = room.hostCredentials();
  const guest = room.join("Guest");
  room.leave(host.participantId);
  room.leave(guest.participantId);
  const finishedAt = Date.parse(room.getSnapshot().finishedAt!);
  assert.deepEqual(store.cleanup(finishedAt + 24 * 60 * 60 * 1_000 - 1), []);
  assert.deepEqual(store.cleanup(finishedAt + 24 * 60 * 60 * 1_000), [room.roomId]);
  assert.deepEqual(store.cleanup(finishedAt + 24 * 60 * 60 * 1_000), []);
});
