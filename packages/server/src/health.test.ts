import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "./index.js";
test("health endpoint uses shared engine package", async () => { const app = buildServer(); const response = await app.inject({ method: "GET", url: "/health" }); assert.equal(response.statusCode, 200); assert.deepEqual(response.json(), { ok: true, engine: true }); await app.close(); });
