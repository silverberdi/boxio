# local-game-ux Specification

## Purpose

Define la experiencia observable para configurar y jugar partidas locales de 2–4 personas en un dispositivo compartido, con tablero SVG táctil, feedback de conquistas y resultados responsive.

## Requirements

### Requirement: Configure human and automatic participants

La configuración de partida contra máquina SHALL permitir un humano y de uno a tres bots, para un total de 2–4 participantes, y SHALL permitir seleccionar la dificultad de cada bot entre fácil, medio y difícil sin registro obligatorio.

#### Scenario: Configure one to three bots
- **DADO** una configuración de partida contra máquina
- **CUANDO** se selecciona uno, dos o tres bots junto con el humano
- **ENTONCES** la partida queda configurada con 2, 3 o 4 participantes totales y dificultades válidas

#### Scenario: Reject invalid machine participant count
- **DADO** una configuración contra máquina
- **CUANDO** se intenta iniciar con cero bots o más de tres bots, o sin un humano
- **ENTONCES** la configuración se rechaza sin crear una partida utilizable

### Requirement: Local mode entry and configuration

La experiencia SHALL mostrar cuatro modalidades desde el inicio y SHALL presentar como no habilitada la ruta de cualquier modalidad que todavía no corresponda a una entrega disponible. La modalidad local SHALL permitir entre 2 y 4 jugadores, apodos, colores y selección de tablero clásico o de cualquiera de las nueve variantes especiales aprobadas, sin registro obligatorio.

#### Scenario: Configure a special local board
- **WHEN** se configura una partida local con 2, 3 o 4 participantes y se selecciona una silueta y tamaño del catálogo
- **THEN** se puede iniciar la partida con esa instantánea de tablero, manteniendo apodos, colores y límites de jugadores

#### Scenario: Unavailable mode remains disabled
- **WHEN** una modalidad todavía no está disponible
- **THEN** su opción y ruta muestran estado no habilitado y no inician una partida

#### Scenario: Configure two to four local players
- **WHEN** se configura una partida local con 2, 3 o 4 participantes
- **THEN** se pueden establecer apodos y colores para cada participante y seleccionar un tablero rectangular válido

#### Scenario: Reject player count outside local bounds
- **WHEN** se intenta configurar una partida local con menos de 2 o más de 4 participantes
- **THEN** la configuración no se puede iniciar y conserva un error observable sin crear estado de partida

### Requirement: Mobile-first local game layout

La pantalla de juego local SHALL mantener utilizables el tablero, el turno actual y los marcadores de 2–4 jugadores en un viewport vertical de 360×640 CSS px. Sus controles y áreas táctiles SHALL medir al menos 44×44 CSS px. La experiencia SHALL tener comprobaciones automatizadas adicionales en 768×1024 y 1280×800.

#### Scenario: Four players fit the mobile game view
- **WHEN** se muestra una partida local de cuatro personas en 360×640 CSS px
- **THEN** el tablero, el turno y los cuatro marcadores siguen siendo visibles y utilizables

#### Scenario: Touch targets meet minimum size
- **WHEN** se inspeccionan los controles interactivos en la pantalla local
- **THEN** cada área táctil relevante tiene al menos 44×44 CSS px

#### Scenario: Additional viewport checks are recorded
- **WHEN** se valida la experiencia en 768×1024 o 1280×800
- **THEN** se ejecuta y registra una comprobación automatizada del diseño sin sustituir la validación física posterior al despliegue

### Requirement: SVG board edge interaction

El tablero SHALL representar únicamente celdas cuadradas y aristas canónicas del motor, tanto clásicas como derivadas de una máscara especial; SHALL permitir seleccionar una arista libre mediante toque y SHALL mantener zoom y desplazamiento táctiles sin ocultar turno ni marcadores. En modalidad local preparada u offline, la validación SHALL ejecutarse en el dispositivo sin requerir red ni API.

#### Scenario: Render every silhouette through the generic board
- **WHEN** se inicia una partida local con cruz, corazón o estrella simple en cualquier tamaño aprobado
- **THEN** el mismo render SVG genérico muestra sus celdas y aristas cuadradas sin una ruta visual específica de la figura

#### Scenario: Tap selects a legal special-board edge
- **WHEN** un jugador toca una arista libre derivada de una silueta
- **THEN** se procesa conforme al motor local y se refleja el resultado confirmado

#### Scenario: Tap selects a legal edge
- **WHEN** un jugador toca una arista libre en una partida local
- **THEN** se procesa la selección conforme a las reglas del motor local y se refleja el resultado confirmado

#### Scenario: Pan or zoom does not select an edge
- **WHEN** el usuario ejecuta un gesto de zoom o desplazamiento
- **THEN** el tablero se transforma según el gesto y no se toma una arista accidentalmente

#### Scenario: Occupied or absent edge is rejected
- **WHEN** el usuario toca una arista ya ocupada o una región ausente de la máscara
- **THEN** el movimiento se rechaza, no cambia el turno y no cambia ningún marcador

#### Scenario: Occupied edge is rejected
- **WHEN** el usuario toca una arista ya ocupada
- **THEN** el movimiento se rechaza, no cambia el turno y no cambia ningún marcador

#### Scenario: Offline move has no network dependency
- **WHEN** una partida local pierde la conexión y el jugador selecciona una arista legal
- **THEN** el motor local valida la arista y actualiza tablero, puntuación y turno sin `fetch`, API ni servidor

### Requirement: Local turn, scoring, and celebrations

La experiencia SHALL mostrar el turno actual y los marcadores de 2–4 jugadores, SHALL aplicar automáticamente el turno adicional al cerrar uno o más cuadrados y SHALL no ofrecer botones de fin de turno. Un movimiento que cierre dos cuadrados SHALL asignar ambos colores, sumar exactamente 2 puntos, conservar el turno y mostrar una celebración reforzada.

#### Scenario: Non-capturing move advances turn
- **WHEN** un movimiento legal no cierra ningún cuadrado
- **THEN** la arista se ocupa y el turno pasa automáticamente al siguiente jugador elegible

#### Scenario: Double capture keeps the player turn
- **WHEN** una confirmación legal cierra dos cuadrados
- **THEN** ambos cuadrados muestran el color del jugador, se suman 2 puntos, se muestra una celebración reforzada y el jugador conserva el turno

#### Scenario: No manual end-turn control exists
- **WHEN** la partida local está activa
- **THEN** los bonus de turno se aplican automáticamente y no se muestra un botón de fin de turno

### Requirement: Results and ties

Al asignarse todas las celdas, la experiencia SHALL mostrar la pantalla de resultados con puntuaciones finales y SHALL listar a todos los ganadores que compartan la puntuación máxima.

#### Scenario: Completed game shows shared winners
- **WHEN** una partida termina con empate
- **THEN** el resultado muestra las puntuaciones y todos los ganadores compartidos

### Requirement: Canonical local assets only

La experiencia SHALL usar únicamente el catálogo local incluido —documentación y tokens del repositorio, wordmark e icono SVG, fondo, iconos, personajes y `boxio-sounds.ts`— y SHALL resolverlo sin CDN, chat, credenciales, MP3 o WAV externos ni PNG generado fuera del repositorio.

#### Scenario: Build resolves the included asset catalog offline
- **WHEN** se construye la experiencia sin conectividad usando el catálogo incluido
- **THEN** los recursos visuales y los doce efectos sintetizados de `boxio-sounds.ts` se resuelven desde el repositorio

#### Scenario: External asset sources are not required
- **WHEN** se valida el alcance de assets de la experiencia local
- **THEN** no se requieren búsquedas en chat o CDN, archivos MP3/WAV externos ni PNGs de referencia no adjuntos

### Requirement: Local scope and deployment evidence boundary

Este change SHALL limitarse a juego local 2–4 y SHALL excluir salas online, quinto jugador, nuevos assets externos, chat, rankings, tiendas, perfiles, registro obligatorio y otras modalidades no entregadas. La validación física en dispositivos SHALL quedar explícitamente pendiente de un candidato desplegado. La PWA SHALL no prometer recuperar una partida local después de cerrar el navegador.

#### Scenario: Excluded online scope is absent
- **WHEN** se revisa la experiencia entregada por D2
- **THEN** no permite iniciar ni jugar una sala online ni añade un quinto jugador

#### Scenario: Physical device validation is not self-claimed
- **WHEN** se registra la evidencia de viewport y dispositivos
- **THEN** la automatización del PR queda separada de la prueba física, que se marca pendiente hasta disponer de un candidato desplegado

#### Scenario: Browser close recovery is not promised
- **WHEN** el usuario cierra el navegador durante una partida local y vuelve posteriormente
- **THEN** la experiencia no afirma ni exige recuperar la partida anterior
