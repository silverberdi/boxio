# Spec Delta

## ADDED Requirements

### Requirement: Rectangular board dimensions
El motor SHALL aceptar tableros clásicos rectangulares con filas y columnas enteras independientes entre 2 y 8 inclusive, y SHALL rechazar dimensiones menores que 2, mayores que 8, fraccionarias, no finitas o que no sean números enteros. El tablero resultante SHALL contener como máximo 64 celdas activas.

#### Scenario: Accepted rectangular boundaries
- **WHEN** se crea un tablero con dimensiones 2×2 o 8×8
- **THEN** la configuración se acepta y el número de celdas activas coincide con filas×columnas

#### Scenario: Rejected invalid dimensions
- **WHEN** se intenta crear un tablero con una fila o columna menor que 2, mayor que 8, fraccionaria, infinita, NaN o de tipo no numérico
- **THEN** la creación se rechaza sin producir un estado de juego utilizable

### Requirement: Pure deterministic engine boundary
El motor SHALL procesar estados y movimientos sin depender de UI, DOM, reloj, red, WebSocket, base de datos, persistencia, imágenes, audio o servicios externos. Para la misma configuración y secuencia válida, SHALL producir el mismo estado, resultado de movimiento, puntuaciones, turno y estado terminal.

#### Scenario: Same input produces same result
- **WHEN** se procesa dos veces la misma secuencia válida sobre la misma configuración rectangular
- **THEN** ambas ejecuciones producen estados serializables semánticamente equivalentes, con las mismas aristas, celdas, puntuaciones, turno y resultado

#### Scenario: No external concerns in the core contract
- **WHEN** se consume el motor desde un entorno sin DOM, red, base de datos, reloj, imágenes ni audio
- **THEN** se pueden construir tableros y procesar movimientos sin inicializar ni consultar ninguna de esas dependencias

### Requirement: Mask preparation without definitive silhouette catalog
El contrato SHALL permitir validar y preparar un conjunto de celdas cuadradas activas para la futura evaluación de máscaras, deduplicando sus aristas y rechazando celdas inválidas o inconsistentes. Esta entrega MUST NOT definir ni activar un catálogo definitivo de siluetas MVP.

#### Scenario: Prepare a square-cell mask
- **WHEN** se prepara una máscara válida compuesta por celdas cuadradas enteras
- **THEN** el motor deriva las aristas únicas y las relaciones de cada celda sin usar un algoritmo distinto al del tablero rectangular

#### Scenario: Do not activate a definitive catalog
- **WHEN** se consulta el alcance de la entrega D1
- **THEN** no se exige ni se expone un catálogo de cruz, corazón, estrella u otras siluetas como parte del motor entregado

## MODIFIED Requirements

### Requirement: Canonical game model
La librería SHALL representar un tablero como un conjunto finito de celdas cuadradas activas, sus vértices y aristas únicas canónicas, junto con participantes, aristas ocupadas, propietarios de celdas, turno, puntuación y estado terminal. Para un tablero rectangular, la topología SHALL corresponder al producto cartesiano de sus filas y columnas; cada arista compartida SHALL tener una sola identidad lógica.

#### Scenario: Same model supports square silhouettes
- **WHEN** se describe un tablero rectangular o una máscara válida compuesta por celdas cuadradas
- **THEN** ambos usan el mismo modelo de aristas y celdas, sin un algoritmo distinto por silueta

#### Scenario: Rectangular topology is canonical
- **WHEN** se construye un tablero rectangular con dimensiones válidas
- **THEN** cada celda tiene cuatro aristas canónicas, las aristas interiores se comparten una sola vez y las aristas de borde pertenecen únicamente a sus celdas adyacentes

### Requirement: Legal edge and square invariants
El contrato SHALL preservar GAME-01..GAME-05: solo se ocupan aristas existentes y libres; una arista ocupada no se libera; una celda se asigna al jugador que cierra su cuarta arista; cada celda vale un punto; y una arista compartida puede cerrar y puntuar todas las celdas completadas una sola vez. Un movimiento ilegal, duplicado o fuera de turno SHALL devolver un rechazo observable sin cambiar el estado, turno ni puntuaciones.

#### Scenario: Invalid edge leaves state unchanged
- **WHEN** un movimiento apunta a una arista inexistente o ya ocupada
- **THEN** el estado, turno y puntuaciones no cambian y el movimiento no consume turno

#### Scenario: Out-of-turn move leaves state unchanged
- **WHEN** un participante que no es el jugador activo intenta ocupar una arista libre
- **THEN** el motor rechaza el movimiento sin ocupar la arista ni modificar estado, turno o puntuaciones

#### Scenario: Shared edge closes multiple cells
- **WHEN** una arista libre compartida completa dos celdas activas
- **THEN** ambas celdas se asignan al jugador del movimiento y la puntuación aumenta exactamente en dos

### Requirement: Turn, completion, and result invariants
El contrato SHALL preservar GAME-06..GAME-09: cerrar al menos una celda conserva el turno, no cerrar avanza al participante elegible, las capturas encadenadas no tienen límite arbitrario, la partida termina al asignar todas las celdas y permite empates con todos los ganadores máximos. El resultado final SHALL conservar la correspondencia entre puntos totales y celdas activas.

#### Scenario: Capture grants another turn
- **WHEN** un movimiento legal cierra una o más celdas
- **THEN** el jugador conserva el turno y la puntuación coincide con las nuevas celdas asignadas

#### Scenario: Last cell produces a complete tied result
- **WHEN** se asigna la última celda activa y la puntuación máxima está compartida
- **THEN** el estado termina, la suma de puntos coincide con el número de celdas activas y el resultado contiene todos los ganadores

#### Scenario: Non-capturing move advances turn
- **WHEN** un movimiento legal ocupa una arista y no completa ninguna celda
- **THEN** la arista queda ocupada y el turno pasa exactamente al siguiente participante elegible

### Requirement: Silhouette independence
El contrato SHALL garantizar GAME-10: detección de cierres, puntuación y cambio de turno producen el mismo resultado semántico para cualquier máscara válida de celdas cuadradas, ajustado únicamente al conjunto de celdas activas y sus aristas derivadas.

#### Scenario: Equivalent move sequence has equivalent semantics
- **WHEN** se aplica una secuencia válida equivalente en un tablero rectangular y en una máscara válida de celdas cuadradas
- **THEN** cada cierre, puntuación, turno extra y estado terminal se determina con las mismas reglas, ajustado únicamente al conjunto de celdas activas

#### Scenario: Invalid mask topology is rejected
- **WHEN** se prepara una máscara con una celda no cuadrada, coordenadas no enteras o relaciones de aristas inconsistentes
- **THEN** la máscara se rechaza antes de poder procesar movimientos
