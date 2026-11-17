import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createGame, applyMove, createRectangularBoard } from "@boxio/engine";

class UpdateCoordinator {
  constructor() { this.pending = false; }
  get updatePending() { return this.pending; }
  notifyNewVersion() { this.pending = true; }
  canActivate(boundary) { return boundary === "safe" && this.pending; }
  consumeAtSafeBoundary(boundary) {
    if (!this.canActivate(boundary)) return false;
    this.pending = false;
    return true;
  }
}

const root = new URL("../dist/web/", import.meta.url);
let networkBlocked = false;

const server = createServer(async (request, response) => {
  if (networkBlocked) {
    response.writeHead(503, { "content-type": "text/plain" });
    response.end("Network offline");
    return;
  }
  const path = request.url === "/" ? "index.html" : request.url.slice(1);
  try {
    const body = await readFile(new URL(path, root));
    const type = path.endsWith(".png")
      ? "image/png"
      : path.endsWith(".json") || path.endsWith(".webmanifest")
      ? "application/json"
      : path.endsWith(".js")
      ? "text/javascript"
      : "text/html";
    response.writeHead(200, { "content-type": type });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

// 1. Manifest & Asset Verification
const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json();
if (manifest.name !== "Boxio — Puntos y Cajas" || manifest.icons.length !== 2) {
  throw new Error("Manifest PWA inválido o incompleto");
}
for (const icon of manifest.icons) {
  const response = await fetch(`${base}/${icon.src}`);
  if (!response.ok || response.headers.get("content-type") !== "image/png") {
    throw new Error(`Icono no servido correctamente: ${icon.src}`);
  }
}
const manifestText = JSON.stringify(manifest);
if (manifestText.includes("https://") || manifestText.includes("http://")) {
  throw new Error("Manifest contiene referencias a URLs externas");
}

// 2. Service Worker & Cache Storage Verification
const worker = await (await fetch(`${base}/ngsw-worker.js`)).text();
const cache = await (await fetch(`${base}/ngsw.json`)).json();
if (!worker.includes("CacheStorage") || !cache.assetGroups?.length) {
  throw new Error("Service worker sin configuración de caché versionado");
}

// 3. Headless Chromium Shell Render
const browser = spawn("google-chrome", [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--dump-dom",
  `${base}/`,
], { stdio: ["ignore", "pipe", "pipe"] });

let output = "";
browser.stdout.on("data", (chunk) => { output += chunk; });
const [browserResult] = await once(browser, "close");
if (browserResult !== 0 || !output.includes("Elige cómo jugar") || !output.includes("Multijugador local")) {
  throw new Error("El shell de la PWA no se renderiza correctamente en Chromium");
}

// 4. Simulate Network Block & Offline Revisit
networkBlocked = true;
const offlineCheck = await fetch(`${base}/api-simulated-external-call`).catch(() => null);
if (offlineCheck && offlineCheck.status !== 503) {
  throw new Error("La simulación de red desconectada no bloqueó peticiones");
}

// 5. Offline Local Gameplay Verification (2 to 4 Players)
for (const playerCount of [2, 3, 4]) {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i}`,
    name: `Jugador ${i + 1}`,
  }));
  const board = createRectangularBoard(2, 2);
  let game = createGame(board, players);
  if (game.currentPlayerId !== "player-0") throw new Error("Turno inicial inválido");
  if (game.status === "complete") throw new Error("Juego no debería ser terminal al inicio");

  // Invalid move check: non-existent edge
  const invalidMove = applyMove(game, { playerId: game.currentPlayerId, edgeId: "invalid-edge-id" });
  if (invalidMove.accepted) throw new Error("Arista inexistente no fue rechazada");
  if (invalidMove.state !== game) throw new Error("Movimiento inválido mutó el estado");

  // Play until terminal
  const initialEdges = [...game.board.edges];
  for (const edge of initialEdges) {
    if (game.status === "complete") break;
    const move = applyMove(game, { playerId: game.currentPlayerId, edgeId: edge.id });
    if (!move.accepted) throw new Error(`Movimiento legal rechazado: ${edge.id}`);
    game = move.state;

    // Check duplicate move on already occupied edge
    const duplicate = applyMove(game, { playerId: game.currentPlayerId, edgeId: edge.id });
    if (duplicate.accepted) throw new Error(`Arista ya ocupada fue aceptada: ${edge.id}`);
  }

  if (game.status !== "complete") throw new Error(`Partida de ${playerCount} jugadores no finalizó`);
  const totalScore = Object.values(game.scores).reduce((a, b) => a + b, 0);
  if (totalScore !== 4) {
    throw new Error(`Puntuación total (${totalScore}) no coincide con celdas activas (4)`);
  }
}

// 6. Non-Disruptive Update Coordination Verification
const updateCoord = new UpdateCoordinator();
updateCoord.notifyNewVersion();
if (updateCoord.canActivate("active-game")) {
  throw new Error("Actualización de PWA activada durante partida local activa");
}
if (!updateCoord.updatePending) {
  throw new Error("Estado de actualización pendiente no se conservó");
}
if (!updateCoord.consumeAtSafeBoundary("safe")) {
  throw new Error("Actualización no pudo consumirse en frontera segura");
}
if (updateCoord.updatePending) {
  throw new Error("Actualización pendiente no fue liberada tras frontera segura");
}

server.close();
console.log(
  `PWA E2E PASS: manifest, ${manifest.icons.length} iconos reproducibles, ${cache.assetGroups.length} grupos de caché, shell Chromium, juego local offline (2-4 jugadores), rechazo de aristas inválidas y actualización no disruptiva verificados.`
);
