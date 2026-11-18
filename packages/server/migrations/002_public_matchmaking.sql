-- D7 public 1v1 queue. PostgreSQL is the only durable state authority.
CREATE TABLE IF NOT EXISTS public_matchmaking_searches (
  search_id uuid PRIMARY KEY,
  participant_id uuid NOT NULL UNIQUE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 18),
  status text NOT NULL CHECK (status IN ('searching', 'cancelled', 'matched')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  board jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  timed_out boolean NOT NULL DEFAULT false,
  match_id uuid,
  participant_credential_hash text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS public_search_one_active_per_participant
  ON public_matchmaking_searches(participant_id) WHERE status = 'searching';
CREATE TABLE IF NOT EXISTS public_matches (
  match_id uuid PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('active', 'complete', 'abandoned')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  event_sequence bigint NOT NULL DEFAULT 0 CHECK (event_sequence >= 0),
  snapshot jsonb NOT NULL,
  finish_cause text CHECK (finish_cause IN ('normal', 'abandonment')),
  finished_at timestamptz
);
CREATE TABLE IF NOT EXISTS public_match_seats (
  match_id uuid NOT NULL REFERENCES public_matches(match_id) ON DELETE CASCADE,
  participant_id uuid NOT NULL UNIQUE,
  seat smallint NOT NULL CHECK (seat IN (0, 1)),
  status text NOT NULL CHECK (status IN ('connected', 'reserved', 'abandoned')),
  reservation_expires_at timestamptz,
  PRIMARY KEY (match_id, seat),
  UNIQUE (match_id, participant_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS public_match_one_seat_per_participant
  ON public_match_seats(participant_id);
-- Rollback: DROP TABLE public_match_seats; DROP TABLE public_matches; DROP TABLE public_matchmaking_searches;
