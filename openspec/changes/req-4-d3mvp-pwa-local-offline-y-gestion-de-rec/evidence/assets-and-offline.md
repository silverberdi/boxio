# Evidencia D3 — catálogo y frontera offline

## Inventario cerrado

El único writer del catálogo es el checkout Git bajo `assets/`; el build Angular lo copia con `angular.json` y el service worker lo precachea mediante `ngsw-config.json`. Los callers observados son `packages/web/src/app.ts` (wordmark, icono y fondo), `packages/web/src/local-game.ts` (motor local) y `assets/audio/boxio-sounds.ts` (audio sintetizado). El conjunto publicado incluye `assets/**`, el shell compilado, manifest e iconos derivados.

No hay writers/callers de red, API, WebSocket, CDN, `localStorage` o `sessionStorage` en el camino local. La partida vive únicamente en memoria (`LocalSession`) y se descarta al salir/cerrar.

## Procedencia reproducible

`scripts/generate-pwa-icons.mjs` lee `assets/branding/boxio-app-icon.svg`, valida su contenido y genera los PNG 192/512 con una implementación determinista local. `scripts/check-assets.mjs` valida el catálogo completo. No se usa PNG generado en chat ni adjunto externo.

## Verificación automatizada

- `npm run check:assets`
- `npm test`
- `npm run test:pwa:e2e`

El último comando levanta el build estático, inspecciona manifest, PNG, `ngsw-worker.js`, grupos de caché y renderiza el shell con Chromium. Chrome Android y Safari iPhone permanecen pendientes en `docs/PWA-PHYSICAL-VALIDATION.md` hasta un candidato desplegado.
