import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SwUpdate } from "@angular/service-worker";
import { canSelectAfterGesture, createLocalSession, edgeGeometry, findEdgeBetween, idleGesture, beginGesture, runAutomaticTurns, uniqueBoardVertices, updateGesture, MODES, PLAYER_COLORS, selectEdge, type ActionFeedback, type GameMode, type GestureState, type LocalPlayerConfig, type LocalSession } from "./local-game";
import { playBoxioSound, soundCatalog } from "../../../assets/audio/boxio-sounds";
import { UpdateCoordinator } from "./update-coordinator";

@Component({
  selector: "boxio-root",
  standalone: true,
  imports: [CommonModule],
  template: `
<main class="app-shell">
  <p *ngIf="updatePending && screen !== 'game'" class="update-banner" role="status">Hay una actualización lista. <button class="quiet" (click)="activatePendingUpdate()">Actualizar</button></p>
  <header class="brand"><img src="assets/branding/boxio-wordmark.svg" alt="Boxio"><span>Juega, captura, conquista</span></header>
  <section *ngIf="screen === 'home'" class="panel home">
    <img class="hero-icon" src="assets/branding/boxio-app-icon.svg" alt="">
    <h1>Elige cómo jugar</h1>
    <p class="muted">Sin registro. Comparte el dispositivo y disfruta la partida.</p>
    <div class="mode-grid">
      <button *ngFor="let mode of modes" class="mode-card" [class.disabled]="!mode.available" [disabled]="!mode.available" (click)="chooseMode(mode.id)" [attr.aria-label]="mode.label + (mode.available ? '' : ', no disponible')">
        <span class="mode-icon">{{ mode.id === 'local' ? '👥' : mode.id === 'machine' ? '🤖' : mode.id === 'private' ? '🔒' : '🌐' }}</span>
        <strong>{{ mode.label }}</strong>
        <small>{{ mode.description }}</small>
      </button>
    </div>
    <p class="scope-note">Las modalidades bloqueadas se habilitarán en próximas entregas.</p>
  </section>
  <section *ngIf="screen === 'setup'" class="panel setup">
    <button class="back" (click)="screen = 'home'">← Inicio</button>
    <h1>Prepara tu partida</h1>
    <p class="muted">{{ machineMode ? 'Un humano y entre 1 y 3 bots.' : 'Elige entre 2 y 4 jugadores.' }} Tablero rectangular, sin conexión.</p>
    <div class="player-count">
      <button *ngFor="let count of [2,3,4]" [class.selected]="playerCount === count" (click)="setPlayerCount(count)">{{ machineMode ? count - 1 : count }} {{ machineMode ? 'bots' : 'jugadores' }}</button>
    </div>
    <div class="player-form">
      <label *ngFor="let player of draftPlayers; let i = index">
        {{ player.kind === 'automatic' ? 'Bot ' + i : 'Humano' }}
        <span class="color-dot" [style.background]="colorValue(player.color)"></span>
        <input [value]="player.name" (input)="setName(i, $any($event.target).value)" maxlength="18" [attr.aria-label]="'Apodo del participante ' + (i + 1)">
        <select *ngIf="player.kind === 'automatic'" [value]="player.difficulty" (change)="setDifficulty(i, $any($event.target).value)">
          <option value="easy">Fácil</option>
          <option value="medium">Media</option>
          <option value="hard">Difícil</option>
        </select>
      </label>
    </div>
    <div class="board-choice">
      <label>Filas <input type="number" min="2" max="8" [value]="rows" (input)="rows = +$any($event.target).value"></label>
      <label>Columnas <input type="number" min="2" max="8" [value]="columns" (input)="columns = +$any($event.target).value"></label>
    </div>
    <p *ngIf="setupError" class="error" role="alert">{{ setupError }}</p>
    <button class="primary" (click)="startGame()">Empezar partida</button>
  </section>
  <section *ngIf="screen === 'game' && session" class="game-screen">
    <div class="game-status">
      <div>
        <p class="eyebrow">Turno actual</p>
        <h1 [style.color]="colorValue(currentPlayerColor)">{{ currentPlayerName }}</h1>
      </div>
      <div class="scores" aria-label="Marcadores">
        <div *ngFor="let player of session.config.players" class="score" [class.active]="player.id === session.state.currentPlayerId">
          <span class="color-dot" [style.background]="colorValue(player.color)"></span>
          <b>{{ player.name }}</b>
          <strong>{{ session.state.scores[player.id] }}</strong>
        </div>
      </div>
    </div>
    <p class="feedback" [class.invalid]="feedback.kind === 'invalid'" [class.capture]="feedback.kind === 'capture' || feedback.kind === 'multi'" role="status">{{ feedback.message }}</p>
    <div class="board-viewport" (pointerdown)="pointerDown($event)" (pointermove)="pointerMove($event)" (pointerup)="pointerUp($event)" (pointercancel)="pointerCancel($event)">
      <svg class="board" [attr.viewBox]="'0 0 ' + boardWidth + ' ' + boardHeight" [style.transform]="'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')'" role="img" aria-label="Tablero de juego">
        <g class="cells">
          <rect *ngFor="let cell of session.state.board.cells" [attr.x]="cell.column * cellSize" [attr.y]="cell.row * cellSize" [attr.width]="cellSize" [attr.height]="cellSize" [class.claimed]="session.state.cellOwners[cell.id]" [style.fill]="cellColor(cell.id)"></rect>
        </g>
        <g class="edges">
          <ng-container *ngFor="let edge of session.state.board.edges">
            <line class="edge-line"
              [class.occupied]="session.state.occupiedEdges.includes(edge.id)"
              [class.hovered]="hoveredEdgeId === edge.id && !session.state.occupiedEdges.includes(edge.id)"
              [style.stroke]="edgeLineColor(edge.id)"
              [style.stroke-width]="edgeLineWidth(edge.id)"
              [style.stroke-opacity]="edgeLineOpacity(edge.id)"
              [attr.x1]="edgeGeometry(edge).x1" [attr.y1]="edgeGeometry(edge).y1"
              [attr.x2]="edgeGeometry(edge).x2" [attr.y2]="edgeGeometry(edge).y2">
            </line>
            <line class="edge-hit"
              [class.occupied]="session.state.occupiedEdges.includes(edge.id)"
              [attr.x1]="edgeGeometry(edge).x1" [attr.y1]="edgeGeometry(edge).y1"
              [attr.x2]="edgeGeometry(edge).x2" [attr.y2]="edgeGeometry(edge).y2"
              [attr.data-edge-id]="edge.id"
              (mouseenter)="onEdgeHover(edge.id)"
              (mouseleave)="onEdgeLeave(edge.id)"
              (click)="onEdgeClick(edge.id, $event)">
            </line>
          </ng-container>
        </g>
        <g *ngIf="isDrawing && dragStartVertex && dragCurrentPoint" class="drawing-layer">
          <line class="drawing-guide"
            [attr.x1]="dragStartVertex.column * cellSize"
            [attr.y1]="dragStartVertex.row * cellSize"
            [attr.x2]="dragCurrentPoint.x"
            [attr.y2]="dragCurrentPoint.y"
            [style.stroke]="colorValue(currentPlayerColor)">
          </line>
        </g>
        <g class="vertices">
          <circle *ngFor="let v of boardVertices"
            class="vertex-dot"
            [class.active-anchor]="dragStartVertex && dragStartVertex.row === v.row && dragStartVertex.column === v.column"
            [attr.cx]="v.column * cellSize"
            [attr.cy]="v.row * cellSize"
            r="6">
          </circle>
          <circle *ngFor="let v of boardVertices"
            class="vertex-hit"
            [attr.cx]="v.column * cellSize"
            [attr.cy]="v.row * cellSize"
            r="20"
            (pointerdown)="startDraw(v, $event)">
          </circle>
        </g>
      </svg>
    </div>
    <p class="hint">En móvil: toca la línea deseada con precisión. En PC: haz clic o dibuja arrastrando entre puntos.</p>
    <button class="quiet" (click)="screen = 'home'; session = null">Salir de la partida</button>
  </section>
  <section *ngIf="screen === 'result' && session" class="panel result">
    <div class="celebration">★</div>
    <h1>{{ session.state.winners.length > 1 ? '¡Empate!' : '¡Partida terminada!' }}</h1>
    <p class="muted">Puntuación final</p>
    <div class="final-score" *ngFor="let player of session.config.players">
      <span class="color-dot" [style.background]="colorValue(player.color)"></span>
      <b>{{ player.name }}</b>
      <strong>{{ session.state.scores[player.id] }}</strong>
      <span *ngIf="session.state.winners.includes(player.id)">🏆</span>
    </div>
    <button class="primary" (click)="screen = 'home'; session = null">Volver al inicio</button>
  </section>
  <footer>
    <span>{{ soundCount }} sonidos locales</span>
    <span>·</span>
    <span>Juego local 2–4</span>
  </footer>
</main>`,
  styles: [`
    :host{display:block;min-height:100vh;color:#082c7c;font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif;background:#bde8ff url(/assets/backgrounds/sky-grid.svg) center/cover fixed}
    .app-shell{min-height:100vh;max-width:1120px;margin:auto;padding:18px 16px 28px;box-sizing:border-box}
    .brand{height:48px;display:flex;align-items:center;gap:12px}
    .brand img{width:132px}
    .brand span{font-size:12px;color:#286198}
    .panel{max-width:680px;margin:24px auto;padding:28px;background:#fff;border:3px solid #082c7c;border-radius:28px;box-shadow:0 10px 0 #82c8eb}
    .home{text-align:center}
    .hero-icon{width:72px}
    .muted{color:#42648c}
    .mode-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0}
    .mode-card,.player-count button,.primary,.quiet,.back{min-height:52px;border:2px solid #082c7c;border-radius:16px;background:#fff;color:#082c7c;font:inherit;cursor:pointer}
    .mode-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:14px}
    .mode-card.disabled{opacity:.52;cursor:not-allowed}
    .mode-icon{font-size:28px}
    .mode-card small{color:#42648c}
    .scope-note,.hint,footer{font-size:12px;color:#42648c}
    .player-count{display:flex;gap:8px;margin:20px 0}
    .player-count button{flex:1}
    .selected,.primary{background:#1e88ff!important;color:#fff!important}
    .player-form{display:grid;gap:10px}
    .player-form label{display:grid;grid-template-columns:1fr auto 1.4fr;align-items:center;gap:8px}
    .player-form input,.board-choice input{min-height:44px;border:2px solid #9acbe4;border-radius:10px;padding:0 10px;font:inherit;color:#082c7c;box-sizing:border-box;width:100%}
    .color-dot{display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #082c7c}
    .board-choice{display:flex;gap:12px;margin:14px 0}
    .board-choice label{flex:1}
    .error{color:#a61732}
    .primary{width:100%;margin-top:10px;font-weight:700}
    .back,.quiet{border:0;padding:6px 12px;background:transparent;min-height:44px}
    .game-screen{display:flex;flex-direction:column;min-height:calc(100vh - 100px)}
    .game-status{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .eyebrow{font-size:12px;margin:0;color:#42648c}
    .game-status h1{margin:3px 0;font-size:26px}
    .scores{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    .score{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px;background:#fff;border:2px solid transparent;border-radius:12px;padding:6px 10px;min-height:44px;box-sizing:border-box}
    .score.active{border-color:#1e88ff}
    .score strong{font-size:20px}
    .feedback{min-height:24px;margin:6px 0;color:#286198}
    .feedback.invalid{color:#a61732}
    .feedback.capture{font-weight:700}
    .board-viewport{flex:1;min-height:300px;margin:8px 0;border:3px solid #082c7c;border-radius:20px;background:rgba(255,255,255,.7);overflow:hidden;touch-action:none;display:flex;align-items:center;justify-content:center}
    .board{width:min(92vw,780px);height:min(62vh,620px);overflow:visible;transform-origin:center;transition:transform .08s ease}
    .cells rect{fill:#fff;stroke:#9acbe4;stroke-width:2}
    .cells rect.claimed{fill-opacity:.62}
    .edge-line{stroke-linecap:round;transition:stroke .15s ease, stroke-width .15s ease}
    .edge-hit{stroke:transparent;stroke-width:48;stroke-linecap:round;cursor:pointer}
    .edge-hit.occupied{cursor:default}
    .vertex-hit{fill:transparent;cursor:pointer}
    .vertex-dot{fill:#082c7c;transition:r .15s ease, fill .15s ease;pointer-events:none}
    .vertex-dot.active-anchor{fill:#1e88ff;r:9}
    .drawing-guide{stroke-width:7;stroke-linecap:round;stroke-dasharray:6,4;pointer-events:none;opacity:.85}
    .hint{text-align:center}
    .quiet{align-self:center}
    footer{display:flex;justify-content:center;gap:8px;margin-top:12px}
    .celebration{text-align:center;font-size:64px;color:#ffc72c}
    .final-score{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #d9edf8;font-size:20px}
    .final-score strong{font-size:28px}
    @media(max-width:600px){.app-shell{padding:12px 10px}.brand span{font-size:11px}.game-status{display:block}.scores{justify-content:flex-start}.score{flex:1;min-width:80px}.board-viewport{min-height:320px}.mode-grid{gap:8px}.mode-card{padding:10px 5px}.panel{padding:20px 16px;margin-top:14px}}
    @media(min-width:800px){.board-viewport{min-height:540px}.game-status{padding:0 12px}}
  `]
})
export class AppComponent {
  screen: "home" | "setup" | "game" | "result" = "home";
  modes = MODES;
  soundCount = Object.keys(soundCatalog).length;
  playerCount = 2;
  rows = 3;
  columns = 3;
  private readonly updates = new UpdateCoordinator();

  constructor(private readonly swUpdate: SwUpdate) {
    if (swUpdate.isEnabled) {
      swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === "VERSION_READY") {
          this.updates.notifyNewVersion();
          this.swUpdate.activateUpdate().then(() => location.reload());
        }
      });
      swUpdate.checkForUpdate();
    }
  }

  get updatePending() { return this.updates.updatePending; }
  async activatePendingUpdate() {
    if (!this.updates.consumeAtSafeBoundary("safe")) return;
    await this.swUpdate.activateUpdate();
    location.reload();
  }

  draftPlayers: LocalPlayerConfig[] = PLAYER_COLORS.slice(0, 2).map((color, i) => ({ id: `player-${i + 1}`, name: `Jugador ${i + 1}`, color }));
  setupError = "";
  session: LocalSession | null = null;
  feedback: ActionFeedback = { kind: "none", message: "" };
  readonly cellSize = 72;
  zoom = 1;
  panX = 0;
  panY = 0;
  gesture: GestureState = idleGesture;
  private pointers = new Map<number, { x: number; y: number }>();
  private audioContext: AudioContext | null = null;
  machineMode = false;

  hoveredEdgeId: string | null = null;
  isDrawing = false;
  dragStartVertex: { row: number; column: number } | null = null;
  dragCurrentPoint: { x: number; y: number } | null = null;

  chooseMode(mode: GameMode) {
    if (mode === "local" || mode === "machine") {
      this.machineMode = mode === "machine";
      this.setPlayerCount(this.machineMode ? 2 : 2);
      this.screen = "setup";
    }
  }

  setPlayerCount(count: number) {
    this.playerCount = count;
    this.draftPlayers = PLAYER_COLORS.slice(0, count).map((color, i) =>
      this.machineMode
        ? (i === 0 ? { id: "human", name: "Tú", color, kind: "human" as const } : { id: `bot-${i}`, name: `Bot ${i}`, color, kind: "automatic" as const, difficulty: "easy" as const, seed: 100 + i })
        : (this.draftPlayers[i] ?? ({ id: `player-${i + 1}`, name: `Jugador ${i + 1}`, color }))
    );
  }

  setName(index: number, name: string) {
    this.draftPlayers[index] = { ...this.draftPlayers[index], name };
  }

  setDifficulty(index: number, difficulty: "easy" | "medium" | "hard") {
    this.draftPlayers[index] = { ...this.draftPlayers[index], difficulty };
  }

  startGame() {
    const config = {
      mode: this.machineMode ? ("machine" as const) : ("local" as const),
      players: this.draftPlayers.slice(0, this.playerCount),
      rows: this.rows,
      columns: this.columns
    } as const;
    try {
      this.session = createLocalSession(config);
      this.setupError = "";
      this.feedback = { kind: "none", message: "Turno de " + (this.session.state.players[0]?.name ?? "") };
      this.screen = "game";
      if (this.machineMode) {
        const automatic = runAutomaticTurns(this.session);
        this.session = automatic.session;
        if (automatic.feedback.kind !== "none") this.feedback = automatic.feedback;
        this.finishIfComplete();
      }
    } catch (error) {
      this.setupError = error instanceof Error ? error.message : "No se pudo iniciar la partida.";
    }
  }

  edgeGeometry = (edge: Parameters<typeof edgeGeometry>[0]) => edgeGeometry(edge, this.cellSize);
  get boardWidth() { return ((this.session?.state.board.cells.reduce((max, cell) => Math.max(max, cell.column), 0) ?? 0) + 1) * this.cellSize; }
  get boardHeight() { return ((this.session?.state.board.cells.reduce((max, cell) => Math.max(max, cell.row), 0) ?? 0) + 1) * this.cellSize; }
  get currentPlayerName() { return this.session?.state.players.find((p) => p.id === this.session?.state.currentPlayerId)?.name ?? ""; }
  get currentPlayerColor() { return this.session?.config.players.find((p) => p.id === this.session?.state.currentPlayerId)?.color ?? "blue"; }
  get boardVertices(): readonly { row: number; column: number }[] {
    return this.session ? uniqueBoardVertices(this.session.state.board) : [];
  }

  colorValue(color: string) {
    return ({
      blue: "#1e88ff",
      yellow: "#ffb800",
      coral: "#ff4757",
      green: "#2ed573",
      white: "#ffffff"
    } as Record<string, string>)[color] ?? "#082c7c";
  }

  cellColor(cellId: string) {
    const owner = this.session?.state.cellOwners[cellId];
    return this.colorValue(this.session?.config.players.find((p) => p.id === owner)?.color ?? "white");
  }

  edgeLineColor(edgeId: string): string {
    if (this.session?.state.occupiedEdges.includes(edgeId)) {
      const ownerId = this.session?.edgeOwners?.[edgeId];
      if (ownerId) {
        const player = this.session?.config.players.find((p) => p.id === ownerId);
        if (player) return this.colorValue(player.color);
      }
      return "#082c7c";
    }
    if (this.hoveredEdgeId === edgeId) {
      return this.colorValue(this.currentPlayerColor);
    }
    return "#b8cee0";
  }

  edgeLineWidth(edgeId: string): string {
    if (this.session?.state.occupiedEdges.includes(edgeId)) return "9px";
    if (this.hoveredEdgeId === edgeId) return "10px";
    return "6px";
  }

  edgeLineOpacity(edgeId: string): string {
    if (this.hoveredEdgeId === edgeId && !this.session?.state.occupiedEdges.includes(edgeId)) return "0.75";
    return "1";
  }

  onEdgeHover(edgeId: string) {
    if (this.session && !this.session.state.occupiedEdges.includes(edgeId)) {
      this.hoveredEdgeId = edgeId;
    }
  }

  onEdgeLeave(edgeId: string) {
    if (this.hoveredEdgeId === edgeId) {
      this.hoveredEdgeId = null;
    }
  }

  onEdgeClick(edgeId: string, event?: MouseEvent) {
    event?.stopPropagation?.();
    if (this.isDrawing) return;
    if (this.session?.state.occupiedEdges.includes(edgeId)) return;
    this.tapEdge(edgeId);
  }

  tapEdge(edgeId: string) {
    if (!this.session) return;
    const result = selectEdge(this.session, edgeId);
    this.feedback = result.feedback;
    if (result.feedback.kind !== "invalid") {
      this.session = result.session;
      this.playSound(result.feedback.kind === "multi" ? "multi" : result.feedback.kind === "capture" ? "capture" : "edge");
      const automatic = runAutomaticTurns(this.session);
      this.session = automatic.session;
      if (automatic.feedback.kind !== "none") this.feedback = automatic.feedback;
      this.finishIfComplete();
    } else {
      this.playSound("invalid");
    }
  }

  /** PC Mouse Only: Drag-to-draw */
  startDraw(v: { row: number; column: number }, event: PointerEvent) {
    if (event.pointerType !== "mouse") return; // Touch on mobile is reserved for tap & pan
    if (this.session?.state.status === "complete") return;
    const currentParticipant = this.session?.state.players.find((p) => p.id === this.session?.state.currentPlayerId);
    if (currentParticipant?.kind === "automatic") return;

    event.stopPropagation();
    this.isDrawing = true;
    this.dragStartVertex = v;
    const svg = (event.target as Element).closest("svg") as SVGSVGElement | null;
    if (svg) {
      this.dragCurrentPoint = this.toSvgCoordinates(svg, event.clientX, event.clientY);
    } else {
      this.dragCurrentPoint = { x: v.column * this.cellSize, y: v.row * this.cellSize };
    }
  }

  private toSvgCoordinates(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    try {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: clientX, y: clientY };
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    } catch {
      return { x: clientX, y: clientY };
    }
  }

  private checkNearAdjacentVertex(point: { x: number; y: number }) {
    if (!this.dragStartVertex || !this.session) return;
    const start = this.dragStartVertex;
    for (const v of this.boardVertices) {
      const distCells = Math.abs(v.row - start.row) + Math.abs(v.column - start.column);
      if (distCells === 1) {
        const vx = v.column * this.cellSize;
        const vy = v.row * this.cellSize;
        if (Math.hypot(point.x - vx, point.y - vy) < this.cellSize * 0.45) {
          const edge = findEdgeBetween(this.session.state.board, start, v);
          if (edge && !this.session.state.occupiedEdges.includes(edge.id)) {
            this.hoveredEdgeId = edge.id;
            return;
          }
        }
      }
    }
  }

  findClosestAvailableEdge(point: { x: number; y: number }, maxDistance: number): string | null {
    if (!this.session) return null;
    let bestEdgeId: string | null = null;
    let minDistance = maxDistance;

    for (const edge of this.session.state.board.edges) {
      if (this.session.state.occupiedEdges.includes(edge.id)) continue;
      const geom = edgeGeometry(edge, this.cellSize);
      let dist: number;
      if (geom.y1 === geom.y2) {
        const minX = Math.min(geom.x1, geom.x2);
        const maxX = Math.max(geom.x1, geom.x2);
        if (point.x >= minX - 12 && point.x <= maxX + 12) {
          dist = Math.abs(point.y - geom.y1);
        } else {
          dist = Math.min(Math.hypot(point.x - minX, point.y - geom.y1), Math.hypot(point.x - maxX, point.y - geom.y1));
        }
      } else {
        const minY = Math.min(geom.y1, geom.y2);
        const maxY = Math.max(geom.y1, geom.y2);
        if (point.y >= minY - 12 && point.y <= maxY + 12) {
          dist = Math.abs(point.x - geom.x1);
        } else {
          dist = Math.min(Math.hypot(point.x - geom.x1, point.y - minY), Math.hypot(point.x - geom.x1, point.y - maxY));
        }
      }

      if (dist < minDistance) {
        minDistance = dist;
        bestEdgeId = edge.id;
      }
    }
    return bestEdgeId;
  }

  private finishIfComplete() {
    if (this.session?.state.status === "complete") {
      this.playSound(this.session.state.winners.length > 1 ? "tie" : "victory");
      this.screen = "result";
    }
  }

  pointerDown(event: PointerEvent) {
    if (this.isDrawing) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.gesture = beginGesture(event.clientX, event.clientY);
      return;
    }
    if (this.pointers.size === 2) {
      const [first, second] = [...this.pointers.values()];
      const center = midpoint(first, second);
      this.gesture = beginGesture(center.x, center.y, 2, distance(first, second));
    }
  }

  pointerMove(event: PointerEvent) {
    if (this.isDrawing && this.dragStartVertex) {
      const svg = (event.currentTarget as HTMLElement).querySelector("svg") as SVGSVGElement | null;
      if (svg) {
        this.dragCurrentPoint = this.toSvgCoordinates(svg, event.clientX, event.clientY);
        this.checkNearAdjacentVertex(this.dragCurrentPoint);
      }
      return;
    }
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      const threshold = event.pointerType === "touch" ? 22 : 8;
      this.gesture = updateGesture(this.gesture, event.clientX, event.clientY, 1, 1, threshold);
      if (this.gesture.moved) {
        this.panX += event.clientX - previous.x;
        this.panY += event.clientY - previous.y;
      }
      return;
    }
    const [first, second] = [...this.pointers.values()];
    const center = midpoint(first, second);
    const currentDistance = distance(first, second);
    const scale = this.gesture.startDistance ? currentDistance / this.gesture.startDistance : 1;
    const previousScale = this.gesture.scale;
    const previousX = this.gesture.lastX;
    const previousY = this.gesture.lastY;
    this.gesture = updateGesture(this.gesture, center.x, center.y, scale, 2);
    this.panX += center.x - previousX;
    this.panY += center.y - previousY;
    this.zoom = Math.min(2.5, Math.max(0.7, this.zoom * (scale / (previousScale || 1))));
  }

  pointerUp(event: PointerEvent) {
    if (this.isDrawing && this.dragStartVertex) {
      let edgeToSelect: string | null = this.hoveredEdgeId;
      if (!edgeToSelect && this.dragCurrentPoint && this.session) {
        const start = this.dragStartVertex;
        for (const v of this.boardVertices) {
          if (Math.abs(v.row - start.row) + Math.abs(v.column - start.column) === 1) {
            const vx = v.column * this.cellSize;
            const vy = v.row * this.cellSize;
            if (Math.hypot(this.dragCurrentPoint.x - vx, this.dragCurrentPoint.y - vy) < this.cellSize * 0.45) {
              const edge = findEdgeBetween(this.session.state.board, start, v);
              if (edge && !this.session.state.occupiedEdges.includes(edge.id)) {
                edgeToSelect = edge.id;
                break;
              }
            }
          }
        }
      }
      this.isDrawing = false;
      this.dragStartVertex = null;
      this.dragCurrentPoint = null;
      this.hoveredEdgeId = null;
      if (edgeToSelect) {
        this.tapEdge(edgeToSelect);
      }
      return;
    }

    const shouldSelect = this.pointers.size === 1 && canSelectAfterGesture(this.gesture);
    const target = event.target as SVGElement;
    let edgeId = target?.getAttribute?.("data-edge-id");

    // Precision fallback on mobile/touch if target was missed by a few pixels:
    if (shouldSelect && !edgeId && this.session) {
      const svg = (event.currentTarget as HTMLElement).querySelector("svg") as SVGSVGElement | null;
      if (svg) {
        const pt = this.toSvgCoordinates(svg, event.clientX, event.clientY);
        edgeId = this.findClosestAvailableEdge(pt, this.cellSize * 0.45);
      }
    }

    this.pointers.delete(event.pointerId);
    if (shouldSelect && edgeId) {
      this.tapEdge(edgeId);
    }
    this.gesture = idleGesture;
  }

  pointerCancel(event: PointerEvent) {
    this.pointers.delete(event.pointerId);
    this.pointers.clear();
    this.gesture = idleGesture;
    this.isDrawing = false;
    this.dragStartVertex = null;
    this.dragCurrentPoint = null;
    this.hoveredEdgeId = null;
  }

  private playSound(sound: Parameters<typeof playBoxioSound>[1]) {
    if (typeof AudioContext === "undefined") return;
    this.audioContext ??= new AudioContext();
    playBoxioSound(this.audioContext, sound);
  }
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }
function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
