import { applyMove, createGame, createRectangularBoard, type Board, type Edge, type GameState, type Player } from "@boxio/engine";

export const PLAYER_COLORS = ["blue", "yellow", "coral", "green"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type GameMode = "machine" | "local" | "private" | "public";
export type LocalConfig = Readonly<{ players: readonly Readonly<{ id: string; name: string; color: PlayerColor }>[]; rows: number; columns: number }>;
export type LocalSession = Readonly<{ config: LocalConfig; state: GameState }>;
export type ActionFeedback = Readonly<{ kind: "none" | "move" | "capture" | "multi" | "invalid"; message: string }>;

export const MODES: readonly Readonly<{ id: GameMode; label: string; available: boolean; description: string }>[] = [
  { id: "machine", label: "Contra la máquina", available: false, description: "Próximamente" },
  { id: "local", label: "Multijugador local", available: true, description: "2–4 personas" },
  { id: "private", label: "Sala privada", available: false, description: "Próximamente" },
  { id: "public", label: "Partida pública", available: false, description: "Próximamente" },
];

export function validateLocalConfig(config: LocalConfig): string | null {
  if (config.players.length < 2 || config.players.length > 4) return "Elige entre 2 y 4 jugadores.";
  if (config.players.some((player) => !player.name.trim())) return "Cada jugador necesita un apodo.";
  if (new Set(config.players.map((player) => player.name.trim().toLocaleLowerCase())).size !== config.players.length) return "Los apodos deben ser diferentes.";
  if (!Number.isInteger(config.rows) || !Number.isInteger(config.columns) || config.rows < 2 || config.rows > 8 || config.columns < 2 || config.columns > 8) return "El tablero debe tener entre 2 y 8 filas y columnas.";
  return null;
}

export function createLocalSession(config: LocalConfig): LocalSession {
  const error = validateLocalConfig(config);
  if (error) throw new RangeError(error);
  const players: readonly Player[] = config.players.map(({ id, name }) => ({ id, name: name.trim() }));
  return { config, state: createGame(createRectangularBoard(config.rows, config.columns), players) };
}

export function selectEdge(session: LocalSession, edgeId: string): Readonly<{ session: LocalSession; feedback: ActionFeedback }> {
  const result = applyMove(session.state, { playerId: session.state.currentPlayerId, edgeId });
  if (!result.accepted) {
    const message = result.reason === "occupied-edge" ? "Esa arista ya está ocupada." : "Elige una arista del tablero.";
    return { session, feedback: { kind: "invalid", message } };
  }
  const count = result.completedCells.length;
  const feedback: ActionFeedback = count > 1 ? { kind: "multi", message: `¡Conquista doble! +${count} puntos y sigues jugando.` } : count === 1 ? { kind: "capture", message: "¡Cuadro conquistado! Sigues jugando." } : { kind: "move", message: "Turno del siguiente jugador." };
  return { session: { ...session, state: result.state }, feedback };
}

export function boardExtent(board: Board): Readonly<{ width: number; height: number }> {
  const rows = Math.max(...board.cells.map((cell) => cell.row)) + 1;
  const columns = Math.max(...board.cells.map((cell) => cell.column)) + 1;
  return { width: columns, height: rows };
}

export function edgeGeometry(edge: Edge, cellSize = 72): Readonly<{ x1: number; y1: number; x2: number; y2: number }> {
  return { x1: edge.a.column * cellSize, y1: edge.a.row * cellSize, x2: edge.b.column * cellSize, y2: edge.b.row * cellSize };
}

export type GestureState = Readonly<{ active: boolean; moved: boolean; pointers: number; scale: number; x: number; y: number; startDistance: number; lastX: number; lastY: number }>;
export const idleGesture: GestureState = { active: false, moved: false, pointers: 0, scale: 1, x: 0, y: 0, startDistance: 0, lastX: 0, lastY: 0 };
export function beginGesture(x: number, y: number, pointers = 1, startDistance = 0): GestureState { return { active: true, moved: false, pointers, scale: 1, x, y, startDistance, lastX: x, lastY: y }; }
export function updateGesture(start: GestureState, x: number, y: number, scale = 1, pointers = start.pointers): GestureState { const moved = start.moved || pointers > 1 || Math.abs(x - start.x) >= 8 || Math.abs(y - start.y) >= 8 || Math.abs(scale - 1) >= 0.03; return { ...start, moved, pointers, scale, lastX: x, lastY: y }; }
export function canSelectAfterGesture(gesture: GestureState): boolean { return gesture.active && !gesture.moved && gesture.pointers === 1; }

export const VIEWPORT_CHECKS = [
  { width: 360, height: 640, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1280, height: 800, label: "desktop" },
] as const;
