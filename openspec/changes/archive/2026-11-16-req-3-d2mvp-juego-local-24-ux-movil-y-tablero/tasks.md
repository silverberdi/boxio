# Tasks

## 1. Flujo de entrada y configuración local

- [x] 1.1 Implementar la vista inicial con las cuatro modalidades, estado no habilitado y rutas bloqueadas para entregas no disponibles; verificar que solo Local inicia una sesión y que el test de navegación cubre las modalidades pendientes.
- [x] 1.2 Implementar configuración de 2–4 jugadores con apodos, colores y selección rectangular válida; verificar límites 2 y 4, rechazo de 1/5 y ausencia de estado creado ante configuración inválida.
- [x] 1.3 Conectar la configuración al estado serializable del motor de D1 sin duplicar reglas; verificar que una partida local se inicia con participantes, tablero, turno y marcadores coherentes.

## 2. Tablero SVG y gestos táctiles

- [x] 2.1 Implementar el render SVG de celdas cuadradas, vértices y aristas canónicas a partir del estado del motor; verificar que aristas compartidas tienen una sola identidad visual/interactiva.
- [x] 2.2 Añadir hit areas táctiles de al menos 44×44 CSS px y conservar turno/marcadores fuera del grupo transformable; verificar dimensiones y visibilidad en 360×640, 768×1024 y 1280×800.
- [x] 2.3 Implementar zoom y desplazamiento táctiles con cancelación de selección durante gesto; verificar con pruebas de interacción que pan/pinch no ocupa ninguna arista.
- [x] 2.4 Conectar toque estático a una intención de arista libre y mostrar rechazo de arista ocupada sin mutar UI, turno ni marcador; verificar selección legal, duplicado y toque fuera de arista.

## 3. Juego local y feedback

- [x] 3.1 Renderizar turno actual y marcadores para 2, 3 y 4 jugadores, con avance automático cuando no hay captura; verificar escenarios de turno y ausencia de controles de fin de turno.
- [x] 3.2 Renderizar cierres y aplicar el resultado del motor para capturas simples, dobles y encadenadas; verificar dos colores de propiedad, +2 puntos y conservación del turno en doble cierre.
- [x] 3.3 Integrar celebración normal/reforzada y audio sintetizado desde `assets/audio/boxio-sounds.ts`; verificar que los imports usan exclusivamente el catálogo local y que la celebración reforzada depende de dos o más celdas cerradas.
- [x] 3.4 Implementar resultado final con puntuaciones y todos los ganadores compartidos; verificar empate, último movimiento y correspondencia entre celdas asignadas y puntos.

## 4. Assets, regresión y evidencia

- [x] 4.1 Integrar wordmark, icono, fondo, tokens, iconos y personajes únicamente desde `assets/`; verificar `npm run check:assets` y un build sin dependencias de CDN, MP3/WAV o PNG externo.
- [x] 4.2 Añadir pruebas automatizadas de los escenarios Gherkin de `specs/local-game-ux/spec.md`, incluyendo configuración, aristas inválidas, gestos, doble cierre, empate, límites de jugadores y alcance excluido; verificar `npm test` sin servicios externos.
- [x] 4.3 Ejecutar compilación y regresión del motor y frontend; verificar `npm run build`, `npm test` y que no se alteran las invariantes de `packages/engine`.
- [x] 4.4 Registrar evidencia de viewport automatizado para 360×640, 768×1024 y 1280×800 y preparar el PR para revisión humana; verificar que la validación física en dispositivos queda marcada pendiente hasta disponer de un candidato desplegado.
