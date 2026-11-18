import type { PublicMatchmakingPersistence, PublicMatchPersistence, PublicSearchPersistence } from "./public-matchmaking.js";
import type { PostgresQuery } from "./postgres-room-persistence.js";
import { Pool } from "pg";

type StoredState = Readonly<{ searches: readonly PublicSearchPersistence[]; matches: readonly PublicMatchPersistence[] }>;
type PostgresTransaction = (work: (query: PostgresQuery) => Promise<void>) => Promise<void>;

/** PostgreSQL adapter for the public queue. Secrets are represented only by hashes. */
export class PostgresPublicMatchmakingPersistence implements PublicMatchmakingPersistence {
  constructor(private readonly query: PostgresQuery, private readonly transaction?: PostgresTransaction) {}

  async load(): Promise<StoredState> {
    const [searches, matches] = await Promise.all([
      this.query("SELECT search_id, participant_id, name, status, version, board, created_at, timed_out, match_id, participant_credential_hash FROM public_matchmaking_searches WHERE status IN ('searching', 'matched', 'cancelled')"),
      this.query("SELECT snapshot FROM public_matches WHERE status IN ('active', 'complete', 'abandoned')"),
    ]);
    return {
      searches: searches.rows.map((row) => ({
        searchId: String(row.search_id), participantId: String(row.participant_id), name: String(row.name), status: row.status as PublicSearchPersistence["status"],
        version: Number(row.version), board: parseJson(row.board), createdAt: new Date(String(row.created_at)).getTime(), timedOut: Boolean(row.timed_out),
        ...(row.match_id ? { matchId: String(row.match_id) } : {}), credentialHash: String(row.participant_credential_hash),
      })),
      matches: matches.rows.map((row) => parseJson(row.snapshot) as PublicMatchPersistence),
    };
  }

  async save(state: StoredState): Promise<void> {
    const write = async (query: PostgresQuery): Promise<void> => {
      // Upserts are idempotent; no destructive mass delete
      for (const search of state.searches) {
        await query(
          `INSERT INTO public_matchmaking_searches
             (search_id, participant_id, name, status, version, board, created_at, timed_out, match_id, participant_credential_hash)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7::timestamptz, $8, $9::uuid, $10)
           ON CONFLICT (search_id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version,
             board = EXCLUDED.board, timed_out = EXCLUDED.timed_out, match_id = EXCLUDED.match_id`,
          [search.searchId, search.participantId, search.name, search.status, search.version, JSON.stringify(search.board), new Date(search.createdAt).toISOString(), search.timedOut, search.matchId ?? null, search.credentialHash],
        );
      }
      for (const match of state.matches) {
        await query(
          `INSERT INTO public_matches (match_id, status, version, event_sequence, snapshot, finish_cause, finished_at)
           VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, CASE WHEN $2 <> 'active' THEN now() ELSE NULL END)
           ON CONFLICT (match_id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version,
             event_sequence = EXCLUDED.event_sequence, snapshot = EXCLUDED.snapshot,
             finish_cause = EXCLUDED.finish_cause, finished_at = EXCLUDED.finished_at`,
          [match.matchId, match.status, match.version, match.eventSequence, JSON.stringify(match), match.result?.cause ?? null],
        );
        for (let i = 0; i < (match.seats || []).length; i++) {
          const seat = match.seats[i];
          const expiresAt = seat.reservationExpiresAt ? new Date(seat.reservationExpiresAt).toISOString() : null;
          await query(
            `INSERT INTO public_match_seats (match_id, participant_id, seat, status, reservation_expires_at)
             VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamptz)
             ON CONFLICT (match_id, seat) DO UPDATE SET participant_id = EXCLUDED.participant_id,
               status = EXCLUDED.status, reservation_expires_at = EXCLUDED.reservation_expires_at`,
            [match.matchId, seat.id, i, seat.status, expiresAt],
          );
        }
      }
    };
    if (this.transaction) return this.transaction(write);
    await this.query("BEGIN");
    try { await write(this.query); await this.query("COMMIT"); }
    catch (error) { await this.query("ROLLBACK"); throw error; }
  }
}

/** Creates the production adapter. A missing URL is a configuration error, not
 * permission to fall back to process-local state. */
export function createPostgresPublicMatchmakingPersistence(databaseUrl = process.env.DATABASE_URL): {
  persistence: PostgresPublicMatchmakingPersistence;
  close: () => Promise<void>;
} {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for public matchmaking");
  const pool = new Pool({ connectionString: databaseUrl });
  return {
    persistence: new PostgresPublicMatchmakingPersistence(
      (text, values) => pool.query(text, values as unknown[]),
      async (work) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await work((text, values) => client.query(text, values as unknown[]));
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally { client.release(); }
      },
    ),
    close: () => pool.end(),
  };
}

function parseJson(value: unknown): any {
  return typeof value === "string" ? JSON.parse(value) : value;
}
