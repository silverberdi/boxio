import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import httpProxy from "http-proxy";
import { chromium } from "@playwright/test";
import { buildServer } from "../packages/server/dist/index.js";
import { testPublicPersistence } from "../packages/server/dist/test-public-persistence.js";

async function main() {
  console.log("Iniciando prueba E2E completa de navegador con Playwright...");

  const persistence = testPublicPersistence();
  const fastifyApp = buildServer(undefined, persistence);
  await fastifyApp.listen({ host: "127.0.0.1", port: 0 });
  const fastifyPort = fastifyApp.server.address().port;
  const fastifyBase = `http://127.0.0.1:${fastifyPort}`;
  const fastifyWs = `ws://127.0.0.1:${fastifyPort}`;

  const proxy = httpProxy.createProxyServer({});
  const root = new URL("../dist/web/", import.meta.url);

  const server = createServer(async (req, res) => {
    if (req.url.startsWith("/api/")) {
      req.url = req.url.slice(4);
      proxy.web(req, res, { target: fastifyBase });
      return;
    }
    const path = req.url === "/" || !req.url.includes(".") ? "index.html" : req.url.slice(1);
    try {
      const body = await readFile(new URL(path, root));
      const type = path.endsWith(".png")
        ? "image/png"
        : path.endsWith(".json") || path.endsWith(".webmanifest")
        ? "application/json"
        : path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
        ? "text/css"
        : "text/html";
      res.writeHead(200, { "content-type": type });
      res.end(body);
    } catch {
      try {
        const indexHtml = await readFile(new URL("index.html", root));
        res.writeHead(200, { "content-type": "text/html" });
        res.end(indexHtml);
      } catch {
        res.writeHead(404);
        res.end();
      }
    }
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/api/")) {
      req.url = req.url.slice(4);
      proxy.ws(req, socket, head, { target: fastifyWs });
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const webPort = server.address().port;
  const webUrl = `http://127.0.0.1:${webPort}`;

  console.log(`Servidor web listo en ${webUrl}, API en ${fastifyBase}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Verificación de Cancelación de Búsqueda
    console.log("1. Verificando cancelación de búsqueda en navegador...");
    const cancelContext = await browser.newContext();
    const cancelPage = await cancelContext.newPage();
    await cancelPage.goto(webUrl);

    await cancelPage.locator(".mode-card").filter({ hasText: /públic/i }).first().click();
    await cancelPage.waitForSelector("section.public-room");

    await cancelPage.fill('input[aria-label="Apodo para partida pública"]', "Cancelador");
    await cancelPage.getByRole("button", { name: "Buscar rival" }).click();

    await cancelPage.waitForSelector("text=Buscando rival");

    await cancelPage.getByRole("button", { name: "Cancelar búsqueda" }).click();
    await cancelPage.waitForSelector("text=Búsqueda cancelada por el servidor");
    await cancelContext.close();
    console.log("✓ Cancelación de búsqueda verificada.");

    // 2. Emparejamiento de dos sesiones públicas
    console.log("2. Verificando emparejamiento de dos sesiones públicas...");
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto(webUrl);
    await page2.goto(webUrl);

    await page1.locator(".mode-card").filter({ hasText: /públic/i }).first().click();
    await page2.locator(".mode-card").filter({ hasText: /públic/i }).first().click();

    await page1.waitForSelector("section.public-room");
    await page2.waitForSelector("section.public-room");

    await page1.fill('input[aria-label="Apodo para partida pública"]', "Jugador Alfa");
    await page2.fill('input[aria-label="Apodo para partida pública"]', "Jugador Beta");

    await page1.getByRole("button", { name: "Buscar rival" }).click();
    await page2.getByRole("button", { name: "Buscar rival" }).click();

    console.log("Esperando confirmación de rival en ambas sesiones...");
    await page1.waitForSelector("text=Rival confirmado", { timeout: 10000 });
    await page2.waitForSelector("text=Rival confirmado", { timeout: 10000 });
    console.log("✓ Ambas sesiones emparejadas y renderizadas inmediatamente.");

    await page1.waitForSelector("text=Conectado", { timeout: 5000 });
    await page2.waitForSelector("text=Conectado", { timeout: 5000 });
    console.log("✓ Conexión WebSocket pública activa en ambas sesiones.");

    // Obtener los IDs de los participantes del match en el servidor
    const savedState = await persistence.load();
    const match = (savedState?.matches ?? []).slice(-1)[0];
    if (!match) throw new Error("No se encontró el match creado en la persistencia");
    const matchId = match.matchId;
    const p1Seat = match.seats.find((s) => s.name === "Jugador Alfa");
    const p2Seat = match.seats.find((s) => s.name === "Jugador Beta");
    if (!p1Seat || !p2Seat) throw new Error("No se encontraron los asientos de los participantes");

    // 3. Completar toda la partida de forma determinista usando el turno autoritativo
    console.log("3. Jugando todas las aristas guiadas por el turno autoritativo del servidor...");
    await page1.waitForSelector(".online-edges button");
    await page2.waitForSelector(".online-edges button");

    let moveCount = 0;
    while (moveCount < 20) {
      const snapRes = await fastifyApp.inject({ method: "GET", url: `/public/matches/${matchId}` });
      const snap = snapRes.json();
      if (snap.status === "complete" || snap.game.status === "complete") {
        console.log("Partida completada a nivel autoritativo.");
        break;
      }

      const currentTurnId = snap.game.currentPlayerId;
      const actingPage = currentTurnId === p1Seat.id ? page1 : page2;
      const actingName = currentTurnId === p1Seat.id ? "Sesión 1 (Alfa)" : "Sesión 2 (Beta)";

      const nextEdge = snap.game.board.edges.find((e) => !snap.game.occupiedEdges.includes(e.id));
      if (!nextEdge) break;

      console.log(`Turno de ${actingName}: jugando arista ${nextEdge.id}...`);
      const btn = actingPage.locator(`.online-edges button:has-text("${nextEdge.id}")`).first();
      await btn.click();
      await actingPage.waitForTimeout(300);
      moveCount++;
    }

    // 4. Afirmar resultado final y marcador visible en ambas vistas sin recarga ni interacción
    console.log("4. Verificando que el resultado y estado final se renderizan en ambas vistas...");
    await page1.waitForSelector("text=Partida terminada por puntuación", { timeout: 10000 });
    await page2.waitForSelector("text=Partida terminada por puntuación", { timeout: 10000 });
    await page1.waitForSelector("text=Estado confirmado: complete", { timeout: 5000 });
    await page2.waitForSelector("text=Estado confirmado: complete", { timeout: 5000 });
    console.log("✓ Partida completada con éxito. Marcador y resultado final visibles en ambas sesiones sin interacción compensatoria.");

    // 5. Retornar al inicio en ambas vistas y confirmar limpieza de estado
    console.log("5. Verificando salida de sala y limpieza de match activo...");
    await page1.getByRole("button", { name: "Continuar al inicio" }).click();
    await page1.waitForSelector(".mode-grid", { timeout: 5000 });
    console.log("✓ Sesión 1 regresó al inicio tras finalizar la partida.");

    await page2.getByRole("button", { name: "Continuar al inicio" }).click();
    await page2.waitForSelector(".mode-grid", { timeout: 5000 });
    console.log("✓ Sesión 2 regresó al inicio tras finalizar la partida.");

    await page1.close();
    await context1.close();
    await page2.close();
    await context2.close();

    // 6. Confirmar que no queda búsqueda ni match activo en los servicios reales
    const finalState = await persistence.load();
    const activeMatches = (finalState?.matches ?? []).filter((m) => m.status === "active");
    const activeSearches = (finalState?.searches ?? []).filter((s) => s.status === "searching");
    if (activeMatches.length > 0) throw new Error("Quedó un match activo en la persistencia del servidor");
    if (activeSearches.length > 0) throw new Error("Quedó una búsqueda activa en la persistencia del servidor");
    console.log("✓ Confirmado: no quedan búsquedas ni matches activos en el servidor.");

    console.log("Playwright E2E PASS: Flujo completo de UI pública verificado con dos sesiones reales en navegador, partida finalizada con marcador observable, resultado visible y limpieza total.");
  } finally {
    await browser.close();
    server.close();
    await fastifyApp.close();
  }
}

main().catch((err) => {
  console.error("Playwright E2E FAIL:", err);
  process.exit(1);
});
