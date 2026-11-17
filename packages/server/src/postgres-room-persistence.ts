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
const participantPayload = (room: PrivateRoom): string => JSON.stringify(room.toPersistence().participants.map((participant) => ({
  participant_id: participant.id,
  name: participant.name,
  status: participant.status,
  connected: participant.connected,
  is_host: participant.host,
  score: participant.score,
  cells: participant.cells,
  credential_hash: participant.credentialHash ?? null,
  joined_at: participant.joinedAt,
  disconnected_at: participant.disconnectedAt ?? null,
  reservation_expires_at: participant.reservationExpiresAt ?? null,
})));

export class PostgresRoomPersistence implements RoomPersistence {
  constructor(private readonly query: PostgresQuery) {}

  async save(room: PrivateRoom, command?: RoomCommand): Promise<void> {
    const state = room.toPersistence();
    const stored = command && state.commands.find((item) => item.commandId === command.commandId);
    const participantSync = `deleted_participants AS (
           DELETE FROM private_room_participants
           WHERE room_id = $1::uuid
             AND participant_id NOT IN (SELECT participant_id FROM jsonb_to_recordset($8::jsonb) AS p(participant_id uuid))
         ), synced_participants AS (
           INSERT INTO private_room_participants
             (participant_id, room_id, name, status, connected, is_host, score, cells, credential_hash,
              joined_at, disconnected_at, reservation_expires_at)
           SELECT p.participant_id, $1::uuid, p.name, p.status, p.connected, p.is_host, p.score, p.cells,
                  p.credential_hash, p.joined_at, p.disconnected_at, p.reservation_expires_at
           FROM jsonb_to_recordset($8::jsonb) AS p(
             participant_id uuid, name text, status text, connected boolean, is_host boolean, score integer,
             cells jsonb, credential_hash text, joined_at timestamptz, disconnected_at timestamptz,
             reservation_expires_at timestamptz)
           CROSS JOIN saved_room
           ON CONFLICT (participant_id) DO UPDATE SET
             room_id = EXCLUDED.room_id, name = EXCLUDED.name, status = EXCLUDED.status,
             connected = EXCLUDED.connected, is_host = EXCLUDED.is_host, score = EXCLUDED.score,
             cells = EXCLUDED.cells, credential_hash = EXCLUDED.credential_hash,
             joined_at = EXCLUDED.joined_at, disconnected_at = EXCLUDED.disconnected_at,
             reservation_expires_at = EXCLUDED.reservation_expires_at
         )`;
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
           , ${participantSync}
           INSERT INTO private_room_commands (room_id, command_id, participant_id, base_version, event_sequence, payload)
           SELECT room_id, $9, $10::uuid, $11, $12, $13::jsonb FROM saved_room
           ON CONFLICT (room_id, command_id) DO NOTHING`
        : `WITH saved_room AS (INSERT INTO private_rooms (room_id, invitation_code, status, version, event_sequence, snapshot, finished_at)
           VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
           ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version,
           event_sequence = EXCLUDED.event_sequence, snapshot = EXCLUDED.snapshot,
           finished_at = EXCLUDED.finished_at, updated_at = now()
           WHERE private_rooms.version <= EXCLUDED.version
           RETURNING room_id), ${participantSync} SELECT room_id FROM saved_room`,
      stored
        ? [state.roomId, state.invitationCode, state.status, state.version, state.eventSequence, snapshotPayload(room), state.finishedAt ?? null,
          participantPayload(room), stored.commandId, command!.participantId, command!.version, stored.eventSequence,
          JSON.stringify({ ...command, credential: undefined })]
        : [state.roomId, state.invitationCode, state.status, state.version, state.eventSequence, snapshotPayload(room), state.finishedAt ?? null, participantPayload(room)],
    );
  }

  async load(roomId: string, clock: () => number = Date.now): Promise<PrivateRoom | undefined> {
    const result = await this.query("SELECT snapshot FROM private_rooms WHERE room_id = $1::uuid", [roomId]);
    const payload = result.rows[0]?.snapshot;
    if (!payload) return undefined;
    const state = typeof payload === "string" ? JSON.parse(payload) as PrivateRoomPersistence : payload as unknown as PrivateRoomPersistence;
    return PrivateRoom.restore(state, clock, this);
  }

  async loadByInvitation(invitationCode: string, clock: () => number = Date.now): Promise<PrivateRoom | undefined> {
    const result = await this.query("SELECT snapshot FROM private_rooms WHERE invitation_code = $1", [invitationCode]);
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
