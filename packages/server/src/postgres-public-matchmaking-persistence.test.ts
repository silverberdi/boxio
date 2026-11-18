import test from "node:test";
import assert from "node:assert/strict";
import { createRectangularBoard } from "@boxio/engine";
import { PostgresPublicMatchmakingPersistence } from "./postgres-public-matchmaking-persistence.js";
import { createPostgresPublicMatchmakingPersistence } from "./postgres-public-matchmaking-persistence.js";
import { buildServer } from "./index.js";
import { Pool } from "pg";

test("public PostgreSQL adapter uses transactional upserts and never stores plaintext credentials", async () => {
  const calls: Array<{ text: string; values: readonly unknown[] }> = [];
  const adapter = new PostgresPublicMatchmakingPersistence(async (text, values = []) => {
    calls.push({ text, values });
    return { rows: [] };
  });
  await adapter.save({ searches: [{ searchId: "00000000-0000-0000-0000-000000000001", participantId: "00000000-0000-0000-0000-000000000002", name: "Uno", board: createRectangularBoard(2, 2), status: "searching", version: 0, createdAt: 1, timedOut: false, credentialHash: "hash-only" }], matches: [] });
  assert.equal(calls[0].text, "BEGIN");
  assert.match(calls.map((call) => call.text).join("\n"), /ON CONFLICT \(search_id\)/);
  assert.equal(calls.some((call) => call.values.includes("hash-only")), true);
  assert.equal(calls.some((call) => call.values.includes("plaintext")), false);
  assert.equal(calls.at(-1)?.text, "COMMIT");
});

test("production public persistence has no in-memory fallback", () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    assert.throws(
      () => createPostgresPublicMatchmakingPersistence(undefined),
      /DATABASE_URL is required for public matchmaking/,
    );
  } finally {
    if (previous !== undefined) process.env.DATABASE_URL = previous;
  }
});

test("real PostgreSQL integration persists migration, HTTP race, restart and terminal state", { skip: !process.env.DATABASE_URL, timeout: 30_000 }, async (t) => {
  const configuredDatabaseUrl = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: configuredDatabaseUrl });
  const client = await pool.connect();
  const schema = `d7_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  t.after(async () => { client.release(); await pool.end(); });
  const sql = await (await import("node:fs/promises")).readFile(new URL("../migrations/002_public_matchmaking.sql", import.meta.url), "utf8");
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET search_path TO ${schema}`);
  const databaseUrl = `${configuredDatabaseUrl}${configuredDatabaseUrl.includes("?") ? "&" : "?"}options=${encodeURIComponent(`-csearch_path=${schema}`)}`;
  try {
    await client.query(sql);
    let now = 1_000_000;
    const firstDatabase = createPostgresPublicMatchmakingPersistence(databaseUrl);
    const first = buildServer(undefined, firstDatabase.persistence, () => now);
    await first.listen({ host: "127.0.0.1", port: 0 });
    const address = first.server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init);
    const entered = await (await request("/public/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Uno" }) })).json() as { search: { searchId: string } };
    const [cancelResponse, secondResponse] = await Promise.all([
      request(`/public/search/${entered.search.searchId}/cancel`, { method: "POST" }),
      request("/public/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Dos" }) }),
    ]);
    assert.equal(cancelResponse.status, 200);
    const cancelled = await cancelResponse.json() as { status: string; matchId?: string };
    const second = await secondResponse.json() as { search: { status: string; matchId?: string } };
    const third = second.search.matchId ? second : await (await request("/public/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Tres" }) })).json() as typeof second;
    assert.equal(third.search.status, "matched");
    assert.ok(third.search.matchId);
    assert.ok(cancelled.status === "cancelled" || cancelled.status === "matched");
    const beforeRestart = await (await request(`/public/matches/${third.search.matchId}`)).json() as { participants: Array<{ id: string }> };
    const absent = beforeRestart.participants[0];
    await request(`/public/matches/${third.search.matchId}/participants/${absent.id}/lifecycle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "disconnect" }) });
    await first.close();
    await firstDatabase.close();

    const restartedDatabase = createPostgresPublicMatchmakingPersistence(databaseUrl);
    const restarted = buildServer(undefined, restartedDatabase.persistence, () => now);
    await restarted.listen({ host: "127.0.0.1", port: 0 });
    const restartedAddress = restarted.server.address();
    assert.ok(restartedAddress && typeof restartedAddress === "object");
    const restartedRequest = (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${restartedAddress.port}${path}`, init);
    assert.equal((await (await restartedRequest(`/public/matches/${third.search.matchId}`)).json() as { participants: Array<unknown> }).participants.length, 2);
    now += 60_000;
    const expired = await restartedRequest(`/public/matches/${third.search.matchId}/participants/${absent.id}/lifecycle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reconnect", credential: "wrong" }) });
    assert.equal(expired.status, 409);
    const terminal = await (await restartedRequest(`/public/matches/${third.search.matchId}`)).json() as { status: string; result?: { cause: string } };
    assert.equal(terminal.status, "abandoned");
    assert.equal(terminal.result?.cause, "abandonment");
    await restarted.close();
    await restartedDatabase.close();

    const afterRestartDatabase = createPostgresPublicMatchmakingPersistence(databaseUrl);
    const afterRestart = buildServer(undefined, afterRestartDatabase.persistence, () => now);
    await afterRestart.listen({ host: "127.0.0.1", port: 0 });
    const afterRestartAddress = afterRestart.server.address();
    assert.ok(afterRestartAddress && typeof afterRestartAddress === "object");
    const durable = await (await fetch(`http://127.0.0.1:${afterRestartAddress.port}/public/matches/${third.search.matchId}`)).json() as { status: string; result?: { cause: string } };
    assert.equal(durable.status, "abandoned");
    assert.equal(durable.result?.cause, "abandonment");
    await afterRestart.close();
    await afterRestartDatabase.close();

    await client.query("DROP TABLE public_match_seats, public_matches, public_matchmaking_searches CASCADE");
    await client.query(sql);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM public_matchmaking_searches")).rows[0].count, 0);
  } finally {
    await client.query(`DROP SCHEMA ${schema} CASCADE`);
  }
});

test("public PostgreSQL adapter loads snapshots and hashes without replaying commands", async () => {
  const board = createRectangularBoard(2, 2);
  const snapshot = { matchId: "m", board, status: "active", version: 1, eventSequence: 1, game: { board, players: [], currentPlayerId: "p", occupiedEdges: [], edgeOwners: {}, cellOwners: {}, scores: {}, status: "active", winners: [] }, seats: [], commands: [], result: undefined };
  const adapter = new PostgresPublicMatchmakingPersistence(async (text) => text.includes("public_matchmaking_searches")
    ? { rows: [{ search_id: "s", participant_id: "p", name: "Uno", status: "searching", version: 0, board, created_at: new Date(1).toISOString(), timed_out: false, participant_credential_hash: "hash" }] }
    : { rows: [{ snapshot }] });
  const loaded = await adapter.load();
  assert.equal(loaded.searches[0].credentialHash, "hash");
  assert.equal(loaded.matches[0].eventSequence, 1);
});

test("D7 migration declares reversible downgrade and fixed-seat constraints", async () => {
  const fs = await import("node:fs/promises");
  const sql = await fs.readFile(new URL("../migrations/002_public_matchmaking.sql", import.meta.url), "utf8");
  const migration = await fs.readFile(new URL("../migrations/002_public_matchmaking.py", import.meta.url), "utf8");
  assert.match(sql, /status IN \('searching', 'cancelled', 'matched'\)/);
  assert.match(sql, /PRIMARY KEY \(match_id, seat\)/);
  assert.match(sql, /UNIQUE \(match_id, participant_id\)/);
  assert.match(sql, /finish_cause text CHECK/);
  assert.match(migration, /def downgrade\(\)/);
  assert.match(migration, /DROP TABLE IF EXISTS public_match_seats;[\s\S]*DROP TABLE IF EXISTS public_matches;[\s\S]*DROP TABLE IF EXISTS public_matchmaking_searches/);
});
