import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { buildServer, PersistentRoomStore } from "./index.js";
import { PostgresRoomPersistence } from "./postgres-room-persistence.js";

const port = Number(process.env.PORT ?? 8080);
const host = "0.0.0.0";

let store: PersistentRoomStore;

if (process.env.DATABASE_URL) {
  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    // Run migration if tables do not exist
    try {
      const migrationUrl = new URL("../migrations/001_private_rooms.sql", import.meta.url);
      const migrationSql = await fs.readFile(migrationUrl, "utf-8");
      await pool.query(migrationSql);
      console.log("[@boxio/server] Database migration applied successfully");
    } catch (migErr) {
      console.warn("[@boxio/server] Migration warning (tables may already exist):", migErr);
    }

    const persistence = new PostgresRoomPersistence(async (text, values) => {
      const res = await pool.query(text, values as unknown[]);
      return { rows: res.rows };
    });

    store = new PersistentRoomStore(persistence);
    console.log("[@boxio/server] Connected to PostgreSQL with PersistentRoomStore");
  } catch (err) {
    console.warn("[@boxio/server] PostgreSQL connection failed, falling back to memory:", err);
    store = new PersistentRoomStore();
  }
} else {
  store = new PersistentRoomStore();
}

const server = buildServer(store);
await server.listen({ port, host });
console.log(`[@boxio/server] Listening on http://${host}:${port}`);
