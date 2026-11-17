export type PlayerId = string;
export type EdgeId = string;
export type CellId = string;
export type Vertex = Readonly<{ row: number; column: number }>;
export type CellCoordinate = Readonly<{ row: number; column: number }>;
export type Edge = Readonly<{ id: EdgeId; a: Vertex; b: Vertex }>;
export type SquareCell = Readonly<{ id: CellId; row: number; column: number; edges: readonly [EdgeId, EdgeId, EdgeId, EdgeId] }>;
export type Board = Readonly<{ cells: readonly SquareCell[]; edges: readonly Edge[] }>;
export type BoardDimensions = Readonly<{ rows: number; columns: number }>;
export type Player = Readonly<{ id: PlayerId; name: string }>;
export type GameStatus = "active" | "complete";
export type GameState = Readonly<{ board: Board; players: readonly Player[]; occupiedEdges: readonly EdgeId[]; cellOwners: Readonly<Record<CellId, PlayerId>>; scores: Readonly<Record<PlayerId, number>>; currentPlayerId: PlayerId; status: GameStatus; winners: readonly PlayerId[] }>;
export type Move = Readonly<{ playerId: PlayerId; edgeId: EdgeId }>;
export type MoveRejectionReason = "unknown-edge" | "occupied-edge" | "wrong-turn" | "game-complete";
export type MoveResult = Readonly<{ accepted: boolean; reason?: MoveRejectionReason; state: GameState; completedCells: readonly CellId[] }>;

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
  return buildBoard(cells);
}

export function createBoard(cells: ReadonlyArray<CellCoordinate>): Board {
  return cells.length === 0 ? buildBoard([]) : prepareCellMask(cells);
}

export function createGame(board: Board, players: readonly Player[]): GameState {
  if (board.cells.length === 0) throw new Error("A game board must contain at least one cell");
  if (players.length < 2) throw new Error("At least two players are required");
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new Error("Player IDs must be unique");
  return { board, players: players.map((p) => ({ ...p })), occupiedEdges: [], cellOwners: {}, scores: Object.fromEntries(players.map((p) => [p.id, 0])), currentPlayerId: players[0].id, status: "active", winners: [] };
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
