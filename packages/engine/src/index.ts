export type PlayerId = string;
export type EdgeId = string;
export type CellId = string;
export type Vertex = Readonly<{ row: number; column: number }>;
export type CellCoordinate = Readonly<{ row: number; column: number }>;
export type Edge = Readonly<{ id: EdgeId; a: Vertex; b: Vertex }>;
export type SquareCell = Readonly<{ id: CellId; row: number; column: number; edges: readonly [EdgeId, EdgeId, EdgeId, EdgeId] }>;
export type Board = Readonly<{ cells: readonly SquareCell[]; edges: readonly Edge[] }>;
export type BoardDimensions = Readonly<{ rows: number; columns: number }>;
export type BoardSelection =
  | Readonly<{ kind: "classic"; rows: unknown; columns: unknown }>
  | Readonly<{ kind: "silhouette"; id: string; cells: ReadonlyArray<CellCoordinate> }>;
export type BotDifficulty = "easy" | "medium" | "hard";
export type HumanParticipant = Readonly<{ id: PlayerId; name: string; kind?: "human" }>;
export type AutomaticParticipant = Readonly<{ id: PlayerId; name: string; kind: "automatic"; difficulty: BotDifficulty; seed: number }>;
export type Player = HumanParticipant | AutomaticParticipant;
export type Participant = Player;
export type GameStatus = "active" | "complete";
export type GameState = Readonly<{ board: Board; players: readonly Player[]; occupiedEdges: readonly EdgeId[]; cellOwners: Readonly<Record<CellId, PlayerId>>; scores: Readonly<Record<PlayerId, number>>; currentPlayerId: PlayerId; status: GameStatus; winners: readonly PlayerId[] }>;
export type Move = Readonly<{ playerId: PlayerId; edgeId: EdgeId }>;
export type MoveRejectionReason = "unknown-edge" | "occupied-edge" | "wrong-turn" | "game-complete";
export type MoveResult = Readonly<{ accepted: boolean; reason?: MoveRejectionReason; state: GameState; completedCells: readonly CellId[] }>;

export type BotDecisionDifficulty = BotDifficulty;

const vertexKey = (v: Vertex) => `${v.row},${v.column}`;
const cellKey = (cell: CellCoordinate) => `${cell.row},${cell.column}`;
const compareVertices = (a: Vertex, b: Vertex) => a.row - b.row || a.column - b.column;
const edgeKey = (a: Vertex, b: Vertex) => {
  const [left, right] = compareVertices(a, b) <= 0 ? [a, b] : [b, a];
  return `${vertexKey(left)}-${vertexKey(right)}`;
};

function assertCellCoordinate(cell: CellCoordinate): void {
  if (!cell || !Number.isInteger(cell.row) || !Number.isInteger(cell.column) || cell.row < 0 || cell.column < 0) {
    throw new TypeError("Cells must use non-negative integer coordinates");
  }
}

function buildBoard(cells: ReadonlyArray<CellCoordinate>): Board {
  const seen = new Set<CellId>();
  const edgeMap = new Map<EdgeId, Edge>();
  const output: SquareCell[] = [];
  for (const cell of [...cells].sort((a, b) => a.row - b.row || a.column - b.column)) {
    assertCellCoordinate(cell);
    const id = cellKey(cell);
    if (seen.has(id)) throw new Error(`Duplicate cell: ${id}`);
    seen.add(id);
    const vertices: readonly [Vertex, Vertex, Vertex, Vertex] = [
      { row: cell.row, column: cell.column }, { row: cell.row, column: cell.column + 1 },
      { row: cell.row + 1, column: cell.column + 1 }, { row: cell.row + 1, column: cell.column },
    ];
    const edges = vertices.map((vertex, index) => {
      const next = vertices[(index + 1) % 4];
      const id = edgeKey(vertex, next);
      if (!edgeMap.has(id)) edgeMap.set(id, { id, a: vertex, b: next });
      return id;
    }) as [EdgeId, EdgeId, EdgeId, EdgeId];
    output.push({ id, row: cell.row, column: cell.column, edges });
  }
  return { cells: output, edges: [...edgeMap.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

function assertConnected(cells: ReadonlyArray<CellCoordinate>): void {
  const keys = new Set(cells.map(cellKey));
  const pending = [cells[0]];
  const visited = new Set<string>();
  while (pending.length) {
    const cell = pending.pop()!;
    const key = cellKey(cell);
    if (visited.has(key)) continue;
    visited.add(key);
    for (const neighbour of [
      { row: cell.row - 1, column: cell.column }, { row: cell.row + 1, column: cell.column },
      { row: cell.row, column: cell.column - 1 }, { row: cell.row, column: cell.column + 1 },
    ]) if (keys.has(cellKey(neighbour))) pending.push(neighbour);
  }
  if (visited.size !== keys.size) throw new Error("A cell mask must be connected by sides");
}

export function validateDimensions(rows: unknown, columns: unknown): BoardDimensions {
  for (const dimension of [rows, columns]) {
    if (typeof dimension !== "number" || !Number.isFinite(dimension) || !Number.isInteger(dimension)) throw new TypeError("Rows and columns must be finite integers");
    if (dimension < 2 || dimension > 8) throw new RangeError("Rows and columns must be between 2 and 8");
  }
  return { rows: rows as number, columns: columns as number };
}

export function createRectangularBoard(rows: unknown, columns: unknown): Board {
  const dimensions = validateDimensions(rows, columns);
  const cells: CellCoordinate[] = [];
  for (let row = 0; row < dimensions.rows; row += 1) for (let column = 0; column < dimensions.columns; column += 1) cells.push({ row, column });
  return buildBoard(cells);
}

export function prepareCellMask(cells: ReadonlyArray<CellCoordinate>): Board {
  if (!Array.isArray(cells) || cells.length === 0) throw new RangeError("A cell mask must not be empty");
  if (cells.some((cell) => !cell || typeof cell !== "object")) throw new TypeError("Cells must be coordinate objects");
  for (const cell of cells) assertCellCoordinate(cell);
  if (new Set(cells.map(cellKey)).size !== cells.length) throw new Error("Duplicate cells are not allowed");
  assertConnected(cells);
  return buildBoard(cells);
}

export function createBoard(cells: ReadonlyArray<CellCoordinate>): Board {
  return prepareCellMask(cells);
}

export function createBoardFromSelection(selection: BoardSelection): Board {
  if (selection?.kind === "classic") return createRectangularBoard(selection.rows, selection.columns);
  if (selection?.kind === "silhouette" && typeof selection.id === "string") return prepareCellMask(selection.cells);
  throw new TypeError("Unknown board selection");
}

export function createGame(board: Board, players: readonly Player[]): GameState {
  if (board.cells.length === 0) throw new Error("A game board must contain at least one cell");
  if (players.length < 2) throw new Error("At least two players are required");
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new Error("Player IDs must be unique");
  return { board, players: players.map((p) => ({ ...p })), occupiedEdges: [], cellOwners: {}, scores: Object.fromEntries(players.map((p) => [p.id, 0])), currentPlayerId: players[0].id, status: "active", winners: [] };
}

function canonicalEdges(state: GameState): readonly EdgeId[] {
  const occupied = new Set(state.occupiedEdges);
  return state.board.edges.map((edge) => edge.id).filter((id) => !occupied.has(id)).sort();
}

function randomUnit(seed: number): number {
  let value = (Math.trunc(seed) >>> 0) || 0x9e3779b9;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 0x100000000;
}

function nextSeed(seed: number, index: number): number {
  return (Math.trunc(seed) + Math.imul(index + 1, 0x45d9f3b)) | 0;
}

function immediateCaptures(state: GameState, edges = canonicalEdges(state)): readonly EdgeId[] {
  const occupied = new Set(state.occupiedEdges);
  return edges.filter((edgeId) => state.board.cells.some((cell) => cell.edges.includes(edgeId) && cell.edges.every((candidate) => occupied.has(candidate) || candidate === edgeId)));
}

function exposesCapture(state: GameState, edgeId: EdgeId): boolean {
  const occupied = new Set(state.occupiedEdges);
  return state.board.cells.some((cell) => cell.edges.includes(edgeId) && cell.edges.filter((candidate) => occupied.has(candidate)).length === 3);
}

function easyDecision(state: GameState, seed: number): EdgeId {
  const legal = canonicalEdges(state);
  if (!legal.length) throw new Error("No legal bot move exists");
  const captures = immediateCaptures(state, legal);
  const sample = randomUnit(seed);
  const chosen = captures.length && sample < 0.2 ? captures : legal;
  return chosen[Math.floor(randomUnit(nextSeed(seed, 1)) * chosen.length)];
}

function mediumDecision(state: GameState, seed: number): EdgeId {
  const legal = canonicalEdges(state);
  if (!legal.length) throw new Error("No legal bot move exists");
  const captures = immediateCaptures(state, legal);
  if (captures.length) return captures[Math.floor(randomUnit(seed) * captures.length)];
  const safe = legal.filter((edgeId) => !exposesCapture(state, edgeId));
  const candidates = safe.length ? safe : legal;
  return candidates[Math.floor(randomUnit(seed) * candidates.length)];
}

function hardScore(state: GameState, edgeId: EdgeId, depth: number, memo: Map<string, number>): number {
  const key = `${state.occupiedEdges.join(",")}|${state.currentPlayerId}|${depth}`;
  const cached = memo.get(`${key}|${edgeId}`);
  if (cached !== undefined) return cached;
  const result = applyMove(state, { playerId: state.currentPlayerId, edgeId });
  if (!result.accepted) return -Infinity;
  const immediate = result.completedCells.length;
  if (!immediate || depth <= 0 || result.state.status === "complete") return immediate * 100 - (exposesCapture(state, edgeId) ? 1 : 0);
  // A chain ends as soon as the capture does not continue; never search a full game tree.
  const next = immediateCaptures(result.state);
  const continuation = next.length ? Math.max(...next.map((candidate) => hardScore(result.state, candidate, depth - 1, memo))) : 0;
  const score = immediate * 100 + continuation - (exposesCapture(state, edgeId) ? 1 : 0);
  memo.set(`${key}|${edgeId}`, score);
  return score;
}

function hardDecision(state: GameState, seed: number): EdgeId {
  const legal = canonicalEdges(state);
  if (!legal.length) throw new Error("No legal bot move exists");
  // Opening play has no capture chain to explore; avoid gifts in one linear pass.
  if (!immediateCaptures(state).length) {
    const safe = legal.filter((edgeId) => !exposesCapture(state, edgeId));
    return (safe.length ? safe : legal)[0];
  }
  const memo = new Map<string, number>();
  const depth = Math.min(6, legal.length);
  return legal.reduce((best, edgeId) => {
    const score = hardScore(state, edgeId, depth, memo);
    const bestScore = hardScore(state, best, depth, memo);
    return score > bestScore ? edgeId : score === bestScore && edgeId < best ? edgeId : best;
  }, legal[0]);
}

/** Pure, serializable bot boundary. The core remains the only move authority. */
export function chooseBotMove(state: GameState, difficulty: BotDecisionDifficulty, seed: number): EdgeId {
  if (state.status === "complete") throw new Error("Cannot choose a move for a complete game");
  if (!Number.isFinite(seed)) throw new TypeError("Bot seed must be finite");
  if (difficulty === "easy") return easyDecision(state, seed);
  if (difficulty === "medium") return mediumDecision(state, seed);
  return hardDecision(state, seed);
}

export function isAutomaticParticipant(player: Player): player is AutomaticParticipant {
  return player.kind === "automatic";
}

function rejected(state: GameState, reason: MoveRejectionReason): MoveResult {
  return { accepted: false, reason, state, completedCells: [] };
}

export function applyMove(state: GameState, move: Move): MoveResult {
  if (state.status === "complete") return rejected(state, "game-complete");
  if (!state.board.edges.some((edge) => edge.id === move.edgeId)) return rejected(state, "unknown-edge");
  if (state.occupiedEdges.includes(move.edgeId)) return rejected(state, "occupied-edge");
  if (state.currentPlayerId !== move.playerId || !state.players.some((player) => player.id === move.playerId)) return rejected(state, "wrong-turn");
  const occupied = new Set([...state.occupiedEdges, move.edgeId]);
  const completedCells = state.board.cells.filter((cell) => !state.cellOwners[cell.id] && cell.edges.every((edge) => occupied.has(edge))).map((cell) => cell.id);
  const cellOwners = { ...state.cellOwners };
  completedCells.forEach((id) => { cellOwners[id] = move.playerId; });
  const scores = { ...state.scores, [move.playerId]: state.scores[move.playerId] + completedCells.length };
  const complete = Object.keys(cellOwners).length === state.board.cells.length;
  const playerIndex = state.players.findIndex((player) => player.id === move.playerId);
  const nextPlayerId = completedCells.length ? move.playerId : state.players[(playerIndex + 1) % state.players.length].id;
  const max = Math.max(...Object.values(scores));
  const winners = complete ? state.players.filter((player) => scores[player.id] === max).map((player) => player.id) : [];
  const next: GameState = { ...state, occupiedEdges: [...occupied].sort(), cellOwners, scores, currentPlayerId: nextPlayerId, status: complete ? "complete" : "active", winners };
  return { accepted: true, state: next, completedCells };
}
