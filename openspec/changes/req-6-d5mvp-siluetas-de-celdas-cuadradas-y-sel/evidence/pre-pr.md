# Evidencia técnica pre-PR — D5

## Alcance observado

- El catálogo local contiene exactamente nueve máscaras: cruz, corazón y estrella simple en pequeño, mediano y grande.
- El motor conserva una sola topología de celdas cuadradas/aristas para tableros clásicos y máscaras.
- La UI local selecciona clásico o catálogo y pasa la misma configuración validada a `createGame`.
- No se incorporan editor libre, T, triángulos, hexágonos, tamaño muy grande, quinto jugador, online nuevo, despliegue ni assets externos.

## Comprobaciones reproducibles

- `npm test`: build engine/server/web; Vitest engine y web; servidor Node.
- `npm run check:assets`: assets canónicos locales, JSON de nueve máscaras y ausencia de URLs, MP3/WAV o referencias de chat.
- `npm run test:pwa:e2e`: build de producción, manifest/service worker, shell Chromium, partida offline clásica de 2–4 jugadores, rechazo de aristas y actualización no disruptiva; además completa cada máscara catalogada.
- `VIEWPORT_CHECKS` mantiene 360×640, 768×1024 y 1280×800; la validación física de dispositivos queda pendiente del flujo humano/deploy.

Esta evidencia es técnica y pre-PR. No afirma merge, despliegue ni validación física.
