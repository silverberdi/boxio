import { Component, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SwUpdate } from "@angular/service-worker";
import {
  BOARD_SELECTIONS,
  canSelectAfterGesture,
  createLocalSession,
  edgeGeometry,
  findEdgeBetween,
  idleGesture,
  beginGesture,
  runAutomaticTurns,
  silhouetteSelection,
  uniqueBoardVertices,
  updateGesture,
  MODES,
  PLAYER_COLORS,
  celebrationForCaptureCount,
  shouldPlaySound,
  selectEdge,
  type ActionFeedback,
  type Celebration,
  type GameMode,
  type GestureState,
  type LocalPlayerConfig,
  type LocalSession,
} from "./local-game";
import { playBoxioSound, soundCatalog } from "../../../assets/audio/boxio-sounds";
import { UpdateCoordinator } from "./update-coordinator";

@Component({
  selector: "boxio-root",
  standalone: true,
  imports: [CommonModule],
  template: `
<main class="app-shell" [class.reduced-motion]="reducedMotion">
  <p *ngIf="updatePending && screen !== 'game'" class="update-banner" role="status">Hay una actualización lista. <button class="quiet" (click)="activatePendingUpdate()">Actualizar</button></p>
  <header class="brand"><img src="assets/branding/boxio-wordmark.svg" alt="Boxio"><span>Juega, captura, conquista</span></header>
  <section *ngIf="screen === 'home'" class="panel home">
    <img class="hero-icon" src="assets/branding/boxio-app-icon.svg" alt="">
    <h1>Elige cómo jugar</h1>
    <p class="muted">Sin registro. Comparte el dispositivo y disfruta la partida.</p>
    <fieldset class="preferences" aria-label="Preferencias de accesibilidad">
      <legend>Preferencias</legend>
      <label><input type="checkbox" [checked]="soundEnabled" (change)="setSoundEnabled($any($event.target).checked)"> Sonido</label>
      <label><input type="checkbox" [checked]="!reducedMotion" (change)="setReducedMotion(!$any($event.target).checked)"> Animaciones</label>
    </fieldset>
    <div class="mode-grid">
      <button *ngFor="let mode of modes" class="mode-card" [class.disabled]="!mode.available" [disabled]="!mode.available" (click)="chooseMode(mode.id)" [attr.aria-label]="mode.label + (mode.available ? '' : ', no disponible')">
        <span class="mode-icon">{{ mode.id === 'local' ? '👥' : mode.id === 'machine' ? '🤖' : mode.id === 'private' ? '🔒' : '🌐' }}</span>
        <strong>{{ mode.label }}</strong>
        <small>{{ mode.description }}</small>
      </button>
    </div>
    <p class="scope-note">Las modalidades bloqueadas se habilitarán en próximas entregas.</p>
  </section>
  <section *ngIf="screen === 'online'" class="panel online-room">
    <button class="back" (click)="exitOnline()">← Inicio</button>
    <h1>Salas privadas online</h1>
    <p class="muted">Juega a distancia con amigos (2 a 4 participantes). El servidor coordina identidad, turnos y puntuación.</p>

    <!-- Estado: Configuración / selección de acción si aún no hay sala -->
    <div *ngIf="!onlineRoomId" class="online-actions-grid">
      <!-- Tarjeta 1: Crear Sala (Anfitrión) -->
      <div class="online-card">
        <h2>Crear una sala</h2>
        <p class="muted"><small>Inicia como anfitrión. El sistema generará un código para compartir.</small></p>
        <label class="field-label">
          <span>Tu apodo</span>
          <input [value]="onlineName" (input)="onlineName = $any($event.target).value" maxlength="18" placeholder="Tu nombre" aria-label="Apodo anfitrión">
        </label>
        <div class="board-choice compact">
          <label class="field-label">
            <span>Filas</span>
            <input type="number" min="2" max="6" [value]="onlineRows" (input)="onlineRows = +$any($event.target).value">
          </label>
          <label class="field-label">
            <span>Columnas</span>
            <input type="number" min="2" max="6" [value]="onlineColumns" (input)="onlineColumns = +$any($event.target).value">
          </label>
        </div>
        <button class="primary" [disabled]="isConnecting" (click)="createPrivateRoom()">
          {{ isConnecting ? 'Creando sala...' : 'Crear sala' }}
        </button>
      </div>

      <div class="online-divider"><span>O</span></div>

      <!-- Tarjeta 2: Unirse a Sala (Invitado) -->
      <div class="online-card">
        <h2>Unirse a una sala</h2>
        <p class="muted"><small>Introduce el código que te compartió el creador de la sala.</small></p>
        <label class="field-label">
          <span>Tu apodo</span>
          <input [value]="onlineJoinName" (input)="onlineJoinName = $any($event.target).value" maxlength="18" placeholder="Tu nombre" aria-label="Apodo participante">
        </label>
        <label class="field-label">
          <span>Código de invitación</span>
          <input [value]="onlineInvitation" (input)="onlineInvitation = $any($event.target).value" maxlength="64" placeholder="Ej: eWzFa6qHK..." aria-label="Código de invitación">
        </label>
        <button class="primary" [disabled]="isConnecting" (click)="joinPrivateRoom()">
          {{ isConnecting ? 'Conectando...' : 'Entrar en sala' }}
        </button>
      </div>
    </div>

    <!-- Estado: Dentro de una sala -->
    <div *ngIf="onlineRoomId" class="online-active-room">

      <!-- Vista 1: Lobby (esperando más jugadores) -->
      <div *ngIf="onlineSnapshot?.status === 'lobby'">
        <div class="invitation-banner">
          <div>
            <span class="eyebrow">Código para invitar a tus amigos</span>
            <strong class="invitation-code">{{ onlineInvitation }}</strong>
          </div>
          <button class="quiet copy-btn" (click)="copyInvitationCode()">{{ copyStatus || 'Copiar código' }}</button>
        </div>

        <p *ngIf="onlineConnection" class="connection-status" role="status" [class.connected]="onlineConnection.includes('Confirmado') || onlineConnection.includes('Conectado')">
          {{ onlineConnection }}
        </p>

        <div class="room-info" style="margin: 14px 0 6px;">
          <span>Participantes en sala: <strong>{{ onlineSnapshot.participants.length }}/4</strong></span>
          <p class="muted" style="margin: 8px 0;"><small>Comparte el código con otro jugador. En cuanto se una, el tablero aparecerá automáticamente para ambos.</small></p>
        </div>

        <div class="participants-list">
          <div *ngFor="let p of onlineSnapshot.participants" class="participant-badge" [class.current]="p.id === onlineParticipantId">
            <span class="color-dot" [style.background]="getParticipantColor(p.id)"></span>
            <b>{{ p.name }}</b>
            <small *ngIf="p.host">(Anfitrión)</small>
            <span *ngIf="p.id === onlineParticipantId" class="you-badge">(Tú)</span>
          </div>
        </div>

        <button class="quiet leave-btn" (click)="exitOnline()">Salir de la sala</button>
      </div>

      <!-- Vista 2: En juego (partida activa o completa) -->
      <div *ngIf="onlineSnapshot?.game">
        <div class="game-status" style="margin-bottom: 8px;">
          <div>
            <p class="eyebrow">Turno actual</p>
            <h1 [style.color]="getParticipantColor(onlineSnapshot.game.currentPlayerId)">
              {{ getParticipantName(onlineSnapshot.game.currentPlayerId) }}
              <span *ngIf="isMyTurn()" class="my-turn-badge">¡Es tu turno!</span>
            </h1>
          </div>
          <div class="scores" aria-label="Marcadores">
            <div *ngFor="let p of onlineSnapshot.participants" class="score" [class.active]="p.id === onlineSnapshot.game.currentPlayerId">
              <span class="color-dot" [style.background]="getParticipantColor(p.id)"></span>
              <b>{{ p.name }}<span *ngIf="p.id === onlineParticipantId"> (Tú)</span></b>
              <strong>{{ onlineSnapshot.game.scores[p.id] ?? 0 }}</strong>
            </div>
          </div>
        </div>

        <div class="invitation-banner compact">
          <div>
            <span class="eyebrow" style="font-size: 11px;">Código de sala: </span>
            <strong class="invitation-code" style="font-size: 16px;">{{ onlineInvitation }}</strong>
          </div>
          <button class="quiet copy-btn" style="min-height: 32px;" (click)="copyInvitationCode()">{{ copyStatus || 'Copiar código' }}</button>
        </div>

        <p *ngIf="onlineError" class="error" role="alert" style="margin: 6px 0;">{{ onlineError }}</p>

        <div class="board-viewport">
          <svg class="board" [attr.viewBox]="'-16 -16 ' + (onlineBoardWidth + 32) + ' ' + (onlineBoardHeight + 32)" role="img" aria-label="Tablero de juego online">
            <g class="cells">
              <rect *ngFor="let cell of onlineSnapshot.game.board.cells"
                [attr.x]="cell.column * cellSize"
                [attr.y]="cell.row * cellSize"
                [attr.width]="cellSize"
                [attr.height]="cellSize"
                [class.claimed]="onlineSnapshot.game.cellOwners[cell.id]"
                [style.fill]="onlineCellColor(cell.id)">
              </rect>
            </g>
            <g class="edges">
              <ng-container *ngFor="let edge of onlineSnapshot.game.board.edges">
                <line class="edge-line"
                  [class.occupied]="onlineSnapshot.game.occupiedEdges.includes(edge.id)"
                  [class.hovered]="hoveredEdgeId === edge.id && !onlineSnapshot.game.occupiedEdges.includes(edge.id)"
                  [style.stroke]="onlineEdgeLineColor(edge.id)"
                  [style.stroke-width]="onlineEdgeLineWidth(edge.id)"
                  [style.stroke-opacity]="onlineEdgeLineOpacity(edge.id)"
                  [attr.x1]="edgeGeometry(edge).x1" [attr.y1]="edgeGeometry(edge).y1"
                  [attr.x2]="edgeGeometry(edge).x2" [attr.y2]="edgeGeometry(edge).y2">
                </line>
                <line class="edge-hit"
                  [class.occupied]="onlineSnapshot.game.occupiedEdges.includes(edge.id)"
                  [style.cursor]="isMyTurn() && !onlineSnapshot.game.occupiedEdges.includes(edge.id) ? 'pointer' : 'default'"
                  [attr.x1]="edgeGeometry(edge).x1" [attr.y1]="edgeGeometry(edge).y1"
                  [attr.x2]="edgeGeometry(edge).x2" [attr.y2]="edgeGeometry(edge).y2"
                  [attr.data-edge-id]="edge.id"
                  (mouseenter)="hoveredEdgeId = edge.id"
                  (mouseleave)="hoveredEdgeId = null"
                  (click)="onlineMove(edge.id)">
                </line>
              </ng-container>
            </g>
            <g class="vertices">
              <circle *ngFor="let v of onlineBoardVertices"
                class="vertex-dot"
                [attr.cx]="v.column * cellSize"
                [attr.cy]="v.row * cellSize"
                r="6">
              </circle>
            </g>
          </svg>
        </div>

        <div *ngIf="onlineSnapshot.status === 'complete'" style="text-align: center; margin: 16px 0;">
          <h2>¡Partida finalizada!</h2>
          <p *ngIf="onlineSnapshot.result?.winners?.length">Ganador: <strong>{{ getParticipantName(onlineSnapshot.result.winners[0]) }}</strong></p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <span class="connection-status" [class.connected]="onlineConnection.includes('Conectado')">{{ onlineConnection }}</span>
          <button class="quiet leave-btn" (click)="exitOnline()">Salir de la sala</button>
        </div>
      </div>
    </div>

    <p *ngIf="onlineError" class="error" role="alert">{{ onlineError }}</p>
  </section>
    <section *ngIf="screen === 'public'" class="panel public-room" aria-live="polite">
    <button class="back" (click)="leavePublic()">← Inicio</button>
    <h1>Partida pública</h1>
    <p class="muted">El servidor te empareja con una sola persona. No necesitas cuenta ni código.</p>
    <label>Tu apodo <input [value]="onlineName" (input)="onlineName = $any($event.target).value" maxlength="18" aria-label="Apodo para partida pública"></label>
    <p role="status">{{ publicStatus }}</p>
    <p *ngIf="publicConnection" class="muted">Conexión: {{ publicConnection }}</p>
    <p *ngIf="publicError" class="error" role="alert">{{ publicError }}</p>
    <button *ngIf="!publicSearchId" class="primary" (click)="startPublicSearch()">Buscar rival</button>
    <button *ngIf="publicSearchId && publicSearch?.status === 'searching'" class="quiet" (click)="cancelPublicSearch()">Cancelar búsqueda</button>
    <ng-container *ngIf="publicSearch?.timedOut">
      <p class="timeout-note">No encontramos rival en 60 segundos.</p>
      <button class="primary" (click)="playPublicMachine()">Jugar contra la máquina (partida separada)</button>
      <button class="quiet" (click)="continuePublicSearch()">Continuar buscando</button>
      <button class="quiet" (click)="cancelPublicSearch()">Cancelar</button>
    </ng-container>
    <div *ngIf="publicMatch" class="online-state">
      <p>Rival confirmado. Partida pública 1 contra 1.</p>
      <p>Estado confirmado: {{ publicMatch.status }} · Versión {{ publicMatch.version }}</p>
      <p *ngIf="publicMatch.status === 'abandoned'" role="status">Victoria por abandono: el rival no regresó dentro de la reserva de 60 segundos.</p>
      <p *ngIf="publicMatch.status === 'complete' && publicMatch.result?.cause === 'normal'" role="status">Partida terminada por puntuación.</p>
      <p *ngIf="publicMatch.status === 'complete' && publicMatch.result?.cause === 'normal' && publicMatch.result?.winners?.length > 1" role="status">Resultado: empate con ganadores compartidos.</p>
      <p *ngIf="publicMatch.status === 'active' && publicDisconnected" role="status">Desconectado. Tu reserva termina a {{ publicReservationExpiresAt || 'los 60 segundos' }}.</p>
      <div class="online-edges"><button *ngFor="let edge of publicMatch.game.board.edges" [disabled]="publicMatch.game.occupiedEdges.includes(edge.id)" (click)="publicMove(edge.id)">{{ edge.id }}</button></div>
      <button *ngIf="publicMatch.status !== 'active'" class="primary" (click)="leavePublic()">Continuar al inicio</button>
    </div>
  </section>
  <section *ngIf="screen === 'setup'" class="panel setup">
    <button class="back" (click)="screen = 'home'">← Inicio</button>
    <h1>Prepara tu partida</h1>
    <p class="muted">{{ machineMode ? 'Un humano y entre 1 y 3 bots.' : 'Elige entre 2 y 4 jugadores.' }} Tablero cuadrado o silueta, sin conexión.</p>
    <div class="player-count">
      <button *ngFor="let count of [2,3,4]" [class.selected]="playerCount === count" (click)="setPlayerCount(count)">{{ machineMode ? count - 1 : count }} {{ machineMode ? 'bots' : 'jugadores' }}</button>
    </div>
    <div class="player-form">
      <label *ngFor="let player of draftPlayers; let i = index">
        {{ player.kind === 'automatic' ? 'Bot ' + i : 'Humano' }}
        <span class="color-dot" [style.background]="colorValue(player.color)"></span>
        <input [value]="player.name" (input)="setName(i, $any($event.target).value)" maxlength="18" [attr.aria-label]="'Apodo del participante ' + (i + 1)">
        <select *ngIf="player.kind === 'automatic'" [value]="player.difficulty" (change)="setDifficulty(i, $any($event.target).value)"><option value="easy">Fácil</option><option value="medium">Media</option><option value="hard">Difícil</option></select>
      </label>
    </div>
    <div class="board-choice">
      <label>Tablero
        <select [value]="boardSelectionId" (change)="boardSelectionId = $any($event.target).value">
          <option *ngFor="let selection of boardSelections" [value]="selection.id">{{ selection.label }}</option>
        </select>
      </label>
      <ng-container *ngIf="boardSelectionId === 'classic'">
        <label>Filas <input type="number" min="2" max="8" [value]="rows" (input)="rows = +$any($event.target).value"></label>
        <label>Columnas <input type="number" min="2" max="8" [value]="columns" (input)="columns = +$any($event.target).value"></label>
      </ng-container>
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
    <p *ngIf="celebration.kind !== 'none'" class="move-celebration" [class.multiple]="celebration.kind === 'multiple'" [class.reduced]="reducedMotion" role="status" aria-live="polite">{{ celebration.label }}</p>
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
    <h1>{{ session.state.winners.length > 1 ? '¡Empate!' : '¡Victoria normal!' }}</h1>
    <p class="result-cause" role="status">{{ session.state.winners.length > 1 ? 'Resultado: empate' : 'Resultado: victoria por puntuación' }}</p>
    <p class="muted">Puntuación final</p>
    <div class="final-score" *ngFor="let player of session.config.players">
      <span class="color-dot" [style.background]="colorValue(player.color)"></span>
      <b>{{ player.name }}</b>
      <strong>{{ session.state.scores[player.id] }}</strong>
      <span *ngIf="session.state.winners.includes(player.id)">🏆</span>
    </div>
    <button class="primary" (click)="continueFromLocalResult()">Volver al inicio</button>
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
    .panel.online-room{max-width:840px}
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
    .player-form input,.player-form select,.board-choice input,.board-choice select,.online-card input,.online-card select,.field-label input{min-height:44px;border:2px solid #9acbe4;border-radius:10px;padding:0 10px;font:inherit;color:#082c7c;box-sizing:border-box;width:100%;background:#fff}
    .color-dot{display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #082c7c}
    .board-choice{display:flex;gap:12px;margin:14px 0}
    .board-choice.compact{margin:6px 0}
    .board-choice label{flex:1}
    .error{color:#a61732;font-weight:600}
    .primary{width:100%;margin-top:10px;font-weight:700}
    .online-edges{display:grid;grid-template-columns:repeat(auto-fit,minmax(44px,1fr));gap:6px}.online-edges button{min-height:44px}.public-room button{touch-action:manipulation}
    .back,.quiet{border:0;padding:6px 12px;background:transparent;min-height:44px}
    .online-actions-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:stretch;margin:18px 0}
    @media(max-width:640px){.online-actions-grid{grid-template-columns:1fr}.online-divider{display:none}}
    .online-card{background:#f4faff;border:2px solid #9acbe4;border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:12px;text-align:left}
    .online-card h2{margin:0;font-size:20px;color:#082c7c}
    .online-divider{display:flex;align-items:center;justify-content:center;color:#42648c;font-weight:700}
    .field-label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600;color:#082c7c}
    .field-label input:focus{border-color:#1e88ff;outline:none}
    .invitation-banner{display:flex;justify-content:space-between;align-items:center;background:#e8f4fc;border:2px dashed #1e88ff;border-radius:14px;padding:12px 18px;margin:16px 0}
    .invitation-banner.compact{padding:6px 14px;margin:8px 0;font-size:13px}
    .invitation-code{font-size:24px;letter-spacing:2px;color:#082c7c;font-family:monospace}
    .copy-btn{color:#1e88ff;font-weight:700;cursor:pointer}
    .participants-list{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .participant-badge{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #9acbe4;border-radius:20px;padding:4px 12px;font-size:14px}
    .participant-badge.current{border-color:#1e88ff;background:#eef6ff;font-weight:700}
    .you-badge{color:#1e88ff;font-size:12px}
    .online-edges-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px;margin-top:12px}
    .edge-btn{min-height:40px;border:2px solid #9acbe4;border-radius:8px;background:#fff;color:#082c7c;font-weight:600;cursor:pointer}
    .edge-btn.occupied{background:#c0dbee;color:#6b8aa8;border-color:#c0dbee;cursor:not-allowed}
    .edge-btn:not([disabled]):hover{background:#1e88ff;color:#fff;border-color:#1e88ff}
    .connection-status{font-size:13px;color:#42648c;margin:6px 0}
    .connection-status.connected{color:#147a32;font-weight:600}
    .my-turn-badge{background:#1e88ff;color:#fff;border-radius:6px;padding:2px 6px;font-size:12px;margin-left:6px}
    .leave-btn{margin-top:16px;color:#a61732}
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
    .preferences{display:flex;gap:16px;justify-content:center;border:0;margin:10px 0;padding:0}.preferences label{min-height:44px;display:flex;align-items:center;gap:6px}.preferences input{width:20px;height:20px}
    .move-celebration{text-align:center;min-height:28px;color:#a26400;font-weight:800;animation:celebrate .38s ease-out}.move-celebration.multiple{font-size:1.15rem}.move-celebration.reduced{animation:none}.result-cause{font-weight:700;color:#42648c}
    @keyframes celebrate{from{opacity:.2;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    .final-score{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #d9edf8;font-size:20px}
    .final-score strong{font-size:28px}
    @media(max-width:600px){.app-shell{padding:12px 10px}.brand span{font-size:11px}.game-status{display:block}.scores{justify-content:flex-start}.score{flex:1;min-width:80px}.board-viewport{min-height:320px}.mode-grid{gap:8px}.mode-card{padding:10px 5px}.panel{padding:20px 16px;margin-top:14px}}
    @media(min-width:800px){.board-viewport{min-height:540px}.game-status{padding:0 12px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
    .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after{animation:none!important;transition:none!important}
  `]
})
export class AppComponent {
  screen: "home" | "setup" | "online" | "public" | "game" | "result" = "home";
  modes = MODES;
  soundCount = Object.keys(soundCatalog).length;
  soundEnabled = this.readPreference("boxio.soundEnabled", true);
  reducedMotion = this.readPreference("boxio.reducedMotion", this.systemReducedMotion());
  celebration: Celebration = celebrationForCaptureCount(0);
  playerCount = 2;
  rows = 3;
  columns = 3;
  boardSelections = BOARD_SELECTIONS;
  boardSelectionId = "classic";
  private readonly updates = new UpdateCoordinator();

  constructor(
    private readonly swUpdate: SwUpdate,
    private readonly cdr: ChangeDetectorRef
  ) {
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
  onlineName = "Anfitrión";
  onlineJoinName = "Invitado";
  onlineRows = 2;
  onlineColumns = 2;
  isConnecting = false;
  copyStatus = "";
  onlineInvitation = "";
  onlineRoomId = "";
  onlineParticipantId = "";
  onlineCredential = "";
  onlineSnapshot: any = null;
  onlineError = "";
  onlineConnection = "";
  private onlineSocket?: WebSocket;
  publicSearchId = "";
  publicParticipantId = "";
  publicCredential = "";
  publicMatchId = "";
  publicSearch: any = null;
  publicMatch: any = null;
  publicStatus = "Listo para buscar rival";
  publicError = "";
  publicConnection = "Sin conexión";
  publicDisconnected = false;
  publicReservationExpiresAt = "";
  private publicPoll?: ReturnType<typeof setInterval>;
  private publicSocket?: WebSocket;

  private systemReducedMotion(): boolean {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private readPreference(key: string, fallback: boolean): boolean {
    try {
      const value = typeof localStorage === "undefined" ? null : localStorage.getItem(key);
      return value === null ? fallback : value === "true";
    } catch { return fallback; }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try { localStorage.setItem("boxio.soundEnabled", String(enabled)); } catch {}
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    try { localStorage.setItem("boxio.reducedMotion", String(reduced)); } catch {}
  }

  copyInvitationCode() {
    if (!this.onlineInvitation) return;
    const text = this.onlineInvitation.trim();
    const onSuccess = () => {
      this.copyStatus = "¡Copiado!";
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copyStatus = "";
        this.cdr.detectChanges();
      }, 2500);
    };

    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        this.fallbackCopy(text, onSuccess);
      });
    } else {
      this.fallbackCopy(text, onSuccess);
    }
  }

  private fallbackCopy(text: string, onSuccess: () => void) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (successful) {
        onSuccess();
      } else {
        this.copyStatus = "Error al copiar";
        this.cdr.detectChanges();
      }
    } catch {
      this.copyStatus = "Error al copiar";
      this.cdr.detectChanges();
    }
  }

  exitOnline() {
    if (this.onlineSocket) {
      try { this.onlineSocket.close(); } catch {}
      this.onlineSocket = undefined;
    }
    this.onlineRoomId = "";
    this.onlineSnapshot = null;
    this.onlineInvitation = "";
    this.onlineError = "";
    this.onlineConnection = "";
    this.screen = "home";
    this.cdr.detectChanges();
  }

  getParticipantColor(participantId: string): string {
    const idx = (this.onlineSnapshot?.participants ?? []).findIndex((p: any) => p.id === participantId);
    const colorName = idx >= 0 ? PLAYER_COLORS[idx % PLAYER_COLORS.length] : "blue";
    return this.colorValue(colorName);
  }

  getParticipantName(participantId: string): string {
    const p = (this.onlineSnapshot?.participants ?? []).find((p: any) => p.id === participantId);
    return p ? p.name : participantId;
  }

  isMyTurn(): boolean {
    return this.onlineSnapshot?.game?.currentPlayerId === this.onlineParticipantId;
  }

  get onlineBoardWidth(): number {
    const cells = this.onlineSnapshot?.game?.board?.cells ?? [];
    if (!cells.length) return 300;
    return ((cells.reduce((max: number, cell: any) => Math.max(max, cell.column), 0)) + 1) * this.cellSize;
  }

  get onlineBoardHeight(): number {
    const cells = this.onlineSnapshot?.game?.board?.cells ?? [];
    if (!cells.length) return 300;
    return ((cells.reduce((max: number, cell: any) => Math.max(max, cell.row), 0)) + 1) * this.cellSize;
  }

  get onlineBoardVertices(): readonly { row: number; column: number }[] {
    return this.onlineSnapshot?.game?.board ? uniqueBoardVertices(this.onlineSnapshot.game.board) : [];
  }

  onlineCellColor(cellId: string): string {
    const ownerId = this.onlineSnapshot?.game?.cellOwners?.[cellId];
    return ownerId ? this.getParticipantColor(ownerId) : "transparent";
  }

  onlineEdgeLineColor(edgeId: string): string {
    if (this.onlineSnapshot?.game?.occupiedEdges?.includes(edgeId)) {
      return "#082c7c";
    }
    if (this.hoveredEdgeId === edgeId && this.isMyTurn()) {
      return this.getParticipantColor(this.onlineParticipantId);
    }
    return "#c3e0f2";
  }

  onlineEdgeLineWidth(edgeId: string): number {
    if (this.onlineSnapshot?.game?.occupiedEdges?.includes(edgeId)) return 6;
    if (this.hoveredEdgeId === edgeId && this.isMyTurn()) return 6;
    return 3;
  }

  onlineEdgeLineOpacity(edgeId: string): number {
    if (this.onlineSnapshot?.game?.occupiedEdges?.includes(edgeId)) return 1;
    if (this.hoveredEdgeId === edgeId && this.isMyTurn()) return 0.8;
    return 0.45;
  }

  connectOnlineSocket() {
    if (typeof window === "undefined" || !this.onlineRoomId) return;
    if (this.onlineSocket) {
      try { this.onlineSocket.close(); } catch {}
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/rooms/${this.onlineRoomId}/ws`;
    const ws = new WebSocket(url);
    this.onlineSocket = ws;
    ws.onopen = () => {
      this.onlineConnection = "Conectado en tiempo real";
      this.cdr.detectChanges();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ack" || data.type === "snapshot") {
          if (data.snapshot) {
            this.onlineSnapshot = data.snapshot;
            try { this.playSound(data.completedCells?.length ? "capture" : "click"); } catch {}
            this.cdr.detectChanges();
          }
        }
      } catch {}
    };
    ws.onclose = () => {
      if (this.onlineSocket === ws) {
        this.onlineSocket = undefined;
        this.onlineConnection = "Desconectado del servidor";
        this.cdr.detectChanges();
      }
    };
  }

  hoveredEdgeId: string | null = null;
  isDrawing = false;
  dragStartVertex: { row: number; column: number } | null = null;
  dragCurrentPoint: { x: number; y: number } | null = null;

  chooseMode(mode: GameMode) {
    if (mode === "public") {
      this.publicError = "";
      this.publicStatus = "Listo para buscar rival";
      this.screen = "public";
      return;
    }
    if (mode === "private") {
      this.onlineError = "";
      this.onlineConnection = "";
      this.screen = "online";
      this.cdr.detectChanges();
      return;
    }
    if (mode === "local" || mode === "machine") {
      this.machineMode = mode === "machine";
      this.setPlayerCount(this.machineMode ? 2 : 2);
      this.screen = "setup";
    }
  }

    async startPublicSearch() {
    try {
      const response = await fetch("/api/public/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: this.onlineName }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "No se pudo buscar rival.");
      this.publicSearchId = payload.search.searchId; this.publicParticipantId = payload.participantId; this.publicCredential = payload.reconnectCredential; this.publicSearch = payload.search; this.publicMatch = payload.match ?? null; this.publicMatchId = payload.search.matchId ?? "";
      this.publicStatus = this.publicMatch ? "Rival confirmado por servidor" : "Buscando rival…";
      this.renderPublicState();
      if (this.publicMatch) this.connectPublicSocket(); else this.startPublicPolling();
    } catch (error) { this.publicError = error instanceof Error ? error.message : "No se pudo buscar rival."; this.renderPublicState(); }
  }
  private startPublicPolling() {
    this.stopPublicPolling();
    void this.refreshPublicSearch();
    this.publicPoll = setInterval(() => void this.refreshPublicSearch(), 1000);
  }
  private stopPublicPolling() { if (this.publicPoll) clearInterval(this.publicPoll); this.publicPoll = undefined; }
  private renderPublicState() { this.cdr.detectChanges(); }
  private async refreshPublicSearch() {
    if (!this.publicSearchId || this.publicMatch) return;
    const response = await fetch(`/api/public/search/${this.publicSearchId}`); if (!response.ok) return;
    this.publicSearch = await response.json(); this.publicStatus = this.publicSearch.timedOut ? "Sin rival tras 60 segundos" : "Buscando rival…";
    this.renderPublicState();
    if (this.publicSearch.matchId) { this.publicMatchId = this.publicSearch.matchId; const matchResponse = await fetch(`/api/public/matches/${this.publicMatchId}`); this.publicMatch = await matchResponse.json(); this.publicStatus = "Rival confirmado por servidor"; this.stopPublicPolling(); this.renderPublicState(); this.connectPublicSocket(); }
  }
  async cancelPublicSearch() { if (!this.publicSearchId) return; const response = await fetch(`/api/public/search/${this.publicSearchId}/cancel`, { method: "POST" }); this.publicSearch = await response.json(); this.stopPublicPolling(); this.publicStatus = "Búsqueda cancelada por el servidor"; this.renderPublicState(); }
  async continuePublicSearch() { const response = await fetch(`/api/public/search/${this.publicSearchId}/continue`, { method: "POST" }); this.publicSearch = await response.json(); this.stopPublicPolling(); this.publicStatus = "Buscando rival…"; this.renderPublicState(); this.startPublicPolling(); }
  async playPublicMachine() { const response = await fetch(`/api/public/search/${this.publicSearchId}/machine`, { method: "POST" }); const payload = await response.json(); if (response.ok) { this.stopPublicPolling(); this.publicSearch = payload.search; this.publicSearchId = ""; this.publicStatus = "Partida separada contra la máquina"; this.renderPublicState(); this.chooseMode("machine"); } else { this.publicError = payload.error ?? "No se pudo iniciar la partida."; this.renderPublicState(); } }
  leavePublic() { this.stopPublicPolling(); try { this.publicSocket?.close(); } catch {} this.publicSearchId = ""; this.publicMatch = null; this.publicSearch = null; this.screen = "home"; this.renderPublicState(); }
  connectPublicSocket() {
    if (!this.publicMatchId || typeof window === "undefined") return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"; const socket = new WebSocket(`${protocol}//${window.location.host}/api/public/matches/${this.publicMatchId}/ws`); this.publicSocket = socket;
    socket.onopen = () => { this.publicConnection = "Conectado"; this.publicDisconnected = false; this.renderPublicState(); };
    socket.onmessage = (event) => { try { const data = JSON.parse(event.data); const snapshot = data.snapshot ?? (data.matchId ? data : undefined); if (snapshot) { this.publicMatch = snapshot; const seat = snapshot.participants?.find((p: any) => p.id === this.publicParticipantId); this.publicDisconnected = seat?.status === "reserved"; this.publicReservationExpiresAt = seat?.reservationExpiresAt ?? ""; this.renderPublicState(); } } catch {} };
    socket.onclose = () => { this.publicConnection = "Desconectado"; this.publicDisconnected = true; this.renderPublicState(); };
  }
  async publicMove(edgeId: string) {
    if (!this.publicMatch) return;
    const response = await fetch(`/api/public/matches/${this.publicMatchId}/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ protocolVersion: 1, commandId: crypto.randomUUID(), participantId: this.publicParticipantId, credential: this.publicCredential, version: this.publicMatch.version, edgeId }) });
    const payload = await response.json(); if (response.ok) this.publicMatch = payload.snapshot; else this.publicError = "La jugada fue rechazada por el servidor."; this.renderPublicState();
  }

  async createPrivateRoom() {
    this.isConnecting = true;
    this.onlineError = "";
    this.onlineConnection = "Creando sala...";
    this.cdr.detectChanges();
    try {
      await this.privateRequest("/api/rooms", {
        name: this.onlineName.trim() || "Anfitrión",
        selection: { kind: "classic", rows: this.onlineRows, columns: this.onlineColumns }
      }, true);
    } finally {
      this.isConnecting = false;
      this.cdr.detectChanges();
    }
  }

  async joinPrivateRoom() {
    const code = this.onlineInvitation.trim();
    if (!code) {
      this.onlineError = "Escribe el código de invitación que te compartieron.";
      this.cdr.detectChanges();
      return;
    }
    this.isConnecting = true;
    this.onlineError = "";
    this.onlineConnection = "Conectando con la sala...";
    this.cdr.detectChanges();
    try {
      await this.privateRequest(`/api/rooms/${encodeURIComponent(code)}/join`, {
        name: this.onlineJoinName.trim() || "Invitado",
        invitationCode: code
      }, false);
    } finally {
      this.isConnecting = false;
      this.cdr.detectChanges();
    }
  }

  private async privateRequest(path: string, body: unknown, creating: boolean) {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo acceder a la sala.");
      this.onlineRoomId = payload.roomId ?? payload.snapshot?.roomId ?? this.onlineRoomId;
      this.onlineParticipantId = payload.participantId;
      this.onlineCredential = payload.reconnectCredential;
      this.onlineSnapshot = payload.snapshot;
      this.onlineInvitation = payload.invitationCode ?? this.onlineInvitation;
      this.onlineConnection = "Conectado al servidor";
      this.onlineError = "";
      this.connectOnlineSocket();
      this.cdr.detectChanges();
    } catch (error) {
      this.onlineConnection = "Error de conexión";
      this.onlineError = error instanceof Error ? error.message : "No se pudo acceder a la sala.";
      this.cdr.detectChanges();
    }
  }

  async onlineMove(edgeId: string) {
    if (!this.onlineSnapshot || !this.onlineRoomId) return;
    if (!this.isMyTurn()) {
      this.onlineError = "Es el turno de " + this.getParticipantName(this.onlineSnapshot.game?.currentPlayerId);
      this.cdr.detectChanges();
      return;
    }
    if (this.onlineSnapshot.game?.occupiedEdges?.includes(edgeId)) return;

    try {
      const response = await fetch(`/api/rooms/${this.onlineRoomId}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocolVersion: 1,
          commandId: generateUUID(),
          participantId: this.onlineParticipantId,
          credential: this.onlineCredential,
          version: this.onlineSnapshot.version,
          edgeId
        })
      });
      const payload = await response.json();
      if (response.ok) {
        this.onlineSnapshot = payload.snapshot ?? this.onlineSnapshot;
        this.onlineError = "";
        try { this.playSound(payload.completedCells?.length ? "capture" : "click"); } catch {}
      } else {
        this.onlineError = payload.code === "forbidden" ? "No es tu turno." : (payload.error ?? "La jugada fue rechazada por el servidor.");
      }
      this.cdr.detectChanges();
    } catch (err) {
      this.onlineError = err instanceof Error ? err.message : "Error de comunicación con el servidor.";
      this.cdr.detectChanges();
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
    const board = this.boardSelectionId === "classic"
      ? { kind: "classic" as const, rows: this.rows, columns: this.columns }
      : silhouetteSelection(this.boardSelectionId);
    const config = {
      mode: this.machineMode ? ("machine" as const) : ("local" as const),
      players: this.draftPlayers.slice(0, this.playerCount),
      board,
      rows: this.rows,
      columns: this.columns,
    } as const;
    try {
      this.session = createLocalSession(config);
      this.celebration = celebrationForCaptureCount(0);
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
      white: "#ffffff",
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
      const captureCount = result.feedback.kind === "multi" ? Number(result.feedback.message.match(/\+(\d+)/)?.[1] ?? 2) : result.feedback.kind === "capture" ? 1 : 0;
      this.celebration = celebrationForCaptureCount(captureCount);
      this.playSound(captureCount > 1 ? "multi" : captureCount === 1 ? "capture" : "edge");
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

  continueFromLocalResult() {
    this.session = null;
    this.celebration = celebrationForCaptureCount(0);
    this.feedback = { kind: "none", message: "" };
    this.screen = "home";
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
    if (!shouldPlaySound({ soundEnabled: this.soundEnabled, reducedMotion: this.reducedMotion })) return;
    if (typeof AudioContext === "undefined") return;
    this.audioContext ??= new AudioContext();
    playBoxioSound(this.audioContext, sound);
  }
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }
function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
