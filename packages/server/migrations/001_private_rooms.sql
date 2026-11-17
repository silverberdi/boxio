-- D6 PostgreSQL schema. The invitation is a locator; credential_hash is never a plaintext secret.
CREATE TABLE IF NOT EXISTS private_rooms (
  room_id uuid PRIMARY KEY,
  invitation_code text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('lobby', 'active', 'complete', 'closed')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  event_sequence bigint NOT NULL DEFAULT 0 CHECK (event_sequence >= 0),
  snapshot jsonb NOT NULL,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private_room_participants (
  participant_id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES private_rooms(room_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 18),
  status text NOT NULL CHECK (status IN ('connected', 'reserved', 'retired', 'replaced')),
  connected boolean NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  cells jsonb NOT NULL DEFAULT '[]'::jsonb,
  credential_hash text,
  joined_at timestamptz NOT NULL,
  disconnected_at timestamptz,
  reservation_expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS private_room_participants_room_idx ON private_room_participants(room_id);
CREATE UNIQUE INDEX IF NOT EXISTS private_room_one_host_idx ON private_room_participants(room_id) WHERE is_host;

CREATE OR REPLACE FUNCTION enforce_private_room_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Serialize occupancy checks per room so concurrent joins cannot both observe
  -- the same final free slot.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.room_id::text, 0));
  IF (SELECT count(*) FROM private_room_participants
      WHERE room_id = NEW.room_id AND status IN ('connected', 'reserved')
        AND participant_id <> NEW.participant_id) >= 4 THEN
    RAISE EXCEPTION 'private room capacity exceeded' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS private_room_capacity_trigger ON private_room_participants;
CREATE TRIGGER private_room_capacity_trigger
  BEFORE INSERT OR UPDATE OF room_id, status ON private_room_participants
  FOR EACH ROW EXECUTE FUNCTION enforce_private_room_capacity();

CREATE TABLE IF NOT EXISTS private_room_commands (
  room_id uuid NOT NULL REFERENCES private_rooms(room_id) ON DELETE CASCADE,
  command_id text NOT NULL,
  participant_id uuid NOT NULL,
  base_version integer NOT NULL,
  event_sequence bigint NOT NULL,
  payload jsonb NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, command_id),
  UNIQUE (room_id, event_sequence)
);
CREATE INDEX IF NOT EXISTS private_rooms_retention_idx ON private_rooms(finished_at) WHERE status = 'complete';

-- Rollback: DROP TRIGGER private_room_capacity_trigger ON private_room_participants;
-- DROP FUNCTION enforce_private_room_capacity(); DROP TABLE private_room_commands;
-- DROP TABLE private_room_participants; DROP TABLE private_rooms;
