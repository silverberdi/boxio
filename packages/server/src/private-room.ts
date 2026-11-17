import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  applyMove,
  createGame,
  type Board,
  type GameState,
  type Player,
} from "@boxio/engine";

export const PRIVATE_ROOM_PROTOCOL_VERSION = 1;
export const MAX_ROOM_PARTICIPANTS = 4;
export const RESERVATION_MS = 60_000;
export const RETENTION_MS = 24 * 60 * 60 * 1_000;

export type ParticipantStatus = "connected" | "reserved" | "retired" | "replaced";
export type RoomStatus = "lobby" | "active" | "complete" | "closed";
export type RoomParticipant = Readonly<{
  id: string;
  name: string;
  status: ParticipantStatus;
  connected: boolean;
  host: boolean;
  score: number;
  cells: readonly string[];
  joinedAt: string;
  disconnectedAt?: string;
  reservationExpiresAt?: string;
}>;
export type PrivateRoomSnapshot = Readonly<{
  protocolVersion: typeof PRIVATE_ROOM_PROTOCOL_VERSION;
  roomId: string;
  invitationCode: string;
  status: RoomStatus;
  version: number;
  eventSequence: number;
  game?: GameState;
  participants: readonly RoomParticipant[];
  pendingParticipantIds: readonly string[];
  result?: Readonly<{ winners: readonly string[]; participants: readonly string[] }>;
  finishedAt?: string;
}>;
export type JoinResult = Readonly<{ participantId: string; reconnectCredential: string; snapshot: PrivateRoomSnapshot }>;
export type RoomCommand = Readonly<{ protocolVersion: 1; commandId: string; participantId: string; credential: string; version: number; edgeId: string }>;
export type CommandResult = Readonly<
  | { accepted: true; commandId: string; eventSequence: number; snapshot: PrivateRoomSnapshot; completedCells: readonly string[] }
  | { accepted: false; commandId?: string; code: "invalid-credential" | "forbidden" | "stale-version" | "duplicate" | "room-closed" | "invalid-move" | "unsupported-version"; snapshot: PrivateRoomSnapshot }
>;

type MutableParticipant = {
  id: string;
  name: string;
  status: ParticipantStatus;
  connected: boolean;
  host: boolean;
  score: number;
  cells: string[];
  joinedAt: string;
  disconnectedAt?: string;
  reservationExpiresAt?: string;
  credentialHash?: string;
};

type StoredCommand = Readonly<{ commandId: string; eventSequence: number; snapshot: PrivateRoomSnapshot }>;

export type RoomPersistence = Readonly<{
  save(room: PrivateRoom, command?: RoomCommand): Promise<void>;
}>;

export type PrivateRoomPersistence = Readonly<{
  roomId: string;
  invitationCode: string;
  board: Board;
  status: RoomStatus;
  version: number;
  eventSequence: number;
  game?: GameState;
  result?: { winners: string[]; participants: string[] };
  finishedAt?: string;
  participants: MutableParticipant[];
  pendingParticipantIds: string[];
  commands: StoredCommand[];
}>;

const hashCredential = (credential: string) => createHash("sha256").update(credential).digest("hex");
const newCredential = () => randomBytes(32).toString("base64url");
const nowIso = (now: number) => new Date(now).toISOString();

function publicParticipant(participant: MutableParticipant): RoomParticipant {
  const { credentialHash: _credentialHash, ...publicValue } = participant;
  return publicValue;
}

export class PrivateRoom {
  readonly roomId: string;
  readonly invitationCode: string;
  private status: RoomStatus = "lobby";
  private version = 0;
  private eventSequence = 0;
  private game?: GameState;
  private result?: { winners: string[]; participants: string[] };
  private finishedAt?: string;
  private readonly participants = new Map<string, MutableParticipant>();
  private readonly pendingParticipantIds = new Set<string>();
  private readonly commands = new Map<string, StoredCommand>();
  private readonly mutex = { tail: Promise.resolve() };

  private constructor(private readonly clock: () => number, board: Board, hostName: string, roomId = randomUUID(), invitationCode = randomBytes(12).toString("base64url"), private readonly persistence?: RoomPersistence) {
    this.roomId = roomId;
    this.invitationCode = invitationCode;
    this.board = board;
    this.addParticipant(hostName, true);
  }

  private readonly board: Board;

  static create(board: Board, hostName: string, clock: () => number = Date.now, persistence?: RoomPersistence): PrivateRoom {
    if (!hostName.trim()) throw new Error("Participant name is required");
    return new PrivateRoom(clock, board, hostName.trim(), randomUUID(), randomBytes(12).toString("base64url"), persistence);
  }

  static restore(state: PrivateRoomPersistence, clock: () => number = Date.now, persistence?: RoomPersistence): PrivateRoom {
    const room = Object.create(PrivateRoom.prototype) as PrivateRoom;
    Object.assign(room, { clock, board: state.board, roomId: state.roomId, invitationCode: state.invitationCode, status: state.status, version: state.version, eventSequence: state.eventSequence, game: state.game, result: state.result, finishedAt: state.finishedAt, persistence });
    Object.defineProperty(room, "participants", { value: new Map(state.participants.map((participant) => [participant.id, { ...participant, cells: [...participant.cells] }])), writable: false });
    Object.defineProperty(room, "pendingParticipantIds", { value: new Set(state.pendingParticipantIds), writable: false });
    Object.defineProperty(room, "commands", { value: new Map(state.commands.map((command) => [command.commandId, command])), writable: false });
    Object.defineProperty(room, "mutex", { value: { tail: Promise.resolve() }, writable: false });
    return room;
  }

  toPersistence(): PrivateRoomPersistence {
    return {
      roomId: this.roomId, invitationCode: this.invitationCode, board: this.board, status: this.status,
      version: this.version, eventSequence: this.eventSequence, game: this.game, result: this.result,
      finishedAt: this.finishedAt, participants: [...this.participants.values()].map((participant) => ({ ...participant, cells: [...participant.cells] })),
      pendingParticipantIds: [...this.pendingParticipantIds], commands: [...this.commands.values()],
    };
  }

  private addParticipant(name: string, host: boolean): MutableParticipant {
    const participant: MutableParticipant = {
      id: randomUUID(), name, status: "connected", connected: true, host, score: 0, cells: [], joinedAt: nowIso(this.clock()), credentialHash: hashCredential(newCredential()),
    };
    this.participants.set(participant.id, participant);
    return participant;
  }

  private findParticipant(id: string) {
    return this.participants.get(id);
  }

  private startIfReady(): void {
    if (!this.game && [...this.participants.values()].filter((p) => p.status === "connected" && p.connected).length >= 2) {
      const players: Player[] = [...this.participants.values()].filter((p) => p.status === "connected").map((p) => ({ id: p.id, name: p.name, kind: "human" as const }));
      this.game = createGame(this.board, players);
      this.status = "active";
    }
  }

  private integratePending(): void {
    if (!this.game || this.pendingParticipantIds.size === 0) return;
    const players = [...this.game.players];
    for (const id of this.pendingParticipantIds) {
      const p = this.participants.get(id);
      if (p) players.push({ id: p.id, name: p.name, kind: "human" });
    }
    this.game = { ...this.game, players };
    this.pendingParticipantIds.clear();
  }

  private snapshot(): PrivateRoomSnapshot {
    return {
      protocolVersion: PRIVATE_ROOM_PROTOCOL_VERSION, roomId: this.roomId, invitationCode: this.invitationCode,
      status: this.status, version: this.version, eventSequence: this.eventSequence, game: this.game,
      participants: [...this.participants.values()].map(publicParticipant), pendingParticipantIds: [...this.pendingParticipantIds], result: this.result, finishedAt: this.finishedAt,
    };
  }

  getSnapshot(): PrivateRoomSnapshot { return this.snapshot(); }

  hostCredentials(): JoinResult {
    const host = [...this.participants.values()].find((p) => p.host)!;
    const credential = newCredential();
    host.credentialHash = hashCredential(credential);
    return { participantId: host.id, reconnectCredential: credential, snapshot: this.snapshot() };
  }

  join(name: string): JoinResult {
    const occupied = [...this.participants.values()].filter((participant) => participant.status === "connected" || participant.status === "reserved").length;
    if (this.status === "closed" || this.status === "complete" || occupied >= MAX_ROOM_PARTICIPANTS) throw new Error("Room is full or closed");
    if (!name.trim()) throw new Error("Participant name is required");
    const participant = this.addParticipant(name.trim(), false);
    const credential = newCredential();
    participant.credentialHash = hashCredential(credential);
    if (this.game) this.pendingParticipantIds.add(participant.id);
    this.startIfReady();
    this.version += 1;
    return { participantId: participant.id, reconnectCredential: credential, snapshot: this.snapshot() };
  }

  disconnect(participantId: string, at = this.clock()): PrivateRoomSnapshot {
    const participant = this.findParticipant(participantId);
    if (!participant || participant.status !== "connected") return this.snapshot();
    participant.connected = false; participant.status = "reserved"; participant.disconnectedAt = nowIso(at); participant.reservationExpiresAt = nowIso(at + RESERVATION_MS);
    this.version += 1;
    return this.snapshot();
  }

  reconnect(participantId: string, credential: string, at = this.clock()): JoinResult {
    const participant = this.findParticipant(participantId);
    if (!participant || participant.status !== "reserved" || !participant.reservationExpiresAt || at >= Date.parse(participant.reservationExpiresAt) || hashCredential(credential) !== participant.credentialHash) throw new Error("Invalid reconnect credential");
    const nextCredential = newCredential();
    participant.connected = true; participant.status = "connected"; delete participant.disconnectedAt; delete participant.reservationExpiresAt; participant.credentialHash = hashCredential(nextCredential);
    this.version += 1;
    return { participantId, reconnectCredential: nextCredential, snapshot: this.snapshot() };
  }

  expireReservations(at = this.clock()): PrivateRoomSnapshot {
    for (const participant of this.participants.values()) {
      if (participant.status === "reserved" && participant.reservationExpiresAt && at >= Date.parse(participant.reservationExpiresAt)) {
        participant.status = "retired"; participant.connected = false; delete participant.credentialHash;
        if (this.game?.currentPlayerId === participant.id) this.advanceTurnFrom(participant.id);
      }
    }
    this.closeIfEmpty();
    return this.snapshot();
  }

  private advanceTurnFrom(participantId: string): void {
    if (!this.game) return;
    const eligible = this.game.players.filter((p) => this.participants.get(p.id)?.status === "connected");
    if (!eligible.length) return;
    const sourceIndex = this.game.players.findIndex((p) => p.id === participantId);
    const next = this.game.players.slice(sourceIndex + 1).concat(this.game.players.slice(0, sourceIndex + 1)).find((player) => this.participants.get(player.id)?.status === "connected");
    if (next) this.game = { ...this.game, currentPlayerId: next.id };
  }

  leave(participantId: string): PrivateRoomSnapshot {
    const participant = this.findParticipant(participantId);
    if (!participant) return this.snapshot();
    participant.connected = false;
    participant.status = participant.score > 0 || participant.cells.length > 0 ? "retired" : "replaced";
    delete participant.credentialHash;
    this.pendingParticipantIds.delete(participantId);
    if (this.game?.currentPlayerId === participantId) this.advanceTurnFrom(participantId);
    this.closeIfEmpty(); this.version += 1;
    return this.snapshot();
  }

  private closeIfEmpty(): void {
    if ([...this.participants.values()].every((p) => !p.connected && p.status !== "reserved")) { this.status = "closed"; this.finishedAt ??= nowIso(this.clock()); for (const p of this.participants.values()) delete p.credentialHash; }
  }

  submit(command: RoomCommand): Promise<CommandResult> {
    const run = this.mutex.tail.then(async () => {
      const result = this.applyCommand(command);
      if (result.accepted && this.persistence) await this.persistence.save(this, command);
      return result;
    });
    this.mutex.tail = run.then(() => undefined, () => undefined);
    return run;
  }

  private applyCommand(command: RoomCommand): CommandResult {
    if (command.protocolVersion !== PRIVATE_ROOM_PROTOCOL_VERSION) return { accepted: false, code: "unsupported-version", snapshot: this.snapshot() };
    const prior = this.commands.get(command.commandId);
    if (prior) return { accepted: true, commandId: command.commandId, eventSequence: prior.eventSequence, snapshot: prior.snapshot, completedCells: [] };
    if (this.status === "closed" || !this.game) return { accepted: false, commandId: command.commandId, code: "room-closed", snapshot: this.snapshot() };
    const participant = this.findParticipant(command.participantId);
    if (!participant || participant.status !== "connected" || !participant.credentialHash || hashCredential(command.credential) !== participant.credentialHash) return { accepted: false, commandId: command.commandId, code: "invalid-credential", snapshot: this.snapshot() };
    if (command.version !== this.version) return { accepted: false, commandId: command.commandId, code: "stale-version", snapshot: this.snapshot() };
    if (this.game.currentPlayerId !== command.participantId) return { accepted: false, commandId: command.commandId, code: "forbidden", snapshot: this.snapshot() };
    const result = applyMove(this.game, { playerId: command.participantId, edgeId: command.edgeId });
    if (!result.accepted) return { accepted: false, commandId: command.commandId, code: "invalid-move", snapshot: this.snapshot() };
    this.game = result.state;
    participant.score = this.game.scores[participant.id];
    participant.cells.push(...result.completedCells);
    this.version += 1; this.eventSequence += 1;
    if (result.completedCells.length === 0) {
      this.integratePending();
      if (this.game && this.participants.get(this.game.currentPlayerId)?.status !== "connected") this.advanceTurnFrom(this.game.currentPlayerId);
    }
    if (this.game.status === "complete") {
      this.status = "complete";
      this.finishedAt = nowIso(this.clock());
      this.result = { winners: [...this.game.winners], participants: [...this.participants.values()].filter((p) => p.status !== "replaced").map((p) => p.id) };
    }
    const snapshot = this.snapshot();
    this.commands.set(command.commandId, { commandId: command.commandId, eventSequence: this.eventSequence, snapshot });
    return { accepted: true, commandId: command.commandId, eventSequence: this.eventSequence, snapshot, completedCells: result.completedCells };
  }
}

export class InMemoryRoomStore {
  private readonly rooms = new Map<string, PrivateRoom>();
  create(board: Board, hostName: string): PrivateRoom { const room = PrivateRoom.create(board, hostName); this.rooms.set(room.roomId, room); return room; }
  get(roomId: string): PrivateRoom | undefined { return this.rooms.get(roomId); }
  getByInvitation(invitationCode: string): PrivateRoom | undefined { return [...this.rooms.values()].find((room) => room.invitationCode === invitationCode); }
  cleanup(at = Date.now()): string[] {
    const removed: string[] = [];
    for (const [id, room] of this.rooms) {
      const snapshot = room.getSnapshot();
      if ((snapshot.status === "complete" || snapshot.status === "closed") && snapshot.finishedAt && at - Date.parse(snapshot.finishedAt) >= RETENTION_MS) { this.rooms.delete(id); removed.push(id); }
    }
    return removed;
  }
}
