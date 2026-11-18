import { createHash, randomBytes, randomUUID } from "node:crypto";
import { applyMove, createGame, type Board, type GameState } from "@boxio/engine";

export const PUBLIC_PROTOCOL_VERSION = 1 as const;
export const PUBLIC_TIMEOUT_MS = 60_000;
type SearchStatus = "searching" | "cancelled" | "matched";
type SeatStatus = "connected" | "reserved" | "abandoned";

export type PublicSearchSnapshot = Readonly<{
  searchId: string; participantId: string; name: string; status: SearchStatus;
  version: number; createdAt: string; timedOut: boolean; matchId?: string;
}>;
export type PublicParticipant = Readonly<{ id: string; name: string; status: SeatStatus; connected: boolean; score: number; cells: readonly string[]; reservationExpiresAt?: string }>;
export type PublicMatchSnapshot = Readonly<{
  protocolVersion: 1; matchId: string; status: "active" | "complete" | "abandoned"; version: number; eventSequence: number;
  game: GameState; participants: readonly PublicParticipant[];
  result?: Readonly<{ winners: readonly string[]; cause: "normal" | "abandonment" }>;
}>;
export type PublicCommand = Readonly<{ protocolVersion: 1; commandId: string; participantId: string; credential: string; version: number; edgeId: string }>;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const credential = () => randomBytes(32).toString("base64url");
const iso = (at: number) => new Date(at).toISOString();

type Search = { id: string; participantId: string; name: string; board: Board; status: SearchStatus; version: number; createdAt: number; timedOut: boolean; matchId?: string; secretHash: string; secret?: string };
type Seat = { id: string; name: string; status: SeatStatus; connected: boolean; score: number; cells: string[]; credentialHash: string; credentialValue: string; disconnectedAt?: number; reservationExpiresAt?: number };

export type PublicSearchPersistence = Readonly<{
  searchId: string; participantId: string; name: string; board: Board; status: SearchStatus;
  version: number; createdAt: number; timedOut: boolean; matchId?: string; credentialHash: string;
}>;

export type PublicMatchPersistence = Readonly<{
  matchId: string; board: Board; status: PublicMatchSnapshot["status"]; version: number; eventSequence: number;
  game: GameState; result?: { winners: string[]; cause: "normal" | "abandonment" };
  seats: ReadonlyArray<Readonly<{ id: string; name: string; status: SeatStatus; connected: boolean; score: number; cells: string[]; credentialHash: string; disconnectedAt?: number; reservationExpiresAt?: number }>>;
  commands: ReadonlyArray<{ commandId: string; eventSequence: number; snapshot: PublicMatchSnapshot }>;
}>;

export type PublicMatchmakingPersistence = Readonly<{
  load(): Promise<Readonly<{ searches: readonly PublicSearchPersistence[]; matches: readonly PublicMatchPersistence[] }> | undefined>;
  save(state: Readonly<{ searches: readonly PublicSearchPersistence[]; matches: readonly PublicMatchPersistence[] }>): Promise<void>;
}>;

export class PublicMatch {
  private status: PublicMatchSnapshot["status"] = "active";
  private version = 0;
  private eventSequence = 0;
  private result?: { winners: string[]; cause: "normal" | "abandonment" };
  private readonly seats: Seat[];
  private game: GameState;
  private readonly commands = new Map<string, { commandId: string; eventSequence: number; snapshot: PublicMatchSnapshot }>();

  constructor(readonly matchId: string, readonly board: Board, first: { id: string; name: string; secret?: string; credentialHash?: string }, second: { id: string; name: string; secret?: string; credentialHash?: string }, private readonly clock: () => number = Date.now) {
    this.seats = [first, second].map((p) => ({ id: p.id, name: p.name, status: "connected", connected: true, score: 0, cells: [], credentialHash: p.credentialHash ?? hash(p.secret ?? ""), credentialValue: p.secret ?? "" }));
    this.game = createGame(this.board, this.seats.map((p) => ({ id: p.id, name: p.name, kind: "human" as const })));
  }

  static restore(state: PublicMatchPersistence, clock: () => number = Date.now): PublicMatch {
    const match = Object.create(PublicMatch.prototype) as PublicMatch;
    Object.assign(match, { matchId: state.matchId, board: state.board, clock, status: state.status, version: state.version, eventSequence: state.eventSequence, result: state.result, game: state.game });
    Object.defineProperty(match, "seats", { value: state.seats.map((seat) => ({ ...seat, cells: [...seat.cells], credentialValue: "" })), writable: false });
    Object.defineProperty(match, "commands", { value: new Map(state.commands.map((command) => [command.commandId, command])), writable: false });
    return match;
  }

  private snapshot(): PublicMatchSnapshot {
    return { protocolVersion: 1, matchId: this.matchId, status: this.status, version: this.version, eventSequence: this.eventSequence, game: this.game, participants: this.seats.map(({ credentialHash: _secret, credentialValue: _value, disconnectedAt: _at, reservationExpiresAt, ...seat }) => ({ ...seat, ...(reservationExpiresAt ? { reservationExpiresAt: iso(reservationExpiresAt) } : {}) })), result: this.result };
  }
  getSnapshot() { return this.snapshot(); }
  credentials() { return this.seats.map((seat) => ({ participantId: seat.id, reconnectCredential: seat.credentialValue })); }
  toPersistence(): PublicMatchPersistence { return { matchId: this.matchId, board: this.board, status: this.status, version: this.version, eventSequence: this.eventSequence, game: this.game, result: this.result, seats: this.seats.map(({ credentialValue: _value, ...seat }) => ({ ...seat, cells: [...seat.cells] })), commands: [...this.commands.values()] }; }
  private issue(seat: Seat) { const value = credential(); seat.credentialValue = value; seat.credentialHash = hash(value); return value; }

  disconnect(participantId: string, at = this.clock()) {
    const seat = this.seats.find((p) => p.id === participantId);
    if (this.status !== "active" || !seat || seat.status !== "connected") return this.snapshot();
    seat.connected = false; seat.status = "reserved"; seat.disconnectedAt = at; seat.reservationExpiresAt = at + PUBLIC_TIMEOUT_MS; this.version++;
    return this.snapshot();
  }
  reconnect(participantId: string, secret: string, at = this.clock()) {
    const seat = this.seats.find((p) => p.id === participantId);
    if (this.status !== "active" || !seat || seat.status !== "reserved" || !seat.reservationExpiresAt || at >= seat.reservationExpiresAt || hash(secret) !== seat.credentialHash) throw new Error("Invalid reconnect credential");
    seat.connected = true; seat.status = "connected"; seat.disconnectedAt = undefined; seat.reservationExpiresAt = undefined; const next = this.issue(seat); this.version++;
    return { participantId, reconnectCredential: next, snapshot: this.snapshot() };
  }
  expire(at = this.clock()) {
    const seat = this.seats.find((p) => p.status === "reserved" && p.reservationExpiresAt && at >= p.reservationExpiresAt);
    if (!seat || this.status !== "active") return this.snapshot();
    seat.status = "abandoned"; seat.connected = false; seat.credentialHash = ""; seat.credentialValue = ""; this.status = "abandoned";
    const rival = this.seats.find((p) => p.id !== seat.id)!; this.result = { winners: [rival.id], cause: "abandonment" }; this.version++;
    return this.snapshot();
  }
  submit(command: PublicCommand): { accepted: true; commandId: string; snapshot: PublicMatchSnapshot; eventSequence: number; completedCells: readonly string[] } | { accepted: false; commandId?: string; code: string; snapshot: PublicMatchSnapshot } {
    const prior = this.commands.get(command.commandId); if (prior) return { accepted: true, commandId: command.commandId, snapshot: prior.snapshot, eventSequence: prior.eventSequence, completedCells: [] };
    if (command.protocolVersion !== 1) return { accepted: false, code: "unsupported-version", snapshot: this.snapshot() };
    if (this.status !== "active") return { accepted: false, commandId: command.commandId, code: "match-closed", snapshot: this.snapshot() };
    const seat = this.seats.find((p) => p.id === command.participantId);
    if (!seat || seat.status !== "connected" || hash(command.credential) !== seat.credentialHash) return { accepted: false, commandId: command.commandId, code: "invalid-credential", snapshot: this.snapshot() };
    if (command.version !== this.version) return { accepted: false, commandId: command.commandId, code: "stale-version", snapshot: this.snapshot() };
    if (this.game.currentPlayerId !== seat.id) return { accepted: false, commandId: command.commandId, code: "forbidden", snapshot: this.snapshot() };
    const moved = applyMove(this.game, { playerId: seat.id, edgeId: command.edgeId });
    if (!moved.accepted) return { accepted: false, commandId: command.commandId, code: "invalid-move", snapshot: this.snapshot() };
    this.game = moved.state; seat.score = this.game.scores[seat.id]; seat.cells.push(...moved.completedCells); this.version++; this.eventSequence++;
    if (this.game.status === "complete") { this.status = "complete"; this.result = { winners: [...this.game.winners], cause: "normal" }; }
    const snapshot = this.snapshot(); this.commands.set(command.commandId, { commandId: command.commandId, eventSequence: this.eventSequence, snapshot });
    return { accepted: true, commandId: command.commandId, snapshot, eventSequence: this.eventSequence, completedCells: moved.completedCells };
  }
}

export class PublicMatchmaking {
  private readonly searches = new Map<string, Search>();
  private readonly matches = new Map<string, PublicMatch>();
  private lock: Promise<void> = Promise.resolve();
  private readonly ready: Promise<void>;
  constructor(private readonly clock: () => number, private readonly persistence: PublicMatchmakingPersistence) {
    this.ready = persistence.load().then((state) => { if (!state) return; for (const item of state.searches) this.searches.set(item.searchId, { id: item.searchId, participantId: item.participantId, name: item.name, board: item.board, status: item.status, version: item.version, createdAt: item.createdAt, timedOut: item.timedOut, matchId: item.matchId, secretHash: item.credentialHash }); for (const item of state.matches) this.matches.set(item.matchId, PublicMatch.restore(item, this.clock)); });
  }
  private async atomic<T>(work: () => T | Promise<T>): Promise<T> { await this.ready; const previous = this.lock; let release!: () => void; this.lock = new Promise<void>((resolve) => { release = resolve; }); await previous; try { return await work(); } finally { release(); } }
  private async persist(): Promise<void> { await this.persistence.save({ searches: [...this.searches.values()].map((s) => ({ searchId: s.id, participantId: s.participantId, name: s.name, board: s.board, status: s.status, version: s.version, createdAt: s.createdAt, timedOut: s.timedOut, matchId: s.matchId, credentialHash: s.secretHash })), matches: [...this.matches.values()].map((match) => match.toPersistence()) }); }
  async enter(board: Board, name: string, at = this.clock()) { return this.atomic(async () => { if (!name.trim()) throw new Error("Participant name is required"); const secret = credential(); const search: Search = { id: randomUUID(), participantId: randomUUID(), name: name.trim(), board, status: "searching", version: 0, createdAt: at, timedOut: false, secretHash: hash(secret), secret }; this.searches.set(search.id, search); this.pair(search); await this.persist(); return { search: this.searchSnapshot(search), participantId: search.participantId, reconnectCredential: secret, match: search.matchId ? this.matches.get(search.matchId)?.getSnapshot() : undefined, matchCredentials: search.matchId ? this.matches.get(search.matchId)?.credentials() : undefined }; }); }
  private searchSnapshot(s: Search): PublicSearchSnapshot { return { searchId: s.id, participantId: s.participantId, name: s.name, status: s.status, version: s.version, createdAt: iso(s.createdAt), timedOut: s.timedOut, ...(s.matchId ? { matchId: s.matchId } : {}) }; }
  private pair(current: Search) { const other = [...this.searches.values()].find((s) => s.id !== current.id && s.status === "searching" && !s.timedOut); if (!other) return; const matchId = randomUUID(); const match = new PublicMatch(matchId, current.board, { id: current.participantId, name: current.name, secret: current.secret, credentialHash: current.secretHash }, { id: other.participantId, name: other.name, secret: other.secret, credentialHash: other.secretHash }, this.clock); current.status = "matched"; other.status = "matched"; current.matchId = other.matchId = matchId; current.version++; other.version++; this.matches.set(matchId, match); }
  async getSearch(id: string, at = this.clock()) { return this.atomic(async () => { const search = this.searches.get(id); if (!search) return undefined; if (search.status === "searching" && at - search.createdAt >= PUBLIC_TIMEOUT_MS) { search.timedOut = true; await this.persist(); } return this.searchSnapshot(search); }); }
  async cancel(id: string) { return this.atomic(async () => { const search = this.searches.get(id); if (!search) throw new Error("search-not-found"); if (search.status === "searching") { search.status = "cancelled"; search.version++; await this.persist(); } return this.searchSnapshot(search); }); }
  async continue(id: string) { return this.atomic(async () => { const search = this.searches.get(id); if (!search || search.status !== "searching") throw new Error("search-not-available"); search.timedOut = false; search.createdAt = this.clock(); search.version++; await this.persist(); return this.searchSnapshot(search); }); }
  async machine(id: string) { return this.atomic(async () => { const search = this.searches.get(id); if (!search || search.status !== "searching") throw new Error("search-not-available"); search.status = "cancelled"; search.version++; const result = { search: this.searchSnapshot(search), session: { mode: "machine", participantId: search.participantId, state: createGame(search.board, [{ id: search.participantId, name: search.name, kind: "human" }, { id: `bot-${randomUUID()}`, name: "Máquina", kind: "automatic", difficulty: "easy", seed: 1 }] as const) } }; await this.persist(); return result; }); }
  async getMatch(id: string) { return this.atomic(() => this.matches.get(id)?.getSnapshot()); }
  async command(id: string, command: PublicCommand) { return this.atomic(async () => { const result = this.matches.get(id)?.submit(command); if (result?.accepted) await this.persist(); return result; }); }
  async disconnect(id: string, participantId: string, at = this.clock()) { return this.atomic(async () => { const result = this.matches.get(id)?.disconnect(participantId, at); await this.persist(); return result; }); }
  async reconnect(id: string, participantId: string, secret: string, at = this.clock()) { return this.atomic(async () => { const result = this.matches.get(id)?.reconnect(participantId, secret, at); await this.persist(); return result; }); }
  async expire(at = this.clock()) { return this.atomic(async () => { const result = [...this.matches.values()].map((match) => match.expire(at)); await this.persist(); return result; }); }
  matchCredentials(id: string) { return this.matches.get(id)?.credentials(); }
}
