import test from "node:test";
import assert from "node:assert/strict";
import { createRectangularBoard } from "@boxio/engine";
import { PublicMatchmaking, PUBLIC_TIMEOUT_MS } from "./public-matchmaking.js";
import { testPublicPersistence } from "./test-public-persistence.js";

test("public queue pairs exactly two guests and rejects a cancelled search", async () => {
  let now = 1_000;
  const queue = new PublicMatchmaking(() => now, testPublicPersistence());
  const first = await queue.enter(createRectangularBoard(2, 2), "Uno");
  const cancelled = await queue.cancel(first.search.searchId);
  assert.equal(cancelled.status, "cancelled");
  const second = await queue.enter(createRectangularBoard(2, 2), "Dos");
  assert.equal(second.match, undefined);
  assert.equal((await queue.cancel(first.search.searchId)).status, "cancelled", "cancel retries are idempotent");
  const third = await queue.enter(createRectangularBoard(2, 2), "Tres");
  assert.ok(third.match);
  assert.equal(third.match!.participants.length, 2);
  assert.equal(third.match!.participants.some((p) => p.name === "Uno"), false);
  void now;
});

test("timeout offers separate machine flow and continuation resets server clock", async () => {
  let now = 10_000;
  const queue = new PublicMatchmaking(() => now, testPublicPersistence());
  const entered = await queue.enter(createRectangularBoard(2, 2), "Invitado");
  now += PUBLIC_TIMEOUT_MS;
  assert.equal((await queue.getSearch(entered.search.searchId))!.timedOut, true);
  const continued = await queue.continue(entered.search.searchId);
  assert.equal(continued.timedOut, false);
  now += PUBLIC_TIMEOUT_MS;
  const machine = await queue.machine(entered.search.searchId);
  assert.equal(machine.search.status, "cancelled");
  assert.equal(machine.session.mode, "machine");
  assert.equal(machine.session.state.players.length, 2);
  assert.equal(machine.session.state.players.some((player) => player.kind === "automatic"), true);
  await assert.rejects(() => queue.continue(entered.search.searchId), /available/);
});

test("concurrent queue entries are serialized into one two-seat match", async () => {
  const queue = new PublicMatchmaking(Date.now, testPublicPersistence());
  const results = await Promise.all(["A", "B", "C"].map((name) => queue.enter(createRectangularBoard(2, 2), name)));
  assert.equal(results.filter((result) => result.match).length, 1);
  const matched = results.find((result) => result.match)!.match!;
  assert.equal(matched.participants.length, 2);
  assert.equal(new Set(matched.participants.map((participant) => participant.name)).size, 2);
});

test("public commands preserve identity, turn, duplicate and engine invariants", async () => {
  const queue = new PublicMatchmaking(Date.now, testPublicPersistence());
  const first = await queue.enter(createRectangularBoard(2, 2), "Uno");
  const second = await queue.enter(createRectangularBoard(2, 2), "Dos");
  assert.ok(second.search.matchId);
  const credentials = queue.matchCredentials(second.search.matchId!);
  assert.ok(credentials);
  const snapshot = (await queue.getMatch(second.search.matchId!))!;
  const current = snapshot.game.currentPlayerId;
  const currentCredential = credentials!.find((entry) => entry.participantId === current)!.reconnectCredential;
  const edge = snapshot.game.board.edges[0].id;
  const accepted = await queue.command(second.search.matchId!, { protocolVersion: 1, commandId: "m-1", participantId: current, credential: currentCredential, version: snapshot.version, edgeId: edge });
  assert.equal(accepted!.accepted, true);
  const duplicate = await queue.command(second.search.matchId!, { protocolVersion: 1, commandId: "m-1", participantId: current, credential: currentCredential, version: snapshot.version, edgeId: edge });
  assert.equal(duplicate!.accepted, true);
  assert.equal((await queue.getMatch(second.search.matchId!))!.eventSequence, 1);
  const invalid = await queue.command(second.search.matchId!, { protocolVersion: 1, commandId: "m-2", participantId: first.participantId, credential: "wrong", version: 0, edgeId: edge });
  assert.equal(invalid!.accepted, false);
  assert.equal((await queue.getMatch(second.search.matchId!))!.eventSequence, 1);
});

test("a legal public game completes through the shared engine with square scoring and extra turns", async () => {
  const queue = new PublicMatchmaking(Date.now, testPublicPersistence());
  await queue.enter(createRectangularBoard(2, 2), "Uno");
  const second = await queue.enter(createRectangularBoard(2, 2), "Dos");
  const matchId = second.search.matchId!;
  const credentials = queue.matchCredentials(matchId)!;
  let state = (await queue.getMatch(matchId))!;
  let sequence = 0;
  while (state.status === "active") {
    const current = state.game.currentPlayerId;
    const secret = credentials.find((entry) => entry.participantId === current)!.reconnectCredential;
    const edge = state.game.board.edges.find((candidate) => !state.game.occupiedEdges.includes(candidate.id))!;
    const result = await queue.command(matchId, { protocolVersion: 1, commandId: `complete-${sequence}`, participantId: current, credential: secret, version: state.version, edgeId: edge.id });
    assert.equal(result!.accepted, true);
    sequence++;
    state = (await queue.getMatch(matchId))!;
  }
  assert.equal(state.status, "complete");
  assert.equal(Object.values(state.game.scores).reduce((total, score) => total + score, 0), 4);
  assert.equal(state.eventSequence, 12);
});

test("public disconnect expires to abandonment and never infers winner from score", async () => {
  let now = 50_000;
  const queue = new PublicMatchmaking(() => now, testPublicPersistence());
  await queue.enter(createRectangularBoard(2, 2), "Uno");
  const second = await queue.enter(createRectangularBoard(2, 2), "Dos");
  const matchId = second.search.matchId!;
  const match = (await queue.getMatch(matchId))!;
  const absent = match.participants[0];
  await queue.disconnect(matchId, absent.id, now);
  now += PUBLIC_TIMEOUT_MS;
  await queue.expire(now);
  const finished = (await queue.getMatch(matchId))!;
  assert.equal(finished.status, "abandoned");
  assert.equal(finished.result?.cause, "abandonment");
  assert.deepEqual(finished.result?.winners, [match.participants[1].id]);
  await assert.rejects(() => queue.reconnect(matchId, absent.id, "anything", now), /Invalid/);
});

test("public reconnection within the reservation restores the same seat and rotates credential", async () => {
  let now = 70_000;
  const queue = new PublicMatchmaking(() => now, testPublicPersistence());
  await queue.enter(createRectangularBoard(2, 2), "Uno");
  const second = await queue.enter(createRectangularBoard(2, 2), "Dos");
  const matchId = second.search.matchId!;
  const participant = (await queue.getMatch(matchId))!.participants[0];
  const original = queue.matchCredentials(matchId)!.find((entry) => entry.participantId === participant.id)!.reconnectCredential;
  await queue.disconnect(matchId, participant.id, now);
  now += PUBLIC_TIMEOUT_MS - 1;
  const restored = await queue.reconnect(matchId, participant.id, original, now);
  assert.ok(restored);
  assert.notEqual(restored!.reconnectCredential, original);
  assert.equal(restored!.snapshot.participants.find((seat) => seat.id === participant.id)?.status, "connected");
  await assert.rejects(() => queue.reconnect(matchId, participant.id, original, now), /Invalid/);
});

test("public matchmaking restores a confirmed snapshot after restart and does not replay its event", async () => {
  let durable: any;
  const persistence = {
    load: async () => durable,
    save: async (state: any) => { durable = structuredClone(state); },
  };
  const firstServer = new PublicMatchmaking(Date.now, persistence);
  const first = await firstServer.enter(createRectangularBoard(2, 2), "Uno");
  const second = await firstServer.enter(createRectangularBoard(2, 2), "Dos");
  const matchId = second.search.matchId!;
  const before = (await firstServer.getMatch(matchId))!;
  const current = before.game.currentPlayerId;
  const currentCredential = [first, second].find((entry) => entry.participantId === current)!.reconnectCredential;
  const command = { protocolVersion: 1 as const, commandId: "restart-public-1", participantId: current, credential: currentCredential, version: before.version, edgeId: before.game.board.edges[0].id };
  const moved = await firstServer.command(matchId, command);
  assert.equal(moved?.accepted, true);

  const restarted = new PublicMatchmaking(Date.now, persistence);
  const restored = (await restarted.getMatch(matchId))!;
  assert.equal(restored.eventSequence, 1);
  assert.deepEqual(restored.game.occupiedEdges, [before.game.board.edges[0].id]);
  const duplicate = await restarted.command(matchId, command);
  assert.equal(duplicate?.accepted, true);
  assert.equal(duplicate?.eventSequence, 1);
  assert.equal((await restarted.getMatch(matchId))!.eventSequence, 1);
});

test("a restored public match keeps terminal abandonment terminal", async () => {
  let now = 100_000;
  let durable: any;
  const persistence = { load: async () => durable, save: async (state: any) => { durable = structuredClone(state); } };
  const running = new PublicMatchmaking(() => now, persistence);
  await running.enter(createRectangularBoard(2, 2), "Uno");
  const second = await running.enter(createRectangularBoard(2, 2), "Dos");
  const matchId = second.search.matchId!;
  const snapshot = (await running.getMatch(matchId))!;
  await running.disconnect(matchId, snapshot.participants[0].id, now);
  now += PUBLIC_TIMEOUT_MS;
  await running.expire(now);
  const restarted = new PublicMatchmaking(() => now, persistence);
  assert.equal((await restarted.getMatch(matchId))!.status, "abandoned");
  await restarted.expire(now + PUBLIC_TIMEOUT_MS);
  assert.equal((await restarted.getMatch(matchId))!.result?.cause, "abandonment");
});
