export type PlayerId = string;
export type EdgeId = string;
export type CellId = string;
export type Vertex = Readonly<{ row: number; column: number }>;
export type Edge = Readonly<{ id: EdgeId; a: Vertex; b: Vertex }>;
export type SquareCell = Readonly<{ id: CellId; row: number; column: number; edges: readonly [EdgeId, EdgeId, EdgeId, EdgeId] }>;
export type Board = Readonly<{ cells: readonly SquareCell[]; edges: readonly Edge[] }>;
export type Player = Readonly<{ id: PlayerId; name: string }>;
export type GameStatus = "active" | "complete";
export type GameState = Readonly<{
  board: Board;
  players: readonly Player[];
  occupiedEdges: readonly EdgeId[];
  cellOwners: Readonly<Record<CellId, PlayerId>>;
  scores: Readonly<Record<PlayerId, number>>;
  currentPlayerId: PlayerId;
  status: GameStatus;
  winners: readonly PlayerId[];
}>;
export type Move = Readonly<{ playerId: PlayerId; edgeId: EdgeId }>;
export type MoveResult = Readonly<{ accepted: boolean; reason?: "unknown-edge" | "occupied-edge" | "wrong-turn"; state: GameState; completedCells: readonly CellId[] }>;

const vertexKey = (v: Vertex) => `${v.row},${v.column}`;
const edgeKey = (a: Vertex, b: Vertex) => {
  const left = vertexKey(a) < vertexKey(b) ? a : b;
  const right = left === a ? b : a;
  return `${vertexKey(left)}-${vertexKey(right)}`;
};

export function createBoard(cells: ReadonlyArray<Readonly<{ row: number; column: number }>>): Board {
  const seen = new Set<string>();
  const edgeMap = new Map<EdgeId, Edge>();
  const output: SquareCell[] = [];
  for (const cell of cells) {
    if (!Number.isInteger(cell.row) || !Number.isInteger(cell.column) || cell.row < 0 || cell.column < 0) throw new Error("Cells must use non-negative integer coordinates");
    const id = `${cell.row},${cell.column}`;
    if (seen.has(id)) throw new Error(`Duplicate cell: ${id}`);
    seen.add(id);
    const vertices: [Vertex, Vertex, Vertex, Vertex] = [
      { row: cell.row, column: cell.column }, { row: cell.row, column: cell.column + 1 },
      { row: cell.row + 1, column: cell.column + 1 }, { row: cell.row + 1, column: cell.column }
    ];
    const ids = vertices.map((v, i) => edgeKey(v, vertices[(i + 1) % 4])) as [EdgeId, EdgeId, EdgeId, EdgeId];
    vertices.forEach((v, i) => {
      const next = vertices[(i + 1) % 4]; const edgeId = ids[i];
      if (!edgeMap.has(edgeId)) edgeMap.set(edgeId, { id: edgeId, a: v, b: next });
    });
    output.push({ id, row: cell.row, column: cell.column, edges: ids });
  }
  return { cells: output, edges: [...edgeMap.values()] };
}

export function createGame(board: Board, players: readonly Player[]): GameState {
  if (players.length < 2) throw new Error("At least two players are required");
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new Error("Player IDs must be unique");
  return { board, players: [...players], occupiedEdges: [], cellOwners: {}, scores: Object.fromEntries(players.map((p) => [p.id, 0])), currentPlayerId: players[0].id, status: "active", winners: [] };
}

export function applyMove(state: GameState, move: Move): MoveResult {
  if (!state.board.edges.some((edge) => edge.id === move.edgeId)) return { accepted: false, reason: "unknown-edge", state, completedCells: [] };
  if (state.occupiedEdges.includes(move.edgeId)) return { accepted: false, reason: "occupied-edge", state, completedCells: [] };
  if (state.currentPlayerId !== move.playerId || !state.players.some((player) => player.id === move.playerId)) return { accepted: false, reason: "wrong-turn", state, completedCells: [] };
  const occupied = new Set([...state.occupiedEdges, move.edgeId]);
  const completedCells = state.board.cells.filter((cell) => !state.cellOwners[cell.id] && cell.edges.every((edge) => occupied.has(edge))).map((cell) => cell.id);
  const cellOwners = { ...state.cellOwners };
  completedCells.forEach((id) => { cellOwners[id] = move.playerId; });
  const scores = { ...state.scores, [move.playerId]: state.scores[move.playerId] + completedCells.length };
  const complete = Object.keys(cellOwners).length === state.board.cells.length;
  const nextIndex = (state.players.findIndex((player) => player.id === move.playerId) + 1) % state.players.length;
  const nextPlayerId = completedCells.length ? move.playerId : state.players[nextIndex].id;
  const max = Math.max(...Object.values(scores));
  const winners = complete ? state.players.filter((player) => scores[player.id] === max).map((player) => player.id) : [];
  const next: GameState = { ...state, occupiedEdges: [...occupied], cellOwners, scores, currentPlayerId: nextPlayerId, status: complete ? "complete" : "active", winners };
  return { accepted: true, state: next, completedCells };
}
