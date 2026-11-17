import { applyMove, chooseBotMove, createGame, createRectangularBoard, isAutomaticParticipant, type Board, type Edge, type BotDifficulty, type GameState, type Player, type Vertex } from "../../engine/src/index.js";

export const PLAYER_COLORS = ["blue", "yellow", "coral", "green"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type GameMode = "machine" | "local" | "private" | "public";
export type LocalPlayerConfig = Readonly<{ id: string; name: string; color: PlayerColor; kind?: "human" | "automatic"; difficulty?: BotDifficulty; seed?: number }>;
export type LocalConfig = Readonly<{ mode?: "local" | "machine"; players: readonly LocalPlayerConfig[]; rows: number; columns: number }>;
export type LocalSession = Readonly<{ config: LocalConfig; state: GameState; edgeOwners: Readonly<Record<string, string>> }>;
export type ActionFeedback = Readonly<{ kind: "none" | "move" | "capture" | "multi" | "invalid"; message: string }>;

export const MODES: readonly Readonly<{ id: GameMode; label: string; available: boolean; description: string }>[] = [
  { id: "machine", label: "Contra la máquina", available: true, description: "1 humano + 1–3 bots" },
  { id: "local", label: "Multijugador local", available: true, description: "2–4 personas" },
  { id: "private", label: "Sala privada", available: false, description: "Próximamente" },
  { id: "public", label: "Partida pública", available: false, description: "Próximamente" },
];

export function validateLocalConfig(config: LocalConfig): string | null {
  const bots = config.players.filter((player) => player.kind === "automatic");
  if (config.mode === "machine" && (bots.length < 1 || bots.length > 3 || config.players.filter((player) => player.kind !== "automatic").length !== 1)) return "La partida contra máquina necesita un humano y entre 1 y 3 bots.";
  if (config.players.length < 2 || config.players.length > 4) return "Elige entre 2 y 4 jugadores.";
  if (bots.some((bot) => !bot.difficulty || !Number.isFinite(bot.seed))) return "Cada bot necesita dificultad y semilla válidas.";
  if (config.players.some((player) => !player.name.trim())) return "Cada jugador necesita un apodo.";
  if (new Set(config.players.map((player) => player.name.trim().toLocaleLowerCase())).size !== config.players.length) return "Los apodos deben ser diferentes.";
  if (!Number.isInteger(config.rows) || !Number.isInteger(config.columns) || config.rows < 2 || config.rows > 8 || config.columns < 2 || config.columns > 8) return "El tablero debe tener entre 2 y 8 filas y columnas.";
  return null;
}

export function createLocalSession(config: LocalConfig): LocalSession {
  const error = validateLocalConfig(config);
  if (error) throw new RangeError(error);
  const players: readonly Player[] = config.players.map(({ id, name, kind, difficulty, seed }) => kind === "automatic"
    ? { id, name: name.trim(), kind: "automatic", difficulty: difficulty!, seed: seed! }
    : { id, name: name.trim(), kind: "human" });
  return { config, state: createGame(createRectangularBoard(config.rows, config.columns), players), edgeOwners: {} };
}

export function selectEdge(session: LocalSession, edgeId: string): Readonly<{ session: LocalSession; feedback: ActionFeedback }> {
  const movingPlayerId = session.state.currentPlayerId;
  const result = applyMove(session.state, { playerId: movingPlayerId, edgeId });
  if (!result.accepted) {
    const message = result.reason === "occupied-edge" ? "Esa arista ya está ocupada." : "Elige una arista del tablero.";
    return { session, feedback: { kind: "invalid", message } };
  }
  const count = result.completedCells.length;
  const feedback: ActionFeedback = count > 1 ? { kind: "multi", message: `¡Conquista doble! +${count} puntos y sigues jugando.` } : count === 1 ? { kind: "capture", message: "¡Cuadro conquistado! Sigues jugando." } : { kind: "move", message: "Turno del siguiente jugador." };
  const edgeOwners = { ...session.edgeOwners, [edgeId]: movingPlayerId };
  return { session: { ...session, state: result.state, edgeOwners }, feedback };
}

/** Runs only automatic turns, routing every move through applyMove. */
export function runAutomaticTurns(session: LocalSession): Readonly<{ session: LocalSession; feedback: ActionFeedback }> {
  let current = session;
  let feedback: ActionFeedback = { kind: "none", message: "" };
  const limit = current.state.board.edges.length + 1;
  for (let step = 0; step < limit && current.state.status !== "complete"; step += 1) {
    const participant = current.state.players.find((player) => player.id === current.state.currentPlayerId);
    if (!participant || !isAutomaticParticipant(participant)) break;
    const edgeId = chooseBotMove(current.state, participant.difficulty, participant.seed);
    const result = selectEdge(current, edgeId);
    if (result.feedback.kind === "invalid") throw new Error("Automatic decision produced an illegal edge");
    current = result.session;
    feedback = result.feedback;
  }
  return { session: current, feedback };
}

export function boardExtent(board: Board): Readonly<{ width: number; height: number }> {
  const rows = Math.max(...board.cells.map((cell) => cell.row)) + 1;
  const columns = Math.max(...board.cells.map((cell) => cell.column)) + 1;
  return { width: columns, height: rows };
}

export function edgeGeometry(edge: Edge, cellSize = 72): Readonly<{ x1: number; y1: number; x2: number; y2: number }> {
  return { x1: edge.a.column * cellSize, y1: edge.a.row * cellSize, x2: edge.b.column * cellSize, y2: edge.b.row * cellSize };
}

export function findEdgeBetween(board: Board, a: Vertex, b: Vertex): Edge | undefined {
  return board.edges.find((e) =>
    (e.a.row === a.row && e.a.column === a.column && e.b.row === b.row && e.b.column === b.column) ||
    (e.b.row === a.row && e.b.column === a.column && e.a.row === b.row && e.a.column === b.column)
  );
}

export function uniqueBoardVertices(board: Board): readonly Vertex[] {
  const map = new Map<string, Vertex>();
  for (const edge of board.edges) {
    map.set(`${edge.a.row},${edge.a.column}`, edge.a);
    map.set(`${edge.b.row},${edge.b.column}`, edge.b);
  }
  return [...map.values()].sort((a, b) => a.row - b.row || a.column - b.column);
}

export type GestureState = Readonly<{ active: boolean; moved: boolean; pointers: number; scale: number; x: number; y: number; startDistance: number; lastX: number; lastY: number }>;
export const idleGesture: GestureState = { active: false, moved: false, pointers: 0, scale: 1, x: 0, y: 0, startDistance: 0, lastX: 0, lastY: 0 };
export function beginGesture(x: number, y: number, pointers = 1, startDistance = 0): GestureState { return { active: true, moved: false, pointers, scale: 1, x, y, startDistance, lastX: x, lastY: y }; }
export function updateGesture(start: GestureState, x: number, y: number, scale = 1, pointers = start.pointers, threshold = 8): GestureState { const moved = start.moved || pointers > 1 || Math.abs(x - start.x) >= threshold || Math.abs(y - start.y) >= threshold || Math.abs(scale - 1) >= 0.03; return { ...start, moved, pointers, scale, lastX: x, lastY: y }; }
export function canSelectAfterGesture(gesture: GestureState): boolean { return gesture.active && !gesture.moved && gesture.pointers === 1; }

export const VIEWPORT_CHECKS = [
  { width: 360, height: 640, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1280, height: 800, label: "desktop" },
] as const;
