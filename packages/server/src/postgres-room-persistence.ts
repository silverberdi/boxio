import type { Board } from "@boxio/engine";
import {
  PrivateRoom,
  type PrivateRoomPersistence,
  type RoomCommand,
  type RoomPersistence,
} from "./private-room.js";

/** Minimal adapter kept driver-agnostic so the application can use its restricted PostgreSQL role. */
export type PostgresQuery = (text: string, values?: readonly unknown[]) => Promise<{ rows: readonly Record<string, unknown>[] }>;

const snapshotPayload = (room: PrivateRoom): string => JSON.stringify(room.toPersistence());

export class PostgresRoomPersistence implements RoomPersistence {
  constructor(private readonly query: PostgresQuery) {}

  async save(room: PrivateRoom, command?: RoomCommand): Promise<void> {
    const state = room.toPersistence();
    const stored = command && state.commands.find((item) => item.commandId === command.commandId);
    await this.query(
      stored
        ? `WITH saved_room AS (
             INSERT INTO private_rooms (room_id, invitation_code, status, version, event_sequence, snapshot, finished_at)
             VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
             ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version,
             event_sequence = EXCLUDED.event_sequence, snapshot = EXCLUDED.snapshot,
             finished_at = EXCLUDED.finished_at, updated_at = now()
             WHERE private_rooms.version <= EXCLUDED.version
             RETURNING room_id
           )
           INSERT INTO private_room_commands (room_id, command_id, participant_id, base_version, event_sequence, payload)
           SELECT room_id, $8, $9::uuid, $10, $11, $12::jsonb FROM saved_room
           ON CONFLICT (room_id, command_id) DO NOTHING`
        : `INSERT INTO private_rooms (room_id, invitation_code, status, version, event_sequence, snapshot, finished_at)
           VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
           ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version,
           event_sequence = EXCLUDED.event_sequence, snapshot = EXCLUDED.snapshot,
           finished_at = EXCLUDED.finished_at, updated_at = now()
           WHERE private_rooms.version <= EXCLUDED.version`,
      stored
        ? [state.roomId, state.invitationCode, state.status, state.version, state.eventSequence, snapshotPayload(room), state.finishedAt ?? null,
          stored.commandId, command!.participantId, command!.version, stored.eventSequence,
          JSON.stringify({ ...command, credential: undefined })]
        : [state.roomId, state.invitationCode, state.status, state.version, state.eventSequence, snapshotPayload(room), state.finishedAt ?? null],
    );
  }

  async load(roomId: string, clock: () => number = Date.now): Promise<PrivateRoom | undefined> {
    const result = await this.query("SELECT snapshot FROM private_rooms WHERE room_id = $1::uuid", [roomId]);
    const payload = result.rows[0]?.snapshot;
    if (!payload) return undefined;
    const state = typeof payload === "string" ? JSON.parse(payload) as PrivateRoomPersistence : payload as unknown as PrivateRoomPersistence;
    return PrivateRoom.restore(state, clock, this);
  }

  async cleanupFinished(at: Date = new Date()): Promise<number> {
    const result = await this.query(
      "DELETE FROM private_rooms WHERE status IN ('complete', 'closed') AND finished_at IS NOT NULL AND finished_at <= ($1::timestamptz - interval '24 hours')",
      [at.toISOString()],
    );
    return result.rows.length;
  }
}

export function isPrivateRoomPersistence(value: unknown): value is PrivateRoomPersistence {
  return !!value && typeof value === "object" && "roomId" in value && "board" in value && "participants" in value;
}

export type PersistedBoard = Board;
