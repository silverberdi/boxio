# Evidencia D8 — candidato pre-PR

Estado: evidencia automatizada reproducible del candidato local; no es evidencia de despliegue.

## Checks ejecutados

- `npm test`: PASS — engine 23/23; server 43/43 (1 test de integración PostgreSQL omitido por entorno); web 16/16.
- `npm run check:assets`: PASS — 8 assets canónicos y 9 máscaras cuadradas; sin referencias externas/chat.
- `npm run test:pwa:e2e`: PASS — manifest, 2 iconos, 2 grupos de caché, shell Chromium en 360×640, 768×1024 y 1280×800, juego local offline 2–4, siluetas, aristas inválidas y actualización no disruptiva.
- `npx vitest run packages/web/src/local-game.test.ts packages/web/src/public-matchmaking-ui.test.ts`: PASS — 14/14.

## Trazabilidad observable

| Modalidad | Evidencia automatizada | Viewports del shell |
|---|---|---|
| Máquina | engine/web tests de sesiones y bots | 360×640, 768×1024, 1280×800 |
| Local | engine/web tests, PWA offline 2–4 jugadores | 360×640, 768×1024, 1280×800 |
| Privada | suite HTTP/WebSocket de sala, ingreso tardío y reconexión | shell verificado en los tres viewports |
| Pública 1v1 | suite HTTP/WebSocket de matchmaking, empate/abandono y comandos | shell verificado en los tres viewports |

La interacción de navegador automatizada de D8 cubre el shell y la ruta offline; las modalidades online se prueban contra sus endpoints/WebSockets reales, no con mocks de cliente.

- Celebración normal/múltiple: `packages/web/src/local-game.ts`, `packages/web/src/app.ts`, `packages/web/src/local-game.test.ts`.
- Mute sin solicitar `AudioContext`, movimiento reducido y estado final visible: `packages/web/src/app.ts`, `packages/web/src/local-game.test.ts`.
- Resultados normal/empate, abandono público y continuación sin revancha: UI existente y pruebas de `packages/server/src/public-matchmaking.test.ts`.
- Comandos online duplicados, identidad/versión/turno inválidos, reconexión de 60 s y abandono: suite HTTP/WebSocket del servidor PASS.

## Pendiente, no ejecutado

- Validación física en Chrome Android, Safari iPhone y Chromium escritorio.
- Instalación/modo avión en dispositivos físicos.
- Métricas de campo p75 LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1.
- Integración PostgreSQL real: omitida porque el entorno no aporta una instancia PostgreSQL ejecutable.

No se declara deploy, merge, revisión humana ni validación física. No se usó evidencia publicada; por tanto no aplica `[PUBLISHED_EVIDENCE ...]`.
