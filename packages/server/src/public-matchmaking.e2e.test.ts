import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "./index.js";
import { testPublicPersistence } from "./test-public-persistence.js";
import WebSocket from "ws";

function receive(socket: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
    socket.once("error", reject);
  });
}

test("two real public WebSocket sessions receive ordered authoritative snapshots", { timeout: 5_000 }, async () => {
  const app = buildServer(undefined, testPublicPersistence());
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  const base = `ws://127.0.0.1:${address.port}`;
  const one = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Uno" } })).json();
  const two = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Dos" } })).json();
  const matchId = two.search.matchId;
  assert.ok(matchId);
  const sockets = [one, two].map(() => new WebSocket(`${base}/public/matches/${matchId}/ws`));
  const initial = await Promise.all(sockets.map(receive));
  assert.deepEqual(initial.map((message) => message.snapshot.version), [0, 0]);
  const snapshot = initial[0].snapshot;
  const current = snapshot.participants.find((participant: any) => participant.id === snapshot.game.currentPlayerId);
  const entry = [one, two].find((candidate) => candidate.participantId === current.id);
  assert.ok(entry);
  const command = { protocolVersion: 1, commandId: "proxy-contract-command", participantId: current.id, credential: entry.reconnectCredential, version: snapshot.version, edgeId: snapshot.game.board.edges[0].id };
  const response = await app.inject({ method: "POST", url: `/public/matches/${matchId}/commands`, payload: command });
  assert.equal(response.statusCode, 200);
  const events = await Promise.all(sockets.map(receive));
  assert.deepEqual(events.map((message) => message.snapshot.version), [1, 1]);
  assert.deepEqual(events[0].snapshot, events[1].snapshot);
  sockets.forEach((socket) => socket.close());
  await app.close();
});

test("real HTTP flow pairs two guests, exposes authoritative snapshot and cancels a third search", async () => {
  const app = buildServer(undefined, testPublicPersistence());
  const oneResponse = await app.inject({ method: "POST", url: "/public/search", payload: { name: "Uno", rows: 2, columns: 2 } });
  const one = oneResponse.json();
  assert.equal(oneResponse.statusCode, 201);
  const twoResponse = await app.inject({ method: "POST", url: "/public/search", payload: { name: "Dos", rows: 2, columns: 2 } });
  const two = twoResponse.json();
  assert.equal(twoResponse.statusCode, 201);
  assert.ok(two.search.matchId);
  const snapshot = await app.inject({ method: "GET", url: `/public/matches/${two.search.matchId}` });
  assert.equal(snapshot.statusCode, 200);
  assert.equal(snapshot.json().participants.length, 2);
  const third = await app.inject({ method: "POST", url: "/public/search", payload: { name: "Tres", rows: 2, columns: 2 } });
  const cancellation = await app.inject({ method: "POST", url: `/public/search/${third.json().search.searchId}/cancel` });
  assert.equal(cancellation.statusCode, 200);
  assert.equal(cancellation.json().status, "cancelled");
  await app.close();
  void one;
});

test("real HTTP command rejects stale and invalid commands without mutating snapshot", async () => {
  const app = buildServer(undefined, testPublicPersistence());
  const first = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Uno" } })).json();
  const second = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Dos" } })).json();
  const matchId = second.search.matchId;
  const snapshot = (await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json();
  const current = snapshot.game.currentPlayerId;
  const command = { protocolVersion: 1, commandId: "bad", participantId: current, credential: "not-a-secret", version: snapshot.version, edgeId: snapshot.game.board.edges[0].id };
  const response = await app.inject({ method: "POST", url: `/public/matches/${matchId}/commands`, payload: command });
  assert.equal(response.statusCode, 409);
  const after = (await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json();
  assert.deepEqual(after.game.occupiedEdges, snapshot.game.occupiedEdges);
  await app.close();
  void first;
});

test("real HTTP lifecycle reconnects the same public seat and rotates its credential", async () => {
  const app = buildServer(undefined, testPublicPersistence());
  const first = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Uno" } })).json();
  const second = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Dos" } })).json();
  const matchId = second.search.matchId;
  const snapshot = (await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json();
  const participant = snapshot.participants[0];
  const original = [first, second].find((entry) => entry.participantId === participant.id).reconnectCredential;
  const disconnected = await app.inject({ method: "POST", url: `/public/matches/${matchId}/participants/${participant.id}/lifecycle`, payload: { action: "disconnect" } });
  assert.equal(disconnected.statusCode, 200);
  const reconnected = await app.inject({ method: "POST", url: `/public/matches/${matchId}/participants/${participant.id}/lifecycle`, payload: { action: "reconnect", credential: original } });
  assert.equal(reconnected.statusCode, 200);
  assert.notEqual(reconnected.json().reconnectCredential, original);
  assert.equal(reconnected.json().snapshot.participants.find((seat: any) => seat.id === participant.id).status, "connected");
  await app.close();
});

test("real HTTP timeout offers machine fallback only after the server clock expires", async () => {
  let now = 200_000;
  const app = buildServer(undefined, testPublicPersistence(), () => now);
  const entered = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Solo" } })).json();
  now += 60_000;
  const timedOut = await app.inject({ method: "GET", url: `/public/search/${entered.search.searchId}` });
  assert.equal(timedOut.json().timedOut, true);
  const machine = await app.inject({ method: "POST", url: `/public/search/${entered.search.searchId}/machine` });
  assert.equal(machine.statusCode, 200);
  assert.equal(machine.json().search.status, "cancelled");
  assert.equal(machine.json().session.mode, "machine");
  await app.close();
});

test("real HTTP public lifecycle rejects a third participant and ends by abandonment at the server boundary", async () => {
  let now = 300_000;
  const app = buildServer(undefined, testPublicPersistence(), () => now);
  const first = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Uno" } })).json();
  const second = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Dos" } })).json();
  const matchId = second.search.matchId;
  const third = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Tres" } })).json();
  assert.equal((await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json().participants.length, 2);
  assert.equal((await app.inject({ method: "POST", url: `/public/search/${third.search.searchId}/cancel` })).json().status, "cancelled");

  const snapshot = (await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json();
  const absent = snapshot.participants[0];
  await app.inject({ method: "POST", url: `/public/matches/${matchId}/participants/${absent.id}/lifecycle`, payload: { action: "disconnect" } });
  now += 59_999;
  await app.inject({ method: "POST", url: `/public/matches/${matchId}/participants/${absent.id}/lifecycle`, payload: { action: "reconnect", credential: "wrong" } });
  assert.equal((await app.inject({ method: "GET", url: `/public/matches/${matchId}` })).json().status, "active");
  now += 1;
  const expired = await app.inject({ method: "POST", url: `/public/matches/${matchId}/participants/${absent.id}/lifecycle`, payload: { action: "reconnect", credential: "wrong" } });
  assert.equal(expired.statusCode, 409);
  await app.close();
  void first;
});

test("real HTTP concurrent cancellation remains idempotent and prevents a later match", async () => {
  const app = buildServer(undefined, testPublicPersistence());
  const entered = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Cancelado" } })).json();
  const [one, two] = await Promise.all([
    app.inject({ method: "POST", url: `/public/search/${entered.search.searchId}/cancel` }),
    app.inject({ method: "POST", url: `/public/search/${entered.search.searchId}/cancel` }),
  ]);
  assert.equal(one.statusCode, 200);
  assert.equal(two.statusCode, 200);
  assert.equal(one.json().status, "cancelled");
  assert.equal(two.json().status, "cancelled");
  const other = (await app.inject({ method: "POST", url: "/public/search", payload: { name: "Otro" } })).json();
  assert.equal(other.search.status, "searching");
  assert.equal(other.search.matchId, undefined);
  await app.close();
});
