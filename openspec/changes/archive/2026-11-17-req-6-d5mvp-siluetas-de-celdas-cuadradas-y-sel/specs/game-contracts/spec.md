# Spec Delta

## MODIFIED Requirements

### Requirement: Canonical game model

El contrato SHALL representar un tablero clásico rectangular o una máscara especial válida como un conjunto finito de celdas cuadradas activas, sus vértices y aristas únicas canónicas, junto con participantes, aristas ocupadas, propietarios de celdas, turno, puntuación y estado terminal. Para un tablero rectangular la topología SHALL corresponder al producto cartesiano de sus filas y columnas; para una máscara solo existirán las celdas presentes y sus aristas delimitadoras; cada arista compartida SHALL tener una sola identidad lógica.

#### Scenario: Same model supports catalog silhouettes
- **WHEN** se describe un tablero rectangular o cualquiera de las máscaras válidas del catálogo
- **THEN** ambos usan el mismo modelo de aristas y celdas, sin un algoritmo distinto por silueta

#### Scenario: Same model supports square silhouettes
- **WHEN** se describe un tablero rectangular o una máscara válida compuesta por celdas cuadradas
- **THEN** ambos usan el mismo modelo de aristas y celdas, sin un algoritmo distinto por silueta

#### Scenario: Rectangular topology is canonical
- **WHEN** se construye un tablero rectangular con dimensiones válidas
- **THEN** cada celda tiene cuatro aristas canónicas, las aristas interiores se comparten una sola vez y las aristas de borde pertenecen únicamente a sus celdas adyacentes

#### Scenario: Missing cells are absent from canonical model
- **WHEN** se construye un tablero desde una máscara con celdas ausentes
- **THEN** las celdas ausentes no pueden reclamarse ni aportar aristas a la topología

### Requirement: Mask preparation without definitive silhouette catalog

El contrato SHALL validar y preparar máscaras de celdas cuadradas activas, deduplicando sus aristas y rechazando celdas inválidas, inconsistentes o desconectadas. El catálogo MVP SHALL incluir cruz, corazón y estrella simple en tamaños pequeño, mediano y grande, sin cambiar el algoritmo del tablero rectangular.

#### Scenario: Prepare an approved silhouette
- **WHEN** se prepara una de las nueve variantes aprobadas del catálogo
- **THEN** se deriva una topología finita de celdas cuadradas conectadas y aristas únicas lista para procesar movimientos

#### Scenario: Prepare a square-cell mask
- **WHEN** se prepara una máscara válida compuesta por celdas cuadradas enteras
- **THEN** el motor deriva las aristas únicas y las relaciones de cada celda sin usar un algoritmo distinto al del tablero rectangular

#### Scenario: Do not activate a definitive catalog
- **WHEN** se consulta el alcance de la entrega D1
- **THEN** no se exige ni se expone un catálogo de cruz, corazón, estrella u otras siluetas como parte del motor entregado

#### Scenario: Invalid silhouette topology is rejected
- **WHEN** se prepara una máscara vacía, con coordenadas inválidas, datos inconsistentes o componentes desconectados
- **THEN** se rechaza antes de poder procesar movimientos y el estado anterior no cambia

### Requirement: Legal edge and square invariants

El contrato SHALL preservar GAME-01..GAME-05 para tableros clásicos y máscaras del catálogo: solo se ocupan aristas existentes y libres; una arista ocupada no se libera; una celda se asigna al jugador que cierra su cuarta arista; cada celda vale un punto; y una arista compartida puede cerrar y puntuar todas las celdas completadas una sola vez. Un movimiento ilegal, duplicado o fuera de turno SHALL devolver un rechazo observable sin cambiar el estado, turno ni puntuaciones.

#### Scenario: Shared edge closes two silhouette cells
- **WHEN** una arista libre compartida completa dos celdas activas de una silueta
- **THEN** ambas celdas se asignan al jugador del movimiento y la puntuación aumenta exactamente en dos

#### Scenario: Invalid edge leaves state unchanged
- **WHEN** un movimiento apunta a una arista inexistente o ya ocupada
- **THEN** el estado, turno y puntuaciones no cambian y el movimiento no consume turno

#### Scenario: Out-of-turn move leaves state unchanged
- **WHEN** un participante que no es el jugador activo intenta ocupar una arista libre
- **THEN** el motor rechaza el movimiento sin ocupar la arista ni modificar estado, turno o puntuaciones

#### Scenario: Shared edge closes multiple cells
- **WHEN** una arista libre compartida completa dos celdas activas
- **THEN** ambas celdas se asignan al jugador del movimiento y la puntuación aumenta exactamente en dos

#### Scenario: Nonexistent silhouette edge leaves state unchanged
- **WHEN** un movimiento apunta al hueco de una máscara o a una arista no derivada de sus celdas activas
- **THEN** el motor rechaza el movimiento sin ocupar aristas ni modificar estado, turno o puntuación

### Requirement: Silhouette independence

El contrato SHALL garantizar GAME-10: detección de cierres, puntuación, cambio de turno, fin y empate producen el mismo resultado semántico para cualquier tablero clásico o máscara válida del catálogo, ajustado únicamente al conjunto de celdas activas y sus aristas derivadas.

#### Scenario: Equivalent rules apply to every catalog silhouette
- **WHEN** se aplica una secuencia válida equivalente en cruz, corazón, estrella simple y un tablero rectangular
- **THEN** cada cierre, punto, turno extra, fin y empate se determina con las mismas reglas, ajustado solo por las celdas activas

#### Scenario: Equivalent move sequence has equivalent semantics
- **WHEN** se aplica una secuencia válida equivalente en un tablero rectangular y en una máscara válida de celdas cuadradas
- **THEN** cada cierre, puntuación, turno extra y estado terminal se determina con las mismas reglas, ajustado únicamente al conjunto de celdas activas

#### Scenario: Invalid mask topology is rejected
- **WHEN** se prepara una máscara con una celda no cuadrada, coordenadas no enteras o relaciones de aristas inconsistentes
- **THEN** la máscara se rechaza antes de poder procesar movimientos
