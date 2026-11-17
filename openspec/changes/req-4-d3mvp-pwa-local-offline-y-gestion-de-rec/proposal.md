# Proposal

## Why

La entrega D2 deja preparada la experiencia local, pero el jugador todavía necesita que la PWA y todos sus recursos funcionen sin red para continuar una partida local cuando se pierde la conexión. D3 formaliza la instalación/carga offline, el caché del shell y una actualización segura, sin convertir una partida local en un servicio online ni prometer recuperación tras cerrar el navegador.

## What Changes

- Añadir la capacidad PWA offline: manifest, iconos raster derivados del SVG local, service worker y caché/versionado del shell y de los recursos locales necesarios.
- Asegurar que la modalidad local de 2–4 jugadores ejecuta validación y transiciones del motor en el dispositivo, sin `fetch`, API ni servidor durante la partida offline.
- Mantener la partida activa al incorporar una nueva versión: la actualización queda disponible sin forzar una recarga que interrumpa el juego.
- Automatizar comprobaciones de navegador para manifest, recursos cacheados, revisita sin red y partida local offline; dejar la instalación y el modo avión en Chrome Android y Safari iPhone como validación física posterior al despliegue, con Chromium de escritorio como comprobación adicional.
- Mantener el catálogo autocontenido bajo `assets/`; no depender de CDN, chat, credenciales, PNGs de referencia no adjuntos ni recursos externos.
- Mantener explícitamente fuera de alcance Capacitor, firma, publicación en tiendas, apps nativas, juego online, persistencia/recuperación de partidas locales tras cerrar el navegador y cualquier funcionalidad fuera de D3.

## Capabilities

### New Capabilities

- `pwa-offline`: manifest, iconos raster locales, service worker, precache del shell/recursos, revisita offline, actualización no disruptiva y evidencia automatizada/física separada.

### Modified Capabilities

- `local-assets`: el catálogo local pasa de ser importable por el build a ser servible y cacheable por la PWA, incluyendo derivados raster del icono SVG sin depender de assets externos.
- `local-game-ux`: la partida local preparada debe continuar offline con el motor en dispositivo, conservando las reglas, las celdas cuadradas, los turnos, la puntuación y los límites de 2–4 jugadores, sin prometer recuperación al cerrar el navegador.

## Impact

- Afecta al workspace web Angular/PWA, su configuración de build, manifest, service worker, estrategia de caché y catálogo de assets.
- Afecta a la integración entre UI local y la librería TypeScript del motor únicamente para garantizar que el camino offline no consulte red; no cambia las reglas del motor ni añade endpoints.
- Añade pruebas de navegador/regresión para carga inicial, revisita offline, recursos locales, actualización durante partida y ausencia de llamadas de red.
- No requiere cambios en servidor, PostgreSQL, WebSockets ni infraestructura de despliegue. La validación física requiere un candidato desplegado y dispositivos reales, y no queda certificada por este change antes de ese momento.
