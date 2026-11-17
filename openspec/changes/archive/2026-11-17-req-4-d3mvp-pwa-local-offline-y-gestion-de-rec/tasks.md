# Tasks

## 1. Inventario y configuración PWA

- [x] 1.1 Inspeccionar el workspace web y los consumidores reales del catálogo `assets/`, documentar los writers/callers afectados y fijar el conjunto cerrado de recursos offline; verificarlo contra `local-assets` y el build existente sin modificar servidor ni motor.
- [x] 1.2 Configurar el manifest y el registro de PWA/service worker para el build web, incluyendo nombre, rutas, display, colores e iconos locales; verificar que el artefacto generado contiene un manifest válido y no URLs de CDN.
- [x] 1.3 Generar iconos raster reproducibles desde `assets/branding/boxio-app-icon.svg` en los tamaños/formats declarados y documentar su procedencia; verificar desde checkout limpio que no depende de PNGs externos o generados en chat.

## 2. Shell, caché y actualización segura

- [x] 2.1 Implementar el precache versionado del shell y del catálogo local necesario para iniciar la modalidad local, con limpieza controlada de versiones obsoletas; verificar carga inicial y revisita con red bloqueada.
- [x] 2.2 Implementar la coordinación de actualización para que una versión nueva no fuerce reload mientras existe una partida local activa y pueda activarse en una frontera segura; verificar que el turno/estado visible permanece intacto durante la detección.
- [x] 2.3 Mantener la política explícita de no recuperación tras cierre del navegador y ausencia de persistencia de partida; verificar que la UX no anuncia reanudación y que no se añade almacenamiento o endpoint fuera del alcance.

## 3. Camino local offline e invariantes

- [x] 3.1 Conectar/verificar la modalidad local preparada directamente con el motor puro para que una jugada offline no consulte `fetch`, API, WebSocket ni servidor; verificar con red interceptada o bloqueada que una partida de 2–4 jugadores inicia y progresa.
- [x] 3.2 Cubrir en regresión las jugadas legales/duplicadas y fuera de turno, cierre de uno y varios cuadrados, bonus de turno, puntuación, fin, empate y tableros de celdas cuadradas; verificar que offline y conectado local producen el mismo resultado determinista.
- [x] 3.3 Verificar que zoom/pan no generan jugadas accidentales y que tablero, turno y marcadores siguen utilizables en 360×640, 768×1024 y 1280×800; registrar automatización separada de validación física.

## 4. Evidencia automatizada y entrega

- [x] 4.1 Añadir o adaptar pruebas de navegador para manifest, iconos, service worker, recursos cacheados, revisita sin red, ausencia de solicitudes externas y actualización no disruptiva; verificar resultados reproducibles contra un candidato previo al despliegue.
- [x] 4.2 Añadir una prueba E2E de partida local offline de 2–4 jugadores que complete el juego y compruebe invariantes del motor; verificar también que una arista inválida no muta estado, puntuación ni turno.
- [x] 4.3 Preparar el registro de validación física posterior al despliegue para instalación y modo avión en Chrome Android y Safari iPhone, con Chromium de escritorio como comprobación adicional; verificar que los dispositivos no se declaran ejecutados antes del candidato real.
- [x] 4.4 Ejecutar build, tests y comprobaciones de assets desde un checkout limpio según los comandos documentados; verificar que no se modifican paquetes server/engine fuera de lo necesario y que no se introduce Capacitor, tienda, CDN, chat, perfiles, rankings o registro obligatorio.
