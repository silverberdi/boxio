import Fastify from "fastify";
import { createBoard } from "@boxio/engine";

export function buildServer() {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, engine: createBoard([]).cells.length === 0 }));
  return app;
}
