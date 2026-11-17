import { applyMove, chooseBotMove, createBoardFromSelection, createGame, isAutomaticParticipant, type Board, type BoardSelection, type Edge, type BotDifficulty, type GameState, type Player } from "../../engine/src/index.js";
import catalog from "../../../assets/boards/silhouette-candidates.json";

export const PLAYER_COLORS = ["blue", "yellow", "coral", "green"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type GameMode = "machine" | "local" | "private" | "public";
export type LocalPlayerConfig = Readonly<{ id: string; name: string; color: PlayerColor; kind?: "human" | "automatic"; difficulty?: BotDifficulty; seed?: number }>;
export type LocalBoardSelection = Readonly<{ kind: "classic"; rows: number; columns: number }> | Readonly<{ kind: "silhouette"; id: string; cells: readonly { row: number; column: number }[] }>;
export type LocalConfig = Readonly<{ mode?: "local" | "machine"; players: readonly LocalPlayerConfig[]; board?: LocalBoardSelection; rows?: number; columns?: number }>;
export type LocalSession = Readonly<{ config: LocalConfig; state: GameState }>;
export type ActionFeedback = Readonly<{ kind: "none" | "move" | "capture" | "multi" | "invalid"; message: string }>;

type CatalogTemplate = Readonly<{ id: string; rows: readonly string[] }>;
export const SILHOUETTE_CATALOG = catalog.templates as readonly CatalogTemplate[];
function assertCatalogTemplate(template: CatalogTemplate): void {
  if (!template.rows.length || template.rows.some((row) => row.length !== template.rows[0].length || !/^[#.]+$/.test(row))) throw new Error("La máscara de silueta no es rectangular.");
}
export const silhouetteCells = (template: CatalogTemplate) => {
  assertCatalogTemplate(template);
  return template.rows.flatMap((row, r) => [...row].flatMap((value, column) => value === "#" ? [{ row: r, column }] : []));
};
export const silhouetteSelection = (id: string): LocalBoardSelection => {
  const template = SILHOUETTE_CATALOG.find((candidate) => candidate.id === id);
  if (!template) throw new RangeError("Silueta no catalogada.");
  return { kind: "silhouette", id, cells: silhouetteCells(template) };
};
export const BOARD_SELECTIONS = [
  { kind: "classic", id: "classic", label: "Clásico" },
  ...SILHOUETTE_CATALOG.map(({ id }) => ({ kind: "silhouette" as const, id, label: id.replace("-", " ") })),
] as const;

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
  const board = config.board ?? { kind: "classic" as const, rows: config.rows, columns: config.columns };
  try { createBoardFromSelection(board as BoardSelection); } catch (error) { return error instanceof Error ? error.message : "La configuración del tablero no es válida."; }
  return null;
}

export function createLocalSession(config: LocalConfig): LocalSession {
  const error = validateLocalConfig(config);
  if (error) throw new RangeError(error);
  const players: readonly Player[] = config.players.map(({ id, name, kind, difficulty, seed }) => kind === "automatic"
    ? { id, name: name.trim(), kind: "automatic", difficulty: difficulty!, seed: seed! }
    : { id, name: name.trim(), kind: "human" });
  const board = config.board ?? { kind: "classic" as const, rows: config.rows, columns: config.columns };
  return { config, state: createGame(createBoardFromSelection(board as BoardSelection), players) };
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
