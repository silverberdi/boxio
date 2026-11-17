# Tasks

## 1. Catálogo y validación de máscaras

- [x] 1.1 Ampliar `assets/boards/silhouette-candidates.json` con las variantes mediana y grande de cruz, corazón y estrella simple, manteniendo las tres fuentes pequeñas y verificando mediante una prueba de catálogo que existen exactamente nueve entradas, todas no vacías, cuadradas y conectadas (silhouette-boards: catálogo).
- [x] 1.2 Implementar o ajustar la preparación de máscaras para validar coordenadas enteras, unicidad, conectividad por lado y aristas derivadas exclusivamente de celdas presentes, verificando máscaras con huecos, duplicados, datos inválidos y componentes desconectados sin mutación de estado (silhouette-boards: topología y rechazo; GAME-01/GAME-10).
- [x] 1.3 Ejecutar regresión de topología clásica 2×2, 8×8 y valores fuera de 2–8, verificando el máximo de 64 celdas y que la validación de máscaras no altera el comportamiento rectangular (silhouette-boards: límites DEC-22; game-contracts: modelo canónico).

## 2. Integración del motor y bots

- [x] 2.1 Extender la configuración de tablero para aceptar una selección clásica o una entrada validada del catálogo antes de crear `GameState`, verificando que configuraciones inválidas se rechazan sin crear ni modificar estado (game-contracts: modelo y preparación).
- [x] 2.2 Parametrizar pruebas del motor para las nueve variantes y comprobar arista legal, arista ausente, arista duplicada, cierre simple, cierre doble con exactamente 2 puntos, turno extra, fin y empate según GAME-01..GAME-10 (game-contracts: invariantes y silueta independiente).
- [x] 2.3 Verificar que fácil, medio y difícil reciben estados de silueta, devuelven aristas existentes/libres, son reproducibles con semilla, no introducen ramas por figura y siguen dentro de 100 ms en el benchmark documentado (automatic-opponents: contrato y límite).
- [x] 2.4 Ejecutar regresión de bots en tablero clásico y especial, incluyendo cadenas de capturas y ausencia de bucles, y conservar la evidencia de que el core único procesa movimientos humanos y automáticos (automatic-opponents: integración).

## 3. Selector y render local

- [x] 3.1 Sustituir el supuesto de selector rectangular único por un selector de tablero clásico o de las nueve variantes especiales, verificando límites de participantes 2–4, apodos/colores y rechazo observable de configuraciones inválidas (local-game-ux: configuración).
- [x] 3.2 Conectar el selector a la misma configuración validada del motor y retirar cualquier validación o ruta duplicada que impida una máscara válida, verificando que la ruta clásica permanece disponible y que el estado previo no se muta ante error (design: retirada segura; local-game-ux: configuración).
- [x] 3.3 Mantener el render SVG genérico basado en `board.cells`/`board.edges`, aristas compartidas, zoom/pan y prevención de selección accidental, verificando visualmente/automáticamente las nueve variantes y una interacción válida e inválida (local-game-ux: interacción SVG).
- [x] 3.4 Verificar en 360×640, 768×1024 y 1280×800 que turno, marcadores, tablero especial y controles siguen utilizables con áreas táctiles existentes mediante pruebas automatizadas de viewport en verify (DEC-23/DEC-30; silhouette-boards: responsive).

## 4. Assets, modos y regresión integrada

- [x] 4.1 Verificar que el build consume únicamente JSON de máscaras, SVG, `assets/design-tokens.json` y `assets/audio/boxio-sounds.ts`, sin CDN, imágenes de chat, MP3/WAV externos ni nuevos assets específicos no aprobados (local-game-ux/local-assets: catálogo canónico).
- [x] 4.2 Ejecutar el flujo local offline con cada tamaño de silueta y el flujo máquina con uno a tres bots, verificando que no se requiere red y que puntuación, turno extra, fin y empate conservan las reglas comunes (PRD-08, DEC-14, GAME-10).
- [x] 4.3 Ejecutar la suite existente de motor, bots, UI local, assets y PWA E2E, incluyendo la comprobación de arista inexistente/duplicada y actualización no disruptiva, y comparar resultados con la línea base de tableros clásicos (docs/DELIVERY.md: pruebas transversales).
- [x] 4.4 Revisar el diff del change para confirmar que no se añadieron editor libre, T, triángulos, hexágonos, tamaño muy grande, quinto jugador, online nuevo, despliegue ni código muerto de una ruta rectangular suplantada; documentar evidencia técnica de pre-PR lista para revisión sin afirmar merge ni validación física (alcance D5 y contrato de entrega).
