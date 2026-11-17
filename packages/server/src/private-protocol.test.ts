import test from "node:test";
import assert from "node:assert/strict";
import { parseMessage, serializeMessage } from "./private-protocol.js";

test("protocol messages are versioned JSON and reject unknown versions", () => {
  const encoded = serializeMessage({ type: "reject", protocolVersion: 1, code: "forbidden", snapshot: {} as never });
  assert.equal(parseMessage(encoded).type, "reject");
  assert.throws(() => parseMessage('{"type":"snapshot","protocolVersion":2}'), /Unsupported/);
});
